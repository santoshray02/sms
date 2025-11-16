#!/bin/bash

# Direct School Setup Script - No prompts, just runs
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }

echo "=================================================="
echo "  ERPNext School Complete Setup"
echo "=================================================="

# Load config
if [ -f ".school.conf" ]; then
    source .school.conf
    SITE_NAME="${SITE_NAME:-school.localhost}"
    print_success "Loaded config: SITE_NAME=$SITE_NAME"
else
    SITE_NAME="school.localhost"
    print_warning "Using default site: $SITE_NAME"
fi

# Find backend container
CONTAINER_NAME=$(docker ps --filter "name=backend" --format "{{.Names}}" | grep -E "santosh_main_school" | head -1)

if [ -z "$CONTAINER_NAME" ]; then
    print_error "Backend container not found!"
    docker ps --format "table {{.Names}}\t{{.Status}}"
    exit 1
fi

print_success "Found container: $CONTAINER_NAME"

# Copy script to apps/frappe folder so it's in the module path
echo ""
echo "Copying setup script to container..."
cat complete_school_setup.py | docker exec -i "$CONTAINER_NAME" bash -c "cat > /home/frappe/frappe-bench/apps/frappe/frappe/school_setup.py && chmod 644 /home/frappe/frappe-bench/apps/frappe/frappe/school_setup.py"

echo ""
echo "Running setup (this may take a few minutes)..."
echo "=================================================="
echo ""

# Use bench execute with the proper module path
docker exec -w /home/frappe/frappe-bench "$CONTAINER_NAME" bench --site "$SITE_NAME" execute frappe.school_setup.main

if [ $? -eq 0 ]; then
    echo ""
    echo "=================================================="
    print_success "Setup completed successfully!"
    echo "=================================================="
    echo ""
    echo "📚 LOGIN CREDENTIALS:"
    echo "------------------------------------"
    echo "Principal:   principal@school.local   / principal123"
    echo "Teacher 1:   teacher1@school.local    / teacher123"
    echo "Teacher 2:   teacher2@school.local    / teacher123"
    echo "Teacher 3:   teacher3@school.local    / teacher123"
    echo "Accountant:  accountant@school.local  / accounts123"
    echo "------------------------------------"
    echo ""
    echo "Access: http://localhost:8080"
    echo ""
else
    print_error "Setup failed!"
    exit 1
fi
