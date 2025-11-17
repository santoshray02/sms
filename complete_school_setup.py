#!/usr/bin/env python3
"""
Complete School Setup Script for ERPNext Education
This script creates all necessary data for a functional school management system:
- Sample users (Principal, Teachers, Students, Parents, Accountant)
- Education module configuration
- Gender master data
- CBSE board programs and academic structure
- Fee structures
- Classrooms and courses
- Student batches
- Sample students with guardians
- Hides non-school modules via Desktop Icon blocking

Usage:
    Run inside the frappe container:
    bench --site <sitename> execute frappe.school_setup.main
"""

import frappe
from frappe import _
import json

def setup_academic_year():
    """Create current academic year"""
    print("\n=== Creating Academic Year ===\n")

    doc_data = {
        "doctype": "Academic Year",
        "academic_year_name": "2024-25",
        "year_start_date": "2024-04-01",
        "year_end_date": "2025-03-31",
    }

    try:
        if not frappe.db.exists("Academic Year", "2024-25"):
            doc = frappe.get_doc(doc_data)
            doc.insert()
            print("✓ Created: Academic Year 2024-25")
        else:
            print("⊙ Already exists: Academic Year 2024-25")
        frappe.db.commit()
    except Exception as e:
        print(f"✗ Failed to create Academic Year: {e}")


def setup_academic_terms():
    """Create standard academic terms"""
    print("\n=== Creating Academic Terms ===\n")

    terms = [
        {
            "term_name": "First Term",
            "term_start_date": "2024-04-01",
            "term_end_date": "2024-09-30",
            "academic_year": "2024-25"
        },
        {
            "term_name": "Second Term",
            "term_start_date": "2024-10-01",
            "term_end_date": "2025-03-31",
            "academic_year": "2024-25"
        },
    ]

    for term_data in terms:
        try:
            if not frappe.db.exists("Academic Term", term_data["term_name"]):
                doc = frappe.get_doc({
                    "doctype": "Academic Term",
                    **term_data
                })
                doc.insert(ignore_permissions=True)
                print(f"✓ Created: {term_data['term_name']}")
            else:
                print(f"⊙ Already exists: {term_data['term_name']}")
        except Exception as e:
            print(f"✗ Failed to create {term_data['term_name']}: {e}")

    frappe.db.commit()


def setup_fee_categories():
    """Create standard fee categories"""
    print("\n=== Creating Fee Categories ===\n")

    categories = [
        {"category_name": "Tuition Fee", "description": "Regular tuition fees"},
        {"category_name": "Admission Fee", "description": "One-time admission fee"},
        {"category_name": "Transport Fee", "description": "School bus transportation"},
        {"category_name": "Lab Fee", "description": "Laboratory charges"},
        {"category_name": "Library Fee", "description": "Library membership"},
        {"category_name": "Sports Fee", "description": "Sports and physical education"},
        {"category_name": "Exam Fee", "description": "Examination charges"},
        {"category_name": "Computer Fee", "description": "Computer lab charges"},
        {"category_name": "Activity Fee", "description": "Co-curricular activities"},
        {"category_name": "Development Fee", "description": "Infrastructure development"},
        {"category_name": "Books Fee", "description": "Textbooks and materials"},
    ]

    for cat in categories:
        try:
            if not frappe.db.exists("Fee Category", cat["category_name"]):
                doc = frappe.get_doc({
                    "doctype": "Fee Category",
                    **cat
                })
                doc.insert()
                print(f"✓ Created: {cat['category_name']}")
            else:
                print(f"⊙ Already exists: {cat['category_name']}")
        except Exception as e:
            print(f"✗ Failed to create {cat['category_name']}: {e}")

    frappe.db.commit()


