from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime, date


# School Settings Schemas
class SchoolSettingsBase(BaseModel):
    """Base schema for school settings"""
    school_name: Optional[str] = Field(None, max_length=200)
    school_code: Optional[str] = Field(None, max_length=50, description="UDISE code")
    affiliation_number: Optional[str] = Field(None, max_length=50, description="CBSE affiliation number")
    school_address: Optional[str] = None
    principal_name: Optional[str] = Field(None, max_length=100)
    principal_signature_url: Optional[str] = Field(None, max_length=255)
    school_logo_url: Optional[str] = Field(None, max_length=255)


class SchoolSettingsUpdate(SchoolSettingsBase):
    """Schema for updating school settings"""
    pass


class SchoolSettingsResponse(SchoolSettingsBase):
    """Schema for school settings response"""
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# SMS Settings Schemas
class SMSSettingsBase(BaseModel):
    """Base schema for SMS settings"""
    sms_provider: Optional[str] = Field(None, max_length=50)
    sms_api_key: Optional[str] = Field(None, max_length=255)
    sms_sender_id: Optional[str] = Field(None, max_length=10, description="DLT registered sender ID")
    sms_balance: Optional[int] = Field(0, ge=0)
    sms_enabled: Optional[bool] = Field(False)


class SMSSettingsUpdate(SMSSettingsBase):
    """Schema for updating SMS settings"""
    pass


class SMSSettingsResponse(SMSSettingsBase):
    """Schema for SMS settings response"""
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Batch Management Settings Schemas
class BatchSettingsBase(BaseModel):
    """Base schema for batch management settings"""
    max_batch_size: Optional[int] = Field(30, ge=10, le=100, description="Maximum students per section")
    batch_assignment_strategy: Optional[Literal["alphabetical", "merit"]] = Field("alphabetical", description="Strategy for assigning students to sections")
    auto_assign_sections: Optional[bool] = Field(True, description="Automatically assign sections to students")
    reorganize_annually: Optional[bool] = Field(True, description="Reorganize batches at the start of academic year")
    last_reorganization_date: Optional[date] = Field(None, description="Last date when batches were reorganized")


class BatchSettingsUpdate(BatchSettingsBase):
    """Schema for updating batch settings"""
    pass


class BatchSettingsResponse(BatchSettingsBase):
    """Schema for batch settings response"""
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Combined System Settings
class SystemSettingsResponse(BaseModel):
    """Combined system settings response"""
    school: SchoolSettingsResponse
    sms: SMSSettingsResponse
    batch: BatchSettingsResponse

    class Config:
        from_attributes = True
