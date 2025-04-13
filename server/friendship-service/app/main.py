from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.init_db import init_db
from app.routes import friendships

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Friendship Service API for the Social Media Platform",
    version="0.1.0",
)

# Set up CORS with standard origins from settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(friendships.router, prefix="", tags=["friendships"])

@app.on_event("startup")
async def startup_event():
    # Initialize database tables and initial data
    await init_db()

# Add a root endpoint for debugging
@app.get("/")
async def root():
    return {"message": "Friendship service is running"}

@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok", "service": settings.PROJECT_NAME}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)