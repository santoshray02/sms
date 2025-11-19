#!/bin/bash

###############################################################################
# Database Restore Script for School Management System
#
# Usage: ./restore-database.sh [backup_file]
#
# Example: ./restore-database.sh /opt/school-management/backups/db_backup_20250119_120000.sql.gz
###############################################################################

# Configuration
DB_NAME="school_management"
DB_USER="school_admin"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error:${NC} Backup file not specified"
    echo ""
    echo "Usage: $0 <backup_file>"
    echo ""
    echo "Available backups:"
    find /opt/school-management/backups -name "db_backup_*.sql.gz" -type f -exec ls -lh {} \; 2>/dev/null || \
        echo "  No backups found in /opt/school-management/backups"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error:${NC} Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║       Database Restore - School Management System        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "  Backup file: $BACKUP_FILE"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""
echo -e "${YELLOW}WARNING:${NC} This will replace all data in the database!"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo ""
echo "Starting restore process..."

# Check if PostgreSQL is running
if ! pg_isready -h localhost -U "$DB_USER" &>/dev/null; then
    echo -e "${RED}Error:${NC} PostgreSQL is not running or not accessible"
    exit 1
fi

# Create a safety backup before restore
SAFETY_BACKUP="/tmp/pre_restore_backup_$(date +%Y%m%d_%H%M%S).sql.gz"
echo ""
echo "Creating safety backup before restore..."
if PGPASSWORD="${DB_PASSWORD:-}" pg_dump -U "$DB_USER" -h localhost "$DB_NAME" | gzip > "$SAFETY_BACKUP"; then
    echo -e "${GREEN}✓${NC} Safety backup created: $SAFETY_BACKUP"
else
    echo -e "${YELLOW}Warning:${NC} Could not create safety backup"
fi

# Drop and recreate database
echo ""
echo "Dropping and recreating database..."
PGPASSWORD="${DB_PASSWORD:-}" psql -U "$DB_USER" -h localhost -d postgres <<EOF
DROP DATABASE IF EXISTS $DB_NAME;
CREATE DATABASE $DB_NAME;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF

if [ $? -ne 0 ]; then
    echo -e "${RED}Error:${NC} Failed to recreate database"
    echo "Safety backup is available at: $SAFETY_BACKUP"
    exit 1
fi

# Restore from backup
echo ""
echo "Restoring from backup..."
if gunzip -c "$BACKUP_FILE" | PGPASSWORD="${DB_PASSWORD:-}" psql -U "$DB_USER" -h localhost "$DB_NAME" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Database restored successfully!"
    echo ""
    echo "Restore completed. Safety backup: $SAFETY_BACKUP"
    echo ""
    echo "Next steps:"
    echo "  1. Restart the backend service: sudo systemctl restart school-backend"
    echo "  2. Verify the application is working"
    echo "  3. If everything is OK, you can delete the safety backup"
    echo ""
else
    echo -e "${RED}Error:${NC} Restore failed!"
    echo ""
    echo "Attempting to restore from safety backup..."
    if gunzip -c "$SAFETY_BACKUP" | PGPASSWORD="${DB_PASSWORD:-}" psql -U "$DB_USER" -h localhost "$DB_NAME" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Safety backup restored"
    else
        echo -e "${RED}Error:${NC} Could not restore safety backup!"
    fi
    exit 1
fi
