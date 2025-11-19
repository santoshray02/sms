from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables
    """
    # Application
    APP_NAME: str = "School Management System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str

    # JWT
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24

    # SMS
    SMS_GATEWAY: str = "msg91"
    SMS_API_KEY: str
    SMS_SENDER_ID: str = "SCHOOL"
    SMS_ROUTE: str = "4"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    # Scheduler
    FEE_GENERATION_DAY: str = "last"
    FEE_GENERATION_HOUR: int = 9
    REMINDER_DAYS_BEFORE_DUE: int = 3
    REMINDER_HOUR: int = 10

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
