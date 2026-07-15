import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base Directory of the Project
BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    # App Config
    APP_NAME: str = "AI Resume Builder"
    DEBUG: bool = True
    PORT: int = 8000
    
    # DB Config (Default to sqlite in database/ directory)
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/database/resume_builder.db"
    
    # AI Config
    GEMINI_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None
    DEFAULT_LLM_PROVIDER: str = "gemini"  # "gemini", "openai", or "mock"
    DEFAULT_GEMINI_MODEL: str = "gemini-2.5-flash"
    DEFAULT_OPENAI_MODEL: str = "gpt-4o-mini"
    
    # Storage Paths
    GENERATED_DIR: str = str(BASE_DIR / "generated")
    LOG_DIR: str = str(BASE_DIR / "logs")
    
    # CORS Origins
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    model_config = SettingsConfigDict(
        env_file=f"{BASE_DIR}/.env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

# Create folders if they don't exist
os.makedirs(os.path.join(BASE_DIR, "database"), exist_ok=True)
os.makedirs(os.path.join(BASE_DIR, "generated"), exist_ok=True)
os.makedirs(os.path.join(BASE_DIR, "logs"), exist_ok=True)

settings = Settings()
