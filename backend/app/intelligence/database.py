from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import config

# Neon Tech (and most cloud Postgres) requires SSL.
# SQLAlchemy passes connect_args to the underlying psycopg2 driver.
# The DATABASE_URL in .env already has ?sslmode=require so this is belt-and-suspenders.
engine = create_engine(
    config.DATABASE_URL,
    pool_pre_ping=True,     # checks connection health before using it from the pool
    pool_size=5,            # keep 5 connections warm (fine for a small SOC dashboard)
    max_overflow=10,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """
    FastAPI dependency that yields a SQLAlchemy session.
    Automatically closes the session after the request finishes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
