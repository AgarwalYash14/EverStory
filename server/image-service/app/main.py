from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from pathlib import Path

from app.core.config import settings
from app.db.init_db import init_db
from app.routes import posts, comments, likes

# Create upload directory if it doesn't exist
upload_dir = Path(settings.UPLOAD_DIR)
upload_dir.mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Image Service API for the Social Media Platform",
    version="0.1.0",
)

# Set up CORS with standard origins from settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],  # Add expose_headers for more compatibility
)

# Mount static files directory for serving uploaded images
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include routers
app.include_router(posts.router, prefix="/api/posts", tags=["posts"])
# Mount comments routes directly under each post for proper nesting
app.include_router(comments.router, prefix="/api/posts", tags=["comments"])
app.include_router(likes.router, prefix="/api/likes", tags=["likes"])

@app.get("/api/health", tags=["health"])
def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "image-service"}

@app.on_event("startup")
async def startup_event():
    """Initialize the database on startup"""
    try:
        # Initialize the database first
        init_db()
        
        # Then run the migration to add cloudinary_public_id column
        from app.db.add_cloudinary_column import add_cloudinary_column
        add_cloudinary_column()
        print("Database initialization and migration completed successfully")
    except Exception as e:
        print(f"Error during startup: {e}")
        # Continue application startup even if there's an error
        # This prevents the application from failing to start if there's a migration issue