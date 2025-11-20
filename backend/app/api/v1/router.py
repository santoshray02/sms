from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, students, academic, fees, payments, reports,
    guardians, streams, concessions, attendance, settings
)

api_router = APIRouter()

# Include routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(students.router, prefix="/students", tags=["Students"])
api_router.include_router(guardians.router, prefix="/guardians", tags=["Guardians"])
api_router.include_router(academic.router, prefix="/academic", tags=["Academic Setup"])
api_router.include_router(streams.router, prefix="/streams", tags=["Streams"])
api_router.include_router(fees.router, prefix="/fees", tags=["Fees"])
api_router.include_router(concessions.router, prefix="/concessions", tags=["Concessions"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["Attendance"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
api_router.include_router(settings.router, prefix="/settings", tags=["Settings"])


@api_router.get("/")
async def api_root():
    """
    API root endpoint
    """
    return {
        "message": "School Management System API v1 - Rural Bihar CBSE School Edition",
        "version": "2.0.0",
        "endpoints": {
            "auth": "/api/v1/auth",
            "students": "/api/v1/students",
            "guardians": "/api/v1/guardians",
            "academic": "/api/v1/academic",
            "streams": "/api/v1/streams",
            "fees": "/api/v1/fees",
            "concessions": "/api/v1/concessions",
            "payments": "/api/v1/payments",
            "attendance": "/api/v1/attendance",
            "reports": "/api/v1/reports",
            "sms": "/api/v1/sms",
            "settings": "/api/v1/settings",
        }
    }
