import socketio
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.auth import validate_token
from .services.socket_manager import sio, socket_app

app = FastAPI(title=settings.PROJECT_NAME)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the Socket.IO application
app.mount("/ws", socket_app)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "WebSocket service is running"}

# Initialize Socket.IO with authentication middleware
@sio.event
async def connect(sid, environ, auth):
    """Handle WebSocket connection with JWT authentication"""
    if not auth or 'token' not in auth:
        await sio.disconnect(sid)
        return False
    
    try:
        # Validate the token and get the user information
        user_data = validate_token(auth['token'])
        # Associate the user ID with the session
        await sio.save_session(sid, {"user_id": user_data["sub"], "username": user_data.get("username", "")})
        print(f"Client connected: {sid} - User: {user_data['sub']}")
        return True
    except Exception as e:
        print(f"Authentication error: {str(e)}")
        await sio.disconnect(sid)
        return False

@sio.event
async def disconnect(sid):
    """Handle client disconnect event"""
    print(f"Client disconnected: {sid}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)