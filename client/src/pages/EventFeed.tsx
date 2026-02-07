import { AnalyticsEvent, ThreatLevel } from '@/../../shared/types/analytics';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, MapPin, ShieldAlert } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EventFeedProps {
    events: AnalyticsEvent[];
    onEventClick: (event: AnalyticsEvent) => void;
    selectedEventId?: string;
}

export function EventFeed({ events, onEventClick, selectedEventId }: EventFeedProps) {
    return (
        <div className="flex flex-col h-full bg-zinc-900/60 border border-white/15 rounded-xl backdrop-blur-md overflow-hidden relative group shadow-lg shadow-black/20">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-700" />

            {/* Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-base font-display font-bold tracking-wider uppercase text-white flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    LIVE_FEED
                </h3>
                <div className="bg-white/10 px-2.5 py-1 rounded text-xs font-tech text-zinc-300 border border-white/10 font-semibold">
                    {events.length} LOGS
                </div>
            </div>

            {/* List */}
            <ScrollArea className="flex-1 p-0">
                <div className="flex flex-col p-3 gap-2.5">
                    <AnimatePresence initial={false}>
                        {events.map((event, index) => (
                            <motion.div
                                key={event.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2, delay: index * 0.05 }}
                                onClick={() => onEventClick(event)}
                                className={cn(
                                    "relative p-4 rounded-lg border cursor-pointer group/item transition-all duration-300 hover:shadow-lg",
                                    selectedEventId === event.id
                                        ? "bg-white/15 border-white/25 shadow-[0_0_25px_rgba(255,255,255,0.15)]"
                                        : "bg-zinc-900/40 border-white/10 hover:bg-white/10 hover:border-white/15"
                                )}
                            >
                                {/* Left Decorator Line */}
                                <div className={cn(
                                    "absolute left-0 top-3 bottom-3 w-[4px] rounded-r-full transition-all duration-300",
                                    event.severity === ThreatLevel.CRITICAL ? "bg-red-500 shadow-[0_0_10px_#ef4444]" :
                                        event.severity === ThreatLevel.HIGH ? "bg-amber-500 shadow-[0_0_8px_#f59e0b]" :
                                            event.severity === ThreatLevel.MEDIUM ? "bg-cyan-500 shadow-[0_0_5px_#06b6d4]" :
                                                "bg-zinc-600"
                                )} />

                                <div className="pl-3 flex flex-col gap-1">
                                    <div className="flex justify-between items-start">
                                        <span className={cn(
                                            "text-sm font-sans font-bold tracking-tight line-clamp-1",
                                            event.severity === ThreatLevel.CRITICAL ? "text-red-300" : "text-white group-hover/item:text-cyan-200"
                                        )}>
                                            {event.title}
                                        </span>
                                        {event.severity === ThreatLevel.CRITICAL && (
                                            <ShieldAlert className="w-3 h-3 text-red-500 animate-pulse" />
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {event.timestamp.toLocaleTimeString()}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {event.cameraId}
                                        </div>
                                    </div>
                                </div>

                                {/* Hover Glow Effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/item:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </ScrollArea>
        </div>
    );
}
