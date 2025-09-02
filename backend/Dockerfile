# backend/Dockerfile

# Use an official Python runtime as a parent image
FROM python:3.10-slim

# --- ADD THIS SECTION ---
# Install system dependencies required by OpenCV
RUN apt-get update && apt-get install -y \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*
# libgl1-mesa-glx provides libGL.so.1
# libglib2.0-0 is another common dependency for OpenCV
# -------------------------

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

# Command to run the application using the shell form to expand ${PORT}
CMD gunicorn -w 2 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:${PORT}