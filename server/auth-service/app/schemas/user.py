from typing import Optional
from pydantic import BaseModel, EmailStr, Field

# Base User Schema
class UserBase(BaseModel):
    email: EmailStr
    username: str
    is_active: bool = True
    
# Schema for User Creation
class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

# Schema for User Update
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    bio: Optional[str] = None

# Schema for User in DB
class UserInDB(UserBase):
    id: int
    hashed_password: str
    profile_image: Optional[str] = None
    bio: Optional[str] = None
    is_superuser: bool = False
    
    class Config:
        from_attributes = True

# Schema for returning User data
class User(UserBase):
    id: int
    profile_image: Optional[str] = None
    bio: Optional[str] = None
    
    class Config:
        from_attributes = True