from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class StreamBase(BaseModel):
    """Base stream schema"""
    name: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = None
    display_order: int = 0
    is_active: bool = True


class StreamCreate(StreamBase):
    """Schema for creating a stream"""
    pass


class StreamUpdate(BaseModel):
    """Schema for updating a stream"""
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class StreamResponse(StreamBase):
    """Schema for stream response"""
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
