from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.db.session import get_db
from app.models.fee import FeeStructure, MonthlyFee
from app.models.user import User
from app.schemas.fee import (
    FeeStructureCreate, FeeStructureUpdate, FeeStructureResponse,
    MonthlyFeeResponse, GenerateMonthlyFeesRequest, GenerateMonthlyFeesResponse
)
from app.api.dependencies import get_current_active_user, get_current_admin
from app.services.fee_service import FeeService

router = APIRouter()


# Fee Structure Endpoints
@router.get("/structures", response_model=list[FeeStructureResponse])
async def list_fee_structures(
    class_id: Optional[int] = None,
    academic_year_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List fee structures with optional filters"""
    query = select(FeeStructure)

    if class_id:
        query = query.where(FeeStructure.class_id == class_id)
    if academic_year_id:
        query = query.where(FeeStructure.academic_year_id == academic_year_id)

    result = await db.execute(query)
    structures = result.scalars().all()

    # Convert paise to rupees
    return [
        FeeStructureResponse(
            id=s.id,
            class_id=s.class_id,
            academic_year_id=s.academic_year_id,
            tuition_fee=s.tuition_fee / 100,
            hostel_fee=s.hostel_fee / 100,
            created_at=s.created_at
        )
        for s in structures
    ]


@router.post("/structures", response_model=FeeStructureResponse, status_code=status.HTTP_201_CREATED)
async def create_fee_structure(
    data: FeeStructureCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Create fee structure (Admin only)"""
    # Check if structure already exists
    result = await db.execute(
        select(FeeStructure).where(
            FeeStructure.class_id == data.class_id,
            FeeStructure.academic_year_id == data.academic_year_id
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Fee structure already exists for this class and academic year"
        )

    # Convert rupees to paise
    structure = FeeStructure(
        class_id=data.class_id,
        academic_year_id=data.academic_year_id,
        tuition_fee=int(data.tuition_fee * 100),
        hostel_fee=int(data.hostel_fee * 100)
    )
    db.add(structure)
    await db.commit()
    await db.refresh(structure)

    return FeeStructureResponse(
        id=structure.id,
        class_id=structure.class_id,
        academic_year_id=structure.academic_year_id,
        tuition_fee=structure.tuition_fee / 100,
        hostel_fee=structure.hostel_fee / 100,
        created_at=structure.created_at
    )


@router.put("/structures/{structure_id}", response_model=FeeStructureResponse)
async def update_fee_structure(
    structure_id: int,
    data: FeeStructureUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Update fee structure (Admin only)"""
    result = await db.execute(select(FeeStructure).where(FeeStructure.id == structure_id))
    structure = result.scalar_one_or_none()

    if not structure:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fee structure not found"
        )

    # Update fields (convert rupees to paise)
    if data.tuition_fee is not None:
        structure.tuition_fee = int(data.tuition_fee * 100)
    if data.hostel_fee is not None:
        structure.hostel_fee = int(data.hostel_fee * 100)

    await db.commit()
    await db.refresh(structure)

    return FeeStructureResponse(
        id=structure.id,
        class_id=structure.class_id,
        academic_year_id=structure.academic_year_id,
        tuition_fee=structure.tuition_fee / 100,
        hostel_fee=structure.hostel_fee / 100,
        created_at=structure.created_at
    )


# Monthly Fee Endpoints
@router.post("/generate-monthly", response_model=GenerateMonthlyFeesResponse)
async def generate_monthly_fees(
    data: GenerateMonthlyFeesRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Generate monthly fees for all active students (Admin only)"""
    generated_count = await FeeService.generate_monthly_fees(
        db=db,
        academic_year_id=data.academic_year_id,
        month=data.month,
        year=data.year,
        due_day=data.due_day
    )

    return GenerateMonthlyFeesResponse(
        total_generated=generated_count,
        academic_year_id=data.academic_year_id,
        month=data.month,
        year=data.year,
        message=f"Successfully generated {generated_count} monthly fee records"
    )


@router.get("/monthly", response_model=list[MonthlyFeeResponse])
async def list_monthly_fees(
    student_id: Optional[int] = None,
    academic_year_id: Optional[int] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    status: Optional[str] = None,
    limit: int = Query(100, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List monthly fees with filters"""
    query = select(MonthlyFee)

    if student_id:
        query = query.where(MonthlyFee.student_id == student_id)
    if academic_year_id:
        query = query.where(MonthlyFee.academic_year_id == academic_year_id)
    if month:
        query = query.where(MonthlyFee.month == month)
    if year:
        query = query.where(MonthlyFee.year == year)
    if status:
        query = query.where(MonthlyFee.status == status)

    query = query.order_by(MonthlyFee.year.desc(), MonthlyFee.month.desc()).limit(limit)

    result = await db.execute(query)
    fees = result.scalars().all()

    # Convert paise to rupees
    return [
        MonthlyFeeResponse(
            id=f.id,
            student_id=f.student_id,
            academic_year_id=f.academic_year_id,
            month=f.month,
            year=f.year,
            tuition_fee=f.tuition_fee / 100,
            hostel_fee=f.hostel_fee / 100,
            transport_fee=f.transport_fee / 100,
            total_fee=f.total_fee / 100,
            amount_paid=f.amount_paid / 100,
            amount_pending=f.amount_pending / 100,
            status=f.status,
            due_date=f.due_date,
            generated_at=f.generated_at,
            sms_sent=f.sms_sent,
            sms_sent_at=f.sms_sent_at,
            reminder_sent=f.reminder_sent,
            reminder_sent_at=f.reminder_sent_at
        )
        for f in fees
    ]


@router.get("/monthly/{fee_id}", response_model=MonthlyFeeResponse)
async def get_monthly_fee(
    fee_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get monthly fee by ID"""
    result = await db.execute(select(MonthlyFee).where(MonthlyFee.id == fee_id))
    fee = result.scalar_one_or_none()

    if not fee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Monthly fee not found"
        )

    return MonthlyFeeResponse(
        id=fee.id,
        student_id=fee.student_id,
        academic_year_id=fee.academic_year_id,
        month=fee.month,
        year=fee.year,
        tuition_fee=fee.tuition_fee / 100,
        hostel_fee=fee.hostel_fee / 100,
        transport_fee=fee.transport_fee / 100,
        total_fee=fee.total_fee / 100,
        amount_paid=fee.amount_paid / 100,
        amount_pending=fee.amount_pending / 100,
        status=fee.status,
        due_date=fee.due_date,
        generated_at=fee.generated_at,
        sms_sent=fee.sms_sent,
        sms_sent_at=fee.sms_sent_at,
        reminder_sent=fee.reminder_sent,
        reminder_sent_at=fee.reminder_sent_at
    )
