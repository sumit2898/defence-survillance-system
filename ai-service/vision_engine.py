"""
Vision Engine - Defense Grade
Non-blocking threaded camera capture and YOLOv8 inference.
Ensures UI never stutters due to camera lag.
"""

import cv2
import threading
import time
import queue
from typing import Optional, List, Dict, Union
from datetime import datetime
import numpy as np
import urllib.request

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False

class ThreadedCamera:
    """
    Background thread for capturing frames.
    Always holds the latest frame in memory.
    """
    def __init__(self, source: Union[int, str]):
        self.source = source
        self.cap = None
        self.lock = threading.Lock()
        self.running = False
        self.latest_frame = None
        self.status = "stopped"
        self.fps = 0
        self.frame_count = 0
        self.thread = None
        self.resolution = (0, 0)
        
        # Snapshot mode support
        self.is_snapshot = isinstance(source, str) and (source.startswith("http") or source.endswith(".jpg"))

    def start(self):
        if self.running: return
        self.running = True
        self.thread = threading.Thread(target=self._update, daemon=True)
        self.thread.start()
        self.status = "starting"

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join(timeout=1.0)
        if self.cap:
            self.cap.release()
        self.status = "stopped"

    def _update(self):
        print(f"📷 Camera Thread Started: {self.source}")
        
        if not self.is_snapshot:
            self.cap = cv2.VideoCapture(self.source)
            if not self.cap.isOpened():
                self.status = "error"
                print(f"❌ Failed to open camera: {self.source}")
                self.running = False
                return
            
            self.resolution = (
                int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
                int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            )
        
        self.status = "active"
        last_time = time.time()
        frames_this_sec = 0

        while self.running:
            try:
                if self.is_snapshot:
                    # Polling Mode
                    try:
                        with urllib.request.urlopen(self.source, timeout=2) as stream:
                            arr = np.frombuffer(stream.read(), np.uint8)
                            frame = cv2.imdecode(arr, -1)
                            if frame is not None:
                                with self.lock:
                                    self.latest_frame = frame
                                    self.resolution = (frame.shape[1], frame.shape[0])
                    except Exception as e:
                        # print(f"Snapshot error: {e}")
                        time.sleep(0.5)
                    
                    time.sleep(0.1) # Limit poll rate
                else:
                    # Streaming Mode
                    ret, frame = self.cap.read()
                    if ret:
                        with self.lock:
                            self.latest_frame = frame
                    else:
                        print("⚠️ Camera stream lost, retrying...")
                        self.cap.release()
                        time.sleep(1)
                        self.cap = cv2.VideoCapture(self.source)
                
                # FPS Counter
                self.frame_count += 1
                frames_this_sec += 1
                if time.time() - last_time >= 1.0:
                    self.fps = frames_this_sec
                    frames_this_sec = 0
                    last_time = time.time()
                
            except Exception as e:
                print(f"Camera Loop Error: {e}")
                time.sleep(1)

        print("📷 Camera Thread Stopped")

    def get_frame(self) -> Optional[np.ndarray]:
        with self.lock:
            if self.latest_frame is not None:
                return self.latest_frame.copy()
            return None

class VisionEngine:
    """
    Main Intelligence Engine.
    Manages Camera Thread and YOLO Inference.
    """
    def __init__(self, source: Union[int, str] = 0):
        self.camera = ThreadedCamera(source)
        self.model = None
        self.is_ready = False
        
        if YOLO_AVAILABLE:
            print("🧠 Loading YOLOv8...")
            try:
                self.model = YOLO('yolov8n.pt')
                self.is_ready = True
                print("✅ YOLOv8 Ready")
            except Exception as e:
                print(f"❌ YOLO Load Failed: {e}")
        else:
            print("❌ YOLO module not found")

    def start(self):
        self.camera.start()

    def stop(self):
        self.camera.stop()

    def analyze(self) -> Dict:
        """
        Get latest frame and run inference.
        Returns: {
            "frame": np.array (or None),
            "detections": List[Dict],
            "metadata": Dict
        }
        """
        frame = self.camera.get_frame()
        detections = []
        
        if frame is not None and self.is_ready and self.model:
            try:
                # Run Inference (Sync for now, can be threaded if needed)
                results = self.model(frame, conf=0.5, verbose=False, max_det=20)[0]
                
                for idx, box in enumerate(results.boxes):
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    conf = float(box.conf[0])
                    cls_id = int(box.cls[0])
                    label = results.names[cls_id]
                    
                    detections.append({
                        "id": f"{self.camera.frame_count}_{idx}",
                        "class": label,
                        "confidence": round(conf, 2),
                        "bbox": [int(x1), int(y1), int(x2), int(y2)],
                        "threat_level": self._classify(label, conf)
                    })
            except Exception as e:
                print(f"Inference Error: {e}")

        return {
            "frame": frame,
            "detections": detections,
            "stats": {
                "fps": self.camera.fps,
                "status": self.camera.status,
                "res": f"{self.camera.resolution[0]}x{self.camera.resolution[1]}"
            }
        }

    def _classify(self, label: str, conf: float) -> str:
        critical = ['gun', 'knife', 'plliers', 'scissors']
        suspicious = ['person', 'backpack']
        
        if any(x in label.lower() for x in critical): return "critical"
        if label.lower() in suspicious and conf > 0.8: return "suspicious"
        return "normal"
