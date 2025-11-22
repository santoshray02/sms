from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import Optional
from datetime import datetime

from app.db.session import get_db
from app.models.student import Student
from app.models.user import User
from app.schemas.student import StudentCreate, StudentUpdate, StudentResponse, StudentListResponse, StudentPerformanceUpdate
from app.api.dependencies import get_current_active_user

router = APIRouter()


@router.get("/", response_model=StudentListResponse)
async def list_students(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    class_id: Optional[int] = None,
    academic_year_id: Optional[int] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = Query(None, regex="^(admission_number|first_name|last_name|date_of_birth|gender|status|computed_section|class_id|created_at)$"),
    sort_order: Optional[str] = Query("asc", regex="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List students with pagination, filters, and sorting
    Sortable fields: admission_number, first_name, last_name, date_of_birth, gender, status, computed_section, class_id, created_at
    """
    from app.models.academic import Class

    # Build query with class name
    query = select(
        Student,
        Class.name.label("class_name")
    ).outerjoin(Class, Student.class_id == Class.id)

    # Apply filters
    if class_id:
        query = query.where(Student.class_id == class_id)
    if academic_year_id:
        query = query.where(Student.academic_year_id == academic_year_id)
    if status:
        query = query.where(Student.status == status)
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Student.first_name.ilike(search_term),
                Student.last_name.ilike(search_term),
                Student.admission_number.ilike(search_term),
                Student.parent_phone.ilike(search_term)
            )
        )

    # Get total count
    count_query = select(func.count(Student.id)).select_from(Student)
    if class_id:
        count_query = count_query.where(Student.class_id == class_id)
    if academic_year_id:
        count_query = count_query.where(Student.academic_year_id == academic_year_id)
    if status:
        count_query = count_query.where(Student.status == status)
    if search:
        search_term = f"%{search}%"
        count_query = count_query.where(
            or_(
                Student.first_name.ilike(search_term),
                Student.last_name.ilike(search_term),
                Student.admission_number.ilike(search_term),
                Student.parent_phone.ilike(search_term)
            )
        )
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Apply sorting
    if sort_by:
        if sort_by == "class_id":
            # Sort by class display_order and name
            sort_column = Class.display_order
            if sort_order == "desc":
                query = query.order_by(sort_column.desc(), Class.name.desc())
            else:
                query = query.order_by(sort_column.asc(), Class.name.asc())
        else:
            sort_column = getattr(Student, sort_by)
            if sort_order == "desc":
                query = query.order_by(sort_column.desc())
            else:
                query = query.order_by(sort_column.asc())
    else:
        # Default sorting by admission_number
        query = query.order_by(Student.admission_number.asc())

    # Apply pagination
    query = query.offset((page - 1) * page_size).limit(page_size)

    # Execute query
    result = await db.execute(query)
    rows = result.all()

    # Combine student data with class_name
    students = []
    for row in rows:
        student_dict = row[0].__dict__.copy()
        student_dict['class_name'] = row[1]
        students.append(student_dict)

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "students": students
    }


@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    student_data: StudentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new student
    """
    # Check if admission number already exists
    result = await db.execute(
        select(Student).where(Student.admission_number == student_data.admission_number)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Student with admission number {student_data.admission_number} already exists"
        )

    # Create student
    student = Student(**student_data.model_dump())
    db.add(student)
    await db.commit()
    await db.refresh(student)

    return student


@router.get("/{student_id}", response_model=StudentResponse)
async def get_student(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get student by ID
    """
    result = await db.execute(
        select(Student).where(Student.id == student_id)
    )
    student = result.scalar_one_or_none()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {student_id} not found"
        )

    return student


@router.put("/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: int,
    student_data: StudentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update student details
    """
    # Get student
    result = await db.execute(
        select(Student).where(Student.id == student_id)
    )
    student = result.scalar_one_or_none()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {student_id} not found"
        )

    # Update fields
    update_data = student_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(student, field, value)

    await db.commit()
    await db.refresh(student)

    return student


@router.put("/{student_id}/performance", response_model=StudentResponse)
async def update_student_performance(
    student_id: int,
    performance_data: StudentPerformanceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update student performance metrics (average marks, attendance)

    This endpoint is used for AI-ready data collection to track student
    performance over time. These metrics are used for merit-based section
    assignment.
    """
    result = await db.execute(
        select(Student).where(Student.id == student_id)
    )
    student = result.scalar_one_or_none()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {student_id} not found"
        )

    # Update performance fields
    update_data = performance_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(student, field, value)

    # Update timestamp
    student.last_performance_update = datetime.now()

    await db.commit()
    await db.refresh(student)

    return student


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Soft delete student (set status to inactive)
    """
    result = await db.execute(
        select(Student).where(Student.id == student_id)
    )
    student = result.scalar_one_or_none()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {student_id} not found"
        )

    # Soft delete
    student.status = "inactive"
    await db.commit()

    return None