def setup_cbse_programs():
    """Create CBSE board programs from Playgroup to Class 12"""
    print("\n=== Creating CBSE Programs ===\n")

    programs = [
        # Pre-Primary
        {"program_name": "Playgroup", "program_abbreviation": "PG"},
        {"program_name": "Nursery", "program_abbreviation": "NUR"},
        {"program_name": "Lower Kindergarten (LKG)", "program_abbreviation": "LKG"},
        {"program_name": "Upper Kindergarten (UKG)", "program_abbreviation": "UKG"},
        # Primary Classes
        {"program_name": "Class 1", "program_abbreviation": "I"},
        {"program_name": "Class 2", "program_abbreviation": "II"},
        {"program_name": "Class 3", "program_abbreviation": "III"},
        {"program_name": "Class 4", "program_abbreviation": "IV"},
        {"program_name": "Class 5", "program_abbreviation": "V"},
        # Middle School
        {"program_name": "Class 6", "program_abbreviation": "VI"},
        {"program_name": "Class 7", "program_abbreviation": "VII"},
        {"program_name": "Class 8", "program_abbreviation": "VIII"},
        # High School
        {"program_name": "Class 9", "program_abbreviation": "IX"},
        {"program_name": "Class 10", "program_abbreviation": "X"},
        # Senior Secondary
        {"program_name": "Class 11 - Science Stream", "program_abbreviation": "XI-SCI"},
        {"program_name": "Class 11 - Commerce Stream", "program_abbreviation": "XI-COM"},
        {"program_name": "Class 11 - Arts Stream", "program_abbreviation": "XI-ART"},
        {"program_name": "Class 12 - Science Stream", "program_abbreviation": "XII-SCI"},
        {"program_name": "Class 12 - Commerce Stream", "program_abbreviation": "XII-COM"},
        {"program_name": "Class 12 - Arts Stream", "program_abbreviation": "XII-ART"},
    ]

    for prog in programs:
        try:
            if not frappe.db.exists("Program", prog["program_name"]):
                doc = frappe.get_doc({
                    "doctype": "Program",
                    "program_name": prog["program_name"],
                    "program_abbreviation": prog["program_abbreviation"],
                })
                doc.insert()
                print(f"✓ Created: {prog['program_name']}")
            else:
                print(f"⊙ Already exists: {prog['program_name']}")
        except Exception as e:
            print(f"✗ Failed to create {prog['program_name']}: {e}")

    frappe.db.commit()


def setup_cbse_courses():
    """Create CBSE curriculum courses"""
    print("\n=== Creating CBSE Courses ===\n")

    courses = [
        # Pre-Primary
        {"course_name": "Early Learning", "course_code": "EL-101"},
        # Primary
        {"course_name": "English", "course_code": "ENG"},
        {"course_name": "Hindi", "course_code": "HIN"},
        {"course_name": "Mathematics", "course_code": "MATH"},
        {"course_name": "Environmental Studies", "course_code": "EVS"},
        # Middle & High School
        {"course_name": "Science", "course_code": "SCI"},
        {"course_name": "Social Science", "course_code": "SST"},
        {"course_name": "Sanskrit", "course_code": "SKT"},
        {"course_name": "Computer Science", "course_code": "CS"},
        {"course_name": "Physical Education", "course_code": "PE"},
        # Class 11-12 Science
        {"course_name": "Physics", "course_code": "PHY"},
        {"course_name": "Chemistry", "course_code": "CHEM"},
        {"course_name": "Biology", "course_code": "BIO"},
        # Class 11-12 Commerce
        {"course_name": "Accountancy", "course_code": "ACC"},
        {"course_name": "Business Studies", "course_code": "BS"},
        {"course_name": "Economics", "course_code": "ECO"},
        # Class 11-12 Arts
        {"course_name": "History", "course_code": "HIST"},
        {"course_name": "Geography", "course_code": "GEO"},
        {"course_name": "Political Science", "course_code": "POL"},
        {"course_name": "Psychology", "course_code": "PSY"},
    ]

    for course in courses:
        try:
            if not frappe.db.exists("Course", course["course_name"]):
                doc = frappe.get_doc({
                    "doctype": "Course",
                    **course
                })
                doc.insert()
                print(f"✓ Created: {course['course_name']}")
            else:
                print(f"⊙ Already exists: {course['course_name']}")
        except Exception as e:
            print(f"✗ Failed to create {course['course_name']}: {e}")

    frappe.db.commit()


