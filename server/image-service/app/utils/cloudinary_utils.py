import os
import cloudinary
import cloudinary.uploader
import cloudinary.api
from PIL import Image
import io
import time
from typing import Dict, Any, Optional
from fastapi import UploadFile

from app.core.config import settings

# Configure Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True
)

async def upload_image_to_cloudinary(
    image: UploadFile, 
    folder: str = "social_posts",
    public_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Upload an image to Cloudinary with optimizations
    
    Args:
        image: The image file to upload
        folder: The folder to upload to in Cloudinary
        public_id: Optional custom public ID for the image
        
    Returns:
        The Cloudinary upload response containing URL and other metadata
    """
    if not settings.USE_CLOUDINARY:
        raise ValueError("Cloudinary is not configured or disabled")
    
    # Read the file into memory
    contents = await image.read()
    
    # Prepare upload options
    options = {
        "folder": folder,
        "resource_type": "image",
        "use_filename": True,
        "unique_filename": True,
        "overwrite": True,
        "quality": "auto",
        "fetch_format": "auto",
        "responsive_breakpoints": {
            "create_derived": True,
            "bytes_step": 20000,
            "min_width": 200,
            "max_width": 1000,
            "max_images": 5
        },
        "progressive": True,
        "eager": [
            {"width": 200, "height": 200, "crop": "fill"},
            {"width": 600, "crop": "scale"},
            {"width": 1200, "crop": "limit", "quality": "auto:good"}
        ]
    }
    
    # Add public_id if provided
    if public_id:
        options["public_id"] = public_id
    
    try:
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(contents, **options)
        return result
    except Exception as e:
        print(f"Error uploading to Cloudinary: {str(e)}")
        return None

async def delete_image_from_cloudinary(public_id: str) -> Dict[str, Any]:
    """
    Delete an image from Cloudinary by its public ID
    
    Args:
        public_id: The public ID of the image to delete
        
    Returns:
        The Cloudinary deletion response
    """
    if not settings.USE_CLOUDINARY:
        raise ValueError("Cloudinary is not configured or disabled")
    
    # Delete from Cloudinary
    result = cloudinary.uploader.destroy(public_id)
    
    return result

def optimize_image_locally(file_content, max_width=1920, quality=85):
    """
    Optimize an image locally using PIL (fallback if Cloudinary is not used)
    
    Args:
        file_content: The binary content of the file
        max_width: Maximum width to resize to
        quality: JPEG compression quality (1-100)
    
    Returns:
        bytes: Optimized image content
    """
    try:
        # Open image from binary content
        img = Image.open(io.BytesIO(file_content))
        
        # Convert to RGB if image has alpha channel (transparency)
        if img.mode in ('RGBA', 'LA'):
            # Create a white background
            background = Image.new("RGB", img.size, (255, 255, 255))
            # Paste the image using the alpha channel as mask
            if img.mode == 'RGBA':
                background.paste(img, mask=img.split()[3])
            else:
                background.paste(img, mask=img.split()[1])
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Calculate new dimensions maintaining aspect ratio if needed
        if img.width > max_width:
            ratio = max_width / float(img.width)
            height = int(float(img.height) * ratio)
            img = img.resize((max_width, height), Image.LANCZOS)
        
        # Save optimized image to bytes buffer
        output = io.BytesIO()
        
        # Use progressive JPEG for better loading experience
        img.save(output, format='JPEG', quality=quality, optimize=True, progressive=True)
        output.seek(0)
        
        return output.getvalue()
    except Exception as e:
        print(f"Error optimizing image: {str(e)}")
        return file_content  # Return original if optimization fails

def save_image_locally(file_content, filename, upload_dir=settings.UPLOAD_DIR):
    """
    Save an uploaded image to local storage with optimization
    
    Args:
        file_content: The binary content of the file
        filename: The name to save the file as
        upload_dir: Directory to save the image in
    
    Returns:
        str: Path to the saved image
    """
    # Ensure upload directory exists
    os.makedirs(upload_dir, exist_ok=True)
    
    # Add timestamp to filename to avoid collisions
    name, ext = os.path.splitext(filename)
    timestamped_filename = f"{name}_{int(time.time())}{ext}"
    
    # Create full path
    file_path = os.path.join(upload_dir, timestamped_filename)
    
    # Optimize the image before saving
    optimized_content = optimize_image_locally(file_content)
    
    # Save the file
    with open(file_path, "wb") as f:
        f.write(optimized_content)
    
    # Return the relative path from the upload directory
    return os.path.join(upload_dir, timestamped_filename)

def get_image_dimensions(file_content):
    """
    Get image dimensions
    
    Args:
        file_content: The binary content of the file
    
    Returns:
        tuple: (width, height)
    """
    try:
        img = Image.open(io.BytesIO(file_content))
        return img.size
    except Exception:
        return (0, 0)  # Return default if fails