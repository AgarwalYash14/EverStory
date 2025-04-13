from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, List, Optional, Dict
import httpx

from app.db.session import get_db
from app.core.auth import get_current_user
from app.core.config import settings
from app.models.friendship import Friendship, FriendshipStatus
from app.schemas.friendship import (
    Friendship as FriendshipSchema,
    FriendshipCreate,
    FriendshipStatusUpdate,
    FriendshipWithUserDetails
)

router = APIRouter()

# Helper function to get all user friendships (reused in multiple routes)
async def _get_user_friendships(db: AsyncSession, current_user: Dict[str, Any]):
    query = select(Friendship).where(
        or_(
            Friendship.requester_id == current_user["id"],
            Friendship.addressee_id == current_user["id"]
        )
    )
    result = await db.execute(query)
    friendships = result.scalars().all()
    
    # Enrich with user data from auth service
    result = []
    async with httpx.AsyncClient() as client:
        for friendship in friendships:
            enriched_friendship = FriendshipWithUserDetails.from_orm(friendship)
            
            # Get requester details if not current user
            if friendship.requester_id != current_user["id"]:
                try:
                    response = await client.get(
                        f"{settings.AUTH_SERVICE_URL}/api/users/{friendship.requester_id}",
                        headers={"Authorization": f"Bearer {current_user['access_token']}"}
                    )
                    if response.status_code == 200:
                        user_data = response.json()
                        enriched_friendship.requester_username = user_data.get("username")
                except httpx.RequestError:
                    # Just continue if the auth service is unavailable
                    pass
            
            # Get addressee details if not current user
            if friendship.addressee_id != current_user["id"]:
                try:
                    response = await client.get(
                        f"{settings.AUTH_SERVICE_URL}/api/users/{friendship.addressee_id}",
                        headers={"Authorization": f"Bearer {current_user['access_token']}"}
                    )
                    if response.status_code == 200:
                        user_data = response.json()
                        enriched_friendship.addressee_username = user_data.get("username")
                except httpx.RequestError:
                    # Just continue if the auth service is unavailable
                    pass
            
            result.append(enriched_friendship)
    
    return result

# Helper function to get pending requests
async def _get_pending_requests(db: AsyncSession, current_user: Dict[str, Any]):
    query = select(Friendship).where(
        and_(
            Friendship.addressee_id == current_user["id"],
            Friendship.status == FriendshipStatus.PENDING
        )
    )
    result = await db.execute(query)
    pending_requests = result.scalars().all()
    
    # Enrich with user data from auth service
    result = []
    async with httpx.AsyncClient() as client:
        for friendship in pending_requests:
            enriched_friendship = FriendshipWithUserDetails.from_orm(friendship)
            
            # Get requester details
            try:
                response = await client.get(
                    f"{settings.AUTH_SERVICE_URL}/api/users/{friendship.requester_id}",
                    headers={"Authorization": f"Bearer {current_user['access_token']}"}
                )
                if response.status_code == 200:
                    user_data = response.json()
                    enriched_friendship.requester_username = user_data.get("username")
            except httpx.RequestError:
                # Just continue if the auth service is unavailable
                pass
            
            result.append(enriched_friendship)
    
    return result

# Helper function to get all friend requests
async def _get_friend_requests(db: AsyncSession, current_user: Dict[str, Any]):
    # Get sent requests
    sent_query = select(Friendship).where(
        and_(
            Friendship.requester_id == current_user["id"],
            Friendship.status == FriendshipStatus.PENDING
        )
    )
    sent_result = await db.execute(sent_query)
    sent_requests = sent_result.scalars().all()
    
    # Get received requests
    received_query = select(Friendship).where(
        and_(
            Friendship.addressee_id == current_user["id"],
            Friendship.status == FriendshipStatus.PENDING
        )
    )
    received_result = await db.execute(received_query)
    received_requests = received_result.scalars().all()
    
    # Enrich with user data from auth service
    result = []
    async with httpx.AsyncClient() as client:
        # Process sent requests
        for friendship in sent_requests:
            enriched_friendship = FriendshipWithUserDetails.from_orm(friendship)
            
            # Get addressee details
            try:
                response = await client.get(
                    f"{settings.AUTH_SERVICE_URL}/api/users/{friendship.addressee_id}",
                    headers={"Authorization": f"Bearer {current_user['access_token']}"}
                )
                if response.status_code == 200:
                    user_data = response.json()
                    enriched_friendship.addressee_username = user_data.get("username")
            except httpx.RequestError:
                # Just continue if the auth service is unavailable
                pass
            
            result.append(enriched_friendship)
            
        # Process received requests
        for friendship in received_requests:
            enriched_friendship = FriendshipWithUserDetails.from_orm(friendship)
            
            # Get requester details
            try:
                response = await client.get(
                    f"{settings.AUTH_SERVICE_URL}/api/users/{friendship.requester_id}",
                    headers={"Authorization": f"Bearer {current_user['access_token']}"}
                )
                if response.status_code == 200:
                    user_data = response.json()
                    enriched_friendship.requester_username = user_data.get("username")
            except httpx.RequestError:
                # Just continue if the auth service is unavailable
                pass
            
            result.append(enriched_friendship)
    
    # Organize by sent and received
    return {
        "sentRequests": [r for r in result if r.requester_id == current_user["id"]],
        "receivedRequests": [r for r in result if r.addressee_id == current_user["id"]]
    }

