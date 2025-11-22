"""
API endpoints for automation features
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import joinedload
from typing import List, Dict, Any
from datetime import datetime, timedelta

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.automation import FeeReminder, AttendanceAlert
from app.services.fee_reminder_service import FeeReminderService
from pydantic import BaseModel


router = APIRouter()


# ==================== Pydantic Schemas ====================

class FeeReminderResponse(BaseModel):
    id: int
    student_id: int
    student_name: str
    monthly_fee_id: int
    reminder_type: str
    amount_pending: int
    due_date: str
    sent_at: str
    sms_status: str
    payment_received_after: bool
    days_to_payment: int | None

    class Config:
        from_attributes = True


class ReminderStatsResponse(BaseModel):
    total_reminders: int
    by_type: Dict[str, int]
    payment_after_reminder: int
    effectiveness_rate: float
    avg_days_to_payment: float | None
    recent_reminders_7_days: int


class ProcessRemindersResponse(BaseModel):
    success: bool
    message: str
    stats: Dict[str, Any]


# ==================== Fee Reminders Endpoints ====================

@router.post("/fee-reminders/send", response_model=ProcessRemindersResponse)
async def send_fee_reminders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Manually trigger automated fee reminders
    This will process all pending fees and send appropriate reminders

    Requires: Admin access
    """
    # Only admins can trigger reminders
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can trigger fee reminders"
        )

    try:
        stats = await FeeReminderService.process_automated_reminders(db)

        return ProcessRemindersResponse(
            success=True,
            message=f"Processed {stats['total_processed']} fees, sent {stats['reminders_sent']} reminders",
            stats=stats
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing reminders: {str(e)}"
        )


