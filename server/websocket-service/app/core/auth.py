from jose import jwt, JWTError
from .config import settings

def validate_token(token: str):
    """
    Validate JWT token and extract user information
    
    Args:
        token: JWT token string
    
    Returns:
        dict: User information from the token
    
    Raises:
        Exception: If token is invalid
    """
    try:
        # Decode the JWT token
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=["HS256"]
        )
        
        # Check if the required fields are present
        if "sub" not in payload:
            raise ValueError("Invalid token payload")
            
        return payload
    except JWTError as e:
        raise Exception(f"Invalid authentication token: {str(e)}")
    except Exception as e:
        raise Exception(f"Token validation error: {str(e)}")