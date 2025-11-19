# Scripts Directory

Utility scripts for managing the School Management System.

## Available Scripts

### 1. backup-database.sh
Automated database backup script with retention policy.

**Usage:**
```bash
./backup-database.sh
```

**Features:**
- Creates compressed PostgreSQL backup
- Timestamped filenames
- Automatic cleanup (keeps 30 days)
- Logging support
- Size verification

**Schedule with cron:**
```bash
# Daily at 2 AM
0 2 * * * /opt/school-management/scripts/backup-database.sh
```

---

### 2. restore-database.sh
Safe database restoration with safety backup.

**Usage:**
```bash
./restore-database.sh /path/to/backup.sql.gz
```

**Features:**
- Creates safety backup before restore
- Confirmation prompt
- Automatic rollback on failure
- Clear status messages

**Example:**
```bash
./restore-database.sh /opt/school-management/backups/db_backup_20250119_120000.sql.gz
```

---

### 3. health-check.sh
Comprehensive system health monitoring.

**Usage:**
```bash
./health-check.sh
```

**Checks:**
- ✓ Backend API health
- ✓ Database connectivity
- ✓ Disk space usage
- ✓ Memory usage
- ✓ Service status
- ✓ Backup recency
- ✓ Log files

**Schedule with cron:**
```bash
# Every 5 minutes
*/5 * * * * /opt/school-management/scripts/health-check.sh

# Daily report at 9 AM
0 9 * * * /opt/school-management/scripts/health-check.sh | mail -s "Daily Health Report" admin@example.com
```

---

## Setup Instructions

### 1. Configure Environment Variables

Create `/etc/environment.d/school-management.conf`:
```bash
DB_USER=school_admin
DB_PASSWORD=your_secure_password
DB_NAME=school_management
API_URL=http://localhost:8000
ALERT_EMAIL=admin@yourdomain.com
```

Or set in script directly:
```bash
export DB_PASSWORD="your_password"
export ALERT_EMAIL="admin@example.com"
```

### 2. Setup Directories

```bash
sudo mkdir -p /opt/school-management/{backups,logs,scripts}
sudo cp scripts/*.sh /opt/school-management/scripts/
sudo chmod +x /opt/school-management/scripts/*.sh
```

### 3. Configure Cron Jobs

```bash
sudo crontab -e
```

Add:
```cron
# Daily database backup at 2 AM
0 2 * * * /opt/school-management/scripts/backup-database.sh

# Health check every 5 minutes
*/5 * * * * /opt/school-management/scripts/health-check.sh

# Weekly backup cleanup (keep 30 days)
0 3 * * 0 find /opt/school-management/backups -name "*.sql.gz" -mtime +30 -delete
```

---

## Backup Strategy

### Retention Policy
- **Daily backups:** 7 days
- **Weekly backups:** 4 weeks
- **Monthly backups:** 12 months

### Implementation

Edit `backup-database.sh` and add:
```bash
# Keep daily for 7 days
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

# Copy weekly backup (every Sunday)
if [ $(date +%u) -eq 7 ]; then
    cp $BACKUP_FILE $BACKUP_DIR/weekly_$(date +%Y_W%W).sql.gz
fi

# Copy monthly backup (1st of month)
if [ $(date +%d) -eq 01 ]; then
    cp $BACKUP_FILE $BACKUP_DIR/monthly_$(date +%Y_%m).sql.gz
fi
```

---

## Monitoring Setup

### 1. Email Alerts

Install mail utility:
```bash
sudo apt install mailutils -y
```

Test:
```bash
echo "Test email" | mail -s "Test" your@email.com
```

### 2. Slack/Discord Webhooks

Add to health-check.sh:
```bash
if [ "$STATUS" = "critical" ]; then
    curl -X POST $WEBHOOK_URL \
        -H 'Content-Type: application/json' \
        -d "{\"text\":\"🚨 School Management System: $ERRORS error(s) found\"}"
fi
```

### 3. Monitoring Dashboard

Use tools like:
- **Grafana + Prometheus** - Full monitoring
- **Uptime Kuma** - Simple uptime monitoring
- **Netdata** - Real-time system monitoring

---

## Troubleshooting

### Backup Script Fails

```bash
# Check PostgreSQL access
PGPASSWORD="your_password" psql -U school_admin -h localhost -d school_management -c "SELECT 1"

# Check disk space
df -h /opt/school-management/backups

# Check permissions
ls -la /opt/school-management/backups
```

### Health Check Fails

```bash
# Test API manually
curl http://localhost:8000/health

# Check service status
systemctl status school-backend

# Check logs
tail -f /opt/school-management/logs/*.log
```

### Restore Fails

```bash
# Verify backup file
gunzip -t backup_file.sql.gz

# Check database status
sudo systemctl status postgresql

# Manual restore
gunzip -c backup.sql.gz | psql -U school_admin school_management
```

---

## Security Notes

1. **Protect Credentials**
   ```bash
   chmod 600 /etc/environment.d/school-management.conf
   ```

2. **Secure Backup Directory**
   ```bash
   chmod 700 /opt/school-management/backups
   chown postgres:postgres /opt/school-management/backups
   ```

3. **Encrypt Backups (Optional)**
   ```bash
   # Encrypt
   gpg -c backup.sql.gz

   # Decrypt
   gpg backup.sql.gz.gpg
   ```

4. **Remote Backup**
   ```bash
   # Sync to remote server
   rsync -avz --delete /opt/school-management/backups/ \
       user@backup-server:/backups/school-management/
   ```

---

## Best Practices

1. **Test Backups Regularly**
   - Restore to a test environment monthly
   - Verify data integrity

2. **Monitor Disk Space**
   - Backups can grow large
   - Set up alerts for low disk space

3. **Keep Multiple Copies**
   - On-site backups (server)
   - Off-site backups (remote server/cloud)
   - Local backups (external drive)

4. **Document Procedures**
   - Recovery time objective (RTO)
   - Recovery point objective (RPO)
   - Disaster recovery plan

---

## Quick Reference

```bash
# Backup database
./backup-database.sh

# Restore database
./restore-database.sh /path/to/backup.sql.gz

# Check system health
./health-check.sh

# List backups
ls -lh /opt/school-management/backups/

# View logs
tail -f /opt/school-management/logs/backup.log

# Check cron jobs
crontab -l

# Test database connection
psql -U school_admin -h localhost -d school_management
```

---

## Support

For issues or questions:
1. Check logs in `/opt/school-management/logs/`
2. Run health check: `./health-check.sh`
3. Review documentation in `/docs/`
4. Check system status: `systemctl status school-backend`
