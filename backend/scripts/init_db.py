"""
Initialize database with sample data for testing
"""
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.academic import AcademicYear, Class, TransportRoute
from app.models.student import Student
from app.core.security import get_password_hash
from datetime import date


async def init_database():
    """Initialize database with sample data"""

    async with AsyncSessionLocal() as db:
        print("🚀 Initializing database...")

        # 1. Create admin user
        print("\n1. Creating admin user...")
        admin = User(
            username="admin",
            email="admin@school.com",
            password_hash=get_password_hash("admin123"),
            full_name="System Administrator",
            role="admin",
            is_active=True
        )
        db.add(admin)

        # Create accountant user
        accountant = User(
            username="accountant",
            email="accountant@school.com",
            password_hash=get_password_hash("account123"),
            full_name="School Accountant",
            role="accountant",
            is_active=True
        )
        db.add(accountant)
        await db.commit()
        print("   ✅ Users created: admin/admin123, accountant/account123")

        # 2. Create academic year
        print("\n2. Creating academic year...")
        academic_year = AcademicYear(
            name="2024-25",
            start_date=date(2024, 4, 1),
            end_date=date(2025, 3, 31),
            is_current=True
        )
        db.add(academic_year)
        await db.commit()
        await db.refresh(academic_year)
        print(f"   ✅ Academic year created: {academic_year.name}")

        # 3. Create classes
        print("\n3. Creating classes...")
        classes_data = [
            ("Playgroup", 1),
            ("Nursery", 2),
            ("LKG", 3),
            ("UKG", 4),
            ("Class 1", 5),
            ("Class 2", 6),
            ("Class 3", 7),
            ("Class 4", 8),
            ("Class 5", 9),
            ("Class 6", 10),
            ("Class 7", 11),
            ("Class 8", 12),
            ("Class 9", 13),
            ("Class 10", 14),
            ("Class 11", 15),
            ("Class 12", 16),
        ]

        class_objects = []
        for name, order in classes_data:
            class_obj = Class(
                name=name,
                section="A",
                display_order=order
            )
            db.add(class_obj)
            class_objects.append(class_obj)

        await db.commit()
        print(f"   ✅ Created {len(class_objects)} classes")

        # 4. Create transport routes
        print("\n4. Creating transport routes...")
        routes_data = [
            ("Route 1 (0-5 km)", 5, 50000),  # Rs. 500 stored as 50000 paise
            ("Route 2 (5-10 km)", 10, 75000),  # Rs. 750
            ("Route 3 (10-15 km)", 15, 100000),  # Rs. 1000
        ]

        route_objects = []
        for name, distance, fee in routes_data:
            route = TransportRoute(
                name=name,
                distance_km=distance,
                monthly_fee=fee
            )
            db.add(route)
            route_objects.append(route)

        await db.commit()
        print(f"   ✅ Created {len(route_objects)} transport routes")

        # 5. Create fee structures
        print("\n5. Creating fee structures...")
        from app.models.fee import FeeStructure

        # Refresh class objects
        for class_obj in class_objects:
            await db.refresh(class_obj)

        await db.refresh(academic_year)

        # Fee structures: increasing fees with class level
        base_tuition = 200000  # Rs. 2000 in paise
        base_hostel = 150000   # Rs. 1500 in paise

        for idx, class_obj in enumerate(class_objects):
            # Increase fees by 10% for every 4 classes
            multiplier = 1 + (idx // 4) * 0.1

            fee_structure = FeeStructure(
                class_id=class_obj.id,
                academic_year_id=academic_year.id,
                tuition_fee=int(base_tuition * multiplier),
                hostel_fee=int(base_hostel * multiplier)
            )
            db.add(fee_structure)

        await db.commit()
        print(f"   ✅ Created {len(class_objects)} fee structures")

        # 6. Create sample students
        print("\n6. Creating sample students...")
        sample_students = [
            {
                "admission_number": "2024001",
                "first_name": "Raj",
                "last_name": "Kumar",
                "date_of_birth": date(2015, 5, 15),
                "gender": "Male",
                "class_id": class_objects[4].id,  # Class 1
                "parent_name": "Suresh Kumar",
                "parent_phone": "+919876543210",
                "has_hostel": False,
                "transport_route_id": route_objects[0].id
            },
            {
                "admission_number": "2024002",
                "first_name": "Priya",
                "last_name": "Sharma",
                "date_of_birth": date(2015, 8, 22),
                "gender": "Female",
                "class_id": class_objects[4].id,  # Class 1
                "parent_name": "Ramesh Sharma",
                "parent_phone": "+919876543211",
                "has_hostel": True,
                "transport_route_id": None
            },
            {
                "admission_number": "2024003",
                "first_name": "Amit",
                "last_name": "Patel",
                "date_of_birth": date(2012, 3, 10),
                "gender": "Male",
                "class_id": class_objects[8].id,  # Class 5
                "parent_name": "Vijay Patel",
                "parent_phone": "+919876543212",
                "has_hostel": False,
                "transport_route_id": route_objects[1].id
            },
        ]

        for student_data in sample_students:
            student = Student(
                **student_data,
                academic_year_id=academic_year.id,
                status="active"
            )
            db.add(student)

        await db.commit()
        print(f"   ✅ Created {len(sample_students)} sample students")

        print("\n✅ Database initialization complete!")
        print("\n📋 Login Credentials:")
        print("   Admin:      username='admin',      password='admin123'")
        print("   Accountant: username='accountant', password='account123'")
        print("\n🎓 Sample Data:")
        print(f"   Academic Year: {academic_year.name}")
        print(f"   Classes: {len(class_objects)} (Playgroup to Class 12)")
        print(f"   Transport Routes: {len(route_objects)}")
        print(f"   Students: {len(sample_students)} sample students")
        print("\n🚀 Next steps:")
        print("   1. Start the server: uvicorn app.main:app --reload")
        print("   2. Visit API docs: http://localhost:8000/docs")
        print("   3. Login with admin credentials")
        print("   4. Generate monthly fees: POST /api/v1/fees/generate-monthly")


if __name__ == "__main__":
    asyncio.run(init_database())
