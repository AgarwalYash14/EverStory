from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Any, Optional
import shutil
import os
from pathlib import Path

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import User as UserSchema, UserUpdate
from app.routes.auth import get_current_active_user

router = APIRouter()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads/profile_images")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.get("/me", response_model=UserSchema)
def read_user_me(current_user: User = Depends(get_current_active_user)) -> Any:
    """
    Get current user.
    """
    return current_user

@router.put("/me", response_model=UserSchema)
async def update_user_me(
    *,
    db: Session = Depends(get_db),
    username: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    bio: Optional[str] = Form(None),
    profile_image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Update own user.
    """
    # Check if username already exists
    if username and username != current_user.username:
        user_with_username = db.query(User).filter(User.username == username).first()
        if user_with_username:
            raise HTTPException(
                status_code=400,
                detail="Username already registered"
            )
    
    # Check if email already exists
    if email and email != current_user.email:
        user_with_email = db.query(User).filter(User.email == email).first()
        if user_with_email:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )
    
    # Handle profile image upload
    if profile_image:
        # Clean up old profile image if it exists
        if current_user.profile_image and os.path.exists(current_user.profile_image):
            try:
                os.remove(current_user.profile_image)
            except:
                pass
        
        # Save new profile image
        file_extension = profile_image.filename.split(".")[-1]
        file_path = UPLOAD_DIR / f"{current_user.id}.{file_extension}"
        
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(profile_image.file, buffer)
        
        # Update database with new image path
        current_user.profile_image = str(file_path)
    
    # Update other fields
    if username:
        current_user.username = username
    
    if email:
        current_user.email = email
        
    if bio:
        current_user.bio = bio
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.get("/{user_id}", response_model=UserSchema)
def read_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get a specific user by id.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    return user