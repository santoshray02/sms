from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import date
from typing import Optional

from app.db.session import get_db
from app.models.fee import MonthlyFee
from app.models.payment import Payment
from app.models.student import Student
from app.models.sms import SMSLog
from app.models.user import User
from app.api.dependencies import get_current_active_user

router = APIRouter()


@router.get("/collections")
async def collection_summary(
    academic_year_id: Optional[int] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Fee collection summary report
    """
    query = select(
        func.sum(MonthlyFee.total_fee).label("total_fees"),
        func.sum(MonthlyFee.amount_paid).label("total_collected"),
        func.sum(MonthlyFee.amount_pending).label("total_pending"),
        func.count(MonthlyFee.id).label("total_students"),
        func.count(func.nullif(MonthlyFee.status == "paid", False)).label("paid_count"),
        func.count(func.nullif(MonthlyFee.status == "partial", False)).label("partial_count"),
        func.count(func.nullif(MonthlyFee.status == "pending", False)).label("pending_count")
    ).select_from(MonthlyFee)

    if academic_year_id:
        query = query.where(MonthlyFee.academic_year_id == academic_year_id)
    if month:
        query = query.where(MonthlyFee.month == month)
    if year:
        query = query.where(MonthlyFee.year == year)

    result = await db.execute(query)
    data = result.one()

    return {
        "total_fees": (data.total_fees or 0) / 100,
        "total_collected": (data.total_collected or 0) / 100,
        "total_pending": (data.total_pending or 0) / 100,
        "collection_percentage": (
            ((data.total_collected or 0) / (data.total_fees or 1)) * 100
        ),
        "total_students": data.total_students or 0,
        "paid_count": data.paid_count or 0,
        "partial_count": data.partial_count or 0,
        "pending_count": data.pending_count or 0
    }


@router.get("/defaulters")
async def defaulters_list(
    academic_year_id: Optional[int] = None,
    limit: int = Query(100, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List of students with pending fees (defaulters)
    """
    query = select(
        Student.id,
        Student.admission_number,
        Student.first_name,
        Student.last_name,
        Student.parent_phone,
        MonthlyFee.month,
        MonthlyFee.year,
        MonthlyFee.total_fee,
        MonthlyFee.amount_paid,
        MonthlyFee.amount_pending,
        MonthlyFee.due_date,
        MonthlyFee.status
    ).join(MonthlyFee, Student.id == MonthlyFee.student_id).where(
        and_(
            MonthlyFee.status.in_(["pending", "partial"]),
            MonthlyFee.due_date < date.today()
        )
    )

    if academic_year_id:
        query = query.where(MonthlyFee.academic_year_id == academic_year_id)

    query = query.order_by(MonthlyFee.due_date.asc()).limit(limit)

    result = await db.execute(query)
    defaulters = result.all()

    return [
        {
            "student_id": d.id,
            "admission_number": d.admission_number,
            "student_name": f"{d.first_name} {d.last_name}",
            "parent_phone": d.parent_phone,
            "month": d.month,
            "year": d.year,
            "total_fee": d.total_fee / 100,
            "amount_paid": d.amount_paid / 100,
            "amount_pending": d.amount_pending / 100,
            "due_date": d.due_date,
            "status": d.status,
            "overdue_days": (date.today() - d.due_date).days
        }
        for d in defaulters
    ]


@router.get("/class-wise")
async def class_wise_collection(
    academic_year_id: int,
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Class-wise fee collection report
    """
    from app.models.academic import Class

    query = select(
        Class.id.label("class_id"),
        Class.name.label("class_name"),
        func.count(MonthlyFee.id).label("total_students"),
        func.sum(MonthlyFee.total_fee).label("total_fees"),
        func.sum(MonthlyFee.amount_paid).label("total_collected"),
        func.sum(MonthlyFee.amount_pending).label("total_pending")
    ).select_from(Student).join(
        Class, Student.class_id == Class.id
    ).join(
        MonthlyFee, Student.id == MonthlyFee.student_id
    ).where(
        MonthlyFee.academic_year_id == academic_year_id
    ).group_by(Class.id, Class.name).order_by(Class.display_order, Class.name)

    if month:
        query = query.where(MonthlyFee.month == month)
    if year:
        query = query.where(MonthlyFee.year == year)

    result = await db.execute(query)
    data = result.all()

    return [
        {
            "class_id": d.class_id,
            "class_name": d.class_name,
            "total_students": d.total_students,
            "total_fees": (d.total_fees or 0) / 100,
            "total_collected": (d.total_collected or 0) / 100,
            "total_pending": (d.total_pending or 0) / 100,
            "collection_percentage": (
                ((d.total_collected or 0) / (d.total_fees or 1)) * 100
            )
        }
        for d in data
    ]


@router.get("/payment-modes")
async def payment_mode_breakdown(
    academic_year_id: Optional[int] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Payment mode breakdown report
    """
    query = select(
        Payment.payment_mode,
        func.count(Payment.id).label("transaction_count"),
        func.sum(Payment.amount).label("total_amount")
    ).group_by(Payment.payment_mode)

    # Join with monthly_fee for filtering
    if academic_year_id or month or year:
        query = query.join(MonthlyFee, Payment.monthly_fee_id == MonthlyFee.id)
        if academic_year_id:
            query = query.where(MonthlyFee.academic_year_id == academic_year_id)
        if month:
            query = query.where(MonthlyFee.month == month)
        if year:
            query = query.where(MonthlyFee.year == year)

    result = await db.execute(query)
    data = result.all()

    return [
        {
            "payment_mode": d.payment_mode,
            "transaction_count": d.transaction_count,
            "total_amount": (d.total_amount or 0) / 100
        }
        for d in data
    ]


@router.get("/sms-logs")
async def sms_logs(
    sms_type: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(100, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    SMS logs report
    """
    query = select(SMSLog).order_by(SMSLog.sent_at.desc())

    if sms_type:
        query = query.where(SMSLog.sms_type == sms_type)
    if status:
        query = query.where(SMSLog.status == status)

    query = query.limit(limit)

    result = await db.execute(query)
    logs = result.scalars().all()

    return [
        {
            "id": log.id,
            "phone_number": log.phone_number,
            "message": log.message,
            "sms_type": log.sms_type,
            "student_id": log.student_id,
            "monthly_fee_id": log.monthly_fee_id,
            "status": log.status,
            "gateway_response": log.gateway_response,
            "sent_at": log.sent_at
        }
        for log in logs
    ]
