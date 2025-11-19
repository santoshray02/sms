from sqlalchemy import Column, Integer, String, Date, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base


class AcademicYear(Base):
    """
    Academic year model (e.g., 2024-25)
    """
    __tablename__ = "academic_years"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(20), unique=True, nullable=False)  # "2024-25"
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_current = Column(Boolean, default=False)

    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    students = relationship("Student", back_populates="academic_year")
    fee_structures = relationship("FeeStructure", back_populates="academic_year")
    monthly_fees = relationship("MonthlyFee", back_populates="academic_year")

    def __repr__(self):
        return f"<AcademicYear {self.name}>"


class Class(Base):
    """
    Class model (Playgroup, Nursery, LKG, UKG, Class 1-12)
    """
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)  # "Class 1", "LKG", etc.
    section = Column(String(10), nullable=True)  # "A", "B", etc.
    display_order = Column(Integer, nullable=True)

    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    students = relationship("Student", back_populates="class_")
    fee_structures = relationship("FeeStructure", back_populates="class_")

    def __repr__(self):
        section_str = f" ({self.section})" if self.section else ""
        return f"<Class {self.name}{section_str}>"


class TransportRoute(Base):
    """
    Transport route model with monthly fee
    """
    __tablename__ = "transport_routes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # "Route 1 (0-5 km)"
    distance_km = Column(Integer, nullable=True)
    monthly_fee = Column(Integer, nullable=False)  # Stored as paise (100 paise = 1 rupee)

    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    students = relationship("Student", back_populates="transport_route")

    def __repr__(self):
        return f"<TransportRoute {self.name}>"
