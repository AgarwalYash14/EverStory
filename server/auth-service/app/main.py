from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routes import auth, users
from app.db.init_db import init_db

# Create FastAPI app
app = FastAPI(title=settings.PROJECT_NAME)

# Set up CORS - using the CORS_ORIGINS list directly
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.CORS_ORIGINS],
    allow_credentials=True,  # This is necessary for cookies
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],  # Add expose_headers to ensure all headers are accessible
)

# Include API routes - keep /api/auth prefix for Kong gateway routes
# But move users under /api/auth directly (not nested)
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/auth/users", tags=["users"]) 

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()  # init_db is synchronous, no await needed

@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok", "service": "auth-service"}

@app.get("/")
def read_root():
    return {"message": "Auth Service API"}