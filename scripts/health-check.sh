#!/bin/bash

###############################################################################
# Health Check Script for School Management System
#
# Usage: ./health-check.sh
#
# Checks:
# - Backend API health
# - Database connectivity
# - Disk space
# - Memory usage
# - Service status
###############################################################################

# Configuration
API_URL="${API_URL:-http://localhost:8000}"
DB_USER="${DB_USER:-school_admin}"
DB_NAME="${DB_NAME:-school_management}"
ALERT_EMAIL="${ALERT_EMAIL:-admin@yourdomain.com}"
DISK_THRESHOLD=90
MEMORY_THRESHOLD=90

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
ERRORS=0
WARNINGS=0

# Functions
check_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}"
    else
        echo -e "${RED}✗ FAIL${NC}"
        ERRORS=$((ERRORS + 1))
    fi
}

warning_status() {
    echo -e "${YELLOW}⚠ WARNING${NC}"
    WARNINGS=$((WARNINGS + 1))
}

# Start health check
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║          Health Check - School Management System         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Check 1: Backend API Health
echo -n "1. Backend API Health ($API_URL/health)... "
response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" 2>/dev/null)
if [ "$response" = "200" ]; then
    check_status 0
else
    check_status 1
    echo "   HTTP Status: $response"
fi

# Check 2: Backend API Root
echo -n "2. Backend API Root ($API_URL/)... "
response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/" 2>/dev/null)
if [ "$response" = "200" ]; then
    check_status 0
else
    check_status 1
    echo "   HTTP Status: $response"
fi

# Check 3: Database Connectivity
echo -n "3. Database Connectivity... "
if PGPASSWORD="${DB_PASSWORD:-}" psql -U "$DB_USER" -h localhost -d "$DB_NAME" -c "SELECT 1" > /dev/null 2>&1; then
    check_status 0
else
    check_status 1
fi

# Check 4: Database Size
echo -n "4. Database Size... "
db_size=$(PGPASSWORD="${DB_PASSWORD:-}" psql -U "$DB_USER" -h localhost -d "$DB_NAME" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" 2>/dev/null | tr -d ' ')
if [ -n "$db_size" ]; then
    echo -e "${GREEN}✓${NC} $db_size"
else
    warning_status
fi

# Check 5: Disk Space
echo -n "5. Disk Space... "
disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$disk_usage" -lt "$DISK_THRESHOLD" ]; then
    echo -e "${GREEN}✓${NC} ${disk_usage}% used"
else
    warning_status
    echo "   ${disk_usage}% used (threshold: ${DISK_THRESHOLD}%)"
fi

# Check 6: Memory Usage
echo -n "6. Memory Usage... "
memory_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
if [ "$memory_usage" -lt "$MEMORY_THRESHOLD" ]; then
    echo -e "${GREEN}✓${NC} ${memory_usage}% used"
else
    warning_status
    echo "   ${memory_usage}% used (threshold: ${MEMORY_THRESHOLD}%)"
fi

# Check 7: Backend Service (if using systemd)
echo -n "7. Backend Service Status... "
if systemctl is-active --quiet school-backend 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Running"
elif [ -f /etc/systemd/system/school-backend.service ]; then
    echo -e "${RED}✗${NC} Not running"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${BLUE}ℹ${NC} Not configured (development mode)"
fi

# Check 8: PostgreSQL Service
echo -n "8. PostgreSQL Service... "
if systemctl is-active --quiet postgresql 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Running"
else
    echo -e "${RED}✗${NC} Not running"
    ERRORS=$((ERRORS + 1))
fi

# Check 9: Nginx Service (if configured)
echo -n "9. Nginx Service... "
if systemctl is-active --quiet nginx 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Running"
elif command -v nginx &> /dev/null; then
    echo -e "${YELLOW}⚠${NC} Installed but not running"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${BLUE}ℹ${NC} Not installed"
fi

# Check 10: Backup Directory
echo -n "10. Backup Directory... "
BACKUP_DIR="/opt/school-management/backups"
if [ -d "$BACKUP_DIR" ]; then
    backup_count=$(find "$BACKUP_DIR" -name "db_backup_*.sql.gz" 2>/dev/null | wc -l)
    echo -e "${GREEN}✓${NC} $backup_count backup(s) found"
else
    warning_status
    echo "   Directory not found: $BACKUP_DIR"
fi

# Check 11: Recent Backup
echo -n "11. Recent Backup (last 24h)... "
recent_backup=$(find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime -1 2>/dev/null | head -1)
if [ -n "$recent_backup" ]; then
    echo -e "${GREEN}✓${NC} Found"
else
    warning_status
    echo "   No recent backup found"
fi

# Check 12: Log Files
echo -n "12. Log Files... "
if [ -d "/opt/school-management/logs" ]; then
    log_size=$(du -sh /opt/school-management/logs 2>/dev/null | cut -f1)
    echo -e "${GREEN}✓${NC} $log_size"
else
    echo -e "${BLUE}ℹ${NC} Directory not found"
fi

# Summary
echo ""
echo "───────────────────────────────────────────────────────────"
echo "Summary:"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    STATUS="healthy"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS warning(s) found${NC}"
    STATUS="warning"
else
    echo -e "${RED}✗ $ERRORS error(s) and $WARNINGS warning(s) found${NC}"
    STATUS="critical"
fi

echo ""
echo "Status: $STATUS"
echo ""

# Send alert if critical
if [ "$STATUS" = "critical" ] && [ -n "$ALERT_EMAIL" ]; then
    echo "Sending alert email to $ALERT_EMAIL..."
    mail -s "ALERT: School Management System Health Check Failed" "$ALERT_EMAIL" <<EOF
Health check failed for School Management System

Errors: $ERRORS
Warnings: $WARNINGS
Timestamp: $(date '+%Y-%m-%d %H:%M:%S')

Please check the system immediately.
EOF
fi

# Exit with appropriate code
if [ "$STATUS" = "critical" ]; then
    exit 2
elif [ "$STATUS" = "warning" ]; then
    exit 1
else
    exit 0
fi