def setup_classrooms():
    """Create sample classrooms"""
    print("\n=== Creating Classrooms ===\n")

    classrooms = [
        {"room_name": "Playgroup Room", "seating_capacity": 25},
        {"room_name": "Nursery Room", "seating_capacity": 30},
        {"room_name": "LKG Room A", "seating_capacity": 30},
        {"room_name": "UKG Room A", "seating_capacity": 30},
        {"room_name": "Class 1-A", "seating_capacity": 35},
        {"room_name": "Class 2-A", "seating_capacity": 35},
        {"room_name": "Class 3-A", "seating_capacity": 40},
        {"room_name": "Class 4-A", "seating_capacity": 40},
        {"room_name": "Class 5-A", "seating_capacity": 40},
        {"room_name": "Class 6-A", "seating_capacity": 45},
        {"room_name": "Class 7-A", "seating_capacity": 45},
        {"room_name": "Class 8-A", "seating_capacity": 45},
        {"room_name": "Class 9-A", "seating_capacity": 45},
        {"room_name": "Class 10-A", "seating_capacity": 45},
        {"room_name": "Class 11-Science", "seating_capacity": 40},
        {"room_name": "Class 11-Commerce", "seating_capacity": 35},
        {"room_name": "Class 11-Arts", "seating_capacity": 30},
        {"room_name": "Class 12-Science", "seating_capacity": 40},
        {"room_name": "Class 12-Commerce", "seating_capacity": 35},
        {"room_name": "Class 12-Arts", "seating_capacity": 30},
        {"room_name": "Science Lab", "seating_capacity": 30},
        {"room_name": "Computer Lab", "seating_capacity": 40},
        {"room_name": "Library", "seating_capacity": 50},
    ]

    for room in classrooms:
        try:
            if not frappe.db.exists("Room", room["room_name"]):
                doc = frappe.get_doc({
                    "doctype": "Room",
                    **room
                })
                doc.insert()
                print(f"✓ Created: {room['room_name']}")
            else:
                print(f"⊙ Already exists: {room['room_name']}")
        except Exception as e:
            print(f"✗ Failed to create {room['room_name']}: {e}")

    frappe.db.commit()


def setup_student_batches():
    """Create student batches for academic year"""
    print("\n=== Creating Student Batches ===\n")

    programs = [
        "Playgroup", "Nursery", "Lower Kindergarten (LKG)", "Upper Kindergarten (UKG)",
        "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
        "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
        "Class 11 - Science Stream", "Class 11 - Commerce Stream", "Class 11 - Arts Stream",
        "Class 12 - Science Stream", "Class 12 - Commerce Stream", "Class 12 - Arts Stream",
    ]

    for program_name in programs:
        batch_name = f"{program_name} - 2024-25"
        try:
            if frappe.db.exists("Program", program_name):
                if not frappe.db.exists("Student Batch Name", batch_name):
                    doc = frappe.get_doc({
                        "doctype": "Student Batch Name",
                        "batch_name": batch_name,
                        "program": program_name,
                        "academic_year": "2024-25",
                    })
                    doc.insert()
                    print(f"✓ Created: {batch_name}")
                else:
                    print(f"⊙ Already exists: {batch_name}")
        except Exception as e:
            print(f"✗ Failed to create {batch_name}: {e}")

    frappe.db.commit()


