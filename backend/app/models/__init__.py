"""
Database models for School Management System
"""
from app.models.user import User
from app.models.academic import AcademicYear, Class, TransportRoute
from app.models.student import Student
from app.models.fee import FeeStructure, MonthlyFee
from app.models.payment import Payment
from app.models.sms import SMSLog, SystemSetting
from app.models.guardian import Guardian
from app.models.stream import Stream
from app.models.concession import Concession
from app.models.attendance import Attendance

__all__ = [
    "User",
    "AcademicYear",
    "Class",
    "TransportRoute",
    "Student",
    "FeeStructure",
    "MonthlyFee",
    "Payment",
    "SMSLog",
    "SystemSetting",
    "Guardian",
    "Stream",
    "Concession",
    "Attendance",
]
