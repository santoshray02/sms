from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import Optional
from datetime import date, datetime

from app.db.session import get_db
from app.models.attendance import Attendance
from app.models.student import Student
from app.models.user import User
from app.schemas.attendance import (
    AttendanceCreate, AttendanceUpdate, AttendanceResponse,
    AttendanceListResponse, BulkAttendanceCreate
)
from app.api.dependencies import get_current_active_user

router = APIRouter()


@router.get("/", response_model=AttendanceListResponse)
async def list_attendance(
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    student_id: Optional[int] = None,
    class_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List attendance records with pagination and filters
    """
    # Build query
    query = select(Attendance).order_by(Attendance.date.desc(), Attendance.student_id)

    # Apply filters
    if student_id:
        query = query.where(Attendance.student_id == student_id)
    if class_id:
        query = query.where(Attendance.class_id == class_id)
    if date_from:
        query = query.where(Attendance.date >= date_from)
    if date_to:
        query = query.where(Attendance.date <= date_to)
    if status:
        query = query.where(Attendance.status == status)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Apply pagination
    query = query.offset((page - 1) * page_size).limit(page_size)

    # Execute query
    result = await db.execute(query)
    attendance_records = result.scalars().all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "attendance_records": attendance_records
    }


@router.post("/", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
async def create_attendance(
    attendance_data: AttendanceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Mark attendance for a single student
    """
    # Check if student exists
    result = await db.execute(
        select(Student).where(Student.id == attendance_data.student_id)
    )
    student = result.scalar_one_or_none()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {attendance_data.student_id} not found"
        )

    # Check if attendance already exists for this student on this date
    result = await db.execute(
        select(Attendance).where(
            and_(
                Attendance.student_id == attendance_data.student_id,
                Attendance.date == attendance_data.date
            )
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Attendance already marked for student {attendance_data.student_id} on {attendance_data.date}"
        )

    # Create attendance record
    attendance = Attendance(**attendance_data.model_dump())
    db.add(attendance)
    await db.commit()
    await db.refresh(attendance)

    return attendance


@router.post("/bulk", status_code=status.HTTP_201_CREATED)
async def create_bulk_attendance(
    bulk_data: BulkAttendanceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Mark attendance for multiple students at once (class-wise)
    """
    # Get all students in the class
    result = await db.execute(
        select(Student).where(Student.class_id == bulk_data.class_id)
    )
    students = result.scalars().all()

    if not students:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No students found in class {bulk_data.class_id}"
        )

    # Create attendance records
    created_count = 0
    skipped_count = 0
    errors = []

    for attendance_item in bulk_data.attendance_data:
        student_id = attendance_item.get('student_id')
        status_value = attendance_item.get('status')
        remarks = attendance_item.get('remarks')

        # Check if already marked
        result = await db.execute(
            select(Attendance).where(
                and_(
                    Attendance.student_id == student_id,
                    Attendance.date == bulk_data.date
                )
            )
        )
        existing = result.scalar_one_or_none()

        if existing:
            skipped_count += 1
            continue

        try:
            attendance = Attendance(
                student_id=student_id,
                class_id=bulk_data.class_id,
                date=bulk_data.date,
                status=status_value,
                remarks=remarks,
                marked_by=bulk_data.marked_by
            )
            db.add(attendance)
            created_count += 1
        except Exception as e:
            errors.append(f"Student {student_id}: {str(e)}")

    await db.commit()

    return {
        "message": "Bulk attendance marked successfully",
        "created": created_count,
        "skipped": skipped_count,
        "errors": errors if errors else None
    }


@router.get("/student/{student_id}/percentage")
async def get_student_attendance_percentage(
    student_id: int,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Calculate attendance percentage for a student
    """
    # Check if student exists
    result = await db.execute(
        select(Student).where(Student.id == student_id)
    )
    student = result.scalar_one_or_none()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {student_id} not found"
        )

    # Build query
    query = select(Attendance).where(Attendance.student_id == student_id)

    if date_from:
        query = query.where(Attendance.date >= date_from)
    if date_to:
        query = query.where(Attendance.date <= date_to)

    result = await db.execute(query)
    attendance_records = result.scalars().all()

    total_days = len(attendance_records)
    if total_days == 0:
        return {
            "student_id": student_id,
            "total_days": 0,
            "present": 0,
            "absent": 0,
            "late": 0,
            "half_day": 0,
            "percentage": 0.0,
            "date_from": date_from,
            "date_to": date_to
        }

    present = sum(1 for r in attendance_records if r.status == "Present")
    absent = sum(1 for r in attendance_records if r.status == "Absent")
    late = sum(1 for r in attendance_records if r.status == "Late")
    half_day = sum(1 for r in attendance_records if r.status == "HalfDay")

    # Calculate percentage (count Late and HalfDay as 0.5 present)
    effective_present = present + (late * 0.5) + (half_day * 0.5)
    percentage = (effective_present / total_days) * 100 if total_days > 0 else 0

    return {
        "student_id": student_id,
        "total_days": total_days,
        "present": present,
        "absent": absent,
        "late": late,
        "half_day": half_day,
        "percentage": round(percentage, 2),
        "meets_75_percent_requirement": percentage >= 75.0,
        "date_from": date_from,
        "date_to": date_to
    }


@router.get("/date/{date_str}")
async def get_attendance_by_date(
    date_str: str,
    class_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all attendance records for a specific date
    """
    try:
        attendance_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )

    query = select(Attendance).where(Attendance.date == attendance_date)

    if class_id:
        query = query.where(Attendance.class_id == class_id)

    result = await db.execute(query)
    attendance_records = result.scalars().all()

    return {
        "date": date_str,
        "total_records": len(attendance_records),
        "attendance": attendance_records
    }


@router.get("/{attendance_id}", response_model=AttendanceResponse)
async def get_attendance(
    attendance_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get attendance record by ID
    """
    result = await db.execute(
        select(Attendance).where(Attendance.id == attendance_id)
    )
    attendance = result.scalar_one_or_none()

    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Attendance record with ID {attendance_id} not found"
        )

    return attendance


@router.put("/{attendance_id}", response_model=AttendanceResponse)
async def update_attendance(
    attendance_id: int,
    attendance_data: AttendanceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update attendance record (e.g., correct a marking mistake)
    """
    # Get attendance record
    result = await db.execute(
        select(Attendance).where(Attendance.id == attendance_id)
    )
    attendance = result.scalar_one_or_none()

    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Attendance record with ID {attendance_id} not found"
        )

    # Update fields
    update_data = attendance_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(attendance, field, value)

    await db.commit()
    await db.refresh(attendance)

    return attendance


@router.delete("/{attendance_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_attendance(
    attendance_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete attendance record (hard delete)
    """
    result = await db.execute(
        select(Attendance).where(Attendance.id == attendance_id)
    )
    attendance = result.scalar_one_or_none()

    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Attendance record with ID {attendance_id} not found"
        )

    await db.delete(attendance)
    await db.commit()

    return None
