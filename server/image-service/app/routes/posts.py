from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from typing import Any, List, Optional
import shutil
import os
from pathlib import Path
import uuid
from PIL import Image
import io

from app.db.session import get_db
from app.core.config import settings
from app.core.auth import get_current_user, check_friendship
from app.models.post import Post, Like, Comment
from app.schemas.post import Post as PostSchema, PostWithDetails, PostCreate, PostUpdate, PostSearchParams
from app.utils.cloudinary_utils import upload_image_to_cloudinary, delete_image_from_cloudinary

router = APIRouter()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path(settings.UPLOAD_DIR)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/", response_model=PostSchema)
async def create_post(
    *,
    db: Session = Depends(get_db),
    caption: Optional[str] = Form(None),
    is_private: bool = Form(False),
    image: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
) -> Any:
    """
    Create new post with image upload
    """
    # Validate image file
    if image.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Only JPEG, PNG, and GIF are supported."
        )
    
    try:
        # Check file size - read into memory temporarily
        image_content = await image.read()
        if len(image_content) > settings.MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Image file too large. Maximum size is {settings.MAX_IMAGE_SIZE // (1024 * 1024)}MB"
            )
        
        # Reset file position after reading
        await image.seek(0)
        
        # Image URL to store in the database
        image_url = None
        cloudinary_public_id = None
        
        # Try to use Cloudinary if enabled
        if settings.USE_CLOUDINARY:
            try:
                # Upload to Cloudinary
                cloudinary_response = await upload_image_to_cloudinary(
                    image,
                    folder="social_posts",
                    public_id=None  # Let Cloudinary generate a unique ID
                )
                
                # Get the secure URL
                image_url = cloudinary_response.get("secure_url")
                cloudinary_public_id = cloudinary_response.get("public_id")
                
            except Exception as cloud_error:
                print(f"Cloudinary upload failed: {str(cloud_error)}")
                # Fall back to local storage if Cloudinary fails
                settings.USE_CLOUDINARY = False
        
        # If Cloudinary is disabled or failed, use local storage
        if not settings.USE_CLOUDINARY:
            # Reset file position after potential Cloudinary attempt
            await image.seek(0)
            
            # Generate unique filename
            file_extension = image.filename.split(".")[-1]
            unique_filename = f"{uuid.uuid4()}.{file_extension}"
            file_location = UPLOAD_DIR / unique_filename
            
            # Save image to file
            with open(file_location, "wb") as buffer:
                await image.seek(0)
                buffer.write(await image.read())
                
            # Set the URL for local storage - use direct path to file
            # This is what needs to be updated - store just the filename since the static files
            # are served from /uploads endpoint
            image_url = f"/uploads/{unique_filename}"
            
        # Create post in database
        db_post = Post(
            user_id=current_user["id"],
            username=current_user["username"],
            image_url=image_url,
            caption=caption,
            is_private=is_private
        )
        
        # If we have a Cloudinary public ID, store it
        if hasattr(Post, 'cloudinary_public_id') and cloudinary_public_id:
            db_post.cloudinary_public_id = cloudinary_public_id
        
        db.add(db_post)
        db.commit()
        db.refresh(db_post)
        return db_post
    
    except Exception as e:
        # Clean up file if there's an error and we're using local storage
        if not settings.USE_CLOUDINARY and 'file_location' in locals() and file_location.exists():
            os.remove(file_location)
        raise HTTPException(status_code=500, detail=f"Failed to create post: {str(e)}")

