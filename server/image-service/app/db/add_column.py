"""
Add missing cloudinary_public_id column to posts table
"""
from sqlalchemy import text
from app.db.session import engine

# Add the column
with engine.connect() as connection:
    try:
        print("Adding cloudinary_public_id column to posts table...")
        connection.execute(text("ALTER TABLE posts ADD COLUMN IF NOT EXISTS cloudinary_public_id VARCHAR;"))
        connection.commit()
        print("Column added successfully!")
    except Exception as e:
        print(f"Error adding column: {e}")

if __name__ == "__main__":
    print("Running column addition script...")