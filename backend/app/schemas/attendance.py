from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional


class AttendanceBase(BaseModel):
    """Base attendance schema"""
    student_id: int
    class_id: int
    date: date
    status: str = Field(..., pattern="^(Present|Absent|Late|HalfDay)$")
    remarks: Optional[str] = Field(None, max_length=200)
    marked_by: int


class AttendanceCreate(AttendanceBase):
    """Schema for creating an attendance record"""
    pass


class AttendanceUpdate(BaseModel):
    """Schema for updating an attendance record"""
    status: Optional[str] = Field(None, pattern="^(Present|Absent|Late|HalfDay)$")
    remarks: Optional[str] = Field(None, max_length=200)


class AttendanceResponse(AttendanceBase):
    """Schema for attendance response"""
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class AttendanceListResponse(BaseModel):
    """Schema for paginated attendance list"""
    total: int
    page: int
    page_size: int
    attendance_records: list[AttendanceResponse]


class BulkAttendanceCreate(BaseModel):
    """Schema for bulk attendance marking"""
    class_id: int
    date: date
    marked_by: int
    attendance_data: list[dict]  # List of {student_id, status, remarks}
