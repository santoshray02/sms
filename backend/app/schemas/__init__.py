"""
Pydantic schemas for API validation and serialization
"""
from app.schemas.user import (
    UserBase, UserCreate, UserUpdate, UserResponse,
    Token, TokenData, LoginRequest
)
from app.schemas.student import (
    StudentBase, StudentCreate, StudentUpdate, StudentResponse, StudentListResponse
)
from app.schemas.academic import (
    AcademicYearBase, AcademicYearCreate, AcademicYearUpdate, AcademicYearResponse,
    ClassBase, ClassCreate, ClassUpdate, ClassResponse,
    TransportRouteBase, TransportRouteCreate, TransportRouteUpdate, TransportRouteResponse
)
from app.schemas.fee import (
    FeeStructureBase, FeeStructureCreate, FeeStructureUpdate, FeeStructureResponse,
    MonthlyFeeBase, MonthlyFeeResponse,
    GenerateMonthlyFeesRequest, GenerateMonthlyFeesResponse
)
from app.schemas.payment import (
    PaymentBase, PaymentCreate, PaymentResponse, PaymentListResponse
)

__all__ = [
    "UserBase", "UserCreate", "UserUpdate", "UserResponse",
    "Token", "TokenData", "LoginRequest",
    "StudentBase", "StudentCreate", "StudentUpdate", "StudentResponse", "StudentListResponse",
    "AcademicYearBase", "AcademicYearCreate", "AcademicYearUpdate", "AcademicYearResponse",
    "ClassBase", "ClassCreate", "ClassUpdate", "ClassResponse",
    "TransportRouteBase", "TransportRouteCreate", "TransportRouteUpdate", "TransportRouteResponse",
    "FeeStructureBase", "FeeStructureCreate", "FeeStructureUpdate", "FeeStructureResponse",
    "MonthlyFeeBase", "MonthlyFeeResponse",
    "GenerateMonthlyFeesRequest", "GenerateMonthlyFeesResponse",
    "PaymentBase", "PaymentCreate", "PaymentResponse", "PaymentListResponse",
]
