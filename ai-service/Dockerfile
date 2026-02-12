FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for OpenCV and others
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Environment variables (Defaults, can be overridden by compose)
ENV DB_HOST=localhost
ENV DB_PORT=5432
ENV DB_NAME=autonomous_shield
ENV DB_USER=postgres
ENV DB_PASS=postgres

# Run FastAPI production server
CMD ["python", "main.py"]
