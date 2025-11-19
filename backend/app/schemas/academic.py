from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional


class AcademicYearBase(BaseModel):
    """Base academic year schema"""
    name: str = Field(..., min_length=1, max_length=20)
    start_date: date
    end_date: date
    is_current: bool = False


class AcademicYearCreate(AcademicYearBase):
    """Schema for creating academic year"""
    pass


class AcademicYearUpdate(BaseModel):
    """Schema for updating academic year"""
    name: Optional[str] = Field(None, min_length=1, max_length=20)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: Optional[bool] = None


class AcademicYearResponse(AcademicYearBase):
    """Schema for academic year response"""
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ClassBase(BaseModel):
    """Base class schema"""
    name: str = Field(..., min_length=1, max_length=50)
    section: Optional[str] = Field(None, max_length=10)
    display_order: Optional[int] = None


class ClassCreate(ClassBase):
    """Schema for creating class"""
    pass


class ClassUpdate(BaseModel):
    """Schema for updating class"""
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    section: Optional[str] = Field(None, max_length=10)
    display_order: Optional[int] = None


class ClassResponse(ClassBase):
    """Schema for class response"""
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class TransportRouteBase(BaseModel):
    """Base transport route schema"""
    name: str = Field(..., min_length=1, max_length=100)
    distance_km: Optional[int] = None
    monthly_fee: float = Field(..., gt=0)  # Input in rupees


class TransportRouteCreate(TransportRouteBase):
    """Schema for creating transport route"""
    pass


class TransportRouteUpdate(BaseModel):
    """Schema for updating transport route"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    distance_km: Optional[int] = None
    monthly_fee: Optional[float] = Field(None, gt=0)


class TransportRouteResponse(BaseModel):
    """Schema for transport route response"""
    id: int
    name: str
    distance_km: Optional[int]
    monthly_fee: float  # Output in rupees
    created_at: datetime

    class Config:
        from_attributes = True
