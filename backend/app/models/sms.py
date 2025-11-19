from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base


class SMSLog(Base):
    """
    SMS log for tracking all notifications sent
    """
    __tablename__ = "sms_logs"

    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String(15), nullable=False, index=True)
    message = Column(Text, nullable=False)
    sms_type = Column(String(20), nullable=False, index=True)  # fee_generated, reminder, custom

    student_id = Column(Integer, ForeignKey("students.id"), nullable=True)
    monthly_fee_id = Column(Integer, ForeignKey("monthly_fees.id"), nullable=True)

    status = Column(String(20), nullable=False)  # sent, failed, pending
    gateway_response = Column(Text, nullable=True)

    sent_at = Column(DateTime, server_default=func.now())

    # Relationships
    student = relationship("Student", back_populates="sms_logs")

    def __repr__(self):
        return f"<SMSLog {self.phone_number} - {self.sms_type} - {self.status}>"


class SystemSetting(Base):
    """
    System settings key-value store
    """
    __tablename__ = "system_settings"

    key = Column(String(50), primary_key=True)
    value = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<SystemSetting {self.key}>"
