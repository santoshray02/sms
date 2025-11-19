# Production Deployment Guide

Complete guide to deploy the School Management System to production.

## Table of Contents

1. [Server Requirements](#server-requirements)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [SSL/HTTPS Setup](#sslhttps-setup)
7. [Monitoring & Logging](#monitoring--logging)
8. [Backup Strategy](#backup-strategy)
9. [Security Hardening](#security-hardening)
10. [Maintenance](#maintenance)

---

## Server Requirements

### Minimum Specifications
- **CPU:** 2 cores
- **RAM:** 4GB
- **Storage:** 50GB SSD
- **OS:** Ubuntu 22.04 LTS (recommended)
- **Network:** Static IP or domain name

### Recommended for 1000+ Students
- **CPU:** 4 cores
- **RAM:** 8GB
- **Storage:** 100GB SSD

### Software Requirements
- Python 3.11+
- PostgreSQL 15+
- Node.js 18+ (for frontend)
- Nginx
- Certbot (for SSL)

---

## Pre-Deployment Checklist

### 1. Security
- [ ] Change default admin password
- [ ] Generate strong JWT_SECRET (32+ characters)
- [ ] Update all passwords in .env
- [ ] Disable DEBUG mode (`DEBUG=False`)
- [ ] Configure firewall (allow only 80, 443, 22)
- [ ] Setup SSH key authentication
- [ ] Disable root SSH login

### 2. Configuration
- [ ] Setup production database
- [ ] Configure SMS gateway (MSG91/Twilio)
- [ ] Setup domain name and DNS
- [ ] Configure CORS for production domain
- [ ] Review and update .env settings

### 3. Testing
- [ ] Test all API endpoints
- [ ] Verify database migrations
- [ ] Test fee generation
- [ ] Test SMS sending
- [ ] Test payment recording

---

## Database Setup

### 1. Install PostgreSQL

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start and enable service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell:
CREATE DATABASE school_management;
CREATE USER school_admin WITH PASSWORD 'YOUR_STRONG_PASSWORD';
ALTER ROLE school_admin SET client_encoding TO 'utf8';
ALTER ROLE school_admin SET default_transaction_isolation TO 'read committed';
ALTER ROLE school_admin SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE school_management TO school_admin;
\q
```

### 3. Configure PostgreSQL for Remote Access (if needed)

```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/15/main/postgresql.conf
# Set: listen_addresses = '*'

# Edit pg_hba.conf
sudo nano /etc/postgresql/15/main/pg_hba.conf
# Add: host school_management school_admin 0.0.0.0/0 md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## Backend Deployment

### Option 1: Systemd Service (Recommended)

#### 1. Setup Application

```bash
# Create application directory
sudo mkdir -p /opt/school-management
sudo chown $USER:$USER /opt/school-management

# Clone or copy your code
cd /opt/school-management
# Copy your backend/ folder here

# Create virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
```

#### 2. Configure Production Environment

```bash
# Create production .env
cat > /opt/school-management/backend/.env << EOF
DATABASE_URL=postgresql+asyncpg://school_admin:YOUR_PASSWORD@localhost:5432/school_management
JWT_SECRET=$(openssl rand -hex 32)
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
SMS_GATEWAY=msg91
SMS_API_KEY=your-actual-api-key
SMS_SENDER_ID=SCHOOL
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
APP_NAME=School Management System
DEBUG=False
EOF

# Secure the file
chmod 600 /opt/school-management/backend/.env
```

#### 3. Initialize Database

```bash
cd /opt/school-management/backend
source venv/bin/activate
python scripts/init_db.py
```

#### 4. Create Systemd Service

```bash
sudo nano /etc/systemd/system/school-backend.service
```

Add:
```ini
[Unit]
Description=School Management Backend
After=network.target postgresql.service

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/opt/school-management/backend
Environment="PATH=/opt/school-management/venv/bin"
ExecStart=/opt/school-management/venv/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### 5. Start Service

```bash
# Set permissions
sudo chown -R www-data:www-data /opt/school-management

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable school-backend
sudo systemctl start school-backend

# Check status
sudo systemctl status school-backend

# View logs
sudo journalctl -u school-backend -f
```

### Option 2: Docker Deployment

```bash
# Build and run with docker-compose
cd /opt/school-management
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f backend
```

---

## Frontend Deployment

### Option 1: Static Files with Nginx

#### 1. Build Frontend

```bash
cd /opt/school-management/frontend

# Install dependencies
npm install

# Create production .env
cat > .env.production << EOF
VITE_API_URL=https://api.yourdomain.com/api/v1
EOF

# Build
npm run build
# Output in dist/ folder
```

#### 2. Deploy to Nginx

```bash
# Copy build to nginx directory
sudo mkdir -p /var/www/school-management
sudo cp -r dist/* /var/www/school-management/
sudo chown -R www-data:www-data /var/www/school-management
```

### Option 2: Vercel/Netlify

```bash
# For Vercel
npm install -g vercel
vercel --prod

# For Netlify
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

---

## SSL/HTTPS Setup

### 1. Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/school-management
```

Add:
```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/school-management;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}

# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/school-management /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3. Get SSL Certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

Certbot will automatically configure HTTPS and set up auto-renewal.

---

## Monitoring & Logging

### 1. Application Logs

```bash
# Backend logs
sudo journalctl -u school-backend -f

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### 2. Health Check Endpoint

The backend has a health check at `/health`:

```bash
curl https://api.yourdomain.com/health
```

### 3. Setup Monitoring Script

Create `/opt/school-management/scripts/health-check.sh`:

```bash
#!/bin/bash
HEALTH_URL="https://api.yourdomain.com/health"
ALERT_EMAIL="admin@yourdomain.com"

response=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $response -ne 200 ]; then
    echo "School Management API is down! HTTP Status: $response" | \
    mail -s "Alert: School Management System Down" $ALERT_EMAIL
fi
```

Add to crontab:
```bash
# Check every 5 minutes
*/5 * * * * /opt/school-management/scripts/health-check.sh
```

### 4. Database Monitoring

```bash
# Check database size
sudo -u postgres psql -d school_management -c "SELECT pg_size_pretty(pg_database_size('school_management'));"

# Check active connections
sudo -u postgres psql -d school_management -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## Backup Strategy

### 1. Database Backup Script

Create `/opt/school-management/scripts/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/school-management/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="school_management"
DB_USER="school_admin"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Backup database
PGPASSWORD="YOUR_DB_PASSWORD" pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Keep only last 30 days of backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: db_backup_$DATE.sql.gz"
```

Make executable:
```bash
chmod +x /opt/school-management/scripts/backup-db.sh
```

### 2. Schedule Daily Backups

```bash
# Add to crontab
crontab -e

# Add this line (runs at 2 AM daily)
0 2 * * * /opt/school-management/scripts/backup-db.sh
```

### 3. Restore from Backup

```bash
# Uncompress backup
gunzip /opt/school-management/backups/db_backup_YYYYMMDD_HHMMSS.sql.gz

# Restore
PGPASSWORD="YOUR_DB_PASSWORD" psql -U school_admin -h localhost school_management < /opt/school-management/backups/db_backup_YYYYMMDD_HHMMSS.sql
```

### 4. Remote Backup (Optional)

```bash
# Sync to remote server
rsync -avz /opt/school-management/backups/ user@backup-server:/backups/school-management/

# Or upload to S3
aws s3 sync /opt/school-management/backups/ s3://your-bucket/school-backups/
```

---

## Security Hardening

### 1. Firewall Configuration

```bash
# Install UFW
sudo apt install ufw -y

# Configure rules
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS

# Enable firewall
sudo ufw enable
```

### 2. Fail2Ban (Brute Force Protection)

```bash
# Install Fail2Ban
sudo apt install fail2ban -y

# Configure for Nginx
sudo nano /etc/fail2ban/jail.local
```

Add:
```ini
[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-noscript]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
```

Restart:
```bash
sudo systemctl restart fail2ban
```

### 3. PostgreSQL Security

```bash
# Edit pg_hba.conf for stricter access
sudo nano /etc/postgresql/15/main/pg_hba.conf

# Use only specific IPs, not 0.0.0.0/0
# host school_management school_admin 127.0.0.1/32 md5
```

### 4. Application Security Checklist

- [x] JWT tokens with short expiry (24 hours)
- [x] Password hashing with bcrypt
- [x] SQL injection prevention (parameterized queries)
- [x] XSS prevention (React auto-escaping)
- [x] CORS configured for production domain
- [x] Input validation on all endpoints
- [x] Rate limiting (add with nginx or middleware)
- [x] HTTPS only in production

---

## Maintenance

### Daily Tasks
- Monitor logs for errors
- Check disk space
- Verify backups completed

### Weekly Tasks
- Review system resource usage
- Check for security updates
- Test backup restoration

### Monthly Tasks
- Update dependencies
- Review and clean old logs
- Analyze usage patterns
- Database optimization (VACUUM)

### Commands

```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check CPU load
uptime

# Database maintenance
sudo -u postgres psql -d school_management -c "VACUUM ANALYZE;"

# Update system packages
sudo apt update && sudo apt upgrade -y

# Restart services
sudo systemctl restart school-backend
sudo systemctl restart nginx
```

---

## Troubleshooting

### Backend Not Starting

```bash
# Check logs
sudo journalctl -u school-backend -n 50

# Test manually
cd /opt/school-management/backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Database Connection Issues

```bash
# Test connection
PGPASSWORD="YOUR_PASSWORD" psql -U school_admin -h localhost -d school_management

# Check PostgreSQL status
sudo systemctl status postgresql
```

### High Memory Usage

```bash
# Check top processes
top

# Restart backend
sudo systemctl restart school-backend
```

### SSL Certificate Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal
```

---

## Performance Optimization

### 1. Database Optimization

```sql
-- Add indexes if needed
CREATE INDEX CONCURRENTLY idx_custom ON table_name(column);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM students WHERE class_id = 1;
```

### 2. Nginx Caching

Add to nginx config:
```nginx
# Cache static files
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. Database Connection Pooling

Already configured in SQLAlchemy with pool_size=20.

---

## Cost Estimation

### Cloud Hosting (Monthly)

**DigitalOcean/Linode:**
- Basic Droplet (2 CPU, 4GB): $24/month
- Domain: $12/year
- **Total: ~$25/month**

**AWS:**
- EC2 t3.medium: $30/month
- RDS PostgreSQL: $30/month
- **Total: ~$60/month**

**Managed Services:**
- Railway/Render: $20-30/month
- Vercel (Frontend): Free or $20/month
- **Total: $20-50/month**

---

## Quick Deployment Checklist

- [ ] Server provisioned
- [ ] PostgreSQL installed and configured
- [ ] Application code deployed
- [ ] Environment variables configured
- [ ] Database initialized with init_db.py
- [ ] Systemd service created and running
- [ ] Nginx configured
- [ ] SSL certificate obtained
- [ ] DNS configured
- [ ] Firewall configured
- [ ] Backups scheduled
- [ ] Monitoring setup
- [ ] Admin password changed
- [ ] SMS gateway configured
- [ ] System tested end-to-end

---

## Post-Deployment

### 1. Change Default Passwords

```bash
# Login to system
# Go to user management
# Change admin password immediately
```

### 2. Import Real Data

```bash
# Prepare CSV with real students
# Use bulk import API
curl -X POST https://api.yourdomain.com/api/v1/students/bulk-import \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@students.csv"
```

### 3. Configure SMS Gateway

Update `.env` with real MSG91/Twilio credentials and test:
```bash
# Test SMS sending through API
curl -X POST https://api.yourdomain.com/api/v1/sms/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"phone": "+91XXXXXXXXXX", "message": "Test message"}'
```

### 4. Train Users

- Show admin how to generate monthly fees
- Show accountant how to record payments
- Demonstrate reports functionality

---

## Summary

You now have a complete production deployment guide covering:
- ✅ Server setup
- ✅ Database configuration
- ✅ Application deployment
- ✅ SSL/HTTPS setup
- ✅ Monitoring and logging
- ✅ Backup strategy
- ✅ Security hardening
- ✅ Maintenance procedures

**Your system is production-ready!** 🚀