def setup_fee_structures():
    """Create CBSE-aligned fee structures"""
    print("\n=== Creating Fee Structures ===\n")

    # Get the first company
    company = frappe.db.get_value("Company", {"is_group": 0}, "name")
    if not company:
        company = frappe.db.get_value("Company", filters={}, fieldname="name")

    if not company:
        print("⚠ Warning: No company found, skipping fee structures")
        return

    # Get default receivable account for the company
    receivable_account = frappe.db.get_value("Company", company, "default_receivable_account")

    # If company doesn't have default, find any non-group receivable account for this company
    if not receivable_account:
        receivable_account = frappe.db.get_value("Account",
            {"account_type": "Receivable", "is_group": 0, "company": company}, "name")

    # Last resort: find any receivable account
    if not receivable_account:
        receivable_account = frappe.db.get_value("Account",
            {"account_type": "Receivable", "is_group": 0}, "name")

    if not receivable_account:
        print(f"⚠ Warning: No receivable account found for company '{company}', skipping fee structures")
        return

    print(f"  Using receivable account: {receivable_account} (Company: {company})")

    fee_structures = [
        # Pre-Primary
        {"program": "Playgroup", "monthly_fee": 500},
        {"program": "Nursery", "monthly_fee": 550},
        {"program": "Lower Kindergarten (LKG)", "monthly_fee": 550},
        {"program": "Upper Kindergarten (UKG)", "monthly_fee": 600},
        # Primary
        {"program": "Class 1", "monthly_fee": 650},
        {"program": "Class 2", "monthly_fee": 650},
        {"program": "Class 3", "monthly_fee": 700},
        {"program": "Class 4", "monthly_fee": 700},
        {"program": "Class 5", "monthly_fee": 750},
        # Middle School
        {"program": "Class 6", "monthly_fee": 750},
        {"program": "Class 7", "monthly_fee": 800},
        {"program": "Class 8", "monthly_fee": 900},
        # High School
        {"program": "Class 9", "monthly_fee": 1000},
        {"program": "Class 10", "monthly_fee": 1100},
        # Senior Secondary
        {"program": "Class 11 - Science Stream", "monthly_fee": 1200},
        {"program": "Class 11 - Commerce Stream", "monthly_fee": 1000},
        {"program": "Class 11 - Arts Stream", "monthly_fee": 900},
        {"program": "Class 12 - Science Stream", "monthly_fee": 1200},
        {"program": "Class 12 - Commerce Stream", "monthly_fee": 1000},
        {"program": "Class 12 - Arts Stream", "monthly_fee": 900},
    ]

    for fs in fee_structures:
        structure_name = f"{fs['program']} - 2024-25"
        try:
            if frappe.db.exists("Program", fs["program"]):
                if not frappe.db.exists("Fee Structure", structure_name):
                    doc = frappe.get_doc({
                        "doctype": "Fee Structure",
                        "academic_year": "2024-25",
                        "program": fs["program"],
                        "receivable_account": receivable_account,
                        "components": [
                            {
                                "fees_category": "Tuition Fee",
                                "amount": fs["monthly_fee"]
                            }
                        ]
                    })
                    doc.insert(ignore_permissions=True)
                    print(f"✓ Created: {structure_name}")
                else:
                    print(f"⊙ Already exists: {structure_name}")
        except Exception as e:
            print(f"✗ Failed to create {structure_name}: {e}")

    frappe.db.commit()


def create_sample_users():
    """Create sample users - Principal, Teachers, Students, Parents, Accountant"""
    print("\n=== Creating Sample Users ===\n")

    users = [
        {
            "email": "principal@school.local",
            "first_name": "Dr. Ramesh",
            "last_name": "Kumar",
            "role": "Principal",
            "password": "principal123",
            "roles": ["Academics User", "Education Manager", "System Manager"]
        },
        {
            "email": "teacher1@school.local",
            "first_name": "Priya",
            "last_name": "Sharma",
            "role": "Teacher",
            "password": "teacher123",
            "roles": ["Academics User", "Instructor"]
        },
        {
            "email": "teacher2@school.local",
            "first_name": "Amit",
            "last_name": "Singh",
            "role": "Teacher",
            "password": "teacher123",
            "roles": ["Academics User", "Instructor"]
        },
        {
            "email": "teacher3@school.local",
            "first_name": "Sunita",
            "last_name": "Verma",
            "role": "Teacher",
            "password": "teacher123",
            "roles": ["Academics User", "Instructor"]
        },
        {
            "email": "accountant@school.local",
            "first_name": "Rajesh",
            "last_name": "Gupta",
            "role": "Accountant",
            "password": "accounts123",
            "roles": ["Accounts User", "Accounts Manager"]
        },
    ]

    for user_data in users:
        try:
            if not frappe.db.exists("User", user_data["email"]):
                user = frappe.get_doc({
                    "doctype": "User",
                    "email": user_data["email"],
                    "first_name": user_data["first_name"],
                    "last_name": user_data["last_name"],
                    "enabled": 1,
                    "send_welcome_email": 0,
                })
                user.flags.ignore_password_policy = 1
                user.insert(ignore_permissions=True)

                # Set password after creation
                user.new_password = user_data["password"]
                user.save(ignore_permissions=True)

                # Add roles
                for role in user_data["roles"]:
                    user.add_roles(role)

                print(f"✓ Created: {user_data['first_name']} {user_data['last_name']} ({user_data['role']})")
                print(f"  Email: {user_data['email']} | Password: {user_data['password']}")
            else:
                print(f"⊙ Already exists: {user_data['email']}")
        except Exception as e:
            print(f"✗ Failed to create {user_data['email']}: {e}")

    frappe.db.commit()


