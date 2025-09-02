# backend/main.py
import os
import io
import cv2
import base64
import numpy as np
from typing import List
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image

# --- FastAPI App Initialization ---
app = FastAPI(
    title="YOLOv8 Object Detection API",
    description="An API to perform object detection on images using a YOLOv8 model.",
    version="1.0.0",
)

# --- CORS Configuration ---
origins = [
    "http://localhost",
    "http://localhost:3000",   # CRA dev server
    "http://localhost:5173",   # Vite dev server
    "http://127.0.0.1:5173",
    "https://wheat-pest-and-disease-detection-frontend.onrender.com",  # 🚀 Production frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Model Configuration ---
MODEL_PATH = "models/best_14.pt"
CONFIDENCE_THRESHOLD = 0.25

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

# --- Endpoints ---
@app.get("/", summary="Root Endpoint")
async def read_root():
    return {"status": "ok", "message": "Welcome to the YOLOv8 Detection API!"}

@app.post("/api/process", summary="Process multiple images and return Base64 results")
async def process_images(files: List[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files were uploaded.")

    results_list = []
    for file in files:
        if not file.content_type.startswith("image/"):
            continue

        try:
            # Read image
            image_bytes = await file.read()
            nparr = np.frombuffer(image_bytes, np.uint8)
            img_np = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            # Run YOLO
            results = model.predict(img_np, conf=CONFIDENCE_THRESHOLD)
            annotated_image = results[0].plot()

            # Encode to Base64
            _, img_encoded = cv2.imencode(".jpg", annotated_image)
            processed_image_b64 = base64.b64encode(img_encoded.tobytes()).decode('utf-8')

            results_list.append({
                "filename": file.filename,
                "content_type": "image/jpeg",
                "processed_image_b64": processed_image_b64,
            })
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing {file.filename}: {str(e)}")

    if not results_list:
        raise HTTPException(status_code=400, detail="No valid image files were processed.")

    return results_list
