from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import asyncio
import json
import cv2
from datetime import datetime
from typing import List, Dict
import time
import uvicorn
from fastapi.responses import StreamingResponse
import io

from mock_detector import MockDetector, ThreatLevel
from model_manager import get_model_manager, ModelType
from mock_fusion import MockFusionEngine
from prediction_engine import ThreatPredictor

# Try to import Vision Engine
try:
    from vision_engine import VisionEngine
    VISION_AVAILABLE = True
except ImportError:
    VisionEngine = None
    VISION_AVAILABLE = False
    print("⚠️  Vision Engine not available - using mock detector")
    print("💡 Install: pip install ultralytics opencv-python")

app = FastAPI(
    title="Autonomous Shield AI Service",
    description="Real-time AI threat detection system (v3.0 Defense Grade)",
    version="3.0.0"
)

# CORS configuration for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
from fastapi.staticfiles import StaticFiles

# ==============================================================================
# CONFIGURATION
# ==============================================================================
# Use 0 for webcam, or HTTP URL for IP Camera
# Defaults to 0 (Webcam) if not set
env_source = os.getenv("VIDEO_SOURCE", "0")
try:
    # Convert to int if it's a number (for webcam index)
    VIDEO_SOURCE = int(env_source)
except ValueError:
    VIDEO_SOURCE = env_source
# Fallback for some systems if needed, but prioritizing env var
if VIDEO_SOURCE == "0": VIDEO_SOURCE = 0

# Global instances
detector = MockDetector(frame_width=1280, frame_height=720)
fusion_engine = MockFusionEngine()
predictor = ThreatPredictor()
vision_engine = None
using_real_vision = False
model_manager = None  # Will be initialized on startup

print(f"🔧 CONFIG: VISION_AVAILABLE={VISION_AVAILABLE}", flush=True)
print(f"🔧 CONFIG: VIDEO_SOURCE={VIDEO_SOURCE}", flush=True)

if VISION_AVAILABLE:
    try:
        print("🚀 Initializing Vision Engine...", flush=True)
        vision_engine = VisionEngine(source=VIDEO_SOURCE)
        vision_engine.start()
        using_real_vision = True
        print("✅ Vision Engine Started", flush=True)
    except Exception as e:
         print(f"❌ Failed to start Vision Engine: {e}", flush=True)
         using_real_vision = False

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"✅ Client connected. Total: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        print(f"❌ Client disconnected. Total: {len(self.active_connections)}")
    
    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error broadcasting: {e}")

manager = ConnectionManager()

async def persist_alert(detection: dict, alert_data: dict):
    """Save critical alert to database"""
    try:
        from database import AsyncSessionLocal, Event, Alert
        async with AsyncSessionLocal() as db:
            # Create Event Record
            event = Event(
                timestamp=datetime.fromisoformat(detection["timestamp"]),
                frame_id=detection["frame_id"],
                source="camera_main",
                object_class=detection["class"],
                confidence=detection["confidence"],
                bbox=detection["bbox"],
                threat_level=detection["threat_level"]
            )
            db.add(event)
            await db.flush() # Get ID
            
            # Create Alert Record
            alert = Alert(
                title=alert_data["title"],
                description=alert_data["description"],
                severity="critical",
                event_id=event.id
            )
            db.add(alert)
            await db.commit()
            # print(f"💾 Alert Persisted: {alert.title}")
    except Exception as e:
        print(f"❌ DB Error: {e}")

@app.get("/")
async def root():
    return {
        "service": "Autonomous Shield AI",
        "status": "operational",
        "version": "3.0.0",
        "engine": "YOLOv8-Threaded",
        "timestamp": datetime.utcnow().isoformat()
    }

from database import init_db, get_db, Event, Alert, SystemLog
from sqlalchemy import select

@app.on_event("startup")
async def startup():
    # Initialize Database
    await init_db()
    print("Database Initialized")

    global vision_engine, using_real_vision, model_manager
    
    # Initialize Model Manager
    print("\n🤖 Initializing AI Model Manager...")
    model_manager = get_model_manager()
    
    # Try to load YOLO26 first, fallback to MOCK
    if model_manager.load_model(ModelType.YOLO26):
        model_manager.set_active_model(ModelType.YOLO26)
        print("✅ YOLO26 Model Loaded and Active")
    else:
        print("⚠️  YOLO26 unavailable, using MOCK detector")
        model_manager.load_model(ModelType.MOCK)
        model_manager.set_active_model(ModelType.MOCK)
    
    if VIDEO_SOURCE is not None and VISION_AVAILABLE:
        print(f"\n👁️  Initializing Vision Engine: {VIDEO_SOURCE}")
        try:
            vision_engine = VisionEngine(source=VIDEO_SOURCE)
            vision_engine.start()
            using_real_vision = True
            print("✅ Vision Engine Started")
        except Exception as e:
            print(f"⚠️  Vision Engine Failed: {e}")
            vision_engine = None
    else:
        print("\n⚠️  Using simulated video stream")
    
    active_model = model_manager.active_model.value if model_manager.active_model else "None"
    mode = f"{active_model.upper()}" + (" + Real Video" if using_real_vision else " + Simulated Video")
    print(f"\n🛡️  AUTONOMOUS SHIELD - {mode}")
    print("="*60)