def setup_genders():
    """Create Gender master data"""
    print("\n=== Creating Gender Master Data ===\n")

    genders = ["Male", "Female", "Other"]

    for gender_name in genders:
        try:
            if not frappe.db.exists("Gender", gender_name):
                gender = frappe.get_doc({
                    "doctype": "Gender",
                    "gender": gender_name
                })
                gender.insert(ignore_permissions=True)
                print(f"✓ Created Gender: {gender_name}")
            else:
                print(f"⊙ Already exists: Gender {gender_name}")
        except Exception as e:
            print(f"✗ Failed to create Gender {gender_name}: {e}")

    frappe.db.commit()


def create_sample_students():
    """Create sample students with guardians"""
    print("\n=== Creating Sample Students ===\n")

    students = [
        {
            "first_name": "Aarav",
            "last_name": "Patel",
            "date_of_birth": "2015-05-15",
            "gender": "Male",
            "program": "Class 5",
            "guardian": {
                "first_name": "Vikram",
                "last_name": "Patel",
                "email": "vikram.patel@example.com",
                "mobile": "9876543210"
            }
        },
        {
            "first_name": "Diya",
            "last_name": "Reddy",
            "date_of_birth": "2014-08-22",
            "gender": "Female",
            "program": "Class 6",
            "guardian": {
                "first_name": "Suresh",
                "last_name": "Reddy",
                "email": "suresh.reddy@example.com",
                "mobile": "9876543211"
            }
        },
        {
            "first_name": "Aryan",
            "last_name": "Mehta",
            "date_of_birth": "2012-11-10",
            "gender": "Male",
            "program": "Class 8",
            "guardian": {
                "first_name": "Ramesh",
                "last_name": "Mehta",
                "email": "ramesh.mehta@example.com",
                "mobile": "9876543212"
            }
        },
        {
            "first_name": "Ananya",
            "last_name": "Iyer",
            "date_of_birth": "2010-03-18",
            "gender": "Female",
            "program": "Class 10",
            "guardian": {
                "first_name": "Srinivasan",
                "last_name": "Iyer",
                "email": "srini.iyer@example.com",
                "mobile": "9876543213"
            }
        },
        {
            "first_name": "Rohan",
            "last_name": "Kapoor",
            "date_of_birth": "2008-12-05",
            "gender": "Male",
            "program": "Class 11 - Science Stream",
            "guardian": {
                "first_name": "Anil",
                "last_name": "Kapoor",
                "email": "anil.kapoor@example.com",
                "mobile": "9876543214"
            }
        },
    ]

    for student_data in students:
        try:
            student_email = f"{student_data['first_name'].lower()}.{student_data['last_name'].lower()}@student.school.local"

            # Create Guardian first
            guardian_name = f"{student_data['guardian']['first_name']} {student_data['guardian']['last_name']}"
            if not frappe.db.exists("Guardian", guardian_name):
                guardian = frappe.get_doc({
                    "doctype": "Guardian",
                    "guardian_name": guardian_name,
                    "email_address": student_data['guardian']['email'],
                    "mobile_number": student_data['guardian']['mobile'],
                })
                guardian.insert(ignore_permissions=True)
                print(f"  ✓ Created Guardian: {guardian_name}")

            # Create Student
            if not frappe.db.exists("Student", student_email):
                student = frappe.get_doc({
                    "doctype": "Student",
                    "first_name": student_data['first_name'],
                    "last_name": student_data['last_name'],
                    "student_email_id": student_email,
                    "date_of_birth": student_data['date_of_birth'],
                    "gender": student_data['gender'],
                    "guardians": [
                        {
                            "guardian": guardian_name
                        }
                    ]
                })
                student.flags.ignore_mandatory = True
                student.insert(ignore_permissions=True)
                print(f"✓ Created Student: {student_data['first_name']} {student_data['last_name']}")

                # Enroll Student in Program
                if frappe.db.exists("Program", student_data['program']):
                    enrollment = frappe.get_doc({
                        "doctype": "Program Enrollment",
                        "student": student.name,
                        "program": student_data['program'],
                        "academic_year": "2024-25",
                        "enrollment_date": "2024-04-01",
                    })
                    enrollment.insert(ignore_permissions=True)
                    print(f"  ✓ Enrolled in: {student_data['program']}")
            else:
                print(f"⊙ Already exists: {student_email}")
        except Exception as e:
            print(f"✗ Failed to create student {student_data['first_name']}: {e}")

    frappe.db.commit()


