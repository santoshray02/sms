from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.sms import SystemSetting
from app.models.user import User
from app.schemas.settings import (
    SchoolSettingsUpdate, SchoolSettingsResponse,
    SMSSettingsUpdate, SMSSettingsResponse,
    SystemSettingsResponse
)
from app.api.dependencies import get_current_user, get_current_admin

router = APIRouter()


@router.get("/", response_model=SystemSettingsResponse)
async def get_system_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all system settings (school + SMS)"""
    # Get or create the settings record with key 'system'
    result = await db.execute(
        select(SystemSetting).where(SystemSetting.key == "system")
    )
    settings = result.scalar_one_or_none()

    if not settings:
        # Create default settings
        settings = SystemSetting(
            key="system",
            value="{}",
            description="System configuration",
            school_name=None,
            school_code=None,
            affiliation_number=None,
            school_address=None,
            principal_name=None,
            principal_signature_url=None,
            school_logo_url=None,
            sms_provider=None,
            sms_api_key=None,
            sms_sender_id=None,
            sms_balance=0,
            sms_enabled=False
        )
        db.add(settings)
        await db.commit()
        await db.refresh(settings)

    # Build response
    school_settings = SchoolSettingsResponse(
        school_name=settings.school_name,
        school_code=settings.school_code,
        affiliation_number=settings.affiliation_number,
        school_address=settings.school_address,
        principal_name=settings.principal_name,
        principal_signature_url=settings.principal_signature_url,
        school_logo_url=settings.school_logo_url,
        updated_at=settings.updated_at
    )

    sms_settings = SMSSettingsResponse(
        sms_provider=settings.sms_provider,
        sms_api_key=settings.sms_api_key,
        sms_sender_id=settings.sms_sender_id,
        sms_balance=settings.sms_balance or 0,
        sms_enabled=settings.sms_enabled or False,
        updated_at=settings.updated_at
    )

    return SystemSettingsResponse(school=school_settings, sms=sms_settings)


@router.put("/school", response_model=SchoolSettingsResponse)
async def update_school_settings(
    data: SchoolSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Update school information settings (Admin only)"""
    # Get or create settings
    result = await db.execute(
        select(SystemSetting).where(SystemSetting.key == "system")
    )
    settings = result.scalar_one_or_none()

    if not settings:
        settings = SystemSetting(key="system", value="{}", description="System configuration")
        db.add(settings)

    # Update school fields
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)

    await db.commit()
    await db.refresh(settings)

    return SchoolSettingsResponse(
        school_name=settings.school_name,
        school_code=settings.school_code,
        affiliation_number=settings.affiliation_number,
        school_address=settings.school_address,
        principal_name=settings.principal_name,
        principal_signature_url=settings.principal_signature_url,
        school_logo_url=settings.school_logo_url,
        updated_at=settings.updated_at
    )


@router.put("/sms", response_model=SMSSettingsResponse)
async def update_sms_settings(
    data: SMSSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Update SMS configuration settings (Admin only)"""
    # Get or create settings
    result = await db.execute(
        select(SystemSetting).where(SystemSetting.key == "system")
    )
    settings = result.scalar_one_or_none()

    if not settings:
        settings = SystemSetting(key="system", value="{}", description="System configuration")
        db.add(settings)

    # Update SMS fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings, field, value)

    await db.commit()
    await db.refresh(settings)

    return SMSSettingsResponse(
        sms_provider=settings.sms_provider,
        sms_api_key=settings.sms_api_key,
        sms_sender_id=settings.sms_sender_id,
        sms_balance=settings.sms_balance or 0,
        sms_enabled=settings.sms_enabled or False,
        updated_at=settings.updated_at
    )