@app.on_event("shutdown")
async def shutdown():
    if vision_engine:
        vision_engine.stop()
        print("🛑 Vision Engine Stopped")


@app.get("/api/ai/status")
async def get_model_status():
    """Get AI model status and statistics"""
    if not model_manager:
        return {"error": "Model manager not initialized"}
    
    model_status = model_manager.get_model_status()
    active_model = model_manager.active_model
    
    stats = {}
    if vision_engine:
         stats = vision_engine.analyze()["stats"]

    return {
        "model": {
            "name": active_model.value.upper() if active_model else "None",
            "mode": active_model.value if active_model else "unknown",
            "status": model_status["models"][active_model.value]["status"] if active_model else "unloaded",
            "confidence_threshold": 0.50,
            "input_resolution": stats.get('res', '1280x720'),
            "inference_time": "~15ms",
            "edge_optimized": True,
            "video_source": str(VIDEO_SOURCE) if VIDEO_SOURCE else "None",
            "using_real_video": using_real_vision
        },
        "statistics": {
            "uptime": "operational",
            "fps": stats.get('fps', 0),
            "status": stats.get('status', 'unknown')
        },
        "available_models": model_manager.get_available_models(),
        "all_models": model_status,
        "classes": ["human", "vehicle", "weapon"],
        "threat_levels": ["normal", "suspicious", "critical"]
    }


@app.post("/api/ai/detect")
async def detect_frame():
    """
    Perform object detection on a single frame
    In production, this would accept image data
    """
    detections = detector.detect_frame()
    
    # Count threats by level
    threat_summary = {
        "total": len(detections),
        "critical": sum(1 for d in detections if d["threat_level"] == "critical"),
        "suspicious": sum(1 for d in detections if d["threat_level"] == "suspicious"),
        "normal": sum(1 for d in detections if d["threat_level"] == "normal")
    }
    
    # Generate alerts for critical threats
    alerts = []
    for det in detections:
        if det["threat_level"] == "critical":
            alert = detector.generate_threat_alert(det)
            if alert:
                alerts.append(alert)
    
    return {
        "success": True,
        "detections": detections,
        "summary": threat_summary,
        "alerts": alerts,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/api/ai/models")
async def get_available_models():
    """Get list of all available AI models and their status"""
    if not model_manager:
        return {"error": "Model manager not initialized"}
    
    return model_manager.get_model_status()


@app.post("/api/ai/models/select")
async def select_model(model_type: str):
    """
    Switch to a different AI model
    
    Args:
        model_type: Model to switch to (yolo26, rfdetr, sam2, rtmdet, mock)
    """
    if not model_manager:
        raise HTTPException(status_code=503, detail="Model manager not initialized")
    
    try:
        model_enum = ModelType(model_type.lower())
    except ValueError:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid model type. Available: {[m.value for m in ModelType]}"
        )
    
    success = model_manager.set_active_model(model_enum)
    
    if success:
        return {
            "success": True,
            "active_model": model_type,
            "message": f"Switched to {model_type} model"
        }
    else:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load {model_type} model"
        )


@app.get("/api/ai/models/{model_type}/info")
async def get_model_info(model_type: str):
    """Get detailed information about a specific model"""
    if not model_manager:
        raise HTTPException(status_code=503, detail="Model manager not initialized")
    
    try:
        model_enum = ModelType(model_type.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid model type")
    
    if model_enum not in model_manager.models:
        raise HTTPException(status_code=404, detail=f"Model {model_type} not loaded")
    
    model = model_manager.models[model_enum]
    
    # Get model-specific info if available
    if hasattr(model, 'get_model_info'):
        return model.get_model_info()
    else:
        return {
            "name": model_type,
            "status": model_manager.model_status[model_enum].value,
            "performance": model_manager.performance_stats[model_enum]
        }


# MJPEG Streaming Generator
def generate_frames():
    while True:
        if vision_engine and vision_engine.camera:
            frame = vision_engine.camera.get_frame()
            if frame is not None:
                # Compress to JPEG
                _, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 70])
                frame_bytes = buffer.tobytes()
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            else:
                # If no frame, sleep briefly
                time.sleep(0.1)
        else:
            time.sleep(0.5)

