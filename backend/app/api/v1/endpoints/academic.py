from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_

from app.db.session import get_db
from app.models.academic import AcademicYear, Class, TransportRoute
from app.models.student import Student
from app.models.user import User
from app.schemas.academic import (
    AcademicYearCreate, AcademicYearUpdate, AcademicYearResponse,
    ClassCreate, ClassUpdate, ClassResponse,
    TransportRouteCreate, TransportRouteUpdate, TransportRouteResponse
)
from app.api.dependencies import get_current_active_user, get_current_admin

router = APIRouter()


# Academic Year Endpoints
@router.get("/academic-years", response_model=list[AcademicYearResponse])
async def list_academic_years(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all academic years"""
    result = await db.execute(select(AcademicYear).order_by(AcademicYear.start_date.desc()))
    return result.scalars().all()


@router.post("/academic-years", response_model=AcademicYearResponse, status_code=status.HTTP_201_CREATED)
async def create_academic_year(
    data: AcademicYearCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Create new academic year (Admin only)"""
    # Check if name already exists
    result = await db.execute(select(AcademicYear).where(AcademicYear.name == data.name))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Academic year {data.name} already exists"
        )

    # If is_current is True, unset all other current years
    if data.is_current:
        await db.execute(
            select(AcademicYear).where(AcademicYear.is_current == True)
        )
        all_years = (await db.execute(select(AcademicYear))).scalars().all()
        for year in all_years:
            year.is_current = False

    academic_year = AcademicYear(**data.model_dump())
    db.add(academic_year)
    await db.commit()
    await db.refresh(academic_year)

    return academic_year


# Class Endpoints
@router.get("/classes", response_model=list[ClassResponse])
async def list_classes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all classes"""
    result = await db.execute(select(Class).order_by(Class.display_order, Class.name))
    return result.scalars().all()


@router.post("/classes", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
async def create_class(
    data: ClassCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Create new class (Admin only)"""
    class_obj = Class(**data.model_dump())
    db.add(class_obj)
    await db.commit()
    await db.refresh(class_obj)

    return class_obj


