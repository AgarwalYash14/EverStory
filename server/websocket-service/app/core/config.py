import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "WebSocket Service"
    API_V1_STR: str = "/api"
    
    # CORS - match the client domain
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    
    # JWT Authentication
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-for-jwt-here-please-change-in-production")
    
    # Services URLs for event propagation
    AUTH_SERVICE_URL: str = os.getenv("AUTH_SERVICE_URL", "http://localhost:8000")
    IMAGE_SERVICE_URL: str = os.getenv("IMAGE_SERVICE_URL", "http://localhost:8000")
    FRIENDSHIP_SERVICE_URL: str = os.getenv("FRIENDSHIP_SERVICE_URL", "http://localhost:8000")
    
    # Redis configuration for Socket.IO
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    USE_REDIS: bool = os.getenv("USE_REDIS", "false").lower() == "true"
    
    class Config:
        case_sensitive = True

settings = Settings()