@app.get("/api/ai/video_feed")
def video_feed():
    """Stream real-time video via MJPEG"""
    if not VISION_AVAILABLE or not vision_engine:
         return JSONResponse(status_code=503, content={"error": "Vision engine not available"})
    
    return StreamingResponse(generate_frames(), media_type="multipart/x-mixed-replace; boundary=frame")

# ==============================================================================
# SUSPECT MANAGEMENT API
# ==============================================================================
import os
import shutil
from fastapi import UploadFile, File

KNOWN_FACES_DIR = "assets/known_faces"
os.makedirs(KNOWN_FACES_DIR, exist_ok=True)

# Mount static files to serve images
app.mount("/api/suspects/image", StaticFiles(directory=KNOWN_FACES_DIR), name="suspects")

@app.get("/api/suspects")
def list_suspects():
    """List all registered suspects"""
    files = []
    if os.path.exists(KNOWN_FACES_DIR):
        for f in os.listdir(KNOWN_FACES_DIR):
            if f.endswith(('.jpg', '.jpeg', '.png')):
                files.append(f)
    return {"suspects": files}

@app.post("/api/suspects")
async def upload_suspect(file: UploadFile = File(...)):
    """Upload a new suspect image"""
    file_path = os.path.join(KNOWN_FACES_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Trigger reload if vision engine is active
    if vision_engine and vision_engine.face_recognizer:
        vision_engine.face_recognizer.reload()
        
    return {"status": "uploaded", "filename": file.filename}

@app.delete("/api/suspects/{filename}")
def delete_suspect(filename: str):
    """Delete a suspect"""
    file_path = os.path.join(KNOWN_FACES_DIR, filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        
        # Trigger reload
        if vision_engine and vision_engine.face_recognizer:
            vision_engine.face_recognizer.reload()
            
        return {"status": "deleted", "filename": filename}
    return JSONResponse(status_code=404, content={"error": "File not found"})

# WebSocket for real-time AI metadata
@app.websocket("/api/ai/stream")
async def websocket_stream(websocket: WebSocket):
    """
    WebSocket endpoint for continuous detection stream
    Simulates real-time YOLOv8 inference at 20 FPS
    """
    await manager.connect(websocket)
    
    try:
        # Send initial connection message
        await websocket.send_json({
            "type": "connection",
            "status": "connected",
            "message": "Autonomous Shield AI Stream Active",
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Continuous detection loop
        frame_count = 0
        while True:
            # Throttle to ~30 FPS (0.033s)
            await asyncio.sleep(0.033)
            
            # Perform detection (real or mock)
            if using_real_vision and vision_engine:
                 analysis = vision_engine.analyze()
                 detections = analysis["detections"]
                 current_frame_id = frame_count
            else:
                # Use Model Manager for detection
                detections = model_manager.detect() if model_manager else []
                current_frame_id = frame_count

            # Send frame analysis
            frame_data = {
                "type": "frame_analysis",
                "frame_id": current_frame_id,
                "detections": detections,
                "mode": "real" if using_real_vision else "mock",
                "timestamp": datetime.now().isoformat(),
                "fusion": fusion_engine.update(),
                "predictions": predictor.predict_risks() if frame_count % 300 == 0 else None # Update predictions every ~10s
            }
            
            await websocket.send_json(frame_data)
            
            # Generate and send alerts for critical threats
            for det in detections:
                if det["threat_level"] == "critical":
                    alert_data = detector.generate_threat_alert(det)
                    if alert_data:
                         # Broadcast
                         await manager.broadcast({
                             "type": "critical_alert",
                             "alert": alert_data
                         })
                         
                         # Persist to DB (Fire and Forget task)
                         asyncio.create_task(persist_alert(det, alert_data))
            
            frame_count += 1
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print(f"🔌 WebSocket disconnected normally")
    except Exception as e:
        print(f"❌ WebSocket error: {e}")
        import traceback
        traceback.print_exc()
        manager.disconnect(websocket)


@app.get("/api/ai/statistics")
async def get_statistics():
    """Get real-time detection statistics"""
    return {
        "detections": {
            "total": detector.detection_count,
            "rate": "20 FPS",
            "confidence_threshold": "60%"
        },
        "performance": {
            "inference_time": "~15ms",
            "latency": "<100ms",
            "edge_device": "Simulated Jetson Nano"
        },
        "alert_stats": {
            "critical_alerts": "Real-time",
            "response_time": "<2 seconds",
            "false_positive_rate": "<5%"
        }
    }


if __name__ == "__main__":
    print("\n" + "="*60)
    print("  AUTONOMOUS SHIELD AI SERVICE")
    print("="*60)
    print("  Starting FastAPI server...")
    print("  WebSocket: ws://localhost:8000/api/ai/stream")
    print("  REST API:  http://localhost:8000/api/ai/detect")
    print("  Status:    http://localhost:8000/api/ai/status")
    print("="*60 + "\n")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
