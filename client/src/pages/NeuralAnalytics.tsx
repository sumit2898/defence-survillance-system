import { Layout } from '@/components/Layout';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ForensicSearch } from '@/components/ForensicSearch';
import { Card } from '@/components/ui/card';
import { Brain, AlertTriangle, Menu, X, Filter, BarChart, Activity, PieChart, Camera, Target } from 'lucide-react';
import { AnalyticsEvent, DetectedObject, ThreatLevel, ObjectType } from '@/../../shared/types/analytics';
import { InferenceLatencyChart, ClassDistributionChart, CameraLoadChart } from './AnalyticsCharts';
import { EventFeed } from './EventFeed';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

// Mock data generator (unchanged for consistency)
const mockEvents: AnalyticsEvent[] = Array.from({ length: 50 }, (_, i) => ({
    id: `event-${i}`,
    type: i % 3 === 0 ? 'anomaly' : 'detection',
    timestamp: new Date(Date.now() - i * 360000), // closer times
    cameraId: `CAM-00${(i % 5) + 1}`,
    severity: [ThreatLevel.LOW, ThreatLevel.MEDIUM, ThreatLevel.HIGH, ThreatLevel.CRITICAL][i % 4],
    title: [
        'Person detected at perimeter',
        'Vehicle approaching Gate A',
        'Unattended baggage detected',
        'Climbing behavior detected',
        'Multiple persons loitering',
    ][i % 5],
    description: 'Automated detection by AI surveillance system. Immediate response recommended if threat level critical.',
}));

const mockObjects: DetectedObject[] = Array.from({ length: 30 }, (_, i) => ({
    id: `obj-${i}`,
    type: [ObjectType.PERSON, ObjectType.VEHICLE, ObjectType.BAGGAGE][i % 3],
    confidence: 0.7 + Math.random() * 0.3,
    boundingBox: { x: 100, y: 100, width: 200, height: 300 },
    timestamp: new Date(Date.now() - i * 1800000),
    cameraId: `CAM-00${(i % 3) + 1}`,
}));

