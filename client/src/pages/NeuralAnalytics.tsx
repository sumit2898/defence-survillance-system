import { Layout } from '@/components/Layout';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { EventRiver } from '@/components/EventRiver';
import { ObjectGallery } from '@/components/ObjectGallery';
import { ForensicSearch } from '@/components/ForensicSearch';
import { Card } from '@/components/ui/card';
import { Brain, AlertTriangle, Activity, PieChart as PieChartIcon, Scan } from 'lucide-react';
import { AnalyticsEvent, DetectedObject, ThreatLevel, ObjectType } from '@/../../shared/types/analytics';
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

// Mock data
const mockEvents: AnalyticsEvent[] = Array.from({ length: 50 }, (_, i) => ({
    id: `event-${i}`,
    type: i % 3 === 0 ? 'anomaly' : 'detection',
    timestamp: new Date(Date.now() - i * 3600000),
    cameraId: `CAM-00${(i % 3) + 1}`,
    severity: [ThreatLevel.LOW, ThreatLevel.MEDIUM, ThreatLevel.HIGH, ThreatLevel.CRITICAL][i % 4],
    title: [
        'Person detected at perimeter',
        'Vehicle approaching Gate A',
        'Unattended baggage detected',
        'Climbing behavior detected',
        'Multiple persons loitering',
    ][i % 5],
    description: 'Automated detection by AI surveillance system',
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
    const [filteredObjects, setFilteredObjects] = useState(mockObjects);

    return (
        <Layout>
            <div className="min-h-screen flex flex-col">
                {/* Header */}
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="px-6 py-4 border-b border-white/5 bg-black/40 backdrop-blur-md"
                >
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                                className="absolute inset-0 bg-purple-500/20 blur-md rounded-full"
                            />
                            <Brain className="w-6 h-6 text-purple-500 relative z-10" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-[0.2em] uppercase text-white">
                                NEURAL ANALYTICS
                            </h1>
                            <p className="text-[11px] text-zinc-500 font-mono">
                                AI-POWERED FORENSIC INTELLIGENCE
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Main Content */}
                <div className="flex-1 flex gap-4 p-4">
                    {/* Left Sidebar - Search & Filters */}
                    <motion.div
                        initial={{ x: -300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="w-80"
                    >
                        <ForensicSearch
                            onSearch={(query) => {
                                // Filter logic here
                                console.log('Search query:', query);
                            }}
                        />

                        {/* Summary Stats */}
                        <Card className="mt-4 bg-black/40 border-white/10 backdrop-blur-md p-4">
                            <h3 className="text-xs font-black tracking-wider uppercase text-white mb-3">
                                DETECTION SUMMARY
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-red-500/10 border border-red-500/20 rounded p-2">
                                    <div className="text-[10px] text-red-500 font-mono mb-1">CRITICAL</div>
                                    <div className="text-xl font-bold text-red-400 font-mono">
                                        {filteredEvents.filter(e => e.severity === ThreatLevel.CRITICAL).length}
                                    </div>
                                </div>
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded p-2">
                                    <div className="text-[10px] text-amber-500 font-mono mb-1">HIGH</div>
                                    <div className="text-xl font-bold text-amber-400 font-mono">
                                        {filteredEvents.filter(e => e.severity === ThreatLevel.HIGH).length}
                                    </div>
                                </div>
                                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded p-2">
                                    <div className="text-[10px] text-cyan-500 font-mono mb-1">PEOPLE</div>
                                    <div className="text-xl font-bold text-cyan-400 font-mono">
                                        {filteredObjects.filter(o => o.type === ObjectType.PERSON).length}
                                    </div>
                                </div>
                                <div className="bg-purple-500/10 border border-purple-500/20 rounded p-2">
                                    <div className="text-[10px] text-purple-500 font-mono mb-1">VEHICLES</div>
                                    <div className="text-xl font-bold text-purple-400 font-mono">
                                        {filteredObjects.filter(o => o.type === ObjectType.VEHICLE).length}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/10">
                                <h3 className="text-[10px] font-black tracking-wider uppercase text-zinc-400 mb-2">
                                    MODEL_CONFIDENCE_TREND
                                </h3>
                                <div className="h-24 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={mockObjects.slice(0, 10).map((o, i) => ({ id: i, conf: o.confidence * 100 }))}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                            <XAxis hide />
                                            <Tooltip
                                                cursor={{ stroke: '#ffffff20' }}
                                                contentStyle={{ backgroundColor: '#000000dd', border: '1px solid #ffffff20', borderRadius: '4px', fontSize: '12px' }}
                                                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Confidence']}
                                            />
                                            <Line type="monotone" dataKey="conf" stroke="#a855f7" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#a855f7' }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Center - Content Area */}
                    <div className="flex-1 flex flex-col gap-4">

                        {/* Top Charts Section */}
                        <div className="grid grid-cols-2 gap-4 h-48 min-h-[192px]">
                            {/* Inference Performance Chart */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-black/40 border border-white/10 rounded-xl p-4 backdrop-blur-md flex flex-col"
                            >
                                <h3 className="text-xs font-black text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Activity className="w-3 h-3 text-cyan-400" />
                                    Inference Latency (ms)
                                </h3>
                                <div className="flex-1 w-full min-h-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={Array.from({ length: 20 }, (_, i) => ({
                                            time: i,
                                            latency: 40 + Math.random() * 20,
                                            spikes: i % 5 === 0 ? 80 : 0
                                        }))}>
                                            <defs>
                                                <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#000', borderColor: '#333' }}
                                                itemStyle={{ color: '#22d3ee', fontSize: '12px' }}
                                            />
                                            <Area type="monotone" dataKey="latency" stroke="#22d3ee" fillOpacity={1} fill="url(#colorLatency)" isAnimationActive={true} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </motion.div>

                            {/* Class Distribution Chart */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 }}
                                className="bg-black/40 border border-white/10 rounded-xl p-4 backdrop-blur-md flex flex-col"
                            >
                                <h3 className="text-xs font-black text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <PieChartIcon className="w-3 h-3 text-purple-400" />
                                    Class Distribution
                                </h3>
                                <div className="flex-1 w-full min-h-0 relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Person', value: 65, fill: '#06b6d4' },
                                                    { name: 'Vehicle', value: 25, fill: '#8b5cf6' },
                                                    { name: 'Weapon', value: 10, fill: '#ef4444' },
                                                ]}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={40}
                                                outerRadius={70}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                <Cell fill="#06b6d4" />
                                                <Cell fill="#8b5cf6" />
                                                <Cell fill="#ef4444" />
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#000', borderColor: '#333' }}
                                                itemStyle={{ fontSize: '12px' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {/* Center Label */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="text-center">
                                            <div className="text-xl font-bold text-white">4.2k</div>
                                            <div className="text-[9px] text-zinc-500 uppercase">Total</div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Legacy Tables Removed for Performance */}
                        <div className="flex-1 flex items-center justify-center bg-black/40 border border-white/10 rounded-xl backdrop-blur-md p-10">
                            <div className="text-center">
                                <Scan className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-zinc-500">Forensic Data Offline</h3>
                                <p className="text-xs text-zinc-600 mt-2 font-mono">
                                    HEAVY_DATA_TABLES_DISABLED_BY_ADMIN
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Selected Event Details */}
                    {selectedEvent && (
                        <motion.div
                            initial={{ x: 300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 300, opacity: 0 }}
                            className="w-80 overflow-y-auto custom-scrollbar"
                        >
                            <Card className="bg-black/40 border-white/10 backdrop-blur-md overflow-hidden">
                                <div className="p-4 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <h3 className="text-sm font-bold text-white">{selectedEvent.title}</h3>
                                        <AlertTriangle className={
                                            selectedEvent.severity === ThreatLevel.CRITICAL ? 'text-red-500' :
                                                selectedEvent.severity === ThreatLevel.HIGH ? 'text-amber-500' :
                                                    'text-cyan-500'
                                        } />
                                    </div>
                                    <div className="text-xs text-zinc-400">{selectedEvent.description}</div>
                                    <div className="space-y-2 pt-4 border-t border-white/5">
                                        <div className="text-[10px] text-zinc-500 font-mono">TIMESTAMP</div>
                                        <div className="text-xs font-mono text-white">
                                            {selectedEvent.timestamp.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-[10px] text-zinc-500 font-mono">CAMERA_ID</div>
                                        <div className="text-xs font-mono text-cyan-400">{selectedEvent.cameraId}</div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
