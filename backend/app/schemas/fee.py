from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional


class FeeStructureBase(BaseModel):
    """Base fee structure schema"""
    class_id: int
    academic_year_id: int
    tuition_fee: float = Field(..., gt=0)  # Input in rupees
    hostel_fee: float = Field(default=0, ge=0)  # Input in rupees


class FeeStructureCreate(FeeStructureBase):
    """Schema for creating fee structure"""
    pass


class FeeStructureUpdate(BaseModel):
    """Schema for updating fee structure"""
    tuition_fee: Optional[float] = Field(None, gt=0)
    hostel_fee: Optional[float] = Field(None, ge=0)


class FeeStructureResponse(BaseModel):
    """Schema for fee structure response"""
    id: int
    class_id: int
    academic_year_id: int
    tuition_fee: float  # Output in rupees
    hostel_fee: float  # Output in rupees
    created_at: datetime

    class Config:
        from_attributes = True


class MonthlyFeeBase(BaseModel):
    """Base monthly fee schema"""
    student_id: int
    academic_year_id: int
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2000, le=2100)
    tuition_fee: float
    hostel_fee: float = 0
    transport_fee: float = 0
    total_fee: float
    due_date: date


class MonthlyFeeResponse(MonthlyFeeBase):
    """Schema for monthly fee response"""
    id: int
    amount_paid: float
    amount_pending: float
    status: str
    generated_at: datetime
    sms_sent: bool
    sms_sent_at: Optional[datetime] = None
    reminder_sent: bool
    reminder_sent_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class GenerateMonthlyFeesRequest(BaseModel):
    """Schema for generating monthly fees"""
    academic_year_id: int
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2000, le=2100)
    due_day: int = Field(default=10, ge=1, le=31)  # Due date day of month


class GenerateMonthlyFeesResponse(BaseModel):
    """Schema for generate monthly fees response"""
    total_generated: int
    academic_year_id: int
    month: int
    year: int
    message: str
