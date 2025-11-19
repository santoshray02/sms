from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime

from app.db.session import get_db
from app.models.payment import Payment
from app.models.fee import MonthlyFee
from app.models.user import User
from app.schemas.payment import PaymentCreate, PaymentResponse, PaymentListResponse
from app.api.dependencies import get_current_active_user
from app.services.fee_service import FeeService

router = APIRouter()


@router.post("/", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def record_payment(
    payment_data: PaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Record a new payment
    """
    # Get monthly fee
    result = await db.execute(
        select(MonthlyFee).where(MonthlyFee.id == payment_data.monthly_fee_id)
    )
    monthly_fee = result.scalar_one_or_none()

    if not monthly_fee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Monthly fee record not found"
        )

    # Verify student ID matches
    if monthly_fee.student_id != payment_data.student_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student ID does not match monthly fee record"
        )

    # Generate receipt number
    # Format: RCP-YYYYMMDD-XXXXX
    today = datetime.now()
    count_result = await db.execute(
        select(func.count(Payment.id)).where(
            func.date(Payment.created_at) == today.date()
        )
    )
    daily_count = count_result.scalar() or 0
    receipt_number = f"RCP-{today.strftime('%Y%m%d')}-{(daily_count + 1):05d}"

    # Convert rupees to paise
    amount_paise = int(payment_data.amount * 100)

    # Create payment
    payment = Payment(
        monthly_fee_id=payment_data.monthly_fee_id,
        student_id=payment_data.student_id,
        amount=amount_paise,
        payment_mode=payment_data.payment_mode,
        payment_date=payment_data.payment_date,
        transaction_id=payment_data.transaction_id,
        receipt_number=receipt_number,
        notes=payment_data.notes,
        recorded_by=current_user.id
    )

    db.add(payment)

    # Update monthly fee
    monthly_fee.amount_paid += amount_paise
    await FeeService.update_payment_status(db, monthly_fee)

    await db.commit()
    await db.refresh(payment)

    return PaymentResponse(
        id=payment.id,
        monthly_fee_id=payment.monthly_fee_id,
        student_id=payment.student_id,
        amount=payment.amount / 100,
        payment_mode=payment.payment_mode,
        payment_date=payment.payment_date,
        transaction_id=payment.transaction_id,
        receipt_number=payment.receipt_number,
        notes=payment.notes,
        recorded_by=payment.recorded_by,
        created_at=payment.created_at
    )


@router.get("/", response_model=PaymentListResponse)
async def list_payments(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    student_id: int = None,
    payment_mode: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List payments with pagination
    """
    query = select(Payment)

    if student_id:
        query = query.where(Payment.student_id == student_id)
    if payment_mode:
        query = query.where(Payment.payment_mode == payment_mode)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Apply pagination
    query = query.order_by(Payment.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    payments = result.scalars().all()

    return PaymentListResponse(
        total=total,
        page=page,
        page_size=page_size,
        payments=[
            PaymentResponse(
                id=p.id,
                monthly_fee_id=p.monthly_fee_id,
                student_id=p.student_id,
                amount=p.amount / 100,
                payment_mode=p.payment_mode,
                payment_date=p.payment_date,
                transaction_id=p.transaction_id,
                receipt_number=p.receipt_number,
                notes=p.notes,
                recorded_by=p.recorded_by,
                created_at=p.created_at
            )
            for p in payments
        ]
    )


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get payment by ID
    """
    result = await db.execute(
        select(Payment).where(Payment.id == payment_id)
    )
    payment = result.scalar_one_or_none()

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )

    return PaymentResponse(
        id=payment.id,
        monthly_fee_id=payment.monthly_fee_id,
        student_id=payment.student_id,
        amount=payment.amount / 100,
        payment_mode=payment.payment_mode,
        payment_date=payment.payment_date,
        transaction_id=payment.transaction_id,
        receipt_number=payment.receipt_number,
        notes=payment.notes,
        recorded_by=payment.recorded_by,
        created_at=payment.created_at
    )
