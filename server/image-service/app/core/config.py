import os
from typing import List
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "Image Service"
    API_V1_STR: str = "/api"
    
    # CORS - define a default list of allowed origins
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    
    # Database
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "image_service")
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}/{POSTGRES_DB}"
    )
    
    # Auth Service
    AUTH_SERVICE_URL: str = os.getenv("AUTH_SERVICE_URL", "http://localhost:8000")
    
    # Friendship Service
    FRIENDSHIP_SERVICE_URL: str = os.getenv("FRIENDSHIP_SERVICE_URL", "http://localhost:8000")
    
    # Image Upload Config
    UPLOAD_DIR: str = "uploads/images"
    MAX_IMAGE_SIZE: int = 5 * 1024 * 1024  # 5MB
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/gif"]
    
    # Cloudinary Config for image uploads
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "dory0lqti")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "798456439656156")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "kh6BouyGjX_DdlnUJspLvqoQII4")
    USE_CLOUDINARY: bool = os.getenv("USE_CLOUDINARY", "true").lower() == "true"
    
    class Config:
        case_sensitive = True

settings = Settings()