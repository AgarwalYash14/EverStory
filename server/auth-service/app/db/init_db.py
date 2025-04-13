from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.user import User

def init_db() -> None:
    # Create tables
    Base.metadata.create_all(bind=engine)

def create_first_user() -> None:
    db = SessionLocal()
    try:
        # Check if we already have users
        user = db.query(User).first()
        if not user:
            # Create first superuser
            admin_user = User(
                email=settings.FIRST_SUPERUSER_EMAIL,
                username=settings.FIRST_SUPERUSER_USERNAME,
                hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
                is_superuser=True,
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print("Created first superuser")
    except Exception as e:
        print(f"Error creating first superuser: {e}")
    finally:
        db.close()