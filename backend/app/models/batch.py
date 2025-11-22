"""
Batch Management Models

Models for section assignment history and batch management.
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base


class SectionAssignment(Base):
    """
    Section assignment history

    Tracks all section assignments made for students, including the strategy used,
    reason for assignment, and who made the assignment.
    """
    __tablename__ = "section_assignments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_section = Column(String(5), nullable=False)
    assignment_strategy = Column(String(20), nullable=False)  # alphabetical, merit, manual
    assignment_reason = Column(Text, nullable=True)
    assigned_at = Column(DateTime, server_default=func.now())
    assigned_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    student = relationship("Student", foreign_keys=[student_id])
    class_ = relationship("Class", foreign_keys=[class_id])
    academic_year = relationship("AcademicYear", foreign_keys=[academic_year_id])
    assigned_by_user = relationship("User", foreign_keys=[assigned_by])

    def __repr__(self):
        return f"<SectionAssignment student_id={self.student_id} section={self.assigned_section} strategy={self.assignment_strategy}>"
