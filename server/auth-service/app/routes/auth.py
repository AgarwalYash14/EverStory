from fastapi import APIRouter, Depends, HTTPException, status, Cookie, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from datetime import timedelta
from typing import Any, Optional

from app.db.session import get_db
from app.core.config import settings
from app.core.security import verify_password, create_access_token, get_password_hash
from app.models.user import User
from app.schemas.auth import Token, TokenData, LoginRequest
from app.schemas.user import User as UserSchema, UserCreate

router = APIRouter()

# Change tokenUrl to match actual endpoint
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

# Cookie extractor - simplified to avoid dependency injection issues
def get_token_from_cookie(request: Request) -> Optional[str]:
    # Direct access to the cookie from the request
    cookies = request.cookies
    return cookies.get("access_token")

# Token dependency that tries both header and cookie
async def get_token(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme)
) -> str:
    # First try OAuth2 (Authorization header)
    if token:
        return token
    
    # Then try cookie
    cookie_token = get_token_from_cookie(request)
    if cookie_token:
        return cookie_token
    
    # If no token found, raise error
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )

def get_current_user(db: Session = Depends(get_db), token: str = Depends(get_token)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(sub=user_id)
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == token_data.sub).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

@router.post("/login", response_model=Token)
def login_for_access_token(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    # First try to find the user by email
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user:
        # Then try to find by username
        user = db.query(User).filter(User.username == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )

    # Create response with token
    response = JSONResponse(content={"access_token": access_token, "token_type": "bearer"})
    
    # Set cookie with token for browser-based authentication
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        secure=False,  # Set to False for HTTP in development, True for HTTPS in production
        samesite="Lax",
        path="/",  # Ensure cookie is sent for all paths
    )

    return response

@router.post("/json-login", response_model=Token)
def json_login(login_data: LoginRequest, db: Session = Depends(get_db)) -> Any:
    """Alternate login endpoint that accepts JSON instead of form data"""
    user = db.query(User).filter(User.email == login_data.email).first()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=UserSchema)
def register(user_in: UserCreate, db: Session = Depends(get_db)) -> Any:
    """Register a new user"""
    # Check if user with this email exists
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )
    
    # Check if user with this username exists
    user = db.query(User).filter(User.username == user_in.username).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this username already exists",
        )
    
    # Create new user
    db_user = User(
        email=user_in.email,
        username=user_in.username,
        hashed_password=get_password_hash(user_in.password),
        is_active=True,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/user", response_model=UserSchema)
def get_current_user_info(current_user: User = Depends(get_current_active_user)) -> Any:
    """Get current user information"""
    return current_user

@router.post("/logout")
def logout():
    """Logout user by clearing the authentication cookie"""
    response = JSONResponse(content={"detail": "Successfully logged out"})
    response.delete_cookie(key="access_token")
    return response

@router.get("/verify-token", response_model=UserSchema)
def verify_token(current_user: User = Depends(get_current_active_user)) -> Any:
    """Verify token and return user if valid"""
    return current_user