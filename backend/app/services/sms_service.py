import requests
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from typing import Optional

from app.core.config import settings
from app.models.sms import SMSLog
from app.models.fee import MonthlyFee
from app.models.student import Student


class SMSService:
    """
    Service for sending SMS notifications via MSG91 or Twilio
    """

    @staticmethod
    async def send_fee_notification(
        db: AsyncSession,
        monthly_fee: MonthlyFee,
        student: Student
    ) -> bool:
        """
        Send fee generated notification to parent

        Returns: True if successful, False otherwise
        """
        # Prepare message
        message = (
            f"Dear {student.parent_name}, "
            f"Fee of Rs. {monthly_fee.total_fee/100:.2f} for {monthly_fee.month}/{monthly_fee.year} "
            f"is generated for {student.first_name}. "
            f"Due date: {monthly_fee.due_date.strftime('%d-%b-%Y')}. "
            f"Please pay on time."
        )

        # Send SMS
        success = await SMSService._send_sms(
            phone=student.parent_phone,
            message=message
        )

        # Log SMS
        sms_log = SMSLog(
            phone_number=student.parent_phone,
            message=message,
            sms_type="fee_generated",
            student_id=student.id,
            monthly_fee_id=monthly_fee.id,
            status="sent" if success else "failed",
            gateway_response=None
        )
        db.add(sms_log)

        # Update monthly fee
        if success:
            monthly_fee.sms_sent = True
            monthly_fee.sms_sent_at = datetime.utcnow()

        await db.commit()

        return success

    @staticmethod
    async def send_reminder(
        db: AsyncSession,
        monthly_fee: MonthlyFee,
        student: Student
    ) -> bool:
        """
        Send payment reminder to parent

        Returns: True if successful, False otherwise
        """
        # Prepare message
        message = (
            f"Reminder: Dear {student.parent_name}, "
            f"Fee of Rs. {monthly_fee.amount_pending/100:.2f} is pending "
            f"for {student.first_name} ({monthly_fee.month}/{monthly_fee.year}). "
            f"Due date: {monthly_fee.due_date.strftime('%d-%b-%Y')}. "
            f"Please clear the dues."
        )

        # Send SMS
        success = await SMSService._send_sms(
            phone=student.parent_phone,
            message=message
        )

        # Log SMS
        sms_log = SMSLog(
            phone_number=student.parent_phone,
            message=message,
            sms_type="reminder",
            student_id=student.id,
            monthly_fee_id=monthly_fee.id,
            status="sent" if success else "failed",
            gateway_response=None
        )
        db.add(sms_log)

        # Update monthly fee
        if success:
            monthly_fee.reminder_sent = True
            monthly_fee.reminder_sent_at = datetime.utcnow()

        await db.commit()

        return success

    @staticmethod
    async def send_custom_sms(
        db: AsyncSession,
        phone: str,
        message: str,
        student_id: Optional[int] = None
    ) -> bool:
        """
        Send custom SMS

        Returns: True if successful, False otherwise
        """
        success = await SMSService._send_sms(phone=phone, message=message)

        # Log SMS
        sms_log = SMSLog(
            phone_number=phone,
            message=message,
            sms_type="custom",
            student_id=student_id,
            status="sent" if success else "failed",
            gateway_response=None
        )
        db.add(sms_log)
        await db.commit()

        return success

    @staticmethod
    async def _send_sms(phone: str, message: str) -> bool:
        """
        Internal method to send SMS via gateway

        Returns: True if successful, False otherwise
        """
        if settings.SMS_GATEWAY == "msg91":
            return await SMSService._send_msg91(phone, message)
        elif settings.SMS_GATEWAY == "twilio":
            return await SMSService._send_twilio(phone, message)
        else:
            # Mock mode for testing
            print(f"[SMS MOCK] To: {phone}, Message: {message}")
            return True

    @staticmethod
    async def _send_msg91(phone: str, message: str) -> bool:
        """Send SMS via MSG91"""
        try:
            url = "https://api.msg91.com/api/v5/flow/"
            payload = {
                "sender": settings.SMS_SENDER_ID,
                "route": settings.SMS_ROUTE,
                "country": "91",
                "sms": [
                    {
                        "message": message,
                        "to": [phone]
                    }
                ]
            }
            headers = {
                "authkey": settings.SMS_API_KEY,
                "content-type": "application/json"
            }

            response = requests.post(url, json=payload, headers=headers, timeout=10)
            return response.status_code == 200
        except Exception as e:
            print(f"MSG91 Error: {str(e)}")
            return False

    @staticmethod
    async def _send_twilio(phone: str, message: str) -> bool:
        """Send SMS via Twilio"""
        try:
            # Twilio implementation would go here
            # For now, return mock success
            print(f"[Twilio] To: {phone}, Message: {message}")
            return True
        except Exception as e:
            print(f"Twilio Error: {str(e)}")
            return False
