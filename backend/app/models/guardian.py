from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base


class Guardian(Base):
    """
    Guardian/Parent model - one guardian can have multiple students (siblings)
    This reduces duplicate data entry and SMS costs for families with multiple children
    """
    __tablename__ = "guardians"

    id = Column(Integer, primary_key=True, index=True)

    # Personal info
    full_name = Column(String(200), nullable=False)
    relation = Column(String(50), nullable=False)  # Father/Mother/Guardian

    # Contact details
    phone = Column(String(15), unique=True, nullable=False, index=True)
    alternate_phone = Column(String(15), nullable=True)
    email = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)

    # Additional info for scholarship eligibility
    occupation = Column(String(100), nullable=True)
    annual_income = Column(Integer, nullable=True)  # in rupees (for EWS/scholarship eligibility)
    education = Column(String(100), nullable=True)

    # Government ID
    aadhaar_number = Column(String(12), unique=True, nullable=True, index=True)

    # Status
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    students = relationship("Student", back_populates="guardian")

    def __repr__(self):
        return f"<Guardian {self.full_name} ({self.relation}) - {self.phone}>"
