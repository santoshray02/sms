from sqlalchemy import Column, Integer, String, Date, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base


class Concession(Base):
    """
    Concession/Scholarship model for fee waivers and discounts
    Types: Government Scholarship, Merit-based, Sibling discount, Financial hardship
    """
    __tablename__ = "concessions"

    id = Column(Integer, primary_key=True, index=True)

    # Student reference
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)

    # Concession details
    concession_type = Column(String(100), nullable=False)  # Scholarship/Sibling/Merit/Financial
    percentage = Column(Integer, nullable=False, default=0)  # 0-100%
    amount = Column(Integer, nullable=False, default=0)  # Fixed amount in paise
    reason = Column(String(200), nullable=True)

    # Approval tracking
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Validity period
    valid_from = Column(Date, nullable=False)
    valid_to = Column(Date, nullable=True)

    # Status
    is_active = Column(Boolean, default=True)
    remarks = Column(Text, nullable=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    student = relationship("Student", back_populates="concessions")
    approved_by_user = relationship("User", foreign_keys=[approved_by])

    def __repr__(self):
        return f"<Concession {self.concession_type} - Student {self.student_id} - {self.percentage}%>"
