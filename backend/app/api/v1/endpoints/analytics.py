"""
API endpoints for predictive analytics
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.services.analytics_service import AnalyticsService


router = APIRouter()


@router.get("/dashboard")
async def get_analytics_dashboard(
    academic_year_id: int,
    use_cache: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get comprehensive analytics dashboard

    Includes:
    - At-risk students (top 10)
    - Revenue forecast (3 months)
    - Collection trends
    - Class performance insights
    - Summary statistics
    """
    try:
        # Check cache first
        if use_cache:
            cached = await AnalyticsService.get_cached_analytics(
                db,
                "dashboard",
                {"academic_year_id": academic_year_id}
            )
            if cached:
                return {
                    **cached,
                    "from_cache": True
                }

        # Generate fresh analytics
        dashboard = await AnalyticsService.get_dashboard_summary(db, academic_year_id)

        # Cache the result
        await AnalyticsService.cache_analytics(
            db,
            "dashboard",
            {"academic_year_id": academic_year_id},
            dashboard,
            ttl_seconds=3600  # 1 hour cache
        )

        return {
            **dashboard,
            "from_cache": False
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating dashboard: {str(e)}")


@router.get("/at-risk-students")
async def get_at_risk_students(
    academic_year_id: int,
    threshold_attendance: float = Query(75.0, ge=0, le=100),
    threshold_payment_delays: int = Query(2, ge=1, le=10),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get list of students at risk of dropping out

    Risk factors analyzed:
    - Low attendance
    - Multiple payment delays
    - No recent payments
    - Unresponded fee reminders
    - Low performance

    Query params:
    - threshold_attendance: Attendance % threshold (default 75%)
    - threshold_payment_delays: Number of delays to flag (default 2)
    """
    try:
        at_risk = await AnalyticsService.get_at_risk_students(
            db,
            academic_year_id,
            threshold_attendance,
            threshold_payment_delays
        )

        return {
            "total_at_risk": len(at_risk),
            "critical_count": len([s for s in at_risk if s["risk_level"] == "Critical"]),
            "high_count": len([s for s in at_risk if s["risk_level"] == "High"]),
            "medium_count": len([s for s in at_risk if s["risk_level"] == "Medium"]),
            "students": at_risk
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing at-risk students: {str(e)}")


@router.get("/revenue-forecast")
async def get_revenue_forecast(
    academic_year_id: int,
    months_ahead: int = Query(3, ge=1, le=12),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Forecast revenue for upcoming months

    Uses historical payment data and trend analysis

    Query params:
    - months_ahead: Number of months to forecast (1-12, default 3)
    """
    try:
        forecast = await AnalyticsService.forecast_revenue(
            db,
            academic_year_id,
            months_ahead
        )

        return forecast

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error forecasting revenue: {str(e)}")


@router.get("/collection-trends")
async def get_collection_trends(
    academic_year_id: int,
    use_cache: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Analyze fee collection patterns and trends

    Includes:
    - Monthly collection rates
    - Payment mode preferences
    - Class-wise performance
    - Defaulter patterns
    """
    try:
        # Check cache
        if use_cache:
            cached = await AnalyticsService.get_cached_analytics(
                db,
                "collection_trends",
                {"academic_year_id": academic_year_id}
            )
            if cached:
                return {
                    **cached,
                    "from_cache": True
                }

        # Generate fresh analysis
        trends = await AnalyticsService.analyze_fee_collection_trends(db, academic_year_id)

        # Cache the result
        await AnalyticsService.cache_analytics(
            db,
            "collection_trends",
            {"academic_year_id": academic_year_id},
            trends,
            ttl_seconds=7200  # 2 hours cache
        )

        return {
            **trends,
            "from_cache": False
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing trends: {str(e)}")


@router.get("/class-performance")
async def get_class_performance(
    academic_year_id: int,
    use_cache: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get class-wise performance insights

    Includes:
    - Attendance patterns
    - Student strength
    - Gender distribution
    - Performance metrics
    - Issues identification
    """
    try:
        # Check cache
        if use_cache:
            cached = await AnalyticsService.get_cached_analytics(
                db,
                "class_performance",
                {"academic_year_id": academic_year_id}
            )
            if cached:
                return {
                    **cached,
                    "from_cache": True
                }

        # Generate fresh insights
        insights = await AnalyticsService.get_class_performance_insights(db, academic_year_id)

        # Cache the result
        await AnalyticsService.cache_analytics(
            db,
            "class_performance",
            {"academic_year_id": academic_year_id},
            insights,
            ttl_seconds=7200  # 2 hours cache
        )

        return {
            **insights,
            "from_cache": False
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing class performance: {str(e)}")


@router.post("/clear-cache")
async def clear_analytics_cache(
    report_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Clear analytics cache

    Query params:
    - report_type: Specific report type to clear (optional, clears all if not provided)

    Requires admin access
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        from sqlalchemy import delete
        from app.models.automation import AnalyticsCache

        if report_type:
            stmt = delete(AnalyticsCache).where(AnalyticsCache.report_type == report_type)
        else:
            stmt = delete(AnalyticsCache)

        result = await db.execute(stmt)
        await db.commit()

        return {
            "success": True,
            "message": f"Cleared {result.rowcount} cache entries",
            "report_type": report_type or "all"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing cache: {str(e)}")
