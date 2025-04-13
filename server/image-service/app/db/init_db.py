from app.db.session import Base, engine

def init_db() -> None:
    """Initialize database - create tables if they don't exist"""
    Base.metadata.create_all(bind=engine)