from typing import List, Optional
from datetime import datetime
from enum import Enum
from pydantic import BaseModel

class FriendshipStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class FriendshipBase(BaseModel):
    requester_id: int
    addressee_id: int

class FriendshipCreate(BaseModel):
    addressee_id: int

class FriendshipStatusUpdate(BaseModel):
    status: FriendshipStatus

class Friendship(FriendshipBase):
    id: int
    status: FriendshipStatus
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class FriendshipWithUserDetails(Friendship):
    requester_username: Optional[str] = None
    addressee_username: Optional[str] = None

    class Config:
        from_attributes = True