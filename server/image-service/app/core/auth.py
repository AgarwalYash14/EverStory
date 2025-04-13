from fastapi import Depends, HTTPException, status, Request, Cookie
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import httpx
from app.core.config import settings
from typing import Dict, Any, Optional

# Bearer token security with auto_error=False to avoid immediate errors
security = HTTPBearer(auto_error=False)

# Helper to get token from cookie
def get_token_from_cookie(request: Request) -> Optional[str]:
    return request.cookies.get("access_token")

# Get token from various sources
async def get_token(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    access_token: Optional[str] = Cookie(None)
) -> Optional[str]:
    # First try from Authorization header
    if credentials:
        return credentials.credentials
    
    # Then try from cookie parameter
    if access_token:
        return access_token
    
    # Finally try direct cookie access
    cookie_token = get_token_from_cookie(request)
    if cookie_token:
        return cookie_token
    
    return None

async def validate_token(token: str) -> Dict[str, Any]:
    """
    Validate token by calling the auth service
    """
    async with httpx.AsyncClient() as client:
        try:
            # Send token both in headers and cookies for maximum compatibility
            cookies = {"access_token": token}
            headers = {"Authorization": f"Bearer {token}"}
            
            response = await client.get(
                f"{settings.AUTH_SERVICE_URL}/api/auth/verify-token",
                headers=headers,
                cookies=cookies
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication credentials",
                    headers={"WWW-Authenticate": "Bearer"},
                )
        except httpx.RequestError:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Authentication service is unavailable",
            )

async def get_current_user(
    request: Request,
    token: Optional[str] = Depends(get_token)
) -> Dict[str, Any]:
    """
    Get the current user from token
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    return await validate_token(token)

async def check_friendship(user_id: int, friend_id: int, token: str) -> bool:
    """
    Check if two users are friends by calling the friendship service
    """
    async with httpx.AsyncClient() as client:
        try:
            # Send token both in headers and cookies
            cookies = {"access_token": token}
            headers = {"Authorization": f"Bearer {token}"}
            
            response = await client.get(
                f"{settings.FRIENDSHIP_SERVICE_URL}/api/friendships/check",
                params={"user_id": user_id, "friend_id": friend_id},
                headers=headers,
                cookies=cookies
            )
            
            if response.status_code == 200:
                return response.json().get("are_friends", False)
            else:
                # Default to not friends if service fails
                return False
        except httpx.RequestError:
            # Default to not friends if service unavailable
            return False