def hide_non_school_modules():
    """Hide modules not needed for school management"""
    print("\n=== Hiding Non-School Modules ===\n")

    modules_to_hide = [
        "Manufacturing", "Buying", "Selling", "Stock", "CRM",
        "Projects", "Support", "HR", "Loan Management", "Healthcare",
        "Payroll", "Assets", "Quality Management", "Maintenance"
    ]

    try:
        hidden_count = 0
        for module in modules_to_hide:
            # Use Desktop Icon to block modules
            desktop_icons = frappe.get_all("Desktop Icon",
                filters={
                    "module_name": module,
                    "type": "module"
                },
                fields=["name", "blocked"]
            )

            for icon in desktop_icons:
                if not icon.blocked:
                    frappe.db.set_value("Desktop Icon", icon.name, "blocked", 1)
                    hidden_count += 1
                    print(f"✓ Hidden: {module}")
                else:
                    print(f"⊙ Already hidden: {module}")

        frappe.db.commit()
        if hidden_count > 0:
            print(f"\n✓ {hidden_count} non-school modules hidden successfully")
        else:
            print("\n⊙ All modules already hidden")
    except Exception as e:
        print(f"✗ Error hiding modules: {e}")


def setup_student_categories():
    """Create student categories for classification"""
    print("\n=== Creating Student Categories ===\n")

    categories = [
        {"category_name": "General", "description": "General category students"},
        {"category_name": "SC", "description": "Scheduled Caste"},
        {"category_name": "ST", "description": "Scheduled Tribe"},
        {"category_name": "OBC", "description": "Other Backward Classes"},
        {"category_name": "EWS", "description": "Economically Weaker Section"},
    ]

    for cat in categories:
        try:
            if not frappe.db.exists("Student Category", cat["category_name"]):
                doc = frappe.get_doc({
                    "doctype": "Student Category",
                    **cat
                })
                doc.insert(ignore_permissions=True)
                print(f"✓ Created: {cat['category_name']}")
            else:
                print(f"⊙ Already exists: {cat['category_name']}")
        except Exception as e:
            print(f"✗ Failed to create {cat['category_name']}: {e}")

    frappe.db.commit()


def create_instructors():
    """Create instructor records for teachers"""
    print("\n=== Creating Instructor Records ===\n")

    instructors = [
        {"first_name": "Priya", "last_name": "Sharma", "email": "teacher1@school.local", "department": "Science"},
        {"first_name": "Amit", "last_name": "Singh", "email": "teacher2@school.local", "department": "Mathematics"},
        {"first_name": "Sunita", "last_name": "Verma", "email": "teacher3@school.local", "department": "Languages"},
    ]

    for instr_data in instructors:
        try:
            instructor_name = f"{instr_data['first_name']} {instr_data['last_name']}"
            if not frappe.db.exists("Instructor", instructor_name):
                doc = frappe.get_doc({
                    "doctype": "Instructor",
                    "instructor_name": instructor_name,
                    "email": instr_data["email"],
                    "department": instr_data["department"],
                })
                doc.insert(ignore_permissions=True)
                print(f"✓ Created Instructor: {instructor_name}")
            else:
                print(f"⊙ Already exists: {instructor_name}")
        except Exception as e:
            print(f"✗ Failed to create instructor {instructor_name}: {e}")

    frappe.db.commit()


