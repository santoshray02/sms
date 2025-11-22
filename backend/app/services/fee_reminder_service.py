"""
Automated Fee Reminders Service

This service implements intelligent fee reminder automation that:
- Sends timely reminders before and after due dates
- Tracks reminder effectiveness
- Prevents reminder spam with throttling
- Provides analytics on payment behavior
"""
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.fee import MonthlyFee
from app.models.student import Student
from app.models.automation import FeeReminder, AutomationConfig
from app.services.sms_service import SMSService


class FeeReminderService:
    """
    Service for automated fee reminder management
    """

    @staticmethod
    async def get_config(db: AsyncSession, key: str, default: Any = None) -> Any:
        """Get automation configuration value"""
        stmt = select(AutomationConfig).where(AutomationConfig.config_key == key)
        result = await db.execute(stmt)
        config = result.scalar_one_or_none()

        if not config:
            return default

        # Parse value based on type
        if config.config_type == "boolean":
            return config.config_value.lower() == "true"
        elif config.config_type == "integer":
            return int(config.config_value)
        elif config.config_type == "json":
            import json
            return json.loads(config.config_value)
        else:
            return config.config_value

    @staticmethod
    async def should_send_reminder(
        db: AsyncSession,
        monthly_fee: MonthlyFee,
        reminder_type: str
    ) -> bool:
        """
        Check if reminder should be sent based on rules and throttling

        Args:
            monthly_fee: MonthlyFee record
            reminder_type: 'advance', 'due', 'overdue', 'final'

        Returns:
            True if reminder should be sent
        """
        # Check if reminders are enabled
        enabled = await FeeReminderService.get_config(db, "fee_reminder_enabled", True)
        if not enabled:
            return False

        # Check max reminders per student
        max_reminders = await FeeReminderService.get_config(db, "max_reminders_per_student", 4)

        # Count existing reminders for this fee
        stmt = select(func.count()).select_from(FeeReminder).where(
            and_(
                FeeReminder.student_id == monthly_fee.student_id,
                FeeReminder.monthly_fee_id == monthly_fee.id
            )
        )
        result = await db.execute(stmt)
        reminder_count = result.scalar()

        if reminder_count >= max_reminders:
            return False

        # Check if similar reminder was sent recently (throttling)
        # Don't send same type of reminder within 2 days
        two_days_ago = datetime.utcnow() - timedelta(days=2)
        stmt = select(FeeReminder).where(
            and_(
                FeeReminder.student_id == monthly_fee.student_id,
                FeeReminder.monthly_fee_id == monthly_fee.id,
                FeeReminder.reminder_type == reminder_type,
                FeeReminder.sent_at >= two_days_ago
            )
        )
        result = await db.execute(stmt)
        recent_reminder = result.scalar_one_or_none()

        if recent_reminder:
            return False

        return True

    @staticmethod
    async def get_pending_fees_for_reminders(db: AsyncSession) -> Dict[str, List[MonthlyFee]]:
        """
        Get all pending fees categorized by reminder type

        Returns:
            Dict with keys: 'advance', 'due', 'overdue_3', 'overdue_7', 'overdue_15'
        """
        today = date.today()

        # Get configuration
        days_before = await FeeReminderService.get_config(db, "fee_reminder_days_before", 3)
        overdue_days_str = await FeeReminderService.get_config(db, "fee_reminder_overdue_days", "3,7,15")
        overdue_days = [int(d.strip()) for d in overdue_days_str.split(",")]

        # Base query for pending fees
        base_stmt = (
            select(MonthlyFee)
            .where(
                and_(
                    MonthlyFee.status.in_(["pending", "partial"]),
                    MonthlyFee.amount_pending > 0
                )
            )
            .options(joinedload(MonthlyFee.student))
        )

        categorized_fees = {
            "advance": [],
            "due": [],
            "overdue_3": [],
            "overdue_7": [],
            "overdue_15": []
        }

        # Advance reminders (N days before due date)
        advance_date = today + timedelta(days=days_before)
        stmt = base_stmt.where(MonthlyFee.due_date == advance_date)
        result = await db.execute(stmt)
        categorized_fees["advance"] = list(result.scalars().all())

        # Due today reminders
        stmt = base_stmt.where(MonthlyFee.due_date == today)
        result = await db.execute(stmt)
        categorized_fees["due"] = list(result.scalars().all())

        # Overdue reminders
        for days in overdue_days:
            overdue_date = today - timedelta(days=days)
            stmt = base_stmt.where(MonthlyFee.due_date == overdue_date)
            result = await db.execute(stmt)
            categorized_fees[f"overdue_{days}"] = list(result.scalars().all())

        return categorized_fees

    @staticmethod
    async def send_reminder(
        db: AsyncSession,
        monthly_fee: MonthlyFee,
        reminder_type: str
    ) -> bool:
        """
        Send a single reminder SMS

        Args:
            monthly_fee: MonthlyFee record
            reminder_type: 'advance', 'due', 'overdue', 'final'

        Returns:
            True if SMS was sent successfully
        """
        student = monthly_fee.student

        # Prepare message based on reminder type
        if reminder_type == "advance":
            message = (
                f"Dear {student.parent_name}, "
                f"Reminder: Fee of Rs. {monthly_fee.amount_pending/100:.2f} for "
                f"{student.first_name} ({monthly_fee.month}/{monthly_fee.year}) "
                f"is due on {monthly_fee.due_date.strftime('%d-%b-%Y')}. "
                f"Please pay on time to avoid late fees."
            )
        elif reminder_type == "due":
            message = (
                f"URGENT: Dear {student.parent_name}, "
                f"Fee of Rs. {monthly_fee.amount_pending/100:.2f} for "
                f"{student.first_name} ({monthly_fee.month}/{monthly_fee.year}) "
                f"is due TODAY ({monthly_fee.due_date.strftime('%d-%b-%Y')}). "
                f"Please pay immediately."
            )
        elif reminder_type == "overdue":
            days_overdue = (date.today() - monthly_fee.due_date).days
            message = (
                f"OVERDUE: Dear {student.parent_name}, "
                f"Fee of Rs. {monthly_fee.amount_pending/100:.2f} for "
                f"{student.first_name} ({monthly_fee.month}/{monthly_fee.year}) "
                f"is overdue by {days_overdue} days. "
                f"Please clear the dues urgently to avoid penalties."
            )
        else:  # final
            days_overdue = (date.today() - monthly_fee.due_date).days
            message = (
                f"FINAL NOTICE: Dear {student.parent_name}, "
                f"Fee of Rs. {monthly_fee.amount_pending/100:.2f} for "
                f"{student.first_name} ({monthly_fee.month}/{monthly_fee.year}) "
                f"is overdue by {days_overdue} days. "
                f"This is the final reminder. Please contact school office immediately."
            )

        # Send SMS
        success = await SMSService._send_sms(
            phone=student.parent_phone,
            message=message
        )

        # Create reminder record
        fee_reminder = FeeReminder(
            student_id=student.id,
            monthly_fee_id=monthly_fee.id,
            reminder_type=reminder_type,
            amount_pending=monthly_fee.amount_pending,
            due_date=monthly_fee.due_date,
            sent_at=datetime.utcnow(),
            sms_status="sent" if success else "failed",
            sms_id=None  # Can be populated if SMS gateway returns ID
        )
        db.add(fee_reminder)
        await db.commit()

        return success

    @staticmethod
    async def process_automated_reminders(db: AsyncSession) -> Dict[str, Any]:
        """
        Main method to process all automated reminders
        This should be called by the daily cron job

        Returns:
            Stats about reminders sent
        """
        stats = {
            "total_processed": 0,
            "reminders_sent": 0,
            "reminders_failed": 0,
            "by_type": {
                "advance": 0,
                "due": 0,
                "overdue": 0,
                "final": 0
            }
        }

        # Get all pending fees categorized
        categorized_fees = await FeeReminderService.get_pending_fees_for_reminders(db)

        # Process advance reminders
        for monthly_fee in categorized_fees["advance"]:
            stats["total_processed"] += 1
            if await FeeReminderService.should_send_reminder(db, monthly_fee, "advance"):
                success = await FeeReminderService.send_reminder(db, monthly_fee, "advance")
                if success:
                    stats["reminders_sent"] += 1
                    stats["by_type"]["advance"] += 1
                else:
                    stats["reminders_failed"] += 1

        # Process due today reminders
        for monthly_fee in categorized_fees["due"]:
            stats["total_processed"] += 1
            if await FeeReminderService.should_send_reminder(db, monthly_fee, "due"):
                success = await FeeReminderService.send_reminder(db, monthly_fee, "due")
                if success:
                    stats["reminders_sent"] += 1
                    stats["by_type"]["due"] += 1
                else:
                    stats["reminders_failed"] += 1

        # Process overdue reminders
        for key in ["overdue_3", "overdue_7", "overdue_15"]:
            for monthly_fee in categorized_fees[key]:
                stats["total_processed"] += 1
                reminder_type = "overdue" if key != "overdue_15" else "final"
                if await FeeReminderService.should_send_reminder(db, monthly_fee, reminder_type):
                    success = await FeeReminderService.send_reminder(db, monthly_fee, reminder_type)
                    if success:
                        stats["reminders_sent"] += 1
                        stats["by_type"][reminder_type] += 1
                    else:
                        stats["reminders_failed"] += 1

        return stats

    @staticmethod
    async def get_reminder_stats(db: AsyncSession) -> Dict[str, Any]:
        """
        Get overall statistics about fee reminders

        Returns:
            Statistics about reminder effectiveness
        """
        # Total reminders sent
        stmt = select(func.count()).select_from(FeeReminder)
        result = await db.execute(stmt)
        total_reminders = result.scalar()

        # Reminders by type
        stmt = select(
            FeeReminder.reminder_type,
            func.count(FeeReminder.id)
        ).group_by(FeeReminder.reminder_type)
        result = await db.execute(stmt)
        by_type = dict(result.all())

        # Reminders that led to payment
        stmt = select(func.count()).select_from(FeeReminder).where(
            FeeReminder.payment_received_after == True
        )
        result = await db.execute(stmt)
        payment_after_reminder = result.scalar()

        # Average days to payment after reminder
        stmt = select(func.avg(FeeReminder.days_to_payment)).where(
            FeeReminder.days_to_payment.isnot(None)
        )
        result = await db.execute(stmt)
        avg_days_to_payment = result.scalar()

        # Recent reminders (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        stmt = select(func.count()).select_from(FeeReminder).where(
            FeeReminder.sent_at >= seven_days_ago
        )
        result = await db.execute(stmt)
        recent_reminders = result.scalar()

        return {
            "total_reminders": total_reminders,
            "by_type": by_type,
            "payment_after_reminder": payment_after_reminder,
            "effectiveness_rate": (payment_after_reminder / total_reminders * 100) if total_reminders > 0 else 0,
            "avg_days_to_payment": float(avg_days_to_payment) if avg_days_to_payment else None,
            "recent_reminders_7_days": recent_reminders
        }

    @staticmethod
    async def mark_payment_received(
        db: AsyncSession,
        monthly_fee_id: int
    ) -> None:
        """
        Mark all reminders for this fee as having received payment
        This should be called when a payment is recorded
        """
        now = datetime.utcnow()

        # Get all reminders for this fee
        stmt = select(FeeReminder).where(
            and_(
                FeeReminder.monthly_fee_id == monthly_fee_id,
                FeeReminder.payment_received_after == False
            )
        )
        result = await db.execute(stmt)
        reminders = result.scalars().all()

        # Update each reminder
        for reminder in reminders:
            reminder.payment_received_after = True
            days_diff = (now - reminder.sent_at).days
            reminder.days_to_payment = days_diff

        await db.commit()
