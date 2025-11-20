from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional


class PaymentBase(BaseModel):
    """Base payment schema"""
    monthly_fee_id: int
    student_id: int
    amount: float = Field(..., gt=0)  # Input in rupees
    payment_mode: str = Field(..., pattern="^(cash|online|upi|cheque|card)$")
    payment_date: date
    transaction_id: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class PaymentCreate(PaymentBase):
    """Schema for creating payment"""
    pass


class PaymentResponse(PaymentBase):
    """Schema for payment response"""
    id: int
    receipt_number: str
    recorded_by: int
    created_at: datetime

    class Config:
        from_attributes = True


class PaymentListResponse(BaseModel):
    """Schema for paginated payment list"""
    total: int
    page: int
    page_size: int
    payments: list[PaymentResponse]
