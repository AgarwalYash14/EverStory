from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

# Comment schemas
class CommentBase(BaseModel):
    content: str = Field(..., min_length=1)

class CommentCreate(CommentBase):
    pass

class Comment(CommentBase):
    id: int
    post_id: int
    user_id: int
    username: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Like schemas
class Like(BaseModel):
    id: int
    user_id: int
    
    class Config:
        from_attributes = True

# Post schemas
class PostBase(BaseModel):
    caption: Optional[str] = None
    is_private: bool = False

class PostCreate(PostBase):
    pass

class PostUpdate(BaseModel):
    caption: Optional[str] = None
    is_private: Optional[bool] = None

class Post(PostBase):
    id: int
    user_id: int
    username: str
    image_url: str
    likes_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class PostWithDetails(Post):
    comments: List[Comment] = []
    user_has_liked: bool = False
    
    class Config:
        from_attributes = True

# Search schemas
class PostSearchParams(BaseModel):
    skip: int = 0
    limit: int = 20
    search_term: Optional[str] = None
    user_id: Optional[int] = None