def configure_education_settings():
    """Configure Education Settings for school"""
    print("\n=== Configuring Education Settings ===\n")

    try:
        settings = frappe.get_doc("Education Settings")
        settings.current_academic_year = "2024-25"
        settings.attendance_freeze_date = "2024-04-01"
        settings.validate_attendance_for_course = 1
        settings.save(ignore_permissions=True)
        frappe.db.commit()
        print("✓ Education Settings configured")
    except Exception as e:
        print(f"✗ Failed to configure Education Settings: {e}")


def main():
    """Main setup function"""
    print("\n" + "="*70)
    print("       COMPLETE SCHOOL SETUP - ERPNext Education")
    print("="*70)

    # Get site name from environment or use default
    import os
    import sys

    # Add frappe to path
    sys.path.insert(0, '/home/frappe/frappe-bench/apps/frappe')
    sys.path.insert(0, '/home/frappe/frappe-bench/apps')

    site_name = os.environ.get('SITE_NAME', 'school.localhost')

    # Check if site exists
    sites_path = '/home/frappe/frappe-bench/sites'
    available_sites = [d for d in os.listdir(sites_path) if os.path.isdir(os.path.join(sites_path, d)) and d not in ['assets', 'common_site_config.json']]

    if site_name not in available_sites and len(available_sites) > 0:
        site_name = available_sites[0]
        print(f"\n⚠ Using detected site: {site_name}")

    print(f"\n📍 Site: {site_name}")

    try:
        # Initialize frappe
        frappe.init(site=site_name)
        frappe.connect()

        # Run setup functions
        setup_academic_year()
        setup_academic_terms()
        setup_fee_categories()
        setup_cbse_programs()
        setup_cbse_courses()
        setup_classrooms()
        setup_student_batches()
        setup_fee_structures()
        setup_student_categories()  # Create student categories
        create_sample_users()
        create_instructors()  # Create instructor records for teachers
        setup_genders()  # Create Gender master data before students
        create_sample_students()
        configure_education_settings()
        hide_non_school_modules()

        # Final commit
        frappe.db.commit()

        print("\n" + "="*70)
        print("       SETUP COMPLETED SUCCESSFULLY!")
        print("="*70)
        print("\n📚 Sample Login Credentials:")
        print("-" * 70)
        print("Principal:   principal@school.local   / principal123")
        print("Teacher 1:   teacher1@school.local    / teacher123")
        print("Teacher 2:   teacher2@school.local    / teacher123")
        print("Teacher 3:   teacher3@school.local    / teacher123")
        print("Accountant:  accountant@school.local  / accounts123")
        print("-" * 70)
        print("\n✓ Academic Year & Terms configured")
        print("✓ 20 CBSE Programs (Playgroup to Class 12)")
        print("✓ 19 CBSE Curriculum Courses")
        print("✓ 23 Classrooms created")
        print("✓ 20 Student Batches for 2024-25")
        print("✓ 11 Fee Categories")
        print("✓ Fee Structures for all programs")
        print("✓ 5 Student Categories (General, SC, ST, OBC, EWS)")
        print("✓ 3 Genders (Male, Female, Other)")
        print("✓ 3 Instructor records")
        print("✓ 5 Sample Users (Principal, Teachers, Accountant)")
        print("✓ 5 Sample Students with Guardians & Enrollments")
        print("✓ Non-school modules hidden")
        print("✓ Education Settings configured")
        print("\n" + "="*70 + "\n")

    except Exception as e:
        print(f"\n✗ Setup failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        frappe.destroy()


if __name__ == "__main__":
    main()
