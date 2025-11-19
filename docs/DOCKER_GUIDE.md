# Docker Deployment Guide

Complete guide to deploying the School Management System using Docker and Docker Compose.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Development Mode](#development-mode)
- [Production Mode](#production-mode)
- [Database Management](#database-management)
- [Monitoring and Logs](#monitoring-and-logs)
- [Troubleshooting](#troubleshooting)
- [Advanced Topics](#advanced-topics)

---

## Prerequisites

### Required Software

```bash
# Docker (20.10+)
docker --version

# Docker Compose (2.0+)
docker-compose --version
```

### Installation

**Ubuntu/Debian:**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

**macOS:**
```bash
# Install Docker Desktop
brew install --cask docker
```

**Windows:**
Download and install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)

---

## Quick Start

### 1. Clone and Setup

```bash
# Navigate to project
cd school-management

# Copy environment file
cp .env.example .env

# Edit configuration (optional for development)
nano .env
```

### 2. Start All Services

```bash
# Start in detached mode
docker-compose up -d

# View startup logs
docker-compose logs -f
```

### 3. Initialize Database

```bash
# Run database initialization script
docker-compose exec backend python scripts/init_db.py
```

### 4. Access Application

- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs
- **Frontend UI:** http://localhost:3000
- **Default Login:** `admin` / `admin123`

### 5. Verify Health

```bash
# Check all services
docker-compose ps

# Test backend
curl http://localhost:8000/health

# Test frontend
curl http://localhost:3000
```

---

## Configuration

### Environment Variables

The `.env` file controls all configuration. Key variables:

```bash
# Database
DB_USER=school_admin
DB_PASSWORD=secure_password_here
DB_NAME=school_management

# Security
JWT_SECRET=generate-32-byte-secret-here

# SMS Gateway
SMS_GATEWAY=msg91
MSG91_API_KEY=your-api-key
MSG91_SENDER_ID=SCHOOL

# Ports
BACKEND_PORT=8000
FRONTEND_PORT=3000
```

### Generate Secure Secrets

```bash
# Generate JWT secret
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Generate database password
openssl rand -base64 32
```

---

## Development Mode

### Start Development Environment

```bash
# Start all services with hot reload
docker-compose up -d

# Backend changes automatically reload
# Frontend changes automatically rebuild
```

### Development Features

- **Hot Reload:** Code changes restart services automatically
- **Volume Mounts:** Local code synced to containers
- **Debug Mode:** Detailed error messages and logging
- **API Docs:** Interactive Swagger UI at `/docs`

### Common Development Commands

```bash
# View real-time logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Access backend shell
docker-compose exec backend bash

# Access frontend shell
docker-compose exec frontend sh

# Run tests
docker-compose exec backend pytest

# Install new Python package
docker-compose exec backend pip install package-name

# Install new npm package
docker-compose exec frontend npm install package-name

# Run database migrations
docker-compose exec backend alembic upgrade head

# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "description"

# Access database
docker-compose exec db psql -U school_admin -d school_management
```

### Reset Development Environment

```bash
# Stop and remove containers + volumes
docker-compose down -v

# Rebuild and start fresh
docker-compose up -d --build

# Reinitialize database
docker-compose exec backend python scripts/init_db.py
```

---

## Production Mode

### Production Setup

```bash
# 1. Update .env for production
cp .env.example .env
nano .env
```

Update these values:
```bash
ENVIRONMENT=production
DEBUG=false
NODE_ENV=production
JWT_SECRET=<strong-32-byte-secret>
DB_PASSWORD=<strong-password>
CORS_ORIGINS=https://yourdomain.com
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
```

### Deploy with Nginx

```bash
# Build production images
docker-compose build

# Start with nginx profile
docker-compose --profile production up -d

# Check nginx status
docker-compose exec nginx nginx -t
```

### SSL/HTTPS Setup

**Option 1: Let's Encrypt (Certbot)**

```bash
# Install certbot in nginx container
docker-compose exec nginx apk add certbot certbot-nginx

# Obtain certificate
docker-compose exec nginx certbot --nginx -d yourdomain.com

# Auto-renewal (add to crontab)
0 0 * * * docker-compose exec nginx certbot renew --quiet
```

**Option 2: Custom Certificates**

```bash
# Place certificates
mkdir -p nginx/ssl
cp your-cert.crt nginx/ssl/
cp your-key.key nginx/ssl/

# Update nginx.conf
# Add SSL configuration
```

### Production Optimization

**backend/Dockerfile (production)**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Run with gunicorn
CMD ["gunicorn", "app.main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

**Update docker-compose.yml for production:**
```yaml
backend:
  command: gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
  restart: always
  environment:
    - ENVIRONMENT=production
```

---

## Database Management

### Backup Database

**Automated Daily Backups:**
```bash
# Backups created automatically in ./backups/
# Retention: 30 days

# Verify backups
ls -lh backups/
```

**Manual Backup:**
```bash
# Create compressed backup
docker-compose exec db pg_dump -U school_admin school_management | gzip > backup_$(date +%Y%m%d).sql.gz

# Backup to specific location
docker-compose exec db pg_dump -U school_admin school_management > /backups/manual_backup.sql
```

### Restore Database

```bash
# From compressed backup
gunzip -c backup_20250119.sql.gz | docker-compose exec -T db psql -U school_admin school_management

# From plain SQL
docker-compose exec -T db psql -U school_admin school_management < backup.sql
```

### Database Migrations

```bash
# Check current version
docker-compose exec backend alembic current

# View migration history
docker-compose exec backend alembic history

# Upgrade to latest
docker-compose exec backend alembic upgrade head

# Downgrade one version
docker-compose exec backend alembic downgrade -1

# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "add new field"
```

### Database Access

```bash
# PostgreSQL shell
docker-compose exec db psql -U school_admin -d school_management

# Run SQL query
docker-compose exec db psql -U school_admin -d school_management -c "SELECT * FROM users;"

# Import data
docker-compose exec -T db psql -U school_admin school_management < data.sql
```

---

## Monitoring and Logs

### View Logs

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# Follow logs (real-time)
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend

# Since timestamp
docker-compose logs --since 2025-01-19T10:00:00 backend
```

### Service Status

```bash
# Check all services
docker-compose ps

# Detailed service info
docker inspect school_backend

# Resource usage
docker stats

# Container processes
docker-compose exec backend ps aux
```

### Health Checks

```bash
# Backend health
curl http://localhost:8000/health

# Database connectivity
docker-compose exec db pg_isready -U school_admin

# Frontend health
curl http://localhost:3000

# All services
docker-compose ps
```

---

## Troubleshooting

### Common Issues

#### 1. Backend Won't Start

```bash
# Check logs
docker-compose logs backend

# Verify database connection
docker-compose exec backend env | grep DATABASE

# Test database
docker-compose exec db pg_isready

# Rebuild backend
docker-compose up -d --build backend
```

#### 2. Database Connection Failed

```bash
# Check database is running
docker-compose ps db

# Check database logs
docker-compose logs db

# Verify credentials
docker-compose exec backend env | grep DB_

# Test connection manually
docker-compose exec backend python -c "from app.core.database import engine; print(engine)"
```

#### 3. Frontend Build Issues

```bash
# Check logs
docker-compose logs frontend

# Rebuild frontend
docker-compose up -d --build frontend

# Clear node_modules
docker-compose exec frontend rm -rf node_modules
docker-compose exec frontend npm install

# Check environment
docker-compose exec frontend env | grep VITE
```

#### 4. Port Already in Use

```bash
# Find process using port 8000
sudo lsof -i :8000

# Kill process
sudo kill -9 <PID>

# Or change port in .env
BACKEND_PORT=8001
```

#### 5. Permission Denied

```bash
# Fix file permissions
sudo chown -R $USER:$USER .

# Fix log directory
sudo mkdir -p logs
sudo chmod 777 logs
```

### Reset Everything

```bash
# Nuclear option - removes all data
docker-compose down -v
docker system prune -a
docker volume prune
docker-compose up -d --build
docker-compose exec backend python scripts/init_db.py
```

---

## Advanced Topics

### Custom Networks

```yaml
networks:
  school_network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.25.0.0/16
```

### Resource Limits

```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
      reservations:
        cpus: '1'
        memory: 1G
```

### Multiple Environments

```bash
# Development
docker-compose -f docker-compose.yml up -d

# Staging
docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Scaling Services

```bash
# Scale backend to 3 instances
docker-compose up -d --scale backend=3

# Behind load balancer
```

### CI/CD Integration

**GitHub Actions Example:**
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Deploy to server
        run: |
          ssh user@server 'cd /app && git pull && docker-compose up -d --build'
```

---

## Performance Optimization

### Backend Optimization

```yaml
backend:
  command: gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
  environment:
    - WORKERS=4
```

### Database Optimization

```yaml
db:
  command: postgres -c shared_buffers=256MB -c max_connections=200
```

### Caching

```yaml
redis:
  image: redis:alpine
  ports:
    - "6379:6379"
```

---

## Security Best Practices

1. **Never commit `.env` file**
   ```bash
   echo ".env" >> .gitignore
   ```

2. **Use secrets management**
   ```yaml
   secrets:
     db_password:
       external: true
   ```

3. **Run as non-root user**
   ```dockerfile
   USER nobody
   ```

4. **Scan images for vulnerabilities**
   ```bash
   docker scan school_backend:latest
   ```

5. **Keep images updated**
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

---

## Quick Reference

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Restart
docker-compose restart

# Logs
docker-compose logs -f

# Shell
docker-compose exec backend bash

# Database
docker-compose exec db psql -U school_admin -d school_management

# Backup
docker-compose exec db pg_dump -U school_admin school_management | gzip > backup.sql.gz

# Restore
gunzip -c backup.sql.gz | docker-compose exec -T db psql -U school_admin school_management

# Clean
docker-compose down -v
docker system prune -a
```

---

## Support

For issues:
1. Check logs: `docker-compose logs`
2. Review [DEPLOYMENT.md](DEPLOYMENT.md)
3. Check [troubleshooting section](#troubleshooting)
4. Reset and retry: `docker-compose down -v && docker-compose up -d --build`

---

**Last Updated:** 2025-01-19
