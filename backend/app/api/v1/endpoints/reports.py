from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, case
from datetime import date
from typing import Optional

from app.db.session import get_db
from app.models.fee import MonthlyFee
from app.models.payment import Payment
from app.models.student import Student
from app.models.sms import SMSLog
from app.models.user import User
from app.api.dependencies import get_current_active_user
from app.services.report_service import ReportService

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
        func.sum(case((MonthlyFee.status == "paid", 1), else_=0)).label("paid_count"),
        func.sum(case((MonthlyFee.status == "partial", 1), else_=0)).label("partial_count"),
        func.sum(case((MonthlyFee.status == "pending", 1), else_=0)).label("pending_count")
    ).select_from(MonthlyFee)

    if academic_year_id:
        query = query.where(MonthlyFee.academic_year_id == academic_year_id)
    if month:
        query = query.where(MonthlyFee.month == month)
    if year:
        query = query.where(MonthlyFee.year == year)

    result = await db.execute(query)
    data = result.one()

    total_fees = data.total_fees or 0
    total_collected = data.total_collected or 0
    total_pending = data.total_pending or 0

    return {
        "total_fees": total_fees / 100,
        "total_expected": total_fees / 100,  # Alias for frontend compatibility
        "total_collected": total_collected / 100,
        "total_pending": total_pending / 100,
        "collection_percentage": (
            ((total_collected / total_fees) * 100) if total_fees > 0 else 0
        ),
        "total_students": data.total_students or 0,
        "paid_count": int(data.paid_count or 0),
        "partial_count": int(data.partial_count or 0),
        "pending_count": int(data.pending_count or 0)
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
    from app.models.academic import Class

    query = select(
        Student.id,
        Student.admission_number,
        Student.first_name,
        Student.last_name,
        Student.parent_phone,
        Student.computed_section,
        Class.name.label("class_name"),
        MonthlyFee.month,
        MonthlyFee.year,
        MonthlyFee.total_fee,
        MonthlyFee.amount_paid,
        MonthlyFee.amount_pending,
        MonthlyFee.due_date,
        MonthlyFee.status
    ).join(MonthlyFee, Student.id == MonthlyFee.student_id
    ).join(Class, Student.class_id == Class.id
    ).where(
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

    # Group by student to show total pending per student
    from collections import defaultdict
    student_data = defaultdict(lambda: {
        "total_pending": 0,
        "overdue_count": 0,
        "details": []
    })

    for d in defaulters:
        key = d.id
        student_data[key]["student_id"] = d.id
        student_data[key]["admission_number"] = d.admission_number
        student_data[key]["student_name"] = f"{d.first_name} {d.last_name}"
        student_data[key]["class_name"] = d.class_name
        student_data[key]["section"] = d.computed_section
        student_data[key]["parent_phone"] = d.parent_phone
        student_data[key]["total_pending"] += d.amount_pending / 100
        student_data[key]["overdue_count"] += 1

    # Convert to list and sort by total pending (highest first)
    result = sorted(student_data.values(), key=lambda x: x["total_pending"], reverse=True)
    return result[:limit]


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


# ==================== Generated Reports (PDF/Excel) ====================

@router.get("/generate/rte-compliance")
async def generate_rte_compliance_report(
    academic_year_id: int,
    format: str = Query("pdf", regex="^(pdf|excel)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Generate RTE Compliance Report

    Includes:
    - EWS/DG student list
    - Category-wise breakdown
    - Concession summary

    Format: pdf or excel
    """
    try:
        buffer = await ReportService.generate_rte_compliance_report(
            db, academic_year_id, format
        )

        # Set appropriate content type and filename
        if format == "pdf":
            content_type = "application/pdf"
            filename = f"RTE_Compliance_{date.today().isoformat()}.pdf"
        else:
            content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            filename = f"RTE_Compliance_{date.today().isoformat()}.xlsx"

        return StreamingResponse(
            buffer,
            media_type=content_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")


@router.get("/generate/financial")
async def generate_financial_report(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020, le=2030),
    academic_year_id: int = Query(...),
    format: str = Query("pdf", regex="^(pdf|excel)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Generate Financial Report

    Includes:
    - Monthly collection summary
    - Payment mode analysis
    - Outstanding fees by class
    - Defaulter list (7, 15, 30+ days)

    Format: pdf or excel
    """
    try:
        buffer = await ReportService.generate_financial_report(
            db, month, year, academic_year_id, format
        )

        # Set appropriate content type and filename
        if format == "pdf":
            content_type = "application/pdf"
            filename = f"Financial_Report_{year}_{month:02d}.pdf"
        else:
            content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            filename = f"Financial_Report_{year}_{month:02d}.xlsx"

        return StreamingResponse(
            buffer,
            media_type=content_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")


@router.get("/generate/academic")
async def generate_academic_report(
    academic_year_id: int,
    format: str = Query("pdf", regex="^(pdf|excel)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Generate Academic Enrollment Report

    Includes:
    - Class-wise strength
    - Gender distribution
    - Category-wise enrollment
    - Transport utilization

    Format: pdf or excel
    """
    try:
        buffer = await ReportService.generate_academic_report(
            db, academic_year_id, format
        )

        # Set appropriate content type and filename
        if format == "pdf":
            content_type = "application/pdf"
            filename = f"Academic_Report_{date.today().isoformat()}.pdf"
        else:
            content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            filename = f"Academic_Report_{date.today().isoformat()}.xlsx"

        return StreamingResponse(
            buffer,
            media_type=content_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")
