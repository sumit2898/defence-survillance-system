import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface LiveFeedProps {
    isActive: boolean;
    detections: any[];
    processingStats: any;
}

export function LiveFeed({ isActive, detections, processingStats }: LiveFeedProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        // Simulate initialization of camera stream
        if (isActive && videoRef.current) {
            // In a real app, we would mount WebRTC or HLS stream here
            // For now, we simulate a "Active" state
        }
    }, [isActive]);

    return (
        <div className="relative w-full aspect-video bg-black overflow-hidden rounded-lg">
            {/* Simulated Video Feed (or Real Video Element) */}
            {/* Live MJPEG Stream or Simulation */}
            {isActive ? (
                <img
                    src={`http://${window.location.hostname}:8000/api/ai/video_feed`}
                    className="w-full h-full object-cover opacity-80"
                    alt="Live Neural Feed"
                />
            ) : (
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover opacity-80"
                    autoPlay
                    muted
                    loop
                    playsInline
                    poster="/placeholder-surveillance.jpg"
                >
                    <source src="/assets/drone_feed_sim.mp4" type="video/mp4" />
                </video>
            )}

            {/* Post-processing effects */}
            <div className="absolute inset-0 pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />

            {!isActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20">
                    <span className="text-zinc-500 font-mono text-sm">SIGNAL_LOST</span>
                </div>
            )}
        </div>
    );
}
