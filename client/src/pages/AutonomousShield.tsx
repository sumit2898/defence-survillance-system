import { useEffect, useState, useRef } from 'react';
import { LiveFeed } from '@/components/LiveFeed';
import { Layout } from '@/components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield,
    AlertTriangle,
    Activity,
    Zap,
    Eye,
    Target,
    Radio,
    Database,
    Cpu,
    BarChart3,
    PieChart as PieChartIcon,
    Map,
    Network,
    Terminal,
    Globe,
    Wind,
    Thermometer,
    Droplets,
    Wifi,
    Signal,
    Users,
    Brain
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { ThreatConsole } from '@/components/ThreatConsole';
import { AIDetectionOverlay } from '@/components/AIDetectionOverlay';
import { ThreatMap } from '@/components/ThreatMap';
import { ModelSelector } from '@/components/ModelSelector';
import { SensorFusion } from '@/components/SensorFusion';
import { EdgeComputing } from '@/components/EdgeComputing';
import { cn } from '@/lib/utils';
import { SecurityScore } from '@/components/SecurityScore';
import { GlitchText } from '@/components/GlitchText';
import { SuspectsManager } from '@/components/SuspectsManager';

interface AIStats {
    totalDetections: number;
    criticalAlerts: number;
    suspiciousEvents: number;
    normalActivity: number;
    fps: number;
    latency: string;
}

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

interface Alert {
    alert_id: string;
    type: string;
    object: string;
    confidence: string;
    location: string;
    coordinates: {
        lat: number;
        lng: number;
    };
    description: string;
    timestamp: string;
    requires_action: boolean;
}

