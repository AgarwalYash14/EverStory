"""
Script to add the missing cloudinary_public_id column to the posts table.
Run this script once to update the database schema.
"""
from sqlalchemy import Column, String, text
from sqlalchemy.exc import ProgrammingError
import sqlalchemy
from app.db.session import engine, SessionLocal

def add_cloudinary_column():
    """Add cloudinary_public_id column to posts table if it doesn't exist"""
    print("Checking if cloudinary_public_id column exists...")
    
    # Check if connection is valid
    try:
        connection = engine.connect()
        connection.close()
    except Exception as e:
        print(f"Database connection error: {e}")
        return
        
    # Use a transaction for safer execution
    with engine.begin() as connection:
        try:
            # Try to add the column in a way that won't fail if it exists
            connection.execute(text(
                """
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (
                        SELECT 1 
                        FROM information_schema.columns 
                        WHERE table_name='posts' AND column_name='cloudinary_public_id'
                    ) THEN 
                        ALTER TABLE posts ADD COLUMN cloudinary_public_id VARCHAR; 
                    END IF; 
                END $$;
                """
            ))
            print("Column cloudinary_public_id checked/added successfully!")
        except Exception as e:
            print(f"Error during migration: {e}")


if __name__ == "__main__":
    add_cloudinary_column()