export default function NeuralAnalytics() {
    const [selectedEvent, setSelectedEvent] = useState<AnalyticsEvent | null>(null);
    const [filteredEvents, setFilteredEvents] = useState(mockEvents);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Toggle Sidebar
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <Layout className="h-screen overflow-hidden flex flex-col bg-zinc-950 text-white selection:bg-cyan-500/30">

            {/* Header / Navbar */}
            <motion.header
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="h-18 border-b border-white/10 bg-black/50 backdrop-blur-md flex items-center justify-between px-8 z-50 shrink-0 shadow-lg shadow-black/20"
            >
                <div className="flex items-center gap-4">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleSidebar}
                        className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-all duration-200 hover:shadow-glow-green">
                        <Menu className="w-5 h-5" />
                    </motion.button>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                                className="absolute inset-0 bg-purple-500/20 blur-md rounded-full"
                            />
                            <Brain className="w-6 h-6 text-purple-500 relative z-10" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-display font-black tracking-[0.2em] uppercase text-white leading-none drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                                NEURAL<span className="text-purple-500">ANALYTICS</span>
                            </h1>
                            <p className="text-xs text-zinc-400 font-tech tracking-[0.3em] mt-1.5">
                                AI-POWERED FORENSIC INTELLIGENCE // V3.0
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Status Indicators */}
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-green-500/15 border border-green-500/30 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs font-tech text-green-300 font-bold tracking-wider">SYSTEM ONLINE</span>
                    </div>
                    <div className="h-8 w-[1px] bg-white/10" />
                    <div className="text-right">
                        <div className="text-sm font-bold font-mono text-white">{new Date().toLocaleTimeString()}</div>
                        <div className="text-[10px] text-zinc-500 font-tech">UTC+05:30</div>
                    </div>
                </div>
            </motion.header>

            {/* Main Grid Content */}
            <div className="flex-1 overflow-hidden relative flex">

                {/* Sidebar (Desktop) */}
                <AnimatePresence mode="wait">
                    {isSidebarOpen && (
                        <motion.aside
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 320, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="h-full border-r border-white/10 bg-zinc-900/40 backdrop-blur-sm flex flex-col shrink-0 overflow-hidden shadow-xl shadow-black/30"
                        >
                            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 w-80">
                                {/* Search */}
                                <div>
                                    <h3 className="text-sm font-display font-bold tracking-wider uppercase text-zinc-400 mb-3 flex items-center gap-2">
                                        <Filter className="w-3 h-3" /> Filters
                                    </h3>
                                    <ForensicSearch onSearch={(q) => console.log(q)} />
                                </div>

                                {/* Summary Stats */}
                                <Card className="bg-zinc-900/60 border-white/15 p-5 space-y-4 shadow-lg shadow-black/20 hover:border-purple-500/30 transition-all duration-300 hover:shadow-glow-blue">
                                    <h3 className="text-base font-display font-bold tracking-wider uppercase text-zinc-300">
                                        THREAT_OVERVIEW
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-red-500/15 border border-red-500/30 rounded-lg p-3 text-center shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                                            <div className="text-3xl font-black text-red-400 font-mono drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]">{mockEvents.filter(e => e.severity === ThreatLevel.CRITICAL).length}</div>
                                            <div className="text-[10px] text-red-300/80 uppercase font-semibold tracking-wide">Critical</div>
                                        </div>
                                        <div className="bg-amber-500/15 border border-amber-500/30 rounded-lg p-3 text-center shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                                            <div className="text-3xl font-black text-amber-400 font-mono drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]">{mockEvents.filter(e => e.severity === ThreatLevel.HIGH).length}</div>
                                            <div className="text-[10px] text-amber-300/80 uppercase font-semibold tracking-wide">High Risk</div>
                                        </div>
                                    </div>
                                    <div className="pt-3 border-t border-white/15 grid grid-cols-3 gap-2 text-center font-mono">
                                        <div>
                                            <div className="text-xl font-bold text-cyan-300">{mockObjects.filter(o => o.type === ObjectType.PERSON).length}</div>
                                            <div className="text-[9px] text-zinc-400 font-semibold">HUMAN</div>
                                        </div>
                                        <div>
                                            <div className="text-xl font-bold text-purple-300">{mockObjects.filter(o => o.type === ObjectType.VEHICLE).length}</div>
                                            <div className="text-[9px] text-zinc-400 font-semibold">AUTO</div>
                                        </div>
                                        <div>
                                            <div className="text-xl font-bold text-zinc-300">12ms</div>
                                            <div className="text-[9px] text-zinc-400 font-semibold">LATENCY</div>
                                        </div>
                                    </div>
                                </Card>

                                {/* Active Cameras List */}
                                <div className="space-y-2 mt-6">
                                    <h3 className="text-sm font-display font-bold tracking-wider uppercase text-zinc-500 mb-2 flex items-center gap-2">
                                        <Camera className="w-3 h-3" /> ACTIVE_SENSORS
                                    </h3>
                                    {['Gate A', 'Perimeter N', 'Lobby Main', 'Parking L2'].map((cam, i) => (
                                        <motion.div
                                            key={i}
                                            whileHover={{ x: 4, scale: 1.02 }}
                                            transition={{ duration: 0.2 }}
                                            className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/5 hover:border-green-500/30 hover:bg-white/10 cursor-pointer transition-all duration-200">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                                <span className="text-xs font-mono text-zinc-300">CAM-0{i + 1} : {cam}</span>
                                            </div>
                                            <span className="text-[9px] text-zinc-600 font-mono">ONLINE</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* Dashboard Grid */}
                <main className="flex-1 p-6 lg:p-8 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto h-[calc(100vh-140px)]">

                        {/* Top Row: Charts */}
                        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 h-64 lg:h-auto lg:min-h-[300px]">
                            <InferenceLatencyChart data={Array.from({ length: 20 }, (_, i) => ({ time: i, latency: 40 + Math.random() * 20 }))} />
                            <ClassDistributionChart />
                        </div>

                        {/* Top Right: Camera Load */}
                        <div className="lg:col-span-1 h-64 lg:h-auto lg:min-h-[300px]">
                            <CameraLoadChart />
                        </div>

                        {/* Bottom Row: Feed & Details */}
                        <div className="lg:col-span-2 h-[400px] lg:h-auto overflow-hidden rounded-xl">
                            <EventFeed
                                events={mockEvents}
                                onEventClick={setSelectedEvent}
                                selectedEventId={selectedEvent?.id}
                            />
                        </div>

                        <div className="lg:col-span-1 h-[400px] lg:h-auto">
                            {/* Selected Event Detail Panel */}
                            <AnimatePresence mode="wait">
                                {selectedEvent ? (
                                    <motion.div
                                        key="detail"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        className="h-full bg-black/40 border border-white/10 rounded-xl backdrop-blur-md p-6 flex flex-col relative group overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-50">
                                            <Target className="w-24 h-24 text-white/5" />
                                        </div>

                                        <div className="flex items-center justify-between mb-6">
                                            <div className="px-2 py-1 bg-white/5 rounded text-[10px] font-mono text-zinc-400 border border-white/5 uppercase tracking-widest">
                                                EVENT_LOG #{selectedEvent.id.split('-')[1]}
                                            </div>
                                            <button onClick={() => setSelectedEvent(null)} className="text-zinc-500 hover:text-white p-1">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="flex-1 space-y-6">
                                            <div>
                                                <h2 className="text-lg font-bold text-white mb-2 leading-tight">{selectedEvent.title}</h2>
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                                        selectedEvent.severity === ThreatLevel.CRITICAL ? "bg-red-500/20 text-red-500 border border-red-500/30" :
                                                            selectedEvent.severity === ThreatLevel.HIGH ? "bg-amber-500/20 text-amber-500 border border-amber-500/30" :
                                                                "bg-cyan-500/20 text-cyan-500 border border-cyan-500/30"
                                                    )}>
                                                        {selectedEvent.severity}
                                                    </span>
                                                    <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                                                        <Activity className="w-3 h-3" /> AI_CONFIDENCE: {(0.85 + Math.random() * 0.14).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="p-4 bg-white/5 rounded-lg border border-white/5 text-xs text-zinc-300 leading-relaxed font-mono">
                                                {selectedEvent.description}
                                            </div>

                                            <div className="space-y-4 pt-4 border-t border-white/5">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <div className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1">TIMESTAMP</div>
                                                        <div className="text-sm font-mono text-white">{selectedEvent.timestamp.toLocaleTimeString()}</div>
                                                        <div className="text-[10px] text-zinc-600">{selectedEvent.timestamp.toLocaleDateString()}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1">SOURCEID</div>
                                                        <div className="text-sm font-mono text-cyan-400">{selectedEvent.cameraId}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-auto pt-6">
                                                <button className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 group/btn">
                                                    <Target className="w-4 h-4 text-cyan-500 group-hover/btn:rotate-90 transition-transform" />
                                                    INITIATE_FORENSIC_ZOOM
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="h-full bg-black/20 border border-white/5 rounded-xl border-dashed flex items-center justify-center flex-col gap-4 text-zinc-600">
                                        <Target className="w-12 h-12 opacity-20" />
                                        <p className="text-xs font-mono uppercase tracking-widest">SELECT_EVENT_FOR_ANALYSIS</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>

                    </div>
                </main>

            </div>
        </Layout>
    );
}

