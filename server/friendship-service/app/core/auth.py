import httpx
from fastapi import Depends, HTTPException, status, Request, Cookie
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.core.config import settings

# Make auto_error=False to prevent immediate errors on missing token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.AUTH_SERVICE_URL}/api/auth/login", auto_error=False)

class TokenData(BaseModel):
    id: int
    username: str
    email: str

# Helper to get token from cookie
def get_token_from_cookie(request: Request) -> Optional[str]:
    return request.cookies.get("access_token")

# Get token from header or cookie
async def get_token(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    access_token: Optional[str] = Cookie(None)
) -> Optional[str]:
    # First try from Authorization header
    if token:
        return token
    
    # Then try from cookie
    if access_token:
        return access_token
    
    # Finally try direct cookie access
    cookie_token = get_token_from_cookie(request)
    if cookie_token:
        return cookie_token
    
    return None

async def get_current_user(
    request: Request,
    token: Optional[str] = Depends(get_token)
) -> Dict[str, Any]:
    """
    Validate JWT token with the Auth service and return the user data
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise credentials_exception
    
    try:
        # Call the Auth service to validate the token
        async with httpx.AsyncClient() as client:
            # Send token both in headers and cookies for maximum compatibility
            cookies = {"access_token": token}
            headers = {"Authorization": f"Bearer {token}"}
            
            response = await client.get(
                f"{settings.AUTH_SERVICE_URL}/api/auth/verify-token",
                headers=headers,
                cookies=cookies
            )
            
            if response.status_code != 200:
                raise credentials_exception
            
            user_data = response.json()
            return user_data
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable"
        )