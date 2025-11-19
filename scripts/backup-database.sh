#!/bin/bash

###############################################################################
# Database Backup Script for School Management System
#
# Usage: ./backup-database.sh
#
# This script:
# - Creates a compressed backup of the PostgreSQL database
# - Stores backups with timestamps
# - Automatically removes backups older than 30 days
# - Logs backup operations
###############################################################################

# Configuration
BACKUP_DIR="/opt/school-management/backups"
LOG_FILE="/opt/school-management/logs/backup.log"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="school_management"
DB_USER="school_admin"
RETENTION_DAYS=30

# Colors for output
RED='\033[0:31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

# Create directories if they don't exist
mkdir -p "$BACKUP_DIR" || error_exit "Failed to create backup directory"
mkdir -p "$(dirname "$LOG_FILE")" || error_exit "Failed to create log directory"

log "Starting database backup..."

# Check if PostgreSQL is running
if ! pg_isready -h localhost -U "$DB_USER" &>/dev/null; then
    error_exit "PostgreSQL is not running or not accessible"
fi

# Perform backup
BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql.gz"
log "Creating backup: $BACKUP_FILE"

if PGPASSWORD="${DB_PASSWORD:-}" pg_dump -U "$DB_USER" -h localhost "$DB_NAME" | gzip > "$BACKUP_FILE"; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✓${NC} Backup completed successfully"
    log "Backup completed: $BACKUP_FILE (Size: $BACKUP_SIZE)"
else
    error_exit "Database backup failed"
fi

# Verify backup file
if [ ! -f "$BACKUP_FILE" ] || [ ! -s "$BACKUP_FILE" ]; then
    error_exit "Backup file is empty or doesn't exist"
fi

# Clean up old backups
log "Cleaning up backups older than $RETENTION_DAYS days..."
DELETED_COUNT=$(find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)

if [ "$DELETED_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}✓${NC} Deleted $DELETED_COUNT old backup(s)"
    log "Deleted $DELETED_COUNT old backup(s)"
fi

# Show current backups
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "db_backup_*.sql.gz" | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo ""
echo "Backup Statistics:"
echo "  Location: $BACKUP_DIR"
echo "  Total backups: $BACKUP_COUNT"
echo "  Total size: $TOTAL_SIZE"
echo ""

log "Backup operation completed successfully"
echo -e "${GREEN}✓ Backup completed successfully!${NC}"
