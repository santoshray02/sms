from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.api.v1.router import api_router
from app.db.session import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup and shutdown events
    """
    # Startup
    await init_db()
    print("✓ Database initialized")

    # Start automation scheduler
    from app.services.scheduler import automation_scheduler
    automation_scheduler.start()
    print("✓ Automation scheduler started")

    yield

    # Shutdown
    from app.services.scheduler import automation_scheduler
    automation_scheduler.stop()
    print("✓ Automation scheduler stopped")
    print("Shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Simple school management system for fee tracking and SMS notifications",
    lifespan=lifespan,
)


# Private Network Access middleware
class PrivateNetworkAccessMiddleware(BaseHTTPMiddleware):
    """
    Middleware to handle Private Network Access (PNA) for local development
    Allows public websites to access local/private network resources
    """
    async def dispatch(self, request: Request, call_next):
        # Handle preflight requests
        if request.method == "OPTIONS":
            response = await call_next(request)
            # Check if the request includes the Private Network Access header
            if "access-control-request-private-network" in request.headers:
                response.headers["Access-Control-Allow-Private-Network"] = "true"
            return response

        # Handle regular requests
        response = await call_next(request)
        response.headers["Access-Control-Allow-Private-Network"] = "true"
        return response


# Add Private Network Access middleware first
app.add_middleware(PrivateNetworkAccessMiddleware)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    """
    Health check endpoint
    """
    return {
        "message": "School Management System API",
        "version": settings.APP_VERSION,
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """
    Health check for monitoring
    """
    return {"status": "healthy"}
