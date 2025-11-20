from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional


class ConcessionBase(BaseModel):
    """Base concession schema"""
    student_id: int
    concession_type: str = Field(..., min_length=1, max_length=100)
    percentage: int = Field(..., ge=0, le=100)
    amount: int = Field(..., ge=0)  # Amount in paise
    reason: Optional[str] = Field(None, max_length=200)
    approved_by: Optional[int] = None
    valid_from: date
    valid_to: Optional[date] = None
    is_active: bool = True
    remarks: Optional[str] = None


class ConcessionCreate(ConcessionBase):
    """Schema for creating a concession"""
    pass


class ConcessionUpdate(BaseModel):
    """Schema for updating a concession"""
    concession_type: Optional[str] = Field(None, min_length=1, max_length=100)
    percentage: Optional[int] = Field(None, ge=0, le=100)
    amount: Optional[int] = Field(None, ge=0)
    reason: Optional[str] = Field(None, max_length=200)
    approved_by: Optional[int] = None
    valid_from: Optional[date] = None
    valid_to: Optional[date] = None
    is_active: Optional[bool] = None
    remarks: Optional[str] = None


class ConcessionResponse(ConcessionBase):
    """Schema for concession response"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConcessionListResponse(BaseModel):
    """Schema for paginated concession list"""
    total: int
    page: int
    page_size: int
    concessions: list[ConcessionResponse]
