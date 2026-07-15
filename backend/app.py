from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.config import settings
from backend.database import engine, Base
from backend.api.routes import router as resume_router
from backend.services.logging_service import logger

# Initialize Database tables
try:
    logger.info("Initializing SQLite database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
except Exception as e:
    logger.critical(f"Database table initialization failed: {str(e)}")

# Create FastAPI app instance
app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for AI-Powered Resume Builder with ATS Optimization",
    version="1.0.0",
    debug=settings.DEBUG
)

# CORS Middleware configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include core resume router
app.include_router(resume_router, prefix="/api")

# ----------------- ERROR HANDLING MIDDLEWARE -----------------

@app.exception_handler(ValueError)
def value_error_handler(request: Request, exc: ValueError):
    """
    Handles input validation and parsing value errors, returning 400.
    """
    logger.warning(f"Bad Request: {request.url.path} | Error: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"status": "error", "type": "ValidationError", "message": str(exc)}
    )

@app.exception_handler(Exception)
def global_exception_handler(request: Request, exc: Exception):
    """
    Catch-all boundary for unhandled server issues.
    """
    logger.error(f"Server Error on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": "error",
            "type": "InternalServerError",
            "message": "An unexpected server error occurred. Please check logs for details."
        }
    )

# ----------------- BASE ROUTES -----------------

@app.get("/", tags=["Health"])
def health_check():
    """
    Reports API Status and service definitions.
    """
    return {
        "status": "online",
        "app": settings.APP_NAME,
        "api_documentation": "/docs",
        "provider": settings.DEFAULT_LLM_PROVIDER
    }

if __name__ == "__main__":
    import uvicorn
    # Start the server on port 8000 (binds to 0.0.0.0 for external network access)
    uvicorn.run("backend.app:app", host="0.0.0.0", port=settings.PORT, reload=settings.DEBUG)
