from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base


class Attendance(Base):
    """
    Daily attendance model - tracks student attendance
    Required for board exam eligibility (75% attendance mandatory)
    """
    __tablename__ = "attendance"
    __table_args__ = (
        UniqueConstraint('student_id', 'date', name='uq_student_date'),
    )

    id = Column(Integer, primary_key=True, index=True)

    # Student and class references
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)

    # Attendance details
    date = Column(Date, nullable=False, index=True)
    status = Column(String(20), nullable=False)  # Present/Absent/Late/HalfDay
    remarks = Column(String(200), nullable=True)

    # Audit trail
    marked_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    student = relationship("Student", back_populates="attendance_records")
    class_ = relationship("Class")
    marked_by_user = relationship("User", foreign_keys=[marked_by])

    def __repr__(self):
        return f"<Attendance Student {self.student_id} - {self.date} - {self.status}>"
