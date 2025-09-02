import io
import cv2
import base64
import numpy as np
from typing import List
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image
# backend/main.py
import os # <-- Import os
# ... (other imports)
from fastapi.middleware.cors import CORSMiddleware
# ...

app = FastAPI(...)

# --- CORS (Cross-Origin Resource Sharing) ---
# Get the frontend URL from an environment variable.
# Provide a default for local development.
CLIENT_URL = os.getenv("CORS_ORIGIN", "http://localhost:5173")

origins = [CLIENT_URL, "https://wheat-pest-and-disease-detection-frontend.onrender.com"]

# If you need to allow more origins, you can parse a comma-separated string
# E.g., CORS_ORIGINS=http://a.com,http://b.com
# cors_origins_str = os.getenv("CORS_ORIGINS")
# if cors_origins_str:
#     origins.extend(cors_origins_str.split(','))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Configuration ---
MODEL_PATH = "models/best_14.pt"
CONFIDENCE_THRESHOLD = 0.25

# --- FastAPI App Initialization ---
app = FastAPI(
    title="YOLOv8 Object Detection API",
    description="An API to perform object detection on images using a YOLOv8 model.",
    version="1.0.0",
)

# --- CORS (Cross-Origin Resource Sharing) ---
# This is crucial for allowing the React frontend to communicate with the backend.
# You can restrict the origins for production environments.
origins = [
    "http://localhost",
    "http://localhost:3000", # Default for Create React App
    "http://localhost:5173", # Default for Vite
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods (GET, POST, etc.)
    allow_headers=["*"], # Allows all headers
)


# --- Model Loading ---
try:
    model = YOLO(MODEL_PATH)
    print("YOLO model loaded successfully.")
except Exception as e:
    print(f"Error loading YOLO model: {e}")
    model = None

@app.on_event("startup")
async def startup_event():
    if model is None:
        raise RuntimeError("YOLO model could not be loaded. Please check the model path.")

# --- API Endpoints ---

@app.get("/", summary="Root Endpoint")
async def read_root():
    return {"status": "ok", "message": "Welcome to the YOLOv8 Detection API!"}


@app.post("/api/process", summary="Process multiple images and return Base64 results")
async def process_images(files: List[UploadFile] = File(...)):
    """
    Accepts multiple image files, performs object detection on each,
    and returns a list of JSON objects containing the filename and the
    processed image encoded in Base64.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files were uploaded.")

    results_list = []

    for file in files:
        if not file.content_type.startswith("image/"):
            # You might want to skip non-image files or raise an error
            print(f"Skipping non-image file: {file.filename}")
            continue

        try:
            # Read image bytes
            image_bytes = await file.read()
            
            # Convert bytes to a NumPy array for OpenCV
            nparr = np.frombuffer(image_bytes, np.uint8)
            img_np = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            # Run YOLO prediction
            results = model.predict(img_np, conf=CONFIDENCE_THRESHOLD)

            # Get the annotated image (returns a BGR NumPy array)
            annotated_image = results[0].plot()

            # Encode the image to JPEG format in memory
            _, img_encoded = cv2.imencode(".jpg", annotated_image)
            
            # Convert the encoded image to a Base64 string
            processed_image_b64 = base64.b64encode(img_encoded.tobytes()).decode('utf-8')

            # Append the result to our list
            results_list.append({
                "filename": file.filename,
                "content_type": "image/jpeg",
                "processed_image_b64": processed_image_b64,
            })

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing file {file.filename}: {str(e)}")

    if not results_list:
        raise HTTPException(status_code=400, detail="No valid image files were processed.")

    return results_list