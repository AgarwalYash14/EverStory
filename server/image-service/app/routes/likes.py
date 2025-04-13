from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, Dict

from app.db.session import get_db
from app.core.auth import get_current_user, check_friendship
from app.models.post import Post, Like
from app.schemas.post import Post as PostSchema

router = APIRouter()

@router.post("/{post_id}", response_model=Dict[str, Any])
async def toggle_like(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> Any:
    """
    Toggle like on a post
    """
    user_id = current_user["id"]
    
    # Check if post exists
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check if user has access to this post (if it's private)
    if post.is_private and post.user_id != user_id:
        # Check if users are friends
        token = current_user.get("access_token", "")
        are_friends = await check_friendship(user_id, post.user_id, token)
        if not are_friends:
            raise HTTPException(status_code=403, detail="You don't have access to this post")
    
    # Check if the user already liked the post
    like = db.query(Like).filter(
        Like.post_id == post_id,
        Like.user_id == user_id
    ).first()
    
    if like:
        # Unlike the post
        db.delete(like)
        post.likes_count = max(0, post.likes_count - 1)  # Ensure it doesn't go below 0
        db.commit()
        return {"liked": False, "likes_count": post.likes_count}
    else:
        # Like the post
        db_like = Like(post_id=post_id, user_id=user_id)
        db.add(db_like)
        post.likes_count += 1
        db.commit()
        return {"liked": True, "likes_count": post.likes_count}