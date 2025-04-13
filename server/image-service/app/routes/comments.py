from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import Any, List
from sqlalchemy import desc

from app.db.session import get_db
from app.core.auth import get_current_user, check_friendship
from app.models.post import Post, Comment
from app.schemas.post import Comment as CommentSchema, CommentCreate

router = APIRouter()

@router.post("/{post_id}/comments", response_model=CommentSchema)
async def create_comment(
    post_id: int,
    comment_in: CommentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> Any:
    """
    Add a comment to a post
    """
    user_id = current_user["id"]
    username = current_user["username"]
    
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
    
    # Create comment
    db_comment = Comment(
        post_id=post_id,
        user_id=user_id,
        username=username,
        content=comment_in.content
    )
    
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    
    return db_comment

@router.get("/{post_id}/comments", response_model=List[CommentSchema])
async def get_comments(
    post_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> Any:
    """
    Get all comments for a post
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
    
    # Get comments with pagination, newest first
    comments = db.query(Comment)\
        .filter(Comment.post_id == post_id)\
        .order_by(desc(Comment.created_at))\
        .offset(skip)\
        .limit(limit)\
        .all()
    
    return comments

@router.delete("/{post_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    post_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a comment
    """
    user_id = current_user["id"]
    
    # Check if comment exists and belongs to the specified post
    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.post_id == post_id
    ).first()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Check if user owns the comment or owns the post
    post = db.query(Post).filter(Post.id == comment.post_id).first()
    
    if comment.user_id != user_id and post.user_id != user_id:
        raise HTTPException(
            status_code=403, 
            detail="You don't have permission to delete this comment"
        )
    
    # Delete the comment
    db.delete(comment)
    db.commit()