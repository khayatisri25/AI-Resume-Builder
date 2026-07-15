from datetime import datetime
import json
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Float, DateTime
from sqlalchemy.orm import relationship
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True) # Nullable for simple passwordless / anonymous sessions
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Nullable to allow anonymous creation
    title = Column(String, default="Untitled Resume")
    template_name = Column(String, default="modern")
    
    # Store raw and enhanced data as JSON string in TEXT columns
    raw_data = Column(Text, nullable=False) # JSON encoded
    enhanced_data = Column(Text, nullable=True) # JSON encoded after AI optimization
    
    ats_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="resumes")
    ats_reports = relationship("ATSReport", back_populates="resume", cascade="all, delete-orphan")


class ATSReport(Base):
    __tablename__ = "ats_reports"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=False)
    score = Column(Float, nullable=False)
    
    # Detailed report data (suggestions, missing keywords, etc.) as JSON string
    feedback_data = Column(Text, nullable=False) # JSON encoded
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    resume = relationship("Resume", back_populates="ats_reports")


class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    stylesheet_config = Column(Text, nullable=False) # JSON configurations (font size, margin, colors)
    created_at = Column(DateTime, default=datetime.utcnow)
