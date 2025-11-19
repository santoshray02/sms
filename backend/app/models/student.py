from sqlalchemy import Column, Integer, String, Date, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base


class Student(Base):
    """
    Student model with class assignment and fee configuration
    """
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    admission_number = Column(String(20), unique=True, nullable=False, index=True)

    # Personal info
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(String(10), nullable=False)  # Male, Female, Other

    # Class assignment
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False, index=True)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"), nullable=False, index=True)

    # Parent/Guardian info
    parent_name = Column(String(200), nullable=False)
    parent_phone = Column(String(15), nullable=False, index=True)
    parent_email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)

    # Fee configuration
    has_hostel = Column(Boolean, default=False)
    transport_route_id = Column(Integer, ForeignKey("transport_routes.id"), nullable=True)

    # Status
    status = Column(String(20), default="active")  # active, inactive, graduated

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    class_ = relationship("Class", back_populates="students")
    academic_year = relationship("AcademicYear", back_populates="students")
    transport_route = relationship("TransportRoute", back_populates="students")
    monthly_fees = relationship("MonthlyFee", back_populates="student")
    payments = relationship("Payment", back_populates="student")
    sms_logs = relationship("SMSLog", back_populates="student")

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def __repr__(self):
        return f"<Student {self.admission_number} - {self.full_name}>"
