from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import Optional

from app.db.session import get_db
from app.models.guardian import Guardian
from app.models.student import Student
from app.models.user import User
from app.schemas.guardian import GuardianCreate, GuardianUpdate, GuardianResponse, GuardianListResponse
from app.api.dependencies import get_current_active_user

router = APIRouter()


@router.get("/", response_model=GuardianListResponse)
async def list_guardians(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List guardians with pagination and filters
    """
    # Build query
    query = select(Guardian)

    # Apply filters
    if is_active is not None:
        query = query.where(Guardian.is_active == is_active)
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Guardian.full_name.ilike(search_term),
                Guardian.phone.ilike(search_term),
                Guardian.email.ilike(search_term)
            )
        )

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Apply pagination
    query = query.offset((page - 1) * page_size).limit(page_size)

    # Execute query
    result = await db.execute(query)
    guardians = result.scalars().all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "guardians": guardians
    }


@router.post("/", response_model=GuardianResponse, status_code=status.HTTP_201_CREATED)
async def create_guardian(
    guardian_data: GuardianCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new guardian
    """
    # Check if phone number already exists
    result = await db.execute(
        select(Guardian).where(Guardian.phone == guardian_data.phone)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Guardian with phone number {guardian_data.phone} already exists"
        )

    # Check if Aadhaar already exists (if provided)
    if guardian_data.aadhaar_number:
        result = await db.execute(
            select(Guardian).where(Guardian.aadhaar_number == guardian_data.aadhaar_number)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Guardian with Aadhaar {guardian_data.aadhaar_number} already exists"
            )

    # Create guardian
    guardian = Guardian(**guardian_data.model_dump())
    db.add(guardian)
    await db.commit()
    await db.refresh(guardian)

    return guardian


@router.get("/{guardian_id}", response_model=GuardianResponse)
async def get_guardian(
    guardian_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get guardian by ID
    """
    result = await db.execute(
        select(Guardian).where(Guardian.id == guardian_id)
    )
    guardian = result.scalar_one_or_none()

    if not guardian:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Guardian with ID {guardian_id} not found"
        )

    return guardian


@router.get("/{guardian_id}/students")
async def get_guardian_students(
    guardian_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all students linked to a guardian
    """
    # Check if guardian exists
    result = await db.execute(
        select(Guardian).where(Guardian.id == guardian_id)
    )
    guardian = result.scalar_one_or_none()

    if not guardian:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Guardian with ID {guardian_id} not found"
        )

    # Get all students for this guardian
    result = await db.execute(
        select(Student).where(Student.guardian_id == guardian_id)
    )
    students = result.scalars().all()

    return {
        "guardian": guardian,
        "students": students,
        "total_students": len(students)
    }


@router.put("/{guardian_id}", response_model=GuardianResponse)
async def update_guardian(
    guardian_id: int,
    guardian_data: GuardianUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update guardian details
    """
    # Get guardian
    result = await db.execute(
        select(Guardian).where(Guardian.id == guardian_id)
    )
    guardian = result.scalar_one_or_none()

    if not guardian:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Guardian with ID {guardian_id} not found"
        )

    # Check for phone number conflict (if phone is being updated)
    if guardian_data.phone and guardian_data.phone != guardian.phone:
        result = await db.execute(
            select(Guardian).where(Guardian.phone == guardian_data.phone)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Guardian with phone number {guardian_data.phone} already exists"
            )

    # Update fields
    update_data = guardian_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(guardian, field, value)

    await db.commit()
    await db.refresh(guardian)

    return guardian


@router.delete("/{guardian_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_guardian(
    guardian_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Soft delete guardian (set is_active to False)
    """
    result = await db.execute(
        select(Guardian).where(Guardian.id == guardian_id)
    )
    guardian = result.scalar_one_or_none()

    if not guardian:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Guardian with ID {guardian_id} not found"
        )

    # Check if guardian has active students
    result = await db.execute(
        select(func.count()).select_from(Student).where(
            Student.guardian_id == guardian_id,
            Student.status == "active"
        )
    )
    active_students_count = result.scalar()

    if active_students_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete guardian with {active_students_count} active student(s). Please reassign students first."
        )

    # Soft delete
    guardian.is_active = False
    await db.commit()

    return None
