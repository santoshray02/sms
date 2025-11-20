from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from typing import Optional


class GuardianBase(BaseModel):
    """Base guardian schema"""
    full_name: str = Field(..., min_length=1, max_length=200)
    relation: str = Field(..., pattern="^(Father|Mother|Guardian)$")
    phone: str = Field(..., pattern=r"^\+?[0-9]{10,15}$")
    alternate_phone: Optional[str] = Field(None, pattern=r"^\+?[0-9]{10,15}$")
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    occupation: Optional[str] = Field(None, max_length=100)
    annual_income: Optional[int] = None
    education: Optional[str] = Field(None, max_length=100)
    aadhaar_number: Optional[str] = Field(None, pattern=r"^[0-9]{12}$")


class GuardianCreate(GuardianBase):
    """Schema for creating a guardian"""
    pass


class GuardianUpdate(BaseModel):
    """Schema for updating a guardian"""
    full_name: Optional[str] = Field(None, min_length=1, max_length=200)
    relation: Optional[str] = Field(None, pattern="^(Father|Mother|Guardian)$")
    phone: Optional[str] = Field(None, pattern=r"^\+?[0-9]{10,15}$")
    alternate_phone: Optional[str] = Field(None, pattern=r"^\+?[0-9]{10,15}$")
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    occupation: Optional[str] = Field(None, max_length=100)
    annual_income: Optional[int] = None
    education: Optional[str] = Field(None, max_length=100)
    aadhaar_number: Optional[str] = Field(None, pattern=r"^[0-9]{12}$")
    is_active: Optional[bool] = None


class GuardianResponse(GuardianBase):
    """Schema for guardian response"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GuardianListResponse(BaseModel):
    """Schema for paginated guardian list"""
    total: int
    page: int
    page_size: int
    guardians: list[GuardianResponse]
