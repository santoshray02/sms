from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from datetime import date

from app.db.session import get_db
from app.models.concession import Concession
from app.models.student import Student
from app.models.user import User
from app.schemas.concession import ConcessionCreate, ConcessionUpdate, ConcessionResponse, ConcessionListResponse
from app.api.dependencies import get_current_active_user

router = APIRouter()


@router.get("/", response_model=ConcessionListResponse)
async def list_concessions(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    student_id: Optional[int] = None,
    concession_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List concessions/scholarships with pagination and filters
    """
    # Build query
    query = select(Concession)

    # Apply filters
    if student_id:
        query = query.where(Concession.student_id == student_id)
    if concession_type:
        query = query.where(Concession.concession_type == concession_type)
    if is_active is not None:
        query = query.where(Concession.is_active == is_active)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Apply pagination
    query = query.offset((page - 1) * page_size).limit(page_size)

    # Execute query
    result = await db.execute(query)
    concessions = result.scalars().all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "concessions": concessions
    }


@router.post("/", response_model=ConcessionResponse, status_code=status.HTTP_201_CREATED)
async def create_concession(
    concession_data: ConcessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new concession/scholarship
    """
    # Verify student exists
    result = await db.execute(
        select(Student).where(Student.id == concession_data.student_id)
    )
    student = result.scalar_one_or_none()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {concession_data.student_id} not found"
        )

    # Set approved_by to current user if not specified
    data_dict = concession_data.model_dump()
    if not data_dict.get('approved_by'):
        data_dict['approved_by'] = current_user.id

    # Create concession
    concession = Concession(**data_dict)
    db.add(concession)
    await db.commit()
    await db.refresh(concession)

    return concession


@router.get("/active", response_model=ConcessionListResponse)
async def get_active_concessions(
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all currently active concessions (within validity period)
    """
    today = date.today()

    query = select(Concession).where(
        Concession.is_active == True,
        Concession.valid_from <= today,
        (Concession.valid_to >= today) | (Concession.valid_to == None)
    )

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Apply pagination
    query = query.offset((page - 1) * page_size).limit(page_size)

    # Execute query
    result = await db.execute(query)
    concessions = result.scalars().all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "concessions": concessions
    }


@router.get("/student/{student_id}", response_model=ConcessionListResponse)
async def get_student_concessions(
    student_id: int,
    include_expired: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all concessions for a specific student
    """
    # Verify student exists
    result = await db.execute(
        select(Student).where(Student.id == student_id)
    )
    student = result.scalar_one_or_none()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {student_id} not found"
        )

    query = select(Concession).where(Concession.student_id == student_id)

    if not include_expired:
        today = date.today()
        query = query.where(
            Concession.is_active == True,
            Concession.valid_from <= today,
            (Concession.valid_to >= today) | (Concession.valid_to == None)
        )

    result = await db.execute(query)
    concessions = result.scalars().all()

    return {
        "total": len(concessions),
        "page": 1,
        "page_size": len(concessions),
        "concessions": concessions
    }


@router.get("/{concession_id}", response_model=ConcessionResponse)
async def get_concession(
    concession_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get concession by ID
    """
    result = await db.execute(
        select(Concession).where(Concession.id == concession_id)
    )
    concession = result.scalar_one_or_none()

    if not concession:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Concession with ID {concession_id} not found"
        )

    return concession


@router.put("/{concession_id}", response_model=ConcessionResponse)
async def update_concession(
    concession_id: int,
    concession_data: ConcessionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update concession details
    """
    # Get concession
    result = await db.execute(
        select(Concession).where(Concession.id == concession_id)
    )
    concession = result.scalar_one_or_none()

    if not concession:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Concession with ID {concession_id} not found"
        )

    # Update fields
    update_data = concession_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(concession, field, value)

    await db.commit()
    await db.refresh(concession)

    return concession


@router.delete("/{concession_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_concession(
    concession_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Soft delete concession (set is_active to False)
    """
    result = await db.execute(
        select(Concession).where(Concession.id == concession_id)
    )
    concession = result.scalar_one_or_none()

    if not concession:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Concession with ID {concession_id} not found"
        )

    # Soft delete
    concession.is_active = False
    await db.commit()

    return None