@router.get("/fee-reminders", response_model=List[FeeReminderResponse])
async def list_fee_reminders(
    skip: int = 0,
    limit: int = 50,
    student_id: int | None = None,
    reminder_type: str | None = None,
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List fee reminders with filters

    Query params:
    - skip: Pagination offset
    - limit: Number of records to return
    - student_id: Filter by student
    - reminder_type: Filter by type (advance, due, overdue, final)
    - days: Show reminders from last N days (default 30)
    """
    # Build query
    date_cutoff = datetime.utcnow() - timedelta(days=days)

    stmt = (
        select(FeeReminder)
        .where(FeeReminder.sent_at >= date_cutoff)
        .options(joinedload(FeeReminder.student))
        .order_by(desc(FeeReminder.sent_at))
    )

    # Apply filters
    if student_id:
        stmt = stmt.where(FeeReminder.student_id == student_id)
    if reminder_type:
        stmt = stmt.where(FeeReminder.reminder_type == reminder_type)

    stmt = stmt.offset(skip).limit(limit)

    result = await db.execute(stmt)
    reminders = result.scalars().all()

    # Format response
    response = []
    for reminder in reminders:
        response.append(FeeReminderResponse(
            id=reminder.id,
            student_id=reminder.student_id,
            student_name=reminder.student.full_name,
            monthly_fee_id=reminder.monthly_fee_id,
            reminder_type=reminder.reminder_type,
            amount_pending=reminder.amount_pending,
            due_date=reminder.due_date.isoformat(),
            sent_at=reminder.sent_at.isoformat(),
            sms_status=reminder.sms_status,
            payment_received_after=reminder.payment_received_after,
            days_to_payment=reminder.days_to_payment
        ))

    return response


@router.get("/fee-reminders/stats", response_model=ReminderStatsResponse)
async def get_reminder_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get overall statistics about fee reminders effectiveness
    """
    stats = await FeeReminderService.get_reminder_stats(db)

    return ReminderStatsResponse(**stats)


@router.get("/fee-reminders/student/{student_id}", response_model=List[FeeReminderResponse])
async def get_student_reminders(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all reminders sent to a specific student
    """
    stmt = (
        select(FeeReminder)
        .where(FeeReminder.student_id == student_id)
        .options(joinedload(FeeReminder.student))
        .order_by(desc(FeeReminder.sent_at))
    )

    result = await db.execute(stmt)
    reminders = result.scalars().all()

    response = []
    for reminder in reminders:
        response.append(FeeReminderResponse(
            id=reminder.id,
            student_id=reminder.student_id,
            student_name=reminder.student.full_name,
            monthly_fee_id=reminder.monthly_fee_id,
            reminder_type=reminder.reminder_type,
            amount_pending=reminder.amount_pending,
            due_date=reminder.due_date.isoformat(),
            sent_at=reminder.sent_at.isoformat(),
            sms_status=reminder.sms_status,
            payment_received_after=reminder.payment_received_after,
            days_to_payment=reminder.days_to_payment
        ))

    return response


# ==================== Attendance Alerts Endpoints ====================

@router.get("/attendance-alerts")
async def list_attendance_alerts(
    skip: int = 0,
    limit: int = 50,
    resolved: bool | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List attendance alerts

    Query params:
    - resolved: Filter by resolved status (true/false)
    """
    stmt = select(AttendanceAlert).order_by(desc(AttendanceAlert.sent_at))

    if resolved is not None:
        stmt = stmt.where(AttendanceAlert.resolved == resolved)

    stmt = stmt.offset(skip).limit(limit)

    result = await db.execute(stmt)
    alerts = result.scalars().all()

    return [
        {
            "id": alert.id,
            "student_id": alert.student_id,
            "alert_type": alert.alert_type,
            "attendance_percentage": float(alert.attendance_percentage),
            "threshold_crossed": float(alert.threshold_crossed),
            "sent_to": alert.sent_to,
            "sent_at": alert.sent_at.isoformat(),
            "resolved": alert.resolved,
            "resolved_at": alert.resolved_at.isoformat() if alert.resolved_at else None
        }
        for alert in alerts
    ]


@router.put("/attendance-alerts/{alert_id}/resolve")
async def resolve_attendance_alert(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark an attendance alert as resolved
    """
    stmt = select(AttendanceAlert).where(AttendanceAlert.id == alert_id)
    result = await db.execute(stmt)
    alert = result.scalar_one_or_none()

    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )

    alert.resolved = True
    alert.resolved_at = datetime.utcnow()
    await db.commit()

    return {"success": True, "message": "Alert marked as resolved"}


@router.get("/attendance-alerts/stats")
async def get_attendance_alert_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get statistics about attendance alerts
    """
    from sqlalchemy import func

    # Total alerts
    stmt = select(func.count()).select_from(AttendanceAlert)
    result = await db.execute(stmt)
    total_alerts = result.scalar()

    # Unresolved alerts
    stmt = select(func.count()).select_from(AttendanceAlert).where(
        AttendanceAlert.resolved == False
    )
    result = await db.execute(stmt)
    unresolved_alerts = result.scalar()

    # Alerts by type
    stmt = select(
        AttendanceAlert.alert_type,
        func.count(AttendanceAlert.id)
    ).group_by(AttendanceAlert.alert_type)
    result = await db.execute(stmt)
    by_type = dict(result.all())

    return {
        "total_alerts": total_alerts,
        "unresolved_alerts": unresolved_alerts,
        "resolved_alerts": total_alerts - unresolved_alerts,
        "by_type": by_type
    }


# ==================== Scheduler Management Endpoints ====================

@router.get("/scheduler/status")
async def get_scheduler_status(
    current_user: User = Depends(get_current_user)
):
    """
    Get status of the automation scheduler and all scheduled jobs
    """
    from app.services.scheduler import automation_scheduler

    return {
        "scheduler_running": automation_scheduler.is_running,
        "jobs": automation_scheduler.get_job_status()
    }


@router.post("/scheduler/trigger/{job_id}")
async def trigger_scheduled_job(
    job_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Manually trigger a scheduled job
    Available job_ids: daily_fee_reminders, daily_attendance_alerts, cache_cleanup
    """
    # Only admins can trigger jobs
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can trigger scheduled jobs"
        )

    from app.services.scheduler import automation_scheduler

    # Map job IDs to methods
    job_methods = {
        "daily_fee_reminders": automation_scheduler.daily_fee_reminders,
        "daily_attendance_alerts": automation_scheduler.daily_attendance_alerts,
        "weekly_analytics": automation_scheduler.weekly_analytics_computation,
        "monthly_reports": automation_scheduler.monthly_report_generation,
        "cache_cleanup": automation_scheduler.daily_cache_cleanup
    }

    if job_id not in job_methods:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found. Available jobs: {list(job_methods.keys())}"
        )

    try:
        # Run the job
        await job_methods[job_id]()
        return {
            "success": True,
            "message": f"Job {job_id} executed successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing job: {str(e)}"
        )
