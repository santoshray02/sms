#!/usr/bin/env python3
"""
Automated School Setup Script
This script creates programs, fee structures, and other school data after site creation
"""

import json
import sys


def setup_academic_programs():
    """Create academic programs from Playgroup to Class 12"""
    programs = [
        # Pre-Primary
        {"name": "Playgroup", "program_name": "Playgroup"},
        {"name": "Nursery", "program_name": "Nursery"},
        {"name": "LKG", "program_name": "Lower Kindergarten (LKG)"},
        {"name": "UKG", "program_name": "Upper Kindergarten (UKG)"},
        # Primary Classes
        {"name": "Class 1", "program_name": "Class 1"},
        {"name": "Class 2", "program_name": "Class 2"},
        {"name": "Class 3", "program_name": "Class 3"},
        {"name": "Class 4", "program_name": "Class 4"},
        {"name": "Class 5", "program_name": "Class 5"},
        # Middle School
        {"name": "Class 6", "program_name": "Class 6"},
        {"name": "Class 7", "program_name": "Class 7"},
        {"name": "Class 8", "program_name": "Class 8"},
        # High School
        {"name": "Class 9", "program_name": "Class 9"},
        {"name": "Class 10", "program_name": "Class 10"},
        # Senior Secondary
        {"name": "Class 11 Science", "program_name": "Class 11 - Science Stream"},
        {"name": "Class 11 Commerce", "program_name": "Class 11 - Commerce Stream"},
        {"name": "Class 11 Arts", "program_name": "Class 11 - Arts Stream"},
        {"name": "Class 12 Science", "program_name": "Class 12 - Science Stream"},
        {"name": "Class 12 Commerce", "program_name": "Class 12 - Commerce Stream"},
        {"name": "Class 12 Arts", "program_name": "Class 12 - Arts Stream"},
    ]

    print("\n=== Creating Academic Programs ===\n")

    for prog in programs:
        doc = {
            "doctype": "Program",
            "program_name": prog["program_name"],
            "program_abbreviation": prog["name"],
        }

        try:
            # Using frappe.get_doc to create the program
            print(f"""
frappe.get_doc({json.dumps(doc, indent=2)}).insert()
print("✓ Created: {prog['program_name']}")
""")
        except Exception as e:
            print(f"✗ Failed to create {prog['program_name']}: {e}")

    print("\nfrappe.db.commit()")


def setup_fee_categories():
    """Create standard fee categories"""
    categories = [
        {"name": "Tuition Fee", "description": "Regular tuition fees"},
        {"name": "Admission Fee", "description": "One-time admission fee"},
        {"name": "Transport Fee", "description": "School bus transportation"},
        {"name": "Lab Fee", "description": "Laboratory charges"},
        {"name": "Library Fee", "description": "Library membership"},
        {"name": "Sports Fee", "description": "Sports and physical education"},
        {"name": "Exam Fee", "description": "Examination charges"},
        {"name": "Computer Fee", "description": "Computer lab charges"},
        {"name": "Activity Fee", "description": "Co-curricular activities"},
        {"name": "Hostel Fee", "description": "Hostel accommodation (if applicable)"},
        {"name": "Mess Fee", "description": "Hostel mess charges"},
        {"name": "Development Fee", "description": "Infrastructure development"},
    ]

    print("\n=== Creating Fee Categories ===\n")

    for cat in categories:
        doc = {
            "doctype": "Fee Category",
            "category_name": cat["name"],
            "description": cat["description"],
        }

        print(f"""
frappe.get_doc({json.dumps(doc, indent=2)}).insert(ignore_if_duplicate=True)
print("✓ Created: {cat['name']}")
""")

    print("\nfrappe.db.commit()")


def setup_academic_terms():
    """Create standard academic terms"""
    terms = [
        {"name": "Term 1", "term_name": "First Term", "term_start_date": "2024-04-01", "term_end_date": "2024-09-30"},
        {"name": "Term 2", "term_name": "Second Term", "term_start_date": "2024-10-01", "term_end_date": "2025-03-31"},
    ]

    print("\n=== Creating Academic Terms ===\n")

    for term in terms:
        doc = {
            "doctype": "Academic Term",
            "academic_term_name": term["term_name"],
            "term_start_date": term["term_start_date"],
            "term_end_date": term["term_end_date"],
        }

        print(f"""
frappe.get_doc({json.dumps(doc, indent=2)}).insert(ignore_if_duplicate=True)
print("✓ Created: {term['term_name']}")
""")

    print("\nfrappe.db.commit()")


def setup_academic_year():
    """Create current academic year"""
    print("\n=== Creating Academic Year ===\n")

    doc = {
        "doctype": "Academic Year",
        "academic_year_name": "2024-25",
        "year_start_date": "2024-04-01",
        "year_end_date": "2025-03-31",
    }

    print(f"""
frappe.get_doc({json.dumps(doc, indent=2)}).insert(ignore_if_duplicate=True)
print("✓ Created: Academic Year 2024-25")
frappe.db.commit()
""")


def generate_bench_commands():
    """Generate the complete frappe-bench console script"""
    print("""#!/usr/bin/env python3
# This script should be executed inside the frappe container
# Usage: bench --site <sitename> console < this_script.py

import frappe

frappe.init(site='<SITE_NAME>')
frappe.connect()

""")

    setup_academic_year()
    setup_academic_terms()
    setup_fee_categories()
    setup_academic_programs()

    print("""
print("\\n" + "="*50)
print("School Setup Completed Successfully!")
print("="*50 + "\\n")

frappe.db.commit()
frappe.destroy()
""")


if __name__ == "__main__":
    print("# Copy this output and save it as setup_script.py")
    print("# Then run: docker compose -p <project> exec backend bench --site <sitename> console < setup_script.py")
    print("\n" + "="*70 + "\n")
    generate_bench_commands()
