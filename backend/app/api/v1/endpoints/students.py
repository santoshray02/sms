from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import Optional

from app.db.session import get_db
from app.models.student import Student
from app.models.user import User
from app.schemas.student import StudentCreate, StudentUpdate, StudentResponse, StudentListResponse
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
    sort_by: Optional[str] = Query(None, regex="^(admission_number|first_name|last_name|date_of_birth|created_at)$"),
    sort_order: Optional[str] = Query("asc", regex="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List students with pagination, filters, and sorting
    Sortable fields: admission_number, first_name, last_name, date_of_birth, created_at
    """
    # Build query
    query = select(Student)

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
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Apply sorting
    if sort_by:
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
    students = result.scalars().all()

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
