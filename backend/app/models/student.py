from sqlalchemy import Column, Integer, String, Date, Boolean, DateTime, Text, ForeignKey, Float
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

    # Parent/Guardian info (legacy - kept for backward compatibility)
    parent_name = Column(String(200), nullable=True)
    parent_phone = Column(String(15), nullable=True, index=True)
    parent_email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)

    # Guardian reference (new - one guardian can have multiple students)
    guardian_id = Column(Integer, ForeignKey("guardians.id"), nullable=True, index=True)

    # Government compliance fields (RTE Act, CBSE requirements)
    category = Column(String(20), nullable=True)  # General/SC/ST/OBC/EWS
    caste = Column(String(100), nullable=True)
    religion = Column(String(50), nullable=True)
    caste_certificate_number = Column(String(50), nullable=True)
    income_certificate_number = Column(String(50), nullable=True)
    bpl_card_number = Column(String(50), nullable=True)
    aadhaar_number = Column(String(12), unique=True, nullable=True, index=True)

    # Additional student info
    blood_group = Column(String(5), nullable=True)
    photo_url = Column(String(255), nullable=True)

    # Scholarship and concession fields
    scholarship_type = Column(String(100), nullable=True)  # NMMSS/NMMS/Post-Matric/etc.
    scholarship_amount = Column(Integer, default=0)  # Monthly amount in paise
    concession_percentage = Column(Integer, default=0)  # 0-100%
    concession_reason = Column(String(200), nullable=True)

    # Board exam fields (Class 10, 12)
    board_registration_number = Column(String(50), nullable=True)
    roll_number = Column(String(20), nullable=True)

    # Batch management (smart section assignment)
    computed_section = Column(String(5), nullable=True, comment="Auto-assigned section (A, B, C...)")
    average_marks = Column(Float, nullable=True, comment="Rolling average for merit calculation")
    last_performance_update = Column(DateTime, nullable=True)
    attendance_percentage = Column(Float, nullable=True)

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
    guardian = relationship("Guardian", back_populates="students")
    monthly_fees = relationship("MonthlyFee", back_populates="student")
    payments = relationship("Payment", back_populates="student")
    sms_logs = relationship("SMSLog", back_populates="student")
    concessions = relationship("Concession", back_populates="student")
    attendance_records = relationship("Attendance", back_populates="student")
    # Automation relationships
    fee_reminders = relationship("FeeReminder", back_populates="student")
    attendance_alerts = relationship("AttendanceAlert", back_populates="student")

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def __repr__(self):
        return f"<Student {self.admission_number} - {self.full_name}>"
