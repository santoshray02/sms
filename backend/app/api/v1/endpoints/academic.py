from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.academic import AcademicYear, Class, TransportRoute
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
