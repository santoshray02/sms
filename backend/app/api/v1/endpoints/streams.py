from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.db.session import get_db
from app.models.stream import Stream
from app.models.user import User
from app.schemas.stream import StreamCreate, StreamUpdate, StreamResponse
from app.api.dependencies import get_current_active_user

router = APIRouter()


@router.get("/", response_model=List[StreamResponse])
async def list_streams(
    is_active: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List all streams (Science/Commerce/Arts for Class 11-12)
    """
    query = select(Stream).order_by(Stream.display_order)

    if is_active:
        query = query.where(Stream.is_active == True)

    result = await db.execute(query)
    streams = result.scalars().all()

    return streams


@router.post("/", response_model=StreamResponse, status_code=status.HTTP_201_CREATED)
async def create_stream(
    stream_data: StreamCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new stream (admin only)
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create streams"
        )

    # Check if stream name already exists
    result = await db.execute(
        select(Stream).where(Stream.name == stream_data.name)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Stream '{stream_data.name}' already exists"
        )

    # Create stream
    stream = Stream(**stream_data.model_dump())
    db.add(stream)
    await db.commit()
    await db.refresh(stream)

    return stream


@router.get("/{stream_id}", response_model=StreamResponse)
async def get_stream(
    stream_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get stream by ID
    """
    result = await db.execute(
        select(Stream).where(Stream.id == stream_id)
    )
    stream = result.scalar_one_or_none()

    if not stream:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stream with ID {stream_id} not found"
        )

    return stream


@router.put("/{stream_id}", response_model=StreamResponse)
async def update_stream(
    stream_id: int,
    stream_data: StreamUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update stream details (admin only)
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update streams"
        )

    # Get stream
    result = await db.execute(
        select(Stream).where(Stream.id == stream_id)
    )
    stream = result.scalar_one_or_none()

    if not stream:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stream with ID {stream_id} not found"
        )

    # Update fields
    update_data = stream_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(stream, field, value)

    await db.commit()
    await db.refresh(stream)

    return stream


@router.delete("/{stream_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_stream(
    stream_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Soft delete stream (admin only)
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete streams"
        )

    result = await db.execute(
        select(Stream).where(Stream.id == stream_id)
    )
    stream = result.scalar_one_or_none()

    if not stream:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stream with ID {stream_id} not found"
        )

    # Soft delete
    stream.is_active = False
    await db.commit()

    return None
