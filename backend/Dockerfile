# backend/Dockerfile

# Use an official Python runtime as a parent image
FROM python:3.10-slim

# --- System dependencies required by OpenCV ---
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \    # fixes libgthread-2.0.so.0 missing error
    libgl1 \          # provides libGL.so.1 for cv2.imshow etc.
    libsm6 \          # session management lib (needed by OpenCV highgui)
    libxext6 \        # X11 extensions (for OpenCV)
    libxrender1 \     # rendering support
    && rm -rf /var/lib/apt/lists/*
# ------------------------------------------------

# Set the working directory in the container
WORKDIR /app

# Set environment variables for Python
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Command to run the application
CMD gunicorn -w 2 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:${PORT}
