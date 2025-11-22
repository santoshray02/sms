"""
Batch Management API Endpoints

Handles automatic section assignment and reorganization of students
into batches based on configured strategy (alphabetical or merit-based).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, distinct
from typing import Optional, Literal
from pydantic import BaseModel, Field

from app.db.session import get_db
from app.models.user import User
from app.models.student import Student
from app.api.dependencies import get_current_admin, get_current_active_user
from app.services.batch_assignment import (
    assign_sections_to_class,
    reorganize_all_classes,
    get_section_distribution,
    get_batch_settings
)

router = APIRouter()


# Request/Response Models
class AssignSectionsRequest(BaseModel):
    """Request to assign sections to a class"""
    class_id: int = Field(..., description="ID of the class")
    academic_year_id: int = Field(..., description="ID of the academic year")
    strategy: Optional[Literal["alphabetical", "merit"]] = Field(None, description="Assignment strategy (defaults to system setting)")


class ReorganizeAllRequest(BaseModel):
    """Request to reorganize all classes"""
    academic_year_id: int = Field(..., description="ID of the academic year")


class BatchSettingsResponse(BaseModel):
    """Current batch management settings"""
    max_batch_size: int
    batch_assignment_strategy: str
    auto_assign_sections: bool
    reorganize_annually: bool


class BatchStatisticsResponse(BaseModel):
    """Batch management statistics for dashboard"""
    total_students: int
    students_with_sections: int
    students_without_sections: int
    section_coverage_percentage: float
    unique_sections: int
    sections_list: list[str]


# Endpoints
@router.post("/assign-sections")
async def assign_sections(
    request: AssignSectionsRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Assign sections to all students in a class

    This endpoint automatically distributes students into sections (A, B, C, etc.)
    based on the configured batch size and assignment strategy.

    - **Alphabetical**: Students sorted by first name, then last name
    - **Merit**: Students sorted by average marks (highest to lowest)

    Requires admin privileges.
    """
    try:
        result = await assign_sections_to_class(
            db=db,
            class_id=request.class_id,
            academic_year_id=request.academic_year_id,
            strategy=request.strategy,
            assigned_by=current_user.id
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to assign sections: {str(e)}"
        )


@router.post("/reorganize-all")
async def reorganize_all(
    request: ReorganizeAllRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Reorganize all classes for an academic year

    This is typically called at the start of a new academic year to
    redistribute students across sections based on current batch size
    and assignment strategy.

    All existing section assignments will be replaced with new ones.

    Requires admin privileges.
    """
    try:
        result = await reorganize_all_classes(
            db=db,
            academic_year_id=request.academic_year_id,
            assigned_by=current_user.id
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reorganize classes: {str(e)}"
        )


@router.get("/distribution/{class_id}")
async def get_distribution(
    class_id: int,
    academic_year_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Get current section distribution for a class

    Returns the number of students in each section (A, B, C, etc.)
    and total student count.

    Requires admin privileges.
    """
    try:
        result = await get_section_distribution(
            db=db,
            class_id=class_id,
            academic_year_id=academic_year_id
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get distribution: {str(e)}"
        )


@router.get("/settings", response_model=BatchSettingsResponse)
async def get_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Get current batch management settings

    Returns the configured batch size, assignment strategy,
    and other batch management preferences.

    Requires admin privileges.
    """
    try:
        settings = await get_batch_settings(db)
        return BatchSettingsResponse(**settings)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get settings: {str(e)}"
        )


@router.get("/statistics", response_model=BatchStatisticsResponse)
async def get_statistics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get batch management statistics for dashboard

    Returns aggregated statistics about section assignments:
    - Total students
    - Students with sections assigned
    - Section coverage percentage
    - List of unique sections

    Uses SQL aggregation for performance with large datasets.
    """
    try:
        # Get total students count
        total_query = select(func.count(Student.id)).where(Student.status == "active")
        total_result = await db.execute(total_query)
        total_students = total_result.scalar() or 0

        # Get students with sections count
        with_sections_query = select(func.count(Student.id)).where(
            Student.status == "active",
            Student.computed_section.isnot(None)
        )
        with_sections_result = await db.execute(with_sections_query)
        students_with_sections = with_sections_result.scalar() or 0

        # Get unique sections
        sections_query = select(distinct(Student.computed_section)).where(
            Student.status == "active",
            Student.computed_section.isnot(None)
        ).order_by(Student.computed_section)
        sections_result = await db.execute(sections_query)
        sections_list = [s for s in sections_result.scalars().all() if s]

        # Calculate statistics
        students_without_sections = total_students - students_with_sections
        section_coverage = (students_with_sections / total_students * 100) if total_students > 0 else 0

        return BatchStatisticsResponse(
            total_students=total_students,
            students_with_sections=students_with_sections,
            students_without_sections=students_without_sections,
            section_coverage_percentage=round(section_coverage, 2),
            unique_sections=len(sections_list),
            sections_list=sections_list
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get statistics: {str(e)}"
        )