@router.post("/optimize-image", response_model=dict)
async def optimize_image(
    *,
    db: Session = Depends(get_db),
    image: UploadFile = File(...),
    width: Optional[int] = Form(1200),
    quality: Optional[int] = Form(85),
    current_user: dict = Depends(get_current_user)
) -> Any:
    """
    Optimize image without creating a post - returns URLs for optimized versions
    """
    # Validate image file
    if image.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Only JPEG, PNG, and GIF are supported."
        )
    
    try:
        # Check file size - read into memory temporarily
        image_content = await image.read()
        if len(image_content) > settings.MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Image file too large. Maximum size is {settings.MAX_IMAGE_SIZE // (1024 * 1024)}MB"
            )
        
        # Reset file position after reading
        await image.seek(0)
        
        result = {}
        
        # Try to use Cloudinary if enabled for optimization
        if settings.USE_CLOUDINARY:
            try:
                # Upload to Cloudinary with responsive options
                cloudinary_response = await upload_image_to_cloudinary(
                    image,
                    folder="temp_optimized",
                    public_id=None  # Let Cloudinary generate a unique ID
                )
                
                # Include responsive breakpoints in result
                result = {
                    "original_url": cloudinary_response.get("secure_url"),
                    "public_id": cloudinary_response.get("public_id"),
                    "format": cloudinary_response.get("format"),
                    "width": cloudinary_response.get("width"),
                    "height": cloudinary_response.get("height"),
                    "bytes": cloudinary_response.get("bytes"),
                }
                
                # Add responsive breakpoints if available
                if "responsive_breakpoints" in cloudinary_response:
                    breakpoints = cloudinary_response["responsive_breakpoints"][0]["breakpoints"]
                    result["responsive_urls"] = [
                        {"width": bp["width"], "url": bp["secure_url"]} 
                        for bp in breakpoints
                    ]
                
                return result
                
            except Exception as cloud_error:
                print(f"Cloudinary optimization failed: {str(cloud_error)}")
        
        # If Cloudinary is disabled or failed, use local optimization
        await image.seek(0)
        
        # Generate unique filename for temp storage
        file_extension = image.filename.split(".")[-1]
        unique_filename = f"temp_{uuid.uuid4()}.{file_extension}"
        file_location = UPLOAD_DIR / unique_filename
        
        # Optimize the image locally
        from app.utils.cloudinary_utils import optimize_image_locally
        optimized_content = optimize_image_locally(await image.read(), max_width=width, quality=quality)
        
        # Save optimized image to file
        with open(file_location, "wb") as buffer:
            buffer.write(optimized_content)
        
        # Get image dimensions
        from PIL import Image
        with Image.open(file_location) as img:
            img_width, img_height = img.size
            
        # Get file size
        file_size = os.path.getsize(file_location)
            
        # Set the URL for local storage
        image_url = f"/uploads/{unique_filename}"
        
        # Return details about the optimized image
        result = {
            "original_url": image_url,
            "width": img_width,
            "height": img_height,
            "bytes": file_size,
            "format": file_extension.lower(),
        }
        
        # Create a few responsive sizes for local storage
        responsive_sizes = [200, 600, 1200]
        responsive_urls = []
        
        for size in responsive_sizes:
            if img_width <= size:
                # Skip sizes larger than the original
                continue
                
            # Generate a new filename for this size
            sized_filename = f"temp_{uuid.uuid4()}_{size}.{file_extension}"
            sized_location = UPLOAD_DIR / sized_filename
            
            # Resize and optimize the image
            with Image.open(file_location) as img:
                ratio = size / img_width
                new_height = int(img_height * ratio)
                resized = img.resize((size, new_height), Image.LANCZOS)
                
                # Save the resized image
                resized.save(sized_location, quality=quality, optimize=True, progressive=True)
                
            # Add to responsive URLs
            responsive_urls.append({
                "width": size,
                "url": f"/uploads/{sized_filename}"
            })
            
        # Add responsive URLs to result
        result["responsive_urls"] = responsive_urls
        
        return result
        
    except Exception as e:
        # Clean up file if there's an error and we created it
        if 'file_location' in locals() and os.path.exists(file_location):
            os.remove(file_location)
        raise HTTPException(status_code=500, detail=f"Failed to optimize image: {str(e)}")

@router.get("/", response_model=dict)
async def get_posts(
    db: Session = Depends(get_db),
    page: int = Query(1),
    size: int = Query(10),
    search: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
) -> Any:
    """
    Get paginated posts with search functionality - endpoint matching frontend expectations
    """
    user_id = current_user["id"]
    
    # Calculate skip value for pagination (page starts at 1 in the frontend)
    skip = (page - 1) * size
    
    try:
        # Base query - get posts that are either:
        # 1. Public posts from anyone OR
        # 2. Private posts from the current user
        query = db.query(Post).filter(
            or_(
                Post.is_private == False,  # Public posts
                and_(Post.is_private == True, Post.user_id == user_id)  # User's own private posts
            )
        )
        
        # Apply search filter if provided
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Post.caption.ilike(search_term),
                    Post.username.ilike(search_term)
                )
            )
        
        # Order by most recent
        query = query.order_by(desc(Post.created_at))
        
        # Get the count and posts safely
        total_count = db.query(Post).count()
        posts = query.offset(skip).limit(size).all()
        
        # For each post, check if private posts are from friends and add user_has_liked
        result_posts = []
        for post in posts:
            # Skip private posts that aren't from the user or their friends
            if post.is_private and post.user_id != user_id:
                # Check if the users are friends
                token = current_user.get("access_token", "")
                are_friends = await check_friendship(user_id, post.user_id, token)
                if not are_friends:
                    continue
            
            # Check if the current user has liked the post
            like = db.query(Like).filter(
                Like.post_id == post.id,
                Like.user_id == user_id
            ).first()
            
            # Convert to dict to avoid model attribute errors if schema changed
            post_dict = {
                "id": post.id,
                "user_id": post.user_id,
                "username": post.username,
                "image_url": post.image_url,
                "caption": post.caption,
                "likes_count": post.likes_count,
                "is_private": post.is_private,
                "created_at": post.created_at,
                "updated_at": post.updated_at,
                "user_has_liked": like is not None
            }
            
            # Add cloudinary_public_id if it exists in the post object
            if hasattr(post, "cloudinary_public_id"):
                post_dict["cloudinary_public_id"] = post.cloudinary_public_id
            
            result_posts.append(post_dict)
        
        # Calculate total number of pages
        total_pages = (total_count + size - 1) // size if total_count > 0 else 1
        
        # Create the result with a structure matching what the frontend expects
        return {
            "items": result_posts,
            "total": total_count,
            "page": page,
            "size": size,
            "pages": total_pages
        }
    except Exception as e:
        print(f"Error fetching posts: {e}")
        # Return empty result on error to avoid complete failure
        return {
            "items": [],
            "total": 0,
            "page": page,
            "size": size,
            "pages": 1,
            "error": str(e)
        }

