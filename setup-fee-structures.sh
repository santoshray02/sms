#!/bin/bash
#
# Fee Structures Setup Script
# Run this after completing ERPNext Setup Wizard to create fee structures
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "========================================"
echo "Fee Structures Setup for ERPNext School"
echo "========================================"
echo ""

# Load configuration
CONFIG_FILE="${CONFIG_FILE:-.school.conf}"
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
else
    print_error "Configuration file not found: $CONFIG_FILE"
    exit 1
fi

# Get project name
USERNAME=$(whoami)
PROJECT_NAME="${USERNAME}_${SCHOOL_CODE}"

print_info "Project: ${PROJECT_NAME}"
print_info "Site: ${SITE_NAME}"
echo ""

# Find backend container
BACKEND_CONTAINER=$(docker ps --filter "name=${PROJECT_NAME}.*backend" --format "{{.Names}}" | head -1)

if [ -z "$BACKEND_CONTAINER" ]; then
    print_error "Backend container not found for project: ${PROJECT_NAME}"
    print_info "Make sure the containers are running: ./manage.sh start"
    exit 1
fi

print_info "Using container: ${BACKEND_CONTAINER}"
echo ""

# Create a Python script for fee structures only
cat > /tmp/setup_fee_structures.py << 'EOFPYTHON'
import frappe

def setup_fee_structures():
    """Create CBSE-aligned fee structures"""
    print("\n=== Creating Fee Structures ===\n")

    # Get the first non-group company, or any company
    company = None
    try:
        companies = frappe.get_all("Company", filters={"is_group": 0}, fields=["name"], limit=1)
        if companies:
            company = companies[0].name
        else:
            companies = frappe.get_all("Company", fields=["name"], limit=1)
            if companies:
                company = companies[0].name
    except Exception as e:
        print(f"✗ Error finding company: {e}")
        return

    if not company:
        print("✗ No company found!")
        print("  Please complete the ERPNext Setup Wizard first.")
        return

    print(f"  Using company: {company}")

    # Get default receivable account
    receivable_account = frappe.db.get_value("Company", company, "default_receivable_account")

    if not receivable_account:
        receivable_account = frappe.db.get_value("Account",
            {"account_type": "Receivable", "is_group": 0, "company": company}, "name")

    if not receivable_account:
        receivable_account = frappe.db.get_value("Account",
            {"account_type": "Receivable", "is_group": 0}, "name")

    if not receivable_account:
        print(f"✗ No receivable account found for company '{company}'")
        return

    print(f"  Using receivable account: {receivable_account}")

    fee_structures = [
        # Pre-Primary
        {"program": "Playgroup", "monthly_fee": 500},
        {"program": "Nursery", "monthly_fee": 550},
        {"program": "Lower Kindergarten (LKG)", "monthly_fee": 550},
        {"program": "Upper Kindergarten (UKG)", "monthly_fee": 600},
        # Primary
        {"program": "Class 1", "monthly_fee": 650},
        {"program": "Class 2", "monthly_fee": 700},
        {"program": "Class 3", "monthly_fee": 700},
        {"program": "Class 4", "monthly_fee": 750},
        {"program": "Class 5", "monthly_fee": 750},
        # Middle School
        {"program": "Class 6", "monthly_fee": 750},
        {"program": "Class 7", "monthly_fee": 850},
        {"program": "Class 8", "monthly_fee": 900},
        # High School
        {"program": "Class 9", "monthly_fee": 1000},
        {"program": "Class 10", "monthly_fee": 1100},
        # Senior Secondary
        {"program": "Class 11 (Science)", "monthly_fee": 1200},
        {"program": "Class 11 (Commerce)", "monthly_fee": 1000},
        {"program": "Class 11 (Arts)", "monthly_fee": 900},
        {"program": "Class 12 (Science)", "monthly_fee": 1200},
        {"program": "Class 12 (Commerce)", "monthly_fee": 1000},
        {"program": "Class 12 (Arts)", "monthly_fee": 900},
    ]

    created_count = 0
    for fee_data in fee_structures:
        try:
            program_name = fee_data["program"]
            fee_structure_name = f"{program_name} Fee Structure"

            if frappe.db.exists("Fee Structure", fee_structure_name):
                print(f"⊙ Already exists: {fee_structure_name}")
                continue

            # Check if program exists
            if not frappe.db.exists("Program", program_name):
                print(f"⚠ Program not found: {program_name}, skipping")
                continue

            doc = frappe.get_doc({
                "doctype": "Fee Structure",
                "program": program_name,
                "receivable_account": receivable_account,
                "company": company,
                "components": [
                    {
                        "fees_category": "Tuition Fee",
                        "amount": fee_data["monthly_fee"]
                    }
                ]
            })
            doc.insert(ignore_permissions=True)
            created_count += 1
            print(f"✓ Created: {fee_structure_name} (₹{fee_data['monthly_fee']}/month)")
        except Exception as e:
            print(f"✗ Failed to create {program_name}: {e}")

    frappe.db.commit()

    if created_count > 0:
        print(f"\n✓ Successfully created {created_count} fee structures")
    else:
        print("\n⊙ No new fee structures created (may already exist)")

# Run the setup
setup_fee_structures()
frappe.destroy()
EOFPYTHON

print_info "Creating fee structures for all programs..."
echo ""

# Copy script to container and execute
docker cp /tmp/setup_fee_structures.py "${BACKEND_CONTAINER}:/tmp/"

docker exec -w /home/frappe/frappe-bench "${BACKEND_CONTAINER}" \
    bench --site "${SITE_NAME}" execute frappe.commands.execute /tmp/setup_fee_structures.py

EXIT_CODE=$?

# Cleanup
rm -f /tmp/setup_fee_structures.py
docker exec "${BACKEND_CONTAINER}" rm -f /tmp/setup_fee_structures.py

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    print_success "Fee structures setup completed!"
    echo ""
    print_info "You can now:"
    echo "  - View fee structures in ERPNext → Education → Fee Structure"
    echo "  - Customize fee amounts as needed"
    echo "  - Set up additional fee components"
else
    print_error "Fee structures setup failed"
    echo ""
    print_info "Make sure:"
    echo "  - ERPNext Setup Wizard is completed"
    echo "  - A company has been created"
    echo "  - Programs have been created (run the main school setup first)"
    exit 1
fi
