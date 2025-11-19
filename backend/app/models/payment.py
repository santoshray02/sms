from sqlalchemy import Column, Integer, String, Date, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base


class Payment(Base):
    """
    Payment record with receipt generation
    """
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    monthly_fee_id = Column(Integer, ForeignKey("monthly_fees.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)

    # Payment details (amount stored as paise)
    amount = Column(Integer, nullable=False)
    payment_mode = Column(String(20), nullable=False)  # cash, upi, cheque, card
    payment_date = Column(Date, nullable=False, index=True)
    transaction_id = Column(String(100), nullable=True)

    # Receipt
    receipt_number = Column(String(50), unique=True, nullable=False, index=True)

    notes = Column(Text, nullable=True)
    recorded_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    monthly_fee = relationship("MonthlyFee", back_populates="payments")
    student = relationship("Student", back_populates="payments")
    recorded_by_user = relationship("User")

    def __repr__(self):
        return f"<Payment {self.receipt_number} - ₹{self.amount/100:.2f}>"