@router.get("/classes/{class_id}", response_model=ClassResponse)
async def get_class(
    class_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get class by ID"""
    result = await db.execute(select(Class).where(Class.id == class_id))
    class_obj = result.scalar_one_or_none()

    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Class with ID {class_id} not found"
        )

    return class_obj


# Transport Route Endpoints
@router.get("/transport-routes", response_model=list[TransportRouteResponse])
async def list_transport_routes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all transport routes"""
    result = await db.execute(select(TransportRoute).order_by(TransportRoute.distance_km))
    routes = result.scalars().all()

    # Convert paise to rupees for response
    return [
        TransportRouteResponse(
            id=route.id,
            name=route.name,
            distance_km=route.distance_km,
            monthly_fee=route.monthly_fee / 100,  # Convert paise to rupees
            created_at=route.created_at
        )
        for route in routes
    ]


@router.post("/transport-routes", response_model=TransportRouteResponse, status_code=status.HTTP_201_CREATED)
async def create_transport_route(
    data: TransportRouteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Create new transport route (Admin only)"""
    # Convert rupees to paise for storage
    route = TransportRoute(
        name=data.name,
        distance_km=data.distance_km,
        monthly_fee=int(data.monthly_fee * 100)  # Convert rupees to paise
    )
    db.add(route)
    await db.commit()
    await db.refresh(route)

    return TransportRouteResponse(
        id=route.id,
        name=route.name,
        distance_km=route.distance_km,
        monthly_fee=route.monthly_fee / 100,  # Convert back to rupees
        created_at=route.created_at
    )


@router.put("/transport-routes/{route_id}", response_model=TransportRouteResponse)
async def update_transport_route(
    route_id: int,
    data: TransportRouteUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Update transport route (Admin only)"""
    result = await db.execute(select(TransportRoute).where(TransportRoute.id == route_id))
    route = result.scalar_one_or_none()

    if not route:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transport route with ID {route_id} not found"
        )

    # Update fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "monthly_fee":
            setattr(route, field, int(value * 100))  # Convert rupees to paise
        else:
            setattr(route, field, value)

    await db.commit()
    await db.refresh(route)

    return TransportRouteResponse(
        id=route.id,
        name=route.name,
        distance_km=route.distance_km,
        monthly_fee=route.monthly_fee / 100,
        created_at=route.created_at
    )


@router.delete("/transport-routes/{route_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transport_route(
    route_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Delete transport route (Admin only). Fails if students are assigned."""
    result = await db.execute(select(TransportRoute).where(TransportRoute.id == route_id))
    route = result.scalar_one_or_none()

    if not route:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transport route with ID {route_id} not found"
        )

    # Check if any students use this route
    student_check = await db.execute(
        select(Student).where(Student.transport_route_id == route_id).limit(1)
    )
    if student_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete transport route: students are assigned to this route"
        )

    await db.delete(route)
    await db.commit()
    return None


# Additional Academic Year Endpoints
@router.put("/academic-years/{year_id}", response_model=AcademicYearResponse)
async def update_academic_year(
    year_id: int,
    data: AcademicYearUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Update academic year (Admin only)"""
    result = await db.execute(select(AcademicYear).where(AcademicYear.id == year_id))
    year = result.scalar_one_or_none()

    if not year:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Academic year with ID {year_id} not found"
        )

    # If setting as current, unset all others
    if data.is_current is True and not year.is_current:
        await db.execute(
            update(AcademicYear).where(AcademicYear.id != year_id).values(is_current=False)
        )

    # Update fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(year, field, value)

    await db.commit()
    await db.refresh(year)
    return year


@router.get("/academic-years/current/get", response_model=AcademicYearResponse)
async def get_current_academic_year(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get the current academic year"""
    result = await db.execute(select(AcademicYear).where(AcademicYear.is_current == True))
    year = result.scalar_one_or_none()

    if not year:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No current academic year set"
        )

    return year


# Class Update Endpoint
@router.put("/classes/{class_id}", response_model=ClassResponse)
async def update_class(
    class_id: int,
    data: ClassUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Update class (Admin only)"""
    result = await db.execute(select(Class).where(Class.id == class_id))
    class_obj = result.scalar_one_or_none()

    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Class with ID {class_id} not found"
        )

    # Update fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(class_obj, field, value)

    await db.commit()
    await db.refresh(class_obj)
    return class_obj


# Student Promotion Endpoint
@router.post("/students/promote", status_code=status.HTTP_200_OK)
async def promote_students(
    from_class_id: int,
    to_class_id: int,
    from_academic_year_id: int,
    to_academic_year_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Promote all active students from one class to another
    Also updates their academic year
    Admin only operation
    """
    # Validate classes
    from_class_result = await db.execute(select(Class).where(Class.id == from_class_id))
    from_class = from_class_result.scalar_one_or_none()

    to_class_result = await db.execute(select(Class).where(Class.id == to_class_id))
    to_class = to_class_result.scalar_one_or_none()

    if not from_class or not to_class:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or both classes not found"
        )

    # Validate academic years
    from_year_result = await db.execute(select(AcademicYear).where(AcademicYear.id == from_academic_year_id))
    from_year = from_year_result.scalar_one_or_none()

    to_year_result = await db.execute(select(AcademicYear).where(AcademicYear.id == to_academic_year_id))
    to_year = to_year_result.scalar_one_or_none()

    if not from_year or not to_year:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or both academic years not found"
        )

    # Get students to promote
    students_result = await db.execute(
        select(Student).where(
            and_(
                Student.class_id == from_class_id,
                Student.academic_year_id == from_academic_year_id,
                Student.status == "active"
            )
        )
    )
    students = students_result.scalars().all()

    if not students:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No active students found in {from_class.name} for academic year {from_year.name}"
        )

    # Promote students
    promoted_count = 0
    for student in students:
        student.class_id = to_class_id
        student.academic_year_id = to_academic_year_id
        promoted_count += 1

    await db.commit()

    return {
        "message": f"Successfully promoted {promoted_count} students",
        "promoted_count": promoted_count,
        "from_class": from_class.name,
        "to_class": to_class.name,
        "from_academic_year": from_year.name,
        "to_academic_year": to_year.name
    }
