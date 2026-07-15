FROM python:3.11-slim

# Install system dependencies needed for ReportLab PDF or other compilations
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY backend/ ./backend/

# Create internal volumes directories
RUN mkdir -p backend/database backend/generated backend/logs

# Expose port
EXPOSE 8000

# Start server
CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000"]
