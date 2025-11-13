#!/usr/bin/env python3
"""
Student Import Script for ERPNext Education
Imports students from CSV file and enrolls them in programs

CSV Format:
student_name,gender,date_of_birth,program,academic_year,guardian_name,guardian_email,guardian_mobile,blood_group,address

Example:
Rahul Kumar,Male,2015-05-10,Class 5,2024-25,Rajesh Kumar,rajesh@example.com,9876543210,B+,123 Main Street
Priya Sharma,Female,2016-03-15,Class 4,2024-25,Sunita Sharma,sunita@example.com,9876543211,A+,456 Park Road

Usage:
    python3 import_students.py --site school.localhost --csv students.csv --project school_main
"""

import argparse
import csv
import sys
import subprocess
from datetime import datetime

def generate_import_script(csv_file, dry_run=False):
    """Generate Python script to import students"""

    # Read CSV file
    students = []
    with open(csv_file, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            students.append(row)

    if not students:
        print("Error: No students found in CSV file")
        return None

    print(f"Found {len(students)} students to import")

    # Generate Frappe script
    script = """
import frappe
from frappe.utils import getdate, nowdate

frappe.init(site='{site}')
frappe.connect()

print("\\n" + "="*60)
print("STUDENT IMPORT SCRIPT")
print("="*60)

students_data = {students_data}

imported = 0
errors = 0

for idx, student_data in enumerate(students_data, 1):
    try:
        print(f"\\n[{{idx}}/{{len(students_data)}}] Processing: {{student_data['student_name']}}")

        # Step 1: Create or get Guardian
        guardian_email = (student_data.get('guardian_email') or '').strip()
        guardian_name = (student_data.get('guardian_name') or '').strip()
        guardian_mobile = (student_data.get('guardian_mobile') or '').strip()

        guardian = None
        if guardian_email and guardian_name:
            # Check if guardian exists
            if frappe.db.exists("Guardian", {{"guardian_name": guardian_name}}):
                guardian = frappe.get_doc("Guardian", {{"guardian_name": guardian_name}})
                print(f"  ✓ Guardian exists: {{guardian_name}}")
            else:
                # Create new guardian
                guardian = frappe.get_doc({{
                    "doctype": "Guardian",
                    "guardian_name": guardian_name,
                    "email_address": guardian_email,
                    "mobile_number": guardian_mobile
                }})
                guardian.insert(ignore_permissions=True)
                print(f"  ✓ Created Guardian: {{guardian_name}}")

        # Step 2: Create Student
        student_name = (student_data.get('student_name') or '').strip()

        # Check if student already exists
        if frappe.db.exists("Student", {{"first_name": student_name.split()[0], "last_name": student_name.split()[-1]}}):
            print(f"  ⚠ Student already exists: {{student_name}}")
            continue

        # Split name
        name_parts = student_name.split()
        first_name = name_parts[0]
        last_name = name_parts[-1] if len(name_parts) > 1 else ""
        middle_name = " ".join(name_parts[1:-1]) if len(name_parts) > 2 else ""

        # Build student data dict
        student_dict = {{
            "doctype": "Student",
            "first_name": first_name,
            "middle_name": middle_name,
            "last_name": last_name,
            "gender": student_data.get('gender') or 'Male',
            "date_of_birth": student_data.get('date_of_birth') or '',
        }}

        # Only add optional fields if they have values
        blood_group = student_data.get('blood_group') or ''
        if blood_group.strip():
            student_dict["blood_group"] = blood_group.strip()

        # Handle student email - generate if not provided
        student_email = student_data.get('student_email') or ''
        if student_email.strip():
            student_dict["student_email_id"] = student_email.strip()
        else:
            # Generate email from student name if not provided
            # Format: firstname.lastname.ID@students.school
            email_name = f"{{first_name.lower()}}.{{last_name.lower()}}" if last_name else first_name.lower()
            student_dict["student_email_id"] = f"{{email_name}}.{{idx}}@students.school"

        student_mobile = student_data.get('student_mobile') or ''
        if student_mobile.strip():
            student_dict["student_mobile_number"] = student_mobile.strip()

        address = student_data.get('address') or ''
        if address.strip():
            student_dict["address_line_1"] = address.strip()

        student = frappe.get_doc(student_dict)

        # Add guardian if exists
        if guardian:
            student.append("guardians", {{
                "guardian": guardian.name,
                "relationship": "Parent"
            }})

        student.insert(ignore_permissions=True)
        print(f"  ✓ Created Student: {{student.student_name}} ({{student.name}})")

        # Step 3: Enroll in Program
        program = (student_data.get('program') or '').strip()
        academic_year = (student_data.get('academic_year') or '2024-25').strip()

        if program:
            # Check if program exists
            if not frappe.db.exists("Program", program):
                print(f"  ⚠ Program not found: {{program}}")
            else:
                # Check if already enrolled
                if frappe.db.exists("Program Enrollment", {{
                    "student": student.name,
                    "program": program,
                    "academic_year": academic_year
                }}):
                    print(f"  ⚠ Already enrolled in {{program}}")
                else:
                    enrollment = frappe.get_doc({{
                        "doctype": "Program Enrollment",
                        "student": student.name,
                        "student_name": student.student_name,
                        "program": program,
                        "academic_year": academic_year,
                        "enrollment_date": nowdate()
                    }})
                    enrollment.insert(ignore_permissions=True)
                    print(f"  ✓ Enrolled in: {{program}} ({{academic_year}})")

        frappe.db.commit()
        imported += 1

    except Exception as e:
        errors += 1
        import traceback
        print(f"  ✗ Error: {{str(e)}}")
        print(f"  Traceback: {{traceback.format_exc()}}")
        frappe.db.rollback()

print("\\n" + "="*60)
print(f"IMPORT COMPLETED")
print(f"Successfully imported: {{imported}}")
print(f"Errors: {{errors}}")
print("="*60 + "\\n")

frappe.destroy()
"""

    return script.format(
        site='{site}',
        students_data=repr(students)
    )

def import_students(site, csv_file, project, dry_run=False):
    """Import students into ERPNext"""

    print(f"\n{'DRY RUN - ' if dry_run else ''}Importing students from: {csv_file}")
    print(f"Site: {site}")
    print(f"Project: {project}")

    # Generate import script
    script = generate_import_script(csv_file, dry_run)
    if not script:
        return False

    if dry_run:
        print("\n--- Generated Script (Dry Run) ---")
        print(script[:500] + "...")
        print("\nDry run completed. Use without --dry-run to execute.")
        return True

    # Write script to temp file
    import tempfile
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(script.replace('{site}', site))
        script_path = f.name

    try:
        # Execute via docker
        command = [
            "docker", "compose", "-p", project,
            "exec", "-T", "backend",
            "bench", "--site", site, "console"
        ]

        with open(script_path, 'r') as script_file:
            result = subprocess.run(
                command,
                stdin=script_file,
                capture_output=True,
                text=True,
            )

        if result.returncode == 0:
            print("\n✓ Import completed successfully")
            print(result.stdout)
            return True
        else:
            print("\n✗ Import failed")
            print(result.stderr)
            return False

    finally:
        import os
        os.unlink(script_path)

def create_sample_csv(output_file):
    """Create a sample CSV file"""
    sample_data = [
        {
            'student_name': 'Rahul Kumar',
            'gender': 'Male',
            'date_of_birth': '2015-05-10',
            'program': 'Class 5',
            'academic_year': '2024-25',
            'guardian_name': 'Rajesh Kumar',
            'guardian_email': 'rajesh.kumar@example.com',
            'guardian_mobile': '9876543210',
            'blood_group': 'B+',
            'address': '123 Main Street, Patna'
        },
        {
            'student_name': 'Priya Sharma',
            'gender': 'Female',
            'date_of_birth': '2016-03-15',
            'program': 'Class 4',
            'academic_year': '2024-25',
            'guardian_name': 'Sunita Sharma',
            'guardian_email': 'sunita.sharma@example.com',
            'guardian_mobile': '9876543211',
            'blood_group': 'A+',
            'address': '456 Park Road, Patna'
        },
        {
            'student_name': 'Amit Singh',
            'gender': 'Male',
            'date_of_birth': '2014-08-20',
            'program': 'Class 6',
            'academic_year': '2024-25',
            'guardian_name': 'Vijay Singh',
            'guardian_email': 'vijay.singh@example.com',
            'guardian_mobile': '9876543212',
            'blood_group': 'O+',
            'address': '789 Garden Street, Patna'
        }
    ]

    with open(output_file, 'w', newline='') as f:
        fieldnames = ['student_name', 'gender', 'date_of_birth', 'program', 'academic_year',
                     'guardian_name', 'guardian_email', 'guardian_mobile', 'blood_group', 'address']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(sample_data)

    print(f"✓ Sample CSV created: {output_file}")
    print(f"  Contains {len(sample_data)} sample students")

def main():
    parser = argparse.ArgumentParser(
        description='Import students from CSV to ERPNext Education',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Create sample CSV
  python3 import_students.py --create-sample students.csv

  # Import students (dry run)
  python3 import_students.py --site school.localhost --csv students.csv --project santosh-school_main --dry-run

  # Import students (actual)
  python3 import_students.py --site school.localhost --csv students.csv --project santosh-school_main

CSV Format:
  student_name,gender,date_of_birth,program,academic_year,guardian_name,guardian_email,guardian_mobile,blood_group,address
        """
    )

    parser.add_argument('--site', help='Site name (e.g., school.localhost)')
    parser.add_argument('--csv', help='CSV file with student data')
    parser.add_argument('--project', help='Docker project name (e.g., santosh-school_main)')
    parser.add_argument('--dry-run', action='store_true', help='Test without actually importing')
    parser.add_argument('--create-sample', help='Create sample CSV file')

    args = parser.parse_args()

    if args.create_sample:
        create_sample_csv(args.create_sample)
        return 0

    if not args.site or not args.csv or not args.project:
        parser.print_help()
        print("\nError: --site, --csv, and --project are required (unless using --create-sample)")
        return 1

    success = import_students(args.site, args.csv, args.project, args.dry_run)
    return 0 if success else 1

if __name__ == '__main__':
    sys.exit(main())
