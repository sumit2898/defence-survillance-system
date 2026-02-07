"""
Database Layer - Autonomous Shield
Supports PostgreSQL (Production) and SQLite (Dev/Fallback)
Async SQLAlchemy Implementation
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, JSON, Boolean, Text
from datetime import datetime
import os

# Configuration
# Usage: set DATABASE_URL=postgresql+asyncpg://user:pass@localhost/dbname
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./autonomous_shield.db")

# Engine
engine = create_async_engine(
    DATABASE_URL, 
    echo=False,
    future=True
)

# Session Factory
AsyncSessionLocal = sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

Base = declarative_base()

# ==============================================================================
# MODELS
# ==============================================================================

class Event(Base):
    """Raw detection events from the Vision Engine"""
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    frame_id = Column(Integer)
    source = Column(String)  # Camera ID or URL
    
    # Detection Data
    object_class = Column(String, index=True) # person, vehicle, weapon
    confidence = Column(Float)
    bbox = Column(JSON) # {x, y, w, h}
    
    # Metadata
    threat_level = Column(String, index=True) # normal, suspicious, critical
    snapshot_path = Column(String, nullable=True) # Path to saved image

class Alert(Base):
    """High-level alerts generated from critical events"""
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    title = Column(String)
    description = Column(Text)
    severity = Column(String) # critical, warning, info
    status = Column(String, default="active") # active, acknowledged, resolved
    
    # Link to event
    event_id = Column(Integer, ForeignKey("events.id"), nullable=True)
    
class Device(Base):
    """Hardware inventory (Cameras, Drones, Sensors)"""
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    type = Column(String) # camera, drone, sensor
    status = Column(String, default="offline")
    ip_address = Column(String, nullable=True)
    config = Column(JSON, default={})
    last_seen = Column(DateTime, default=datetime.utcnow)

class SystemLog(Base):
    """Audit trail for system actions"""
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    level = Column(String) # INFO, WARN, ERROR
    module = Column(String)
    message = Column(Text)
    meta = Column(JSON, nullable=True)

# ==============================================================================
# UTILITIES
# ==============================================================================

async def init_db():
    """Initialize database tables"""
    async with engine.begin() as conn:
        # In production, use Alembic for migrations
        # For this setup, we auto-create
        await conn.run_sync(Base.metadata.create_all)

async def get_db():
    """Dependency for FastAPI"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
