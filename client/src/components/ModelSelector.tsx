import { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Cpu, Zap, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModelSelectorProps {
    onModelChange?: (model: string) => void;
    className?: string;
}

interface ModelInfo {
    id: string;
    name: string;
    description: string;
    icon: any;
    status: 'available' | 'loading' | 'unavailable';
    performance: {
        fps: string;
        latency: string;
    };
}

const MODELS: ModelInfo[] = [
    {
        id: 'yolo26',
        name: 'YOLO26',
        description: '43% faster, NMS-free detection',
        icon: Zap,
        status: 'available',
        performance: { fps: '20-30', latency: '<50ms' }
    },
    {
        id: 'rfdetr',
        name: 'RF-DETR',
        description: 'Transformer-based detection',
        icon: Brain,
        status: 'unavailable',
        performance: { fps: '15-25', latency: '<80ms' }
    },
    {
        id: 'sam2',
        name: 'SAM2',
        description: 'Advanced segmentation',
        icon: Activity,
        status: 'unavailable',
        performance: { fps: '10-20', latency: '<100ms' }
    },
    {
        id: 'rtmdet',
        name: 'RTMDet',
        description: 'High-throughput processing',
        icon: Cpu,
        status: 'unavailable',
        performance: { fps: '30+', latency: '<40ms' }
    },
    {
        id: 'mock',
        name: 'Simulation',
        description: 'Mock detector for testing',
        icon: Activity,
        status: 'available',
        performance: { fps: '20', latency: '<10ms' }
    }
];

export function ModelSelector({ onModelChange, className }: ModelSelectorProps) {
    const [selectedModel, setSelectedModel] = useState('yolo26');
    const [isChanging, setIsChanging] = useState(false);

    const handleModelChange = async (modelId: string) => {
        if (modelId === selectedModel || isChanging) return;

        setIsChanging(true);

        try {
            // Call API to switch model
            const response = await fetch('/api/ai/models/select', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model_type: modelId })
            });

            if (response.ok) {
                setSelectedModel(modelId);
                onModelChange?.(modelId);
            } else {
                console.error('Failed to switch model');
            }
        } catch (error) {
            console.error('Error switching model:', error);
        } finally {
            setTimeout(() => setIsChanging(false), 500);
        }
    };

    return (
        <div className={cn("space-y-2", className)}>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-cyan-400">AI Model</h3>
                {isChanging && (
                    <span className="text-xs text-yellow-400 animate-pulse">Switching...</span>
                )}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                {MODELS.map((model) => {
                    const Icon = model.icon;
                    const isSelected = selectedModel === model.id;
                    const isAvailable = model.status === 'available';

                    return (
                        <motion.button
                            key={model.id}
                            onClick={() => isAvailable && handleModelChange(model.id)}
                            disabled={!isAvailable || isChanging}
                            whileHover={isAvailable ? { scale: 1.02 } : {}}
                            whileTap={isAvailable ? { scale: 0.98 } : {}}
                            className={cn(
                                "relative p-3 rounded-lg border transition-all duration-200",
                                "flex flex-col items-center gap-2 text-center",
                                isSelected
                                    ? "bg-cyan-500/20 border-cyan-400 shadow-lg shadow-cyan-500/20"
                                    : "bg-slate-800/50 border-slate-700 hover:border-slate-600",
                                !isAvailable && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {/* Status Indicator */}
                            <div className={cn(
                                "absolute top-2 right-2 w-2 h-2 rounded-full",
                                isSelected ? "bg-green-400 animate-pulse" : "bg-slate-600"
                            )} />

                            {/* Icon */}
                            <Icon className={cn(
                                "w-5 h-5",
                                isSelected ? "text-cyan-400" : "text-slate-400"
                            )} />

                            {/* Model Name */}
                            <div>
                                <div className={cn(
                                    "text-xs font-semibold",
                                    isSelected ? "text-cyan-300" : "text-slate-300"
                                )}>
                                    {model.name}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                    {model.description}
                                </div>
                            </div>

                            {/* Performance Metrics */}
                            {isAvailable && (
                                <div className="flex gap-2 text-[9px] text-slate-500 mt-1">
                                    <span>{model.performance.fps} FPS</span>
                                    <span>•</span>
                                    <span>{model.performance.latency}</span>
                                </div>
                            )}

                            {!isAvailable && (
                                <div className="text-[9px] text-amber-500 font-medium">
                                    Coming Soon
                                </div>
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Active Model Info */}
            <div className="mt-3 p-2 bg-slate-900/50 rounded border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Active:</span>
                    <span className="text-cyan-400 font-semibold">
                        {MODELS.find(m => m.id === selectedModel)?.name || 'Unknown'}
                    </span>
                </div>
            </div>
        </div>
    );
}
