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
        # Store the original source for reference
        self.source = source
        
        # Check if source is an integer string (e.g., "0")
        processed_src = source
        if isinstance(processed_src, str) and processed_src.isdigit():
            processed_src = int(processed_src)
            
        print(f"📷 Initializing Camera Source: {processed_src}")
        
        # Win32 backend is more stable for IP cameras on Windows
        if isinstance(processed_src, str) and processed_src.startswith("http"):
             self.cap = cv2.VideoCapture(processed_src)
        else:
             # Use DirectShow for local cameras on Windows, if available
             self.cap = cv2.VideoCapture(processed_src, cv2.CAP_DSHOW) 
             
        # Initialization check
        if not self.cap.isOpened():
            print(f"❌ FAILED to open camera source: {processed_src}")
            # The thread will handle the error state, no need to set self.status here
        else:
            print(f"✅ Camera opened successfully: {processed_src}")
            
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
            # Try to force MAX resolution (4K) to get camera's best
            try:
                self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 3840)
                self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 2160)
                self.cap.set(cv2.CAP_PROP_FPS, 30)
            except Exception:
                print("⚠️ Could not set camera resolution/FPS, using default.")
            
            if not self.cap.isOpened():
                self.status = "error"
                print(f"❌ Failed to open camera: {self.source}")
                self.running = False
                return
            
            self.resolution = (
                int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
                int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            )
            print(f"📷 Camera Resolution: {self.resolution[0]}x{self.resolution[1]}")
        
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
                        # Mirror effect
                        frame = cv2.flip(frame, 1)
                        # Ensure memory layout is compatible with YOLO/OpenCV
                        frame = np.ascontiguousarray(frame)
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

        # Initialize Facial Recognition
        self.face_recognizer = FaceRecognizer()
        
        
        # Initialize ALPR
        self.alpr = ALPRSystem()
        
        # Behavior Analytics State
        self.track_history = {} # {track_id: start_timestamp}
        
        # Optimization Cache
        self.result_cache = {} # {track_id: {'name': str, 'plate': str, 'last_update': timestamp}}

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
                # Run Tracking (instead of just detection)
                results = self.model.track(frame, conf=0.5, persist=True, verbose=False, max_det=20)[0]
                
                if results and results.boxes:
                    print(f"👀 Detections: {len(results.boxes)}", flush=True)
                
                # Crowd Detection
                person_count = 0
                
                if results.boxes:
                    for box in results.boxes:
                        if int(box.cls[0]) == 0: # 0 is person class in COCO
                            person_count += 1
                            
                    is_crowd = person_count >= 5
                else:
                    is_crowd = False

                for idx, box in enumerate(results.boxes):
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    conf = float(box.conf[0])
                    cls_id = int(box.cls[0])
                    label = results.names[cls_id]
                    
                    # Track ID
                    track_id = int(box.id[0]) if box.id is not None else None
                    
                    # Behavioral Analytics (Loitering)
                    is_loitering = False
                    if track_id is not None and label == 'person':
                        now = time.time()
                        if track_id not in self.track_history:
                            self.track_history[track_id] = now
                        
                        duration = now - self.track_history[track_id]
                        if duration > 10: # 10 seconds threshold for demo
                            is_loitering = True

                    # ---------------------------------------------------------
                    # OPTIMIZATION: CACHING & FRAME SKIPPING
                    # ---------------------------------------------------------
                    # Only run heavy AI (Face/OCR) if:
                    # 1. We have a track ID (so we can cache it)
                    # 2. It's a "check frame" (every 30 frames) OR we haven't identified this ID yet
                    
                    should_run_ai = False
                    cached_data = self.result_cache.get(track_id) if track_id is not None else None
                    
                    if track_id is not None:
                         # If we don't have data, run AI immediately
                         if cached_data is None:
                             should_run_ai = True
                         # If we have data, refresh it every 30 frames (approx 1 sec)
                         elif self.camera.frame_count % 30 == 0:
                             should_run_ai = True
                    else:
                        # No track ID (tracking lost or failed), run AI every 5 frames to be safe?
                        # Or just skip optimization for untracked objects
                        if self.camera.frame_count % 5 == 0:
                            should_run_ai = True

                    final_label = label
                    threat_level = self._classify(label, conf)
                    
                    # Initialize variables from cache if available
                    person_name = cached_data.get('name') if cached_data else None
                    plate_text = cached_data.get('plate') if cached_data else None

                    # Run Heavy AI if needed
                    if should_run_ai:
                        # Facial Recognition Hook
                        if label == 'person':
                             # Debug: Print status once every 60 frames to avoid spam, or just print always for now
                             # print(f"👤 Person detected. Active: {self.face_recognizer.is_active} | Conf: {conf:.2f}") 
                             
                             if self.face_recognizer.is_active and conf > 0.4: 
                                 print(f"👤 Calling Identify... (Conf: {conf:.2f})") # FORCE PRINT
                                 name = self.face_recognizer.identify(frame, [int(x1), int(y1), int(x2), int(y2)])
                                 if name != "Unknown":
                                     person_name = name
                                     print(f"🎯 FACE RECOGNIZED: {name}")  # Debug log

                        # ALPR Hook (Vehicle Recognition)
                        vehicle_classes = ['car', 'truck', 'bus', 'motorcycle']
                        if label in vehicle_classes and self.alpr.is_active:
                             if conf > 0.6:
                                text = self.alpr.read_plate(frame, [int(x1), int(y1), int(x2), int(y2)])
                                if text:
                                    plate_text = text
                        
                        # Update Cache
                        if track_id is not None:
                            self.result_cache[track_id] = {
                                'name': person_name,
                                'plate': plate_text,
                                'last_update': time.time()
                            }
                    
                    # Apply Logic (using either new or cached data)
                    if person_name and person_name != "Unknown":
                        final_label = f"SUSPECT: {person_name}"
                        threat_level = "critical"  # All recognized suspects are critical threats
                    
                    if plate_text:
                        final_label = f"{label} [{plate_text}]"
                        if "STOLEN" in plate_text or "BAD" in plate_text: threat_level = "critical"
                    
                    if is_loitering:
                        final_label += " [Loitering]"
                        threat_level = "suspicious"
                        
                    if is_crowd and label == 'person':
                        threat_level = "warning"

                    # Use track_id for stable ID if available, otherwise fallback to index
                    detection_id = str(track_id) if track_id is not None else f"det_{self.camera.frame_count}_{idx}"

                    detections.append({
                        "id": detection_id,
                        "track_id": track_id,
                        "class": final_label,
                        "confidence": round(conf, 2),
                        "bbox": [int(x1), int(y1), int(x2), int(y2)],
                        "bbox_normalized": [
                            float(x1 / self.camera.resolution[0]), 
                            float(y1 / self.camera.resolution[1]), 
                            float((x2 - x1) / self.camera.resolution[0]), 
                            float((y2 - y1) / self.camera.resolution[1])
                        ],
                        "threat_level": threat_level
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


# ==============================================================================
# ALPR MODULE (License Plate Recognition)
# ==============================================================================
try:
    import easyocr
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
    print("⚠️  easyocr not installed. Skipping ALPR.")

# ==============================================================================
# FACIAL RECOGNITION MODULE (OpenCV-based, no dlib required)
# ==============================================================================

import os

class FaceRecognizer:
    def __init__(self, known_faces_dir="assets/known_faces"):
        self.known_faces = {}  # {name: face_image}
        self.known_names = []
        self.is_active = False
        self.face_cascade = None
        
        # Load Haar Cascade for face detection
        try:
            # Try 'alt2' which is often more robust than default
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_alt2.xml'
            if not os.path.exists(cascade_path):
                cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
                
            self.face_cascade = cv2.CascadeClassifier(cascade_path)
            self._load_known_faces(known_faces_dir)
        except Exception as e:
            print(f"❌ Face Cascade Load Failed: {e}")
            
    def reload(self):
        """Reload known faces from disk"""
        print("🔄 Reloading Facial Database...")
        self.known_faces = {}
        self.known_names = []
        self.is_active = False
        self._load_known_faces("assets/known_faces")

    def _load_known_faces(self, directory):
        if not os.path.exists(directory):
            os.makedirs(directory, exist_ok=True)
            print(f"📁 Created known_faces directory: {directory}")
            return

        print(f"👤 Loading Known Faces from {directory}...")
        for filename in os.listdir(directory):
            if filename.endswith((".jpg", ".png", ".jpeg")):
                path = os.path.join(directory, filename)
                try:
                    # Load image
                    image = cv2.imread(path)
                    if image is None:
                        print(f"  ❌ Failed to load {filename}: Invalid image")
                        continue
                    
                    # Convert to grayscale
                    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
                    
                    # Detect face
                    faces = self.face_cascade.detectMultiScale(gray, 1.3, 5)
                    
                    if len(faces) == 0:
                        print(f"  ❌ No face detected in {filename}")
                        continue
                    
                    # Use the first detected face
                    (x, y, w, h) = faces[0]
                    face_roi = gray[y:y+h, x:x+w]
                    face_roi = cv2.resize(face_roi, (100, 100))  # Normalize size
                    
                    name = os.path.splitext(filename)[0].replace("_", " ").title()
                    self.known_faces[name] = face_roi
                    self.known_names.append(name)
                    print(f"  ✅ Loaded: {name}")
                    
                except Exception as e:
                    print(f"  ❌ Failed to load {filename}: {e}")
        
        if self.known_faces:
            self.is_active = True
            print(f"✅ Facial Recognition Active: {len(self.known_names)} identities loaded.")

    def identify(self, frame, bbox):
        """
        Identify a person within a bounding box using template matching.
        bbox: [x1, y1, x2, y2]
        """
        if not self.is_active or not self.known_faces:
            return "Unknown"

        x1, y1, x2, y2 = bbox
        
        # Strategy 1: Crop Detection (Fast)
        face_img = frame[y1:y2, x1:x2]
        if face_img.size == 0: return "Unknown"
        
        gray_face = cv2.cvtColor(face_img, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray_face, 1.1, 4, minSize=(30, 30))
        
        target_face = None
        
        if len(faces) > 0:
            (fx, fy, fw, fh) = faces[0]
            target_face = gray_face[fy:fy+fh, fx:fx+fw]
        else:
            # Strategy 2: Full Frame Context (Slower but Robust)
            gray_full = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            # Enhance contrast
            gray_full = cv2.equalizeHist(gray_full)
            
            # Detect faces in the whole image
            full_faces = self.face_cascade.detectMultiScale(gray_full, 1.1, 3, minSize=(20, 20))
            
            for (fx, fy, fw, fh) in full_faces:
                # Check if face center is inside person bbox
                cx = fx + fw // 2
                cy = fy + fh // 2
                
                # Check with some margin (expand bbox by 10% for matching)
                bx1, by1, bx2, by2 = x1 * 0.9, y1 * 0.9, x2 * 1.1, y2 * 1.1
                
                if bx1 < cx < bx2 and by1 < cy < by2:
                    target_face = gray_full[fy:fy+fh, fx:fx+fw]
                    print(f"✅ Found face in full frame context! ({fx},{fy})")
                    break
            
            if target_face is None:
                h, w, _ = frame.shape
                print(f"⚠️ Face Rec: No face found (tried crop & full context) | Frame: {w}x{h}")
                return "Unknown"
        
        # Resize to match known faces
        face_roi = cv2.resize(target_face, (100, 100))
        
        # Template matching with all known faces
        best_match = "Unknown"
        best_score = -1.0 # Higher is better for TM_CCOEFF_NORMED
        threshold = 0.5   # 0.5 is a reasonable starting point for faces
        
        for name, known_face in self.known_faces.items():
            # Use Normalized Cross Correlation (robust to lighting)
            # We need to ensure known_face is <= face_roi in size for matchTemplate?
            # Actually matchTemplate expects the template to be smaller than the image.
            # Here both are 100x100.
            # So we can just use simple correlation or resize if needed.
            # But if they are same size, result is 1x1.
            
            res = cv2.matchTemplate(face_roi, known_face, cv2.TM_CCOEFF_NORMED)
            score = res[0][0]
            
            if score > best_score:
                best_score = score
                best_match = name
        
        # Debug Log for tuning
        print(f"🔍 Face Check: Best Score: {best_score:.4f} | Match: {best_match} | Thresh: {threshold}")

        # Only return match if confidence is high enough
        if best_score > threshold:
            return best_match
        
        return "Unknown"

# ==============================================================================
# ALPR (Automatic License Plate Recognition) SYSTEM
# ==============================================================================

class ALPRSystem:
    def __init__(self):
        self.reader = None
        self.is_active = False
        if OCR_AVAILABLE:
            print("📖 Loading EasyOCR (this may take time on first run)...")
            try:
                # CPU mode by default to avoid VRAM issues if GPU matches
                self.reader = easyocr.Reader(['en'], gpu=False, verbose=False)
                self.is_active = True
                print("✅ ALPR System Ready")
            except Exception as e:
                print(f"❌ ALPR Init Failed: {e}")

    def read_plate(self, frame, bbox):
        if not self.is_active: return None
        
        x1, y1, x2, y2 = bbox
        plate_img = frame[y1:y2, x1:x2]
        h, w = plate_img.shape[:2]
        if h < 10 or w < 20: return None # Too small
        
        try:
            results = self.reader.readtext(plate_img)
            # Filter for likely plate text (alphanumeric, > 3 chars)
            for (_, text, conf) in results:
                if conf > 0.4 and len(text) > 3 and any(c.isdigit() for c in text):
                     return text.upper().replace(" ", "")
            return None
        except:
            return None

