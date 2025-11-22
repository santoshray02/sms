"""
SQLAlchemy models for automation features
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Numeric, Text, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base


class FeeReminder(Base):
    """Tracks automated fee reminders sent to parents"""
    __tablename__ = "fee_reminders"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    monthly_fee_id = Column(Integer, ForeignKey("monthly_fees.id", ondelete="CASCADE"), nullable=False)
    reminder_type = Column(String(20), nullable=False)  # advance, due, overdue, final
    amount_pending = Column(Integer, nullable=False)  # in paise
    due_date = Column(Date, nullable=False)
    sent_at = Column(DateTime, nullable=False, default=func.now())
    sms_status = Column(String(20))  # sent, delivered, failed
    sms_id = Column(String(100))
    payment_received_after = Column(Boolean, default=False)
    days_to_payment = Column(Integer)  # Days between reminder and payment
    created_at = Column(DateTime, default=func.now())

    # Relationships
    student = relationship("Student", back_populates="fee_reminders")
    monthly_fee = relationship("MonthlyFee")

    def __repr__(self):
        return f"<FeeReminder(id={self.id}, student_id={self.student_id}, type={self.reminder_type})>"


class AttendanceAlert(Base):
    """Tracks automated attendance alerts"""
    __tablename__ = "attendance_alerts"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    alert_type = Column(String(20), nullable=False)  # warning, urgent, critical
    attendance_percentage = Column(Numeric(5, 2), nullable=False)
    threshold_crossed = Column(Numeric(5, 2), nullable=False)
    sent_to = Column(String(20), nullable=False)  # parent, teacher, principal
    sent_at = Column(DateTime, nullable=False, default=func.now())
    resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime)
    created_at = Column(DateTime, default=func.now())

    # Relationships
    student = relationship("Student", back_populates="attendance_alerts")

    def __repr__(self):
        return f"<AttendanceAlert(id={self.id}, student_id={self.student_id}, type={self.alert_type})>"


class GeneratedDocument(Base):
    """Tracks all auto-generated documents"""
    __tablename__ = "generated_documents"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"))
    document_type = Column(String(50), nullable=False)  # tc, bonafide, receipt, etc.
    document_path = Column(String(500), nullable=False)
    verification_code = Column(String(100), unique=True, nullable=False, index=True)
    generated_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    generated_at = Column(DateTime, default=func.now())
    accessed_count = Column(Integer, default=0)
    last_accessed = Column(DateTime)
    document_metadata = Column(JSONB)  # Document-specific additional data

    # Relationships
    student = relationship("Student")
    generated_by_user = relationship("User")

    def __repr__(self):
        return f"<GeneratedDocument(id={self.id}, type={self.document_type}, code={self.verification_code})>"


class AnalyticsCache(Base):
    """Caches computed analytics to improve dashboard performance"""
    __tablename__ = "analytics_cache"

    id = Column(Integer, primary_key=True, index=True)
    report_type = Column(String(50), nullable=False, index=True)
    parameters = Column(JSONB)  # Query parameters as JSON
    result_data = Column(JSONB, nullable=False)  # Computed results
    computed_at = Column(DateTime, default=func.now())
    expires_at = Column(DateTime, nullable=False, index=True)

    def __repr__(self):
        return f"<AnalyticsCache(id={self.id}, type={self.report_type})>"


class ReconciliationLog(Base):
    """Logs bank reconciliation matches"""
    __tablename__ = "reconciliation_log"

    id = Column(Integer, primary_key=True, index=True)
    bank_transaction_id = Column(String(100), nullable=False, index=True)
    payment_id = Column(Integer, ForeignKey("payments.id"))
    amount = Column(Integer, nullable=False)  # in paise
    transaction_date = Column(Date, nullable=False)
    match_confidence = Column(Numeric(5, 2))  # 0-100%
    matched_by = Column(String(20), nullable=False)  # auto, manual
    matched_by_user = Column(Integer, ForeignKey("users.id"))
    matched_at = Column(DateTime, default=func.now())
    notes = Column(Text)
    bank_data = Column(JSONB)  # Original bank statement row

    # Relationships
    payment = relationship("Payment")
    user = relationship("User")

    def __repr__(self):
        return f"<ReconciliationLog(id={self.id}, bank_txn={self.bank_transaction_id})>"


class AutomationConfig(Base):
    """System configuration for automation features"""
    __tablename__ = "automation_config"

    id = Column(Integer, primary_key=True, index=True)
    config_key = Column(String(100), unique=True, nullable=False)
    config_value = Column(String(500), nullable=False)
    config_type = Column(String(20), nullable=False)  # string, integer, boolean, json
    description = Column(Text)
    updated_by = Column(Integer, ForeignKey("users.id"))
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User")

    def __repr__(self):
        return f"<AutomationConfig(key={self.config_key}, value={self.config_value})>"
