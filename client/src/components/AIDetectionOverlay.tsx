import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Target, AlertTriangle } from 'lucide-react';

interface Detection {
    id: string;
    class: string;
    confidence: number;
    bbox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    bbox_normalized?: number[];
    threat_level: 'normal' | 'suspicious' | 'critical';
    timestamp: string;
}

interface AIDetectionOverlayProps {
    detections: Detection[];
    isConnected: boolean;
}

export function AIDetectionOverlay({ detections, isConnected }: AIDetectionOverlayProps) {
    const getThreatColor = (level: string) => {
        switch (level) {
            case 'critical':
                return 'border-red-500 bg-red-500/10';
            case 'suspicious':
                return 'border-yellow-500 bg-yellow-500/10';
            default:
                return 'border-green-500 bg-green-500/10';
        }
    };

    const getTextColor = (level: string) => {
        return 'text-black';
    };

    return (
        <div className="relative w-full h-full bg-transparent rounded-lg overflow-hidden border border-white/10 pointer-events-none">

            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-cyan-500/10 border-2 border-cyan-500/30 flex items-center justify-center">
                        <Target className="w-12 h-12 text-cyan-500/50" />
                    </div>
                    <p className="text-sm font-mono text-zinc-600 uppercase tracking-wider">
                        {isConnected ? 'AI Vision Active' : 'Connecting to AI Stream...'}
                    </p>
                    {isConnected && (
                        <p className="text-[10px] text-zinc-700 mt-2">
                            WebRTC Stream - 720p @ 20 FPS
                        </p>
                    )}
                </div>
            </div>

            {/* Detection Overlays */}
            {detections.map((detection, index) => (
                <motion.div
                    key={detection.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                        left: detection.bbox_normalized
                            ? `${detection.bbox_normalized[0] * 100}%`
                            : `${(detection.bbox.x / 1280) * 100}%`,
                        top: detection.bbox_normalized
                            ? `${detection.bbox_normalized[1] * 100}%`
                            : `${(detection.bbox.y / 720) * 100}%`,
                        width: detection.bbox_normalized
                            ? `${detection.bbox_normalized[2] * 100}%`
                            : `${(detection.bbox.width / 1280) * 100}%`,
                        height: detection.bbox_normalized
                            ? `${detection.bbox_normalized[3] * 100}%`
                            : `${(detection.bbox.height / 720) * 100}%`,
                    }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{
                        duration: 0.2,
                        ease: "linear" // Smooth linear interpolation for tracking
                    }}
                    className={cn(
                        'absolute border-2 backdrop-blur-[2px]',
                        getThreatColor(detection.threat_level)
                    )}
                >
                    {/* Label */}
                    <div
                        className={cn(
                            'absolute -top-6 left-0 px-2 py-1 text-[11px] font-bold uppercase tracking-wider rounded-sm shadow-sm',
                            getThreatColor(detection.threat_level).replace('bg-', 'bg-').replace('/10', ''), // Make background solid for text
                            getTextColor(detection.threat_level)
                        )}
                    >
                        {detection.class}
                    </div>

                    {/* Threat indicator for critical */}
                    {detection.threat_level === 'critical' && (
                        <motion.div
                            animate={{
                                opacity: [1, 0.3, 1],
                                scale: [1, 1.1, 1]
                            }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                            className="absolute -top-2 -right-2"
                        >
                            <AlertTriangle className="w-4 h-4 text-red-500 fill-red-500/20" />
                        </motion.div>
                    )}

                    {/* Corner markers */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2" />
                    <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2" />
                </motion.div>
            ))}

            {/* Stats Overlay */}
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg p-3">
                <div className="text-[10px] font-mono space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-zinc-400">AI: </span>
                        <span className="text-white font-bold">ACTIVE</span>
                    </div>
                    <div>
                        <span className="text-zinc-400">Detections: </span>
                        <span className="text-cyan-400 font-bold">{detections.length}</span>
                    </div>
                    <div>
                        <span className="text-zinc-400">Critical: </span>
                        <span className="text-red-400 font-bold">
                            {detections.filter(d => d.threat_level === 'critical').length}
                        </span>
                    </div>
                </div>
            </div>

            {/* Confidence threshold indicator */}
            <div className="absolute bottom-4 left-4 text-[9px] font-mono text-zinc-600 uppercase">
                Threshold: 60% | YOLOv8-Nano
            </div>
        </div>
    );
}
