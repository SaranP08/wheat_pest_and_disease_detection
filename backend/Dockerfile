# backend/Dockerfile
FROM python:3.10-slim

WORKDIR /app

# Set environment variables for Python
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# The PORT environment variable is automatically provided by Render.
# Gunicorn will run Uvicorn workers and bind to the correct port.
CMD ["gunicorn", "-w", "2", "-k", "uvicorn.workers.UvicornWorker", "main:app", "--bind", "0.0.0.0:${PORT}"]