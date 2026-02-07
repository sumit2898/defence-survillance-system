"""
Model Manager - Central AI Model Management System
Handles loading, switching, and managing multiple AI detection models
Supports YOLO26, RF-DETR, SAM2, RTMDet with ensemble capabilities
"""

import json
import time
from typing import Dict, List, Optional, Any
from enum import Enum
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ModelType(str, Enum):
    """Supported AI model types"""
    YOLO26 = "yolo26"
    RFDETR = "rfdetr"
    SAM2 = "sam2"
    RTMDET = "rtmdet"
    MOCK = "mock"


class ModelStatus(str, Enum):
    """Model loading status"""
    UNLOADED = "unloaded"
    LOADING = "loading"
    LOADED = "loaded"
    ERROR = "error"


class ModelManager:
    """
    Central manager for all AI detection models
    Handles model lifecycle, switching, and performance tracking
    """
    
    def __init__(self, config_path: str = "ai_config.json"):
        self.config_path = config_path
        self.config = self._load_config()
        self.models: Dict[ModelType, Any] = {}
        self.model_status: Dict[ModelType, ModelStatus] = {}
        self.active_model: Optional[ModelType] = None
        self.performance_stats: Dict[ModelType, Dict] = {}
        
        # Initialize performance tracking
        for model_type in ModelType:
            self.performance_stats[model_type] = {
                "total_inferences": 0,
                "total_time": 0.0,
                "avg_fps": 0.0,
                "avg_latency_ms": 0.0,
                "last_inference_time": 0.0
            }
            self.model_status[model_type] = ModelStatus.UNLOADED
    
    def _load_config(self) -> Dict:
        """Load AI configuration from JSON file"""
        config_file = Path(__file__).parent / self.config_path
        
        # Default configuration
        default_config = {
            "models": {
                "yolo26": {
                    "enabled": True,
                    "confidence_threshold": 0.50,
                    "device": "cpu",  # Will auto-detect GPU
                    "batch_size": 1,
                    "nms_free": True
                },
                "rfdetr": {
                    "enabled": False,
                    "confidence_threshold": 0.55,
                    "device": "cpu"
                },
                "sam2": {
                    "enabled": False,
                    "prompt_mode": "auto",
                    "device": "cpu"
                },
                "rtmdet": {
                    "enabled": False,
                    "confidence_threshold": 0.50,
                    "device": "cpu",
                    "max_fps": 300
                },
                "mock": {
                    "enabled": True,
                    "confidence_threshold": 0.60
                }
            },
            "ensemble": {
                "enabled": False,
                "voting_strategy": "weighted",
                "min_agreement": 2
            },
            "performance": {
                "target_fps": 30,
                "max_latency_ms": 100,
                "adaptive_quality": True
            }
        }
        
        if config_file.exists():
            try:
                with open(config_file, 'r') as f:
                    loaded_config = json.load(f)
                    # Merge with defaults
                    default_config.update(loaded_config)
                    logger.info(f"✅ Loaded configuration from {config_file}")
            except Exception as e:
                logger.warning(f"⚠️  Failed to load config: {e}, using defaults")
        else:
            # Save default config
            try:
                with open(config_file, 'w') as f:
                    json.dump(default_config, f, indent=2)
                logger.info(f"📝 Created default config at {config_file}")
            except Exception as e:
                logger.warning(f"⚠️  Could not save default config: {e}")
        
        return default_config
    
    def load_model(self, model_type: ModelType) -> bool:
        """
        Load a specific AI model
        
        Args:
            model_type: Type of model to load
            
        Returns:
            bool: True if loaded successfully
        """
        if model_type in self.models and self.model_status[model_type] == ModelStatus.LOADED:
            logger.info(f"✅ Model {model_type.value} already loaded")
            return True
        
        logger.info(f"🔄 Loading model: {model_type.value}")
        self.model_status[model_type] = ModelStatus.LOADING
        
        try:
            if model_type == ModelType.YOLO26:
                from yolo26_detector import YOLO26Detector
                config = self.config["models"]["yolo26"]
                self.models[model_type] = YOLO26Detector(
                    confidence_threshold=config["confidence_threshold"],
                    device=config["device"]
                )
            
            elif model_type == ModelType.RFDETR:
                from rfdetr_detector import RFDETRDetector
                config = self.config["models"]["rfdetr"]
                self.models[model_type] = RFDETRDetector(
                    confidence_threshold=config["confidence_threshold"],
                    device=config["device"]
                )
            
            elif model_type == ModelType.SAM2:
                from sam2_segmentation import SAM2Segmentation
                config = self.config["models"]["sam2"]
                self.models[model_type] = SAM2Segmentation(
                    device=config["device"],
                    prompt_mode=config["prompt_mode"]
                )
            
            elif model_type == ModelType.RTMDET:
                from rtmdet_detector import RTMDetDetector
                config = self.config["models"]["rtmdet"]
                self.models[model_type] = RTMDetDetector(
                    confidence_threshold=config["confidence_threshold"],
                    device=config["device"]
                )
            
            elif model_type == ModelType.MOCK:
                from mock_detector import MockDetector
                self.models[model_type] = MockDetector(frame_width=1280, frame_height=720)
            
            else:
                raise ValueError(f"Unknown model type: {model_type}")
            
            self.model_status[model_type] = ModelStatus.LOADED
            logger.info(f"✅ Successfully loaded {model_type.value}")
            return True
            
        except ImportError as e:
            logger.error(f"❌ Failed to import {model_type.value}: {e}")
            logger.info(f"💡 Install required packages for {model_type.value}")
            self.model_status[model_type] = ModelStatus.ERROR
            return False
        except Exception as e:
            logger.error(f"❌ Failed to load {model_type.value}: {e}")
            self.model_status[model_type] = ModelStatus.ERROR
            return False
    
    def set_active_model(self, model_type: ModelType) -> bool:
        """
        Set the active model for inference
        
        Args:
            model_type: Model to activate
            
        Returns:
            bool: True if successfully activated
        """
        # Load model if not already loaded
        if model_type not in self.models or self.model_status[model_type] != ModelStatus.LOADED:
            if not self.load_model(model_type):
                logger.error(f"❌ Cannot activate {model_type.value} - failed to load")
                return False
        
        self.active_model = model_type
        logger.info(f"🎯 Active model set to: {model_type.value}")
        return True
    
    def detect(self, frame=None) -> List[Dict]:
        """
        Perform detection using the active model
        
        Args:
            frame: Optional frame data (for real models)
            
        Returns:
            List of detections
        """
        if not self.active_model:
            logger.warning("⚠️  No active model set, using MOCK")
            self.set_active_model(ModelType.MOCK)
        
        if self.active_model not in self.models:
            logger.error(f"❌ Active model {self.active_model} not loaded")
            return []
        
        # Track performance
        start_time = time.time()
        
        try:
            model = self.models[self.active_model]
            
            # Call appropriate detection method
            if hasattr(model, 'detect_frame'):
                detections = model.detect_frame(frame)
            elif hasattr(model, 'detect'):
                detections = model.detect(frame)
            else:
                logger.error(f"❌ Model {self.active_model} has no detect method")
                return []
            
            # Update performance stats
            inference_time = time.time() - start_time
            self._update_performance_stats(self.active_model, inference_time)
            
            # Add model metadata to detections
            for det in detections:
                det['model'] = self.active_model.value
                det['inference_time_ms'] = round(inference_time * 1000, 2)
            
            return detections
            
        except Exception as e:
            logger.error(f"❌ Detection failed with {self.active_model}: {e}")
            return []
    
    def _update_performance_stats(self, model_type: ModelType, inference_time: float):
        """Update performance statistics for a model"""
        stats = self.performance_stats[model_type]
        stats["total_inferences"] += 1
        stats["total_time"] += inference_time
        stats["last_inference_time"] = inference_time
        
        # Calculate averages
        if stats["total_inferences"] > 0:
            avg_time = stats["total_time"] / stats["total_inferences"]
            stats["avg_fps"] = 1.0 / avg_time if avg_time > 0 else 0
            stats["avg_latency_ms"] = avg_time * 1000
    
    def get_model_status(self) -> Dict:
        """Get status of all models"""
        return {
            "active_model": self.active_model.value if self.active_model else None,
            "models": {
                model_type.value: {
                    "status": self.model_status[model_type].value,
                    "enabled": self.config["models"].get(model_type.value, {}).get("enabled", False),
                    "performance": self.performance_stats[model_type]
                }
                for model_type in ModelType
            },
            "ensemble": self.config["ensemble"]
        }
    
    def get_available_models(self) -> List[str]:
        """Get list of available (loaded) models"""
        return [
            model_type.value 
            for model_type, status in self.model_status.items() 
            if status == ModelStatus.LOADED
        ]
    
    def unload_model(self, model_type: ModelType):
        """Unload a model to free memory"""
        if model_type in self.models:
            del self.models[model_type]
            self.model_status[model_type] = ModelStatus.UNLOADED
            logger.info(f"🗑️  Unloaded model: {model_type.value}")
            
            # If this was the active model, switch to MOCK
            if self.active_model == model_type:
                self.set_active_model(ModelType.MOCK)


# Singleton instance
_model_manager_instance = None

def get_model_manager() -> ModelManager:
    """Get or create the global ModelManager instance"""
    global _model_manager_instance
    if _model_manager_instance is None:
        _model_manager_instance = ModelManager()
    return _model_manager_instance
