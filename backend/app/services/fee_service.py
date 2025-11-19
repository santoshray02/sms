from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date, datetime
from typing import List

from app.models.student import Student
from app.models.fee import FeeStructure, MonthlyFee
from app.models.academic import TransportRoute


class FeeService:
    """
    Service for fee generation and management
    """

    @staticmethod
    async def generate_monthly_fees(
        db: AsyncSession,
        academic_year_id: int,
        month: int,
        year: int,
        due_day: int = 10
    ) -> int:
        """
        Generate monthly fees for all active students

        Returns: Number of fees generated
        """
        # Get all active students for the academic year
        result = await db.execute(
            select(Student).where(
                Student.academic_year_id == academic_year_id,
                Student.status == "active"
            )
        )
        students = result.scalars().all()

        generated_count = 0

        for student in students:
            # Check if fee already exists
            existing = await db.execute(
                select(MonthlyFee).where(
                    MonthlyFee.student_id == student.id,
                    MonthlyFee.academic_year_id == academic_year_id,
                    MonthlyFee.month == month,
                    MonthlyFee.year == year
                )
            )
            if existing.scalar_one_or_none():
                continue  # Skip if already generated

            # Get fee structure for student's class
            fee_structure_result = await db.execute(
                select(FeeStructure).where(
                    FeeStructure.class_id == student.class_id,
                    FeeStructure.academic_year_id == academic_year_id
                )
            )
            fee_structure = fee_structure_result.scalar_one_or_none()

            if not fee_structure:
                continue  # Skip if no fee structure defined

            # Calculate fees (in paise)
            tuition_fee = fee_structure.tuition_fee
            hostel_fee = fee_structure.hostel_fee if student.has_hostel else 0
            transport_fee = 0

            if student.transport_route_id:
                transport_result = await db.execute(
                    select(TransportRoute).where(TransportRoute.id == student.transport_route_id)
                )
                transport_route = transport_result.scalar_one_or_none()
                if transport_route:
                    transport_fee = transport_route.monthly_fee

            total_fee = tuition_fee + hostel_fee + transport_fee

            # Create due date
            due_date = date(year, month, min(due_day, 28))  # Avoid invalid dates

            # Create monthly fee record
            monthly_fee = MonthlyFee(
                student_id=student.id,
                academic_year_id=academic_year_id,
                month=month,
                year=year,
                tuition_fee=tuition_fee,
                hostel_fee=hostel_fee,
                transport_fee=transport_fee,
                total_fee=total_fee,
                amount_paid=0,
                amount_pending=total_fee,
                status="pending",
                due_date=due_date,
                sms_sent=False,
                reminder_sent=False
            )

            db.add(monthly_fee)
            generated_count += 1

        await db.commit()

        return generated_count

    @staticmethod
    async def calculate_student_fee(
        db: AsyncSession,
        student: Student,
        fee_structure: FeeStructure
    ) -> dict:
        """
        Calculate total fee for a student based on configuration

        Returns: Dictionary with fee breakdown
        """
        tuition_fee = fee_structure.tuition_fee
        hostel_fee = fee_structure.hostel_fee if student.has_hostel else 0
        transport_fee = 0

        if student.transport_route_id:
            result = await db.execute(
                select(TransportRoute).where(TransportRoute.id == student.transport_route_id)
            )
            transport_route = result.scalar_one_or_none()
            if transport_route:
                transport_fee = transport_route.monthly_fee

        return {
            "tuition_fee": tuition_fee / 100,  # Convert to rupees
            "hostel_fee": hostel_fee / 100,
            "transport_fee": transport_fee / 100,
            "total_fee": (tuition_fee + hostel_fee + transport_fee) / 100
        }

    @staticmethod
    async def update_payment_status(
        db: AsyncSession,
        monthly_fee: MonthlyFee
    ):
        """
        Update monthly fee payment status based on amount paid
        """
        if monthly_fee.amount_paid >= monthly_fee.total_fee:
            monthly_fee.status = "paid"
            monthly_fee.amount_pending = 0
        elif monthly_fee.amount_paid > 0:
            monthly_fee.status = "partial"
            monthly_fee.amount_pending = monthly_fee.total_fee - monthly_fee.amount_paid
        else:
            monthly_fee.status = "pending"
            monthly_fee.amount_pending = monthly_fee.total_fee

        await db.commit()