# Original routes
@router.post("/", response_model=FriendshipSchema)
async def create_friend_request(
    friend_request: FriendshipCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create a new friend request"""
    # Check if friendship already exists
    query = select(Friendship).where(
        or_(
            and_(Friendship.requester_id == current_user["id"], Friendship.addressee_id == friend_request.addressee_id),
            and_(Friendship.requester_id == friend_request.addressee_id, Friendship.addressee_id == current_user["id"])
        )
    )
    result = await db.execute(query)
    existing_friendship = result.scalar_one_or_none()
    
    if existing_friendship:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Friendship already exists"
        )
    
    # Create new friend request
    new_friendship = Friendship(
        requester_id=current_user["id"],
        addressee_id=friend_request.addressee_id,
        status=FriendshipStatus.PENDING
    )
    
    db.add(new_friendship)
    await db.commit()
    await db.refresh(new_friendship)
    
    return new_friendship

@router.get("/", response_model=List[FriendshipWithUserDetails])
async def get_user_friendships(
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get all friends and friend requests for the current user"""
    return await _get_user_friendships(db, current_user)

@router.get("/pending", response_model=List[FriendshipWithUserDetails])
async def get_pending_friend_requests(
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get all pending friend requests received by the current user"""
    return await _get_pending_requests(db, current_user)

@router.get("/requests", response_model=dict)
async def get_friend_requests(
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get all friend requests for the current user (both sent and received)"""
    return await _get_friend_requests(db, current_user)

# Add routes with full paths to handle Kong forwarding with original paths
@router.get("/api/friendships", response_model=List[FriendshipWithUserDetails])
async def get_user_friendships_full_path(
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get all friends and friend requests for the current user (full path)"""
    return await _get_user_friendships(db, current_user)

@router.get("/api/friendships/pending", response_model=List[FriendshipWithUserDetails])
async def get_pending_friend_requests_full_path(
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get all pending friend requests received by the current user (full path)"""
    return await _get_pending_requests(db, current_user)

@router.get("/api/friendships/requests", response_model=dict)
async def get_friend_requests_full_path(
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get all friend requests for the current user (both sent and received) (full path)"""
    return await _get_friend_requests(db, current_user)

@router.post("/api/friendships", response_model=FriendshipSchema)
async def create_friend_request_full_path(
    friend_request: FriendshipCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create a new friend request (full path)"""
    # Reuse the same logic as the original route
    return await create_friend_request(friend_request, db, current_user)

# Remaining routes
@router.patch("/{friendship_id}", response_model=FriendshipSchema)
async def update_friendship_status(
    friendship_id: int,
    status_update: FriendshipStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Update a friendship status (accept or decline)"""
    query = select(Friendship).where(Friendship.id == friendship_id)
    result = await db.execute(query)
    friendship = result.scalar_one_or_none()
    
    if not friendship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Friendship not found"
        )
    
    # Only the addressee can update the status
    if friendship.addressee_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this friendship"
        )
    
    # Update status
    friendship.status = status_update.status
    await db.commit()
    await db.refresh(friendship)
    
    return friendship

@router.delete("/{friendship_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_friendship(
    friendship_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Delete a friendship (unfriend or cancel request)"""
    query = select(Friendship).where(Friendship.id == friendship_id)
    result = await db.execute(query)
    friendship = result.scalar_one_or_none()
    
    if not friendship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Friendship not found"
        )
    
    # Only participants can delete the friendship
    if friendship.requester_id != current_user["id"] and friendship.addressee_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this friendship"
        )
    
    await db.delete(friendship)
    await db.commit()

# Also add full path versions of the update and delete endpoints
@router.patch("/api/friendships/{friendship_id}", response_model=FriendshipSchema)
async def update_friendship_status_full_path(
    friendship_id: int,
    status_update: FriendshipStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Update a friendship status (accept or decline) (full path)"""
    return await update_friendship_status(friendship_id, status_update, db, current_user)

@router.delete("/api/friendships/{friendship_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_friendship_full_path(
    friendship_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Delete a friendship (unfriend or cancel request) (full path)"""
    return await delete_friendship(friendship_id, db, current_user)