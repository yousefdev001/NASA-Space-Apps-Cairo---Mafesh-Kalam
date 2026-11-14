"""Database connection and session factory for AuraMed structured persistence.

Supports MySQL 9.4 with transparent fail-safe fallback to local persistent SQLite
when operating in isolated offline or containerless development environments.
"""

import os
from pathlib import Path
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from infrastructure.database.models import Base

# Default database connection parameters
MYSQL_HOST = os.getenv("MYSQL_HOST", "127.0.0.1")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "auramed_db")
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")

DATABASE_URL = os.getenv("DATABASE_URL")


def get_default_sqlite_url() -> str:
    """Generate path-safe SQLite database URL for offline persistent fallback."""
    data_dir = Path("data")
    data_dir.mkdir(parents=True, exist_ok=True)
    db_path = (data_dir / "auramed_audit.db").resolve()
    return f"sqlite:///{db_path}"


def initialize_engine() -> Engine:
    """Initialize database engine prioritizing MySQL 9.4 with fail-safe local SQLite fallback."""
    if DATABASE_URL:
        target_url = DATABASE_URL
    elif MYSQL_PASSWORD:
        target_url = (
            f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}?charset=utf8mb4"
        )
    else:
        # If no password provided, probe MySQL root with empty password, otherwise default to local SQLite
        target_url = (
            f"mysql+pymysql://{MYSQL_USER}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}?charset=utf8mb4"
        )

    # Attempt connection with target engine
    try:
        engine = create_engine(
            target_url,
            pool_pre_ping=True,
            connect_args={"connect_timeout": 2} if "mysql" in target_url else {},
        )
        # Probe connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        # Ensure tables exist
        Base.metadata.create_all(bind=engine)
        return engine
    except Exception:
        # Fallback to local offline SQLite
        fallback_url = get_default_sqlite_url()
        engine = create_engine(
            fallback_url,
            connect_args={"check_same_thread": False},
        )
        Base.metadata.create_all(bind=engine)
        return engine


# Global engine and sessionmaker
engine: Engine = initialize_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding a managed database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
