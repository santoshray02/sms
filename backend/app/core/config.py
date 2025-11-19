from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Union


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
    SMS_API_KEY: str = ""  # Optional - set for SMS functionality
    SMS_SENDER_ID: str = "SCHOOL"
    SMS_ROUTE: str = "4"

    # CORS - Can be string (comma-separated) or list
    CORS_ORIGINS: Union[List[str], str] = "http://localhost:3000"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    # Scheduler
    FEE_GENERATION_DAY: str = "last"
    FEE_GENERATION_HOUR: int = 9
    REMINDER_DAYS_BEFORE_DUE: int = 3
    REMINDER_HOUR: int = 10

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