export default function AutonomousShield() {
    const [isConnected, setIsConnected] = useState(false);
    const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
    const [detections, setDetections] = useState<Detection[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [fusionData, setFusionData] = useState<any>(null);
    const [predictionData, setPredictionData] = useState<any>(null);
    const [stats, setStats] = useState<AIStats>({
        totalDetections: 0,
        criticalAlerts: 0,
        suspiciousEvents: 0,
        normalActivity: 0,
        fps: 20,
        latency: '<100ms'
    });

    const [isSuspectsOpen, setIsSuspectsOpen] = useState(false);

    // Neural Terminal Simulation
    useEffect(() => {
        const thoughts = [
            "Scanning Sector 4...", "Optimizing weights...", "Threat correlation: 0.05",
            "Analyzing biometric signatures...", "Synchronizing edge nodes...", "Pattern match: NEGATIVE",
            "Updating geospatial index...", "Thermal anomaly check...", "Packet inspection complete..."
        ];
        const interval = setInterval(() => {
            setTerminalLogs(prev => [`[${new Date().toLocaleTimeString()}] ${thoughts[Math.floor(Math.random() * thoughts.length)]}`, ...prev].slice(0, 5));
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    const securityScore = Math.max(0, 100 - (stats.criticalAlerts * 10) - (stats.suspiciousEvents * 2));

    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        // Connect to AI service WebSocket
        const connectWebSocket = () => {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const ws = new WebSocket(`${protocol}//${window.location.hostname}:8000/api/ai/stream`);

            ws.onopen = () => {
                console.log('🛡️ Connected to Autonomous Shield AI');
                setIsConnected(true);
            };

            let lastUpdate = 0;
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                const now = Date.now();

                if (data.type === 'frame_analysis') {
                    // 1. Detections MUST be real-time for overlay smooth tracking
                    setDetections(data.detections || []);

                    // 2. Throttle Chart & Stats updates to avoid React render loops and Recharts overload (limit to ~10 FPS)
                    if (now - lastUpdate > 100) {
                        if (data.fusion) setFusionData(data.fusion);
                        if (data.predictions) setPredictionData(data.predictions);

                        // Update stats logic
                        setStats(prev => {
                            return {
                                ...prev,
                                totalDetections: data.detections.length,
                                criticalAlerts: data.detections.filter((d: Detection) => d.threat_level === 'critical').length,
                                suspiciousEvents: data.detections.filter((d: Detection) => d.threat_level === 'suspicious').length,
                                normalActivity: data.detections.filter((d: Detection) => d.threat_level === 'normal').length
                            };
                        });
                        lastUpdate = now;
                    }
                }

                if (data.type === 'critical_alert') {
                    setAlerts(prev => [data.alert, ...prev].slice(0, 50));
                }

                if (data.type === 'SYSTEM_EVENT') {
                    const event = data.data;
                    const newAlert: Alert = {
                        alert_id: `evt-${Date.now()}`,
                        type: event.eventType,
                        object: event.metadata?.drone || 'UNKNOWN',
                        confidence: '100%',
                        location: event.title,
                        coordinates: event.metadata?.coords || { lat: 0, lng: 0 },
                        description: event.title,
                        timestamp: event.timestamp || new Date().toISOString(),
                        requires_action: event.severity === 'CRITICAL'
                    };
                    setAlerts(prev => [newAlert, ...prev].slice(0, 50));
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                setIsConnected(false);
            };

            ws.onclose = () => {
                console.log('WebSocket closed, reconnecting...');
                setIsConnected(false);
                setTimeout(connectWebSocket, 3000);
            };

            wsRef.current = ws;
        };

        connectWebSocket();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    return (
        <Layout>
            <div className="min-h-screen flex flex-col bg-black relative">
                {/* Cinematic Background Layer */}
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-cyan-500/[0.05] to-transparent" />
                    <div className="absolute inset-y-0 left-0 w-[1px] bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent" />
                    {/* Animated Scanning Beam */}
                    <motion.div
                        animate={{ y: ['-100%', '200%'] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent shadow-[0_0_30px_rgba(0,255,255,0.3)]"
                    />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,255,255,0.03),transparent_60%)]" />
                </div>

                {/* Header */}
                <div className="flex-none px-6 py-4 border-b border-white/10 bg-black/80 backdrop-blur-md relative z-10">
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <motion.div
                                animate={{
                                    boxShadow: isConnected
                                        ? ['0 0 20px rgba(0,255,255,0.3)', '0 0 40px rgba(0,255,255,0.6)', '0 0 20px rgba(0,255,255,0.3)']
                                        : '0 0 10px rgba(239,68,68,0.3)'
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center backdrop-blur-md"
                            >
                                <Shield className="w-7 h-7 text-cyan-400" />
                            </motion.div>

                            <div>
                                <h1 className="text-2xl font-black tracking-[0.2em] uppercase text-white flex gap-3">
                                    <GlitchText text="AUTONOMOUS" />
                                    <span className="text-cyan-500"><GlitchText text="SHIELD" /></span>
                                </h1>
                                <div className="flex items-center gap-3 mt-1">
                                    <p className="text-[10px] text-zinc-500 font-mono tracking-[0.3em]">ACTIVE_INTELLIGENCE_CORE_v4.2</p>
                                    <div className="h-3 w-[1px] bg-white/10" />
                                    <p className="text-[10px] text-green-500 font-mono tracking-widest uppercase">
                                        {isConnected ? 'SECURE_LINK_ESTABLISHED' : 'LINK_PENDING...'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setIsSuspectsOpen(true)}
                                    className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg backdrop-blur-sm hover:bg-red-500/20 transition-all group"
                                >
                                    <span className="text-[10px] font-black text-red-400 uppercase tracking-wider flex items-center gap-2">
                                        <Database className="w-3 h-3 group-hover:scale-110 transition-transform" />
                                        MANAGE TARGETS
                                    </span>
                                </button>

                                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
                                    <div className={cn(
                                        'w-2 h-2 rounded-full animate-pulse',
                                        isConnected ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'
                                    )} />
                                    <span className="text-[10px] font-mono text-white uppercase tracking-wider">
                                        {isConnected ? 'SYSTEM ONLINE' : 'OFFLINE'}
                                    </span>
                                </div>

                                <div className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg backdrop-blur-sm">
                                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                                        <Cpu className="w-3 h-3" />
                                        YOLOv8-NANO ACCELERATED
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Model Selector Section */}
                <div className="px-6 py-3 border-b border-white/10 bg-black/60 backdrop-blur-md relative z-10">
                    <ModelSelector />
                </div>

                {/* Main Content - Two Sections */}
                <div className="flex-1 flex flex-col relative z-10 text-white">

                    {/* Mission Control Matrix */}
                    <div className="px-6 pt-6 pb-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {/* 1. Tactical */}
                        <motion.div
                            whileHover={{ y: -2, scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                            className="bg-black/40 border border-white/10 rounded-lg p-3 backdrop-blur-md flex flex-col justify-between h-24 relative overflow-hidden group hover:border-cyan-500/30 hover:shadow-glow-blue transition-all">
                            <div className="flex justify-between items-start z-10">
                                <div>
                                    <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">TACTICAL</div>
                                    <div className="text-xl font-black text-white flex items-baseline gap-1">3 <span className="text-[10px] text-cyan-400 font-normal">ACTIVE</span></div>
                                </div>
                                <Activity className="w-3 h-3 text-cyan-500" />
                            </div>
                            <div className="h-8 w-full z-10">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={[{ n: '1', v: 85 }, { n: '2', v: 65 }, { n: '3', v: 92 }]}>
                                        <Bar dataKey="v" fill="#06b6d4" radius={[2, 2, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent group-hover:via-cyan-500/60 transition-all" />
                        </motion.div>

                        {/* 2. Alerts */}
                        <motion.div
                            whileHover={{ y: -2, scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                            className="bg-black/40 border border-white/10 rounded-lg p-3 backdrop-blur-md flex flex-col justify-between h-24 relative overflow-hidden group hover:border-red-500/30 hover:shadow-glow-red transition-all">
                            <div className="flex justify-between items-start z-10">
                                <div>
                                    <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">THREATS</div>
                                    <div className="text-xl font-black text-white flex items-baseline gap-1">12 <span className="text-[10px] text-red-400 font-normal">CRITICAL</span></div>
                                </div>
                                <AlertTriangle className="w-3 h-3 text-red-500" />
                            </div>
                            <div className="h-8 w-full z-10 opacity-60">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={[{ v: 20 }, { v: 40 }, { v: 30 }, { v: 70 }, { v: 45 }, { v: 80 }]}>
                                        <Area type="monotone" dataKey="v" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* 3. Devices */}
                        <motion.div
                            whileHover={{ y: -2, scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                            className="bg-black/40 border border-white/10 rounded-lg p-3 backdrop-blur-md flex flex-col justify-between h-24 relative overflow-hidden group hover:border-green-500/30 hover:shadow-glow-green transition-all">
                            <div className="flex justify-between items-start z-10">
                                <div>
                                    <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">ASSETS</div>
                                    <div className="text-xl font-black text-white flex items-baseline gap-1">98% <span className="text-[10px] text-green-400 font-normal">ONLINE</span></div>
                                </div>
                                <Database className="w-3 h-3 text-green-500" />
                            </div>
                            <div className="h-10 w-10 absolute bottom-2 right-2 z-10">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={[{ v: 42, c: '#22c55e' }, { v: 3, c: '#ef4444' }]} dataKey="v" innerRadius={8} outerRadius={14} paddingAngle={2}>
                                            <Cell fill="#22c55e" />
                                            <Cell fill="#ef4444" />
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* 4. Logs */}
                        <motion.div
                            whileHover={{ y: -2, scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                            className="bg-black/40 border border-white/10 rounded-lg p-3 backdrop-blur-md flex flex-col justify-between h-24 relative overflow-hidden group hover:border-blue-500/30 hover:shadow-glow-blue transition-all">
                            <div className="flex justify-between items-start z-10">
                                <div>
                                    <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">EVENTS</div>
                                    <div className="text-xl font-black text-white flex items-baseline gap-1">240 <span className="text-[10px] text-blue-400 font-normal">EPS</span></div>
                                </div>
                                <Activity className="w-3 h-3 text-blue-500" />
                            </div>
                            <div className="h-8 w-full z-10">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={[{ v: 100 }, { v: 140 }, { v: 120 }, { v: 180 }, { v: 160 }, { v: 240 }]}>
                                        <Line type="step" dataKey="v" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* 5. Neural */}
                        <motion.div
                            whileHover={{ y: -2, scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                            className="bg-black/40 border border-white/10 rounded-lg p-3 backdrop-blur-md flex flex-col justify-between h-24 relative overflow-hidden group hover:border-purple-500/30 hover:shadow-glow-blue transition-all">
                            <div className="flex justify-between items-start z-10">
                                <div>
                                    <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">NEURAL</div>
                                    <div className="text-xl font-black text-white flex items-baseline gap-1">94% <span className="text-[10px] text-purple-400 font-normal">CONF</span></div>
                                </div>
                                <Cpu className="w-3 h-3 text-purple-500" />
                            </div>
                            <div className="h-8 w-full z-10">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={[{ v: 80 }, { v: 85 }, { v: 82 }, { v: 90 }, { v: 88 }, { v: 94 }]}>
                                        <Line type="monotone" dataKey="v" stroke="#a855f7" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    </div>

                    {/* Top Section - Dashboard Grid */}
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4">
                        {/* Left Sidebar - System Vitals & Widgets */}
                        <div className="col-span-1 lg:col-span-3 space-y-4">
                            {/* Security Score Widget */}
                            <SecurityScore score={securityScore} className="w-full" />

                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="bg-black/40 border border-white/10 rounded-xl p-4 backdrop-blur-md"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <Activity className="w-4 h-4 text-cyan-400" />
                                    <h3 className="text-xs font-black text-white uppercase tracking-wider">
                                        Live Telemetry
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <StatCard
                                        label="Total Detections"
                                        value={stats.totalDetections.toString()}
                                        icon={Eye}
                                        trend="neutral"
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <StatCard
                                            label="FPS"
                                            value={stats.fps.toString()}
                                            icon={Zap}
                                            trend="success"
                                        />
                                        <StatCard
                                            label="Latency"
                                            value={stats.latency}
                                            icon={Radio}
                                            trend="success"
                                        />
                                    </div>
                                    <StatCard
                                        label="Critical Alerts"
                                        value={stats.criticalAlerts.toString()}
                                        icon={AlertTriangle}
                                        trend={stats.criticalAlerts > 0 ? 'critical' : 'success'}
                                    />
                                </div>
                            </motion.div>

                            {/* Sensor Fusion / Environmental Intel */}
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="bg-black/40 border border-white/10 rounded-xl p-4 backdrop-blur-md"
                            >
                                <SensorFusion />
                            </motion.div>

                            {/* Edge Computing Node Status */}
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                <EdgeComputing />
                            </motion.div>
                        </div>

                        {/* Center - Visual Cortex */}
                        <div className="col-span-1 lg:col-span-6 flex flex-col gap-4 h-full">
                            {/* TOP: Visual Cortex (Live Feed) - 60% Height */}
                            <div className="flex-[3] relative bg-black/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md group">
                                {/* Header Overlay */}
                                <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                        <h2 className="text-sm font-black text-white tracking-[0.2em] uppercase">
                                            Visual Cortex
                                        </h2>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono text-cyan-400">LIVE FEED</span>
                                        <div className="px-2 py-0.5 bg-red-500/20 border border-red-500/50 rounded text-[10px] text-red-500 font-bold animate-pulse">
                                            REC
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="absolute inset-0 z-10">
                                    <LiveFeed
                                        isActive={true}
                                        detections={detections}
                                        processingStats={stats}
                                    />
                                    {/* AI Overlay */}
                                    <AIDetectionOverlay
                                        detections={detections}
                                        isConnected={isConnected}
                                    />
                                </div>
                            </div>

                            {/* MODULE SHOWCASE: Command Capabilities */}
                            <div className="h-48 grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Neural Analytics Card */}
                                <div className="group relative bg-black/40 border border-white/10 rounded-xl p-4 overflow-hidden hover:border-purple-500/50 transition-all cursor-pointer">
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <Brain className="w-8 h-8 text-purple-500 mb-3" />
                                    <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">
                                        Neural Analytics
                                    </h3>
                                    <p className="text-[10px] text-zinc-400 leading-tight mb-3">
                                        Deep dive into AI confidence scoring, forensic event logs, and historical pattern recognition.
                                    </p>
                                    <div className="text-[9px] font-mono text-purple-400 flex items-center gap-1">
                                        ACCESS_MODULE <span className="text-xs">→</span>
                                    </div>
                                </div>

                                {/* Tactical 3D Card */}
                                <div className="group relative bg-black/40 border border-white/10 rounded-xl p-4 overflow-hidden hover:border-cyan-500/50 transition-all cursor-pointer">
                                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <Target className="w-8 h-8 text-cyan-500 mb-3" />
                                    <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">
                                        Tactical 3D
                                    </h3>
                                    <p className="text-[10px] text-zinc-400 leading-tight mb-3">
                                        Real-time asset tracking in 3D space. Monitor drone telemetry, battery, and signal coverage.
                                    </p>
                                    <div className="text-[9px] font-mono text-cyan-400 flex items-center gap-1">
                                        ACCESS_MODULE <span className="text-xs">→</span>
                                    </div>
                                </div>

                                {/* Devices & Assets Card */}
                                <div className="group relative bg-black/40 border border-white/10 rounded-xl p-4 overflow-hidden hover:border-green-500/50 transition-all cursor-pointer">
                                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <Cpu className="w-8 h-8 text-green-500 mb-3" />
                                    <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">
                                        Asset Control
                                    </h3>
                                    <p className="text-[10px] text-zinc-400 leading-tight mb-3">
                                        Manage hardware nodes, reboot cameras, check server load, and update firmware.
                                    </p>
                                    <div className="text-[9px] font-mono text-green-400 flex items-center gap-1">
                                        ACCESS_MODULE <span className="text-xs">→</span>
                                    </div>
                                </div>

                                {/* System Logs Card */}
                                <div className="group relative bg-black/40 border border-white/10 rounded-xl p-4 overflow-hidden hover:border-amber-500/50 transition-all cursor-pointer">
                                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <Database className="w-8 h-8 text-amber-500 mb-3" />
                                    <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">
                                        System Logs
                                    </h3>
                                    <p className="text-[10px] text-zinc-400 leading-tight mb-3">
                                        Audit trail of all security events, user actions, and system health warnings.
                                    </p>
                                    <div className="text-[9px] font-mono text-amber-400 flex items-center gap-1">
                                        ACCESS_MODULE <span className="text-xs">→</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Sidebar - Deployed Units */}
                        <div className="col-span-1 lg:col-span-3 flex flex-col gap-4">
                            {/* Active Units List */}
                            <div className="bg-black/40 border border-white/10 rounded-xl p-4 backdrop-blur-md">
                                <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                                    <Users className="w-4 h-4 text-cyan-400" />
                                    <h3 className="text-xs font-black text-white uppercase tracking-wider">
                                        Deployed Units
                                    </h3>
                                </div>
                                <div className="space-y-2">
                                    {[
                                        { name: 'ALPHA_TEAM', status: 'PATROL', loc: 'SECTOR_4', color: 'text-green-400' },
                                        { name: 'BRAVO_DRONE', status: 'SURVEIL', loc: 'GATE_N', color: 'text-cyan-400' },
                                        { name: 'CHARLIE_BOT', status: 'CHARGING', loc: 'BASE', color: 'text-amber-400' },
                                    ].map((unit, i) => (
                                        <div key={i} className="flex items-center justify-between text-[10px] bg-white/5 p-2 rounded">
                                            <div className="font-bold text-zinc-300">{unit.name}</div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-zinc-500 font-mono">{unit.loc}</span>
                                                <span className={cn("font-black", unit.color)}>{unit.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <SuspectsManager
                isOpen={isSuspectsOpen}
                onClose={() => setIsSuspectsOpen(false)}
            />
        </Layout>
    );
}

function StatCard({ label, value, icon: Icon, trend }: { label: string, value: string, icon: any, trend: 'neutral' | 'success' | 'warning' | 'critical' }) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between group hover:border-white/20 transition-all">
            <div>
                <p className="text-[9px] text-zinc-400 font-bold tracking-wider uppercase mb-1">{label}</p>
                <div className="text-lg font-black text-white tracking-tight">{value}</div>
            </div>
            <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center border transition-all",
                trend === 'success' && "bg-green-500/10 border-green-500/20 text-green-400 group-hover:scale-110",
                trend === 'warning' && "bg-amber-500/10 border-amber-500/20 text-amber-400 group-hover:scale-110",
                trend === 'critical' && "bg-red-500/10 border-red-500/20 text-red-400 group-hover:scale-110 animate-pulse",
                trend === 'neutral' && "bg-cyan-500/10 border-cyan-500/20 text-cyan-400 group-hover:scale-110"
            )}>
                <Icon className="w-4 h-4" />
            </div>
        </div>
    );
}
