from fastapi import APIRouter
from app.api.v1.endpoints import auth

api_router = APIRouter()

# Include routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# TODO: Include remaining routers once endpoints are created
# api_router.include_router(students.router, prefix="/students", tags=["Students"])
# api_router.include_router(classes.router, prefix="/classes", tags=["Classes"])
# api_router.include_router(fees.router, prefix="/fees", tags=["Fees"])
# api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])
# api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
# api_router.include_router(sms.router, prefix="/sms", tags=["SMS"])
# api_router.include_router(settings.router, prefix="/settings", tags=["Settings"])


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