@router.get("/feed", response_model=List[PostWithDetails])
async def get_posts_feed(
    db: Session = Depends(get_db),
    skip: int = Query(0),
    limit: int = Query(20),
    search: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
) -> Any:
    """
    Get posts for user's feed with virtualized loading
    Implements search and respects privacy settings
    """
    user_id = current_user["id"]
    
    # Base query - get posts that are either:
    # 1. Public posts from anyone OR
    # 2. Private posts from the current user
    query = db.query(Post).filter(
        or_(
            Post.is_private == False,  # Public posts
            and_(Post.is_private == True, Post.user_id == user_id)  # User's own private posts
        )
    )
    
    # Apply search filter if provided
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Post.caption.ilike(search_term),
                Post.username.ilike(search_term)
            )
        )
    
    # Order by most recent
    query = query.order_by(desc(Post.created_at))
    
    # Apply pagination
    posts = query.offset(skip).limit(limit).all()
    
    # For each post, check if private posts are from friends
    result_posts = []
    for post in posts:
        # Skip private posts that aren't from the user or their friends
        if post.is_private and post.user_id != user_id:
            # Check if the users are friends
            token = current_user.get("access_token", "")
            are_friends = await check_friendship(user_id, post.user_id, token)
            if not are_friends:
                continue
        
        # Check if the current user has liked the post
        like = db.query(Like).filter(
            Like.post_id == post.id,
            Like.user_id == user_id
        ).first()
        
        post_dict = PostWithDetails.model_validate(post)
        post_dict.user_has_liked = like is not None
        
        result_posts.append(post_dict)
    
    return result_posts

@router.get("/{post_id}", response_model=PostWithDetails)
async def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> Any:
    """
    Get a specific post by ID
    """
    user_id = current_user["id"]
    
    # Get the post
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check if user has access to view this post
    if post.is_private and post.user_id != user_id:
        # Check if users are friends
        token = current_user.get("access_token", "")
        are_friends = await check_friendship(user_id, post.user_id, token)
        if not are_friends:
            raise HTTPException(status_code=403, detail="You don't have access to this post")
    
    # Check if the current user has liked the post
    like = db.query(Like).filter(
        Like.post_id == post.id,
        Like.user_id == user_id
    ).first()
    
    post_dict = PostWithDetails.model_validate(post)
    post_dict.user_has_liked = like is not None
    
    return post_dict

@router.put("/{post_id}", response_model=PostSchema)
async def update_post(
    post_id: int,
    post_update: PostUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> Any:
    """
    Update a post (caption or privacy settings)
    """
    user_id = current_user["id"]
    
    # Get the post
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check if the user is the owner
    if post.user_id != user_id:
        raise HTTPException(status_code=403, detail="You don't have permission to update this post")
    
    # Update the post
    if post_update.caption is not None:
        post.caption = post_update.caption
    
    if post_update.is_private is not None:
        post.is_private = post_update.is_private
    
    db.commit()
    db.refresh(post)
    
    return post

@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a post
    """
    user_id = current_user["id"]
    
    # Get the post
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check if the user is the owner
    if post.user_id != user_id:
        raise HTTPException(status_code=403, detail="You don't have permission to delete this post")
    
    # Delete the image file or from Cloudinary
    try:
        # If post has a Cloudinary public ID, delete from Cloudinary
        if settings.USE_CLOUDINARY and hasattr(post, 'cloudinary_public_id') and post.cloudinary_public_id:
            await delete_image_from_cloudinary(post.cloudinary_public_id)
        # Otherwise delete local file if it exists
        elif post.image_url and not settings.USE_CLOUDINARY:
            try:
                image_path = post.image_url.replace("/uploads/", "")
                file_path = UPLOAD_DIR / image_path
                if file_path.exists():
                    os.remove(file_path)
            except Exception:
                # Continue even if file deletion fails
                pass
    except Exception as e:
        # Log the error but continue with database deletion
        print(f"Error deleting image for post {post_id}: {str(e)}")
    
    # Delete the post (cascade will delete comments and likes)
    db.delete(post)
    db.commit()