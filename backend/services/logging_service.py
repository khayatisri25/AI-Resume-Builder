import logging
import os
import time
from functools import wraps
from backend.config import settings

# Configure logging
log_file_path = os.path.join(settings.LOG_DIR, "app.log")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler(log_file_path),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("ResumeBuilder")

def log_execution_time(name: str):
    """
    Decorator to log execution time of methods, especially LLM calls.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            logger.info(f"Starting execution of: {name}")
            try:
                result = func(*args, **kwargs)
                elapsed = time.time() - start_time
                logger.info(f"Completed execution of: {name} | Time: {elapsed:.2f}s")
                return result
            except Exception as e:
                elapsed = time.time() - start_time
                logger.error(f"Failed execution of: {name} | Time: {elapsed:.2f}s | Error: {str(e)}")
                raise e
        return wrapper
    return decorator

def log_async_execution_time(name: str):
    """
    Async decorator to log execution time.
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            logger.info(f"Starting async execution of: {name}")
            try:
                result = await func(*args, **kwargs)
                elapsed = time.time() - start_time
                logger.info(f"Completed async execution of: {name} | Time: {elapsed:.2f}s")
                return result
            except Exception as e:
                elapsed = time.time() - start_time
                logger.error(f"Failed async execution of: {name} | Time: {elapsed:.2f}s | Error: {str(e)}")
                raise e
        return wrapper
    return decorator
