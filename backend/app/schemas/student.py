from pydantic import BaseModel, Field, field_validator
from datetime import date, datetime
from typing import Optional


class StudentBase(BaseModel):
    """Base student schema"""
    admission_number: str = Field(..., min_length=1, max_length=20)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    date_of_birth: date
    gender: str
    class_id: int
    academic_year_id: int
    parent_name: str = Field(..., min_length=1, max_length=200)
    parent_phone: str = Field(..., pattern=r"^\+?[0-9]{10,15}$")
    parent_email: Optional[str] = None
    address: Optional[str] = None
    has_hostel: bool = False
    transport_route_id: Optional[int] = None

    @field_validator('gender')
    @classmethod
    def validate_gender(cls, v: str) -> str:
        """Validate and normalize gender to proper case"""
        if v is None:
            raise ValueError('Gender is required')
        v_lower = v.lower()
        if v_lower not in ['male', 'female', 'other']:
            raise ValueError('Gender must be Male, Female, or Other')
        # Return capitalized version
        return v_lower.capitalize()


class StudentCreate(StudentBase):
    """Schema for creating a student"""
    pass


class StudentUpdate(BaseModel):
    """Schema for updating a student"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    class_id: Optional[int] = None
    academic_year_id: Optional[int] = None
    parent_name: Optional[str] = Field(None, min_length=1, max_length=200)
    parent_phone: Optional[str] = Field(None, pattern=r"^\+?[0-9]{10,15}$")
    parent_email: Optional[str] = None
    address: Optional[str] = None
    has_hostel: Optional[bool] = None
    transport_route_id: Optional[int] = None
    status: Optional[str] = Field(None, pattern="^(active|inactive|graduated)$")

    @field_validator('gender')
    @classmethod
    def validate_gender(cls, v: Optional[str]) -> Optional[str]:
        """Validate and normalize gender to proper case"""
        if v is None:
            return None
        v_lower = v.lower()
        if v_lower not in ['male', 'female', 'other']:
            raise ValueError('Gender must be Male, Female, or Other')
        return v_lower.capitalize()


class StudentResponse(StudentBase):
    """Schema for student response"""
    id: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StudentListResponse(BaseModel):
    """Schema for paginated student list"""
    total: int
    page: int
    page_size: int
    students: list[StudentResponse]
