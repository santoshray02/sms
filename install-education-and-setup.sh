#!/bin/bash
# Simple Education App Installation + School Setup
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        ERPNext School - Complete Setup                        ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Load site config
if [ -f ".school.conf" ]; then
    source .school.conf
    SITE_NAME="${SITE_NAME:-school.localhost}"
else
    SITE_NAME="school.localhost"
fi

CONTAINER="santosh_main_school-backend-1"

echo "Site: $SITE_NAME"
echo "Container: $CONTAINER"
echo ""

# Step 1: Check if Education app is installed
echo -e "${YELLOW}[1/3]${NC} Checking Education app..."
if docker exec $CONTAINER bench --site $SITE_NAME list-apps 2>/dev/null | grep -q "education"; then
    echo -e "${GREEN}✓${NC} Education app already installed"
else
    echo -e "${YELLOW}⚠${NC} Installing Education app (this takes ~5 minutes)..."

    # Install Education app
    docker exec $CONTAINER bash -c "cd /home/frappe/frappe-bench && bench get-app education --branch version-15"
    docker exec $CONTAINER bench --site $SITE_NAME install-app education

    echo -e "${GREEN}✓${NC} Education app installed"

    # Restart
    echo -e "${YELLOW}⚠${NC} Restarting services..."
    ./manage.sh restart > /dev/null 2>&1
    sleep 10
    echo -e "${GREEN}✓${NC} Services restarted"
fi

echo ""

# Step 2: Copy and prepare setup script
echo -e "${YELLOW}[2/3]${NC} Preparing school setup script..."
cat complete_school_setup.py | docker exec -i $CONTAINER \
    bash -c "cat > /home/frappe/frappe-bench/apps/frappe/frappe/school_setup.py"
echo -e "${GREEN}✓${NC} Setup script ready"

echo ""

# Step 3: Run setup
echo -e "${YELLOW}[3/3]${NC} Creating school data (this takes ~2 minutes)..."
echo ""
docker exec -w /home/frappe/frappe-bench $CONTAINER \
    bench --site $SITE_NAME execute frappe.school_setup.main

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                  🎉 SETUP COMPLETE! 🎉                        ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "📚 LOGIN CREDENTIALS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Principal:   principal@school.local   / principal123"
echo "  Teacher 1:   teacher1@school.local    / teacher123"
echo "  Teacher 2:   teacher2@school.local    / teacher123"
echo "  Teacher 3:   teacher3@school.local    / teacher123"
echo "  Accountant:  accountant@school.local  / accounts123"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 ACCESS:"
echo "  http://localhost:8080"
echo "  https://localhost:8443"
echo ""
echo "📦 CREATED:"
echo "  ✓ 20 CBSE Programs (Playgroup → Class 12)"
echo "  ✓ 19 CBSE Courses"
echo "  ✓ 23 Classrooms"
echo "  ✓ Fee Structures (₹500-1200/month)"
echo "  ✓ 5 Sample Users + 5 Sample Students"
echo ""
echo "⚠️  IMPORTANT: Change default passwords immediately!"
echo ""
