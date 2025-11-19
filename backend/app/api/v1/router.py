from fastapi import APIRouter
from app.api.v1.endpoints import auth, students, academic, fees, payments, reports

api_router = APIRouter()

# Include routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(students.router, prefix="/students", tags=["Students"])
api_router.include_router(academic.router, prefix="/academic", tags=["Academic Setup"])
api_router.include_router(fees.router, prefix="/fees", tags=["Fees"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])


@api_router.get("/")
async def api_root():
    """
    API root endpoint
    """
    return {
        "message": "School Management System API v1",
        "endpoints": {
            "auth": "/api/v1/auth",
            "students": "/api/v1/students",
            "classes": "/api/v1/classes",
            "fees": "/api/v1/fees",
            "payments": "/api/v1/payments",
            "reports": "/api/v1/reports",
            "sms": "/api/v1/sms",
            "settings": "/api/v1/settings",
        }
    }
