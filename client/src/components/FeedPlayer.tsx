import { useEffect, useState } from "react";
import { Maximize2, Activity, User, Car } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface FeedPlayerProps {
  id: number;
  name: string;
  status: "online" | "offline" | "warning";
  active?: boolean;
}

export function FeedPlayer({ id, name, status, active }: FeedPlayerProps) {
  const [detection, setDetection] = useState<null | { type: 'person' | 'vehicle', conf: number, x: number, y: number }>(null);

  // Simulate detections
  useEffect(() => {
    if (status !== 'online') return;
    
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setDetection({
          type: Math.random() > 0.5 ? 'person' : 'vehicle',
          conf: Math.floor(85 + Math.random() * 14),
          x: 20 + Math.random() * 60,
          y: 20 + Math.random() * 60
        });
        setTimeout(() => setDetection(null), 2000);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [status]);

  return (
    <div className={cn(
      "relative aspect-video bg-black rounded-lg overflow-hidden border border-white/10 group",
      active && "ring-2 ring-red-500/50"
    )}>
      {/* Feed Content Placeholder */}
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
        {status === 'online' ? (
          <div className="w-full h-full relative overflow-hidden">
            {/* Grid Pattern */}
            <div className="absolute inset-0" 
              style={{ 
                backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', 
                backgroundSize: '40px 40px' 
              }} 
            />
            {/* Scanline */}
            <div className="absolute inset-0 scanline opacity-20" />
            
            {/* Simulated Detection Box */}
            {detection && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute border-2 border-red-500 bg-red-500/10"
                style={{ 
                  left: `${detection.x}%`, 
                  top: `${detection.y}%`,
                  width: '15%',
                  height: '25%'
                }}
              >
                <div className="absolute -top-6 left-0 bg-red-500 text-white text-[10px] px-1 py-0.5 font-mono uppercase flex items-center gap-1">
                  {detection.type === 'person' ? <User size={10} /> : <Car size={10} />}
                  {detection.conf}%
                </div>
              </motion.div>
            )}

            <div className="absolute bottom-0 right-0 p-8 opacity-20">
               <Activity size={64} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-muted-foreground">
            <Activity className="h-12 w-12 mb-2 opacity-50" />
            <span className="text-sm font-mono uppercase tracking-widest">Signal Lost</span>
          </div>
        )}
      </div>

      {/* Overlay UI */}
      <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none">
        <div className="flex justify-between items-start">
          <div className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded border border-white/10 text-xs font-mono text-white flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full animate-pulse", status === 'online' ? "bg-green-500" : "bg-red-500")} />
            CAM-{id.toString().padStart(2, '0')} :: {name}
          </div>
          <div className="text-[10px] font-mono text-red-500 bg-black/60 px-1 rounded animate-pulse">
            REC ●
          </div>
        </div>

        <div className="flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity duration-200">
           <div className="text-[10px] font-mono text-white/50">
             FPS: 30 / BIT: 4096
           </div>
           <button className="p-1.5 bg-black/60 hover:bg-white/10 rounded text-white pointer-events-auto transition-colors">
             <Maximize2 size={16} />
           </button>
        </div>
      </div>
    </div>
  );
}
