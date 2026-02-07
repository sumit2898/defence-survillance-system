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
import { cn } from '@/lib/utils';

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

import { SecurityScore } from '@/components/SecurityScore';
import { GlitchText } from '@/components/GlitchText';

export default function AutonomousShield() {
    const [isConnected, setIsConnected] = useState(false);
    const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
    const [detections, setDetections] = useState<Detection[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [stats, setStats] = useState<AIStats>({
        totalDetections: 0,
        criticalAlerts: 0,
        suspiciousEvents: 0,
        normalActivity: 0,
        fps: 20,
        latency: '<100ms'
    });

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
            const ws = new WebSocket('ws://localhost:8000/api/ai/stream');

            ws.onopen = () => {
                console.log('🛡️ Connected to Autonomous Shield AI');
                setIsConnected(true);
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);

                if (data.type === 'frame_analysis') {
                    setDetections(data.detections || []);

                    // Update stats
                    const critical = data.detections.filter((d: Detection) => d.threat_level === 'critical').length;
                    const suspicious = data.detections.filter((d: Detection) => d.threat_level === 'suspicious').length;
                    const normal = data.detections.filter((d: Detection) => d.threat_level === 'normal').length;

                    setStats(prev => ({
                        ...prev,
                        totalDetections: prev.totalDetections + data.detections.length,
                        criticalAlerts: prev.criticalAlerts + critical,
                        suspiciousEvents: prev.suspiciousEvents + suspicious,
                        normalActivity: prev.normalActivity + normal
                    }));
                }

                if (data.type === 'critical_alert') {
                    setAlerts(prev => [data.alert, ...prev].slice(0, 50)); // Keep last 50 alerts
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
                                        {isConnected ? 'SECURE_LINK_BSTABLISHED' : 'LINK_PENDING...'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
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

                {/* Main Content - Two Sections */}
                <div className="flex-1 flex flex-col relative z-10 text-white">

                    {/* Mission Control Matrix */}
                    <div className="px-6 pt-6 pb-2 grid grid-cols-5 gap-4">
                        {/* 1. Tactical */}
                        <div className="bg-black/40 border border-white/10 rounded-lg p-3 backdrop-blur-md flex flex-col justify-between h-24 relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
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
                        </div>

                        {/* 2. Alerts */}
                        <div className="bg-black/40 border border-white/10 rounded-lg p-3 backdrop-blur-md flex flex-col justify-between h-24 relative overflow-hidden group hover:border-red-500/30 transition-colors">
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
                        </div>

                        {/* 3. Devices */}
                        <div className="bg-black/40 border border-white/10 rounded-lg p-3 backdrop-blur-md flex flex-col justify-between h-24 relative overflow-hidden group hover:border-green-500/30 transition-colors">
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
                        </div>

                        {/* 4. Logs */}
                        <div className="bg-black/40 border border-white/10 rounded-lg p-3 backdrop-blur-md flex flex-col justify-between h-24 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
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
                        </div>

                        {/* 5. Neural */}
                        <div className="bg-black/40 border border-white/10 rounded-lg p-3 backdrop-blur-md flex flex-col justify-between h-24 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
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
                        </div>
                    </div>
                    {/* Top Section - Dashboard Grid */}
                    <div className="flex-1 grid grid-cols-12 gap-4 p-4">
                        {/* Left Sidebar - System Vitals & Widgets */}
                        <div className="col-span-3 space-y-4">
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

                            {/* Environmental Intel */}
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="bg-black/40 border border-white/10 rounded-xl p-4 backdrop-blur-md"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <Globe className="w-4 h-4 text-cyan-400" />
                                    <h3 className="text-xs font-black text-white uppercase tracking-wider">
                                        Sector Environment
                                    </h3>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div className="bg-white/5 rounded p-2 flex flex-col items-center justify-center">
                                        <Wind className="w-4 h-4 text-zinc-400 mb-1" />
                                        <span className="text-lg font-bold text-white">12<span className="text-[9px] text-zinc-500 ml-0.5">KM/H</span></span>
                                        <span className="text-[9px] text-zinc-500 uppercase">NW WIND</span>
                                    </div>
                                    <div className="bg-white/5 rounded p-2 flex flex-col items-center justify-center">
                                        <Thermometer className="w-4 h-4 text-zinc-400 mb-1" />
                                        <span className="text-lg font-bold text-white">24<span className="text-[9px] text-zinc-500 ml-0.5">°C</span></span>
                                        <span className="text-[9px] text-zinc-500 uppercase">TEMP</span>
                                    </div>
                                    <div className="bg-white/5 rounded p-2 flex flex-col items-center justify-center">
                                        <Droplets className="w-4 h-4 text-zinc-400 mb-1" />
                                        <span className="text-lg font-bold text-white">45<span className="text-[9px] text-zinc-500 ml-0.5">%</span></span>
                                        <span className="text-[9px] text-zinc-500 uppercase">HUMIDITY</span>
                                    </div>
                                    <div className="bg-white/5 rounded p-2 flex flex-col items-center justify-center">
                                        <Activity className="w-4 h-4 text-zinc-400 mb-1" />
                                        <span className="text-lg font-bold text-white">98<span className="text-[9px] text-zinc-500 ml-0.5">kPa</span></span>
                                        <span className="text-[9px] text-zinc-500 uppercase">PRESSURE</span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Network Link Status */}
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="bg-black/40 border border-white/10 rounded-xl p-4 backdrop-blur-md"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Wifi className="w-4 h-4 text-cyan-400" />
                                        <h3 className="text-xs font-black text-white uppercase tracking-wider">UPLINK</h3>
                                    </div>
                                    <span className="text-[9px] font-mono text-green-400">1.2 GB/s STABLE</span>
                                </div>
                                <div className="h-24 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={Array.from({ length: 15 }, (_, i) => ({ v: 50 + Math.random() * 40 }))}>
                                            <defs>
                                                <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <Area type="monotone" dataKey="v" stroke="#06b6d4" fill="url(#colorNet)" strokeWidth={2} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </motion.div>



                        </div>

                        {/* Center - Live Feed + Map Split */}
                        <div className="col-span-6 flex flex-col gap-4 h-full">

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

                            {/* BOTTOM: Geospatial Intel (Map) - 40% Height */}
                            <div className="flex-[2] relative bg-black/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
                                <ThreatMap alerts={alerts} />
                            </div>

                            {/* MODULE SHOWCASE: Command Capabilities */}
                            <div className="h-48 grid grid-cols-4 gap-4">
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
                        <div className="col-span-3 flex flex-col gap-4">
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

                            <div className="flex-1 bg-black/40 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md">
                                <ThreatConsole alerts={alerts} />
                            </div>

                            {/* Neural Terminal */}
                            <div className="h-32 bg-black/80 border-t border-cyan-500/20 p-2 font-mono text-[10px] overflow-hidden relative">
                                <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-black to-transparent pointer-events-none z-10" />
                                <div className="flex items-center gap-2 mb-2 text-cyan-500 border-b border-white/10 pb-1">
                                    <Terminal className="w-3 h-3" />
                                    <span className="font-bold tracking-wider">SENTIENT_LINK_V4</span>
                                </div>
                                <div className="flex flex-col gap-1 opacity-80">
                                    {terminalLogs.map((log, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1 - (i * 0.15), x: 0 }}
                                            className="text-cyan-400/80 truncate"
                                        >
                                            <span className="text-zinc-600 mr-2">{'>'}</span>
                                            {log}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

// Stat Card Component
function StatCard({
    label,
    value,
    icon: Icon,
    trend
}: {
    label: string;
    value: string;
    icon: any;
    trend: 'success' | 'warning' | 'critical' | 'neutral';
}) {
    const colors = {
        success: 'text-green-400 border-green-500/30 bg-green-500/10',
        warning: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
        critical: 'text-red-400 border-red-500/30 bg-red-500/10',
        neutral: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10'
    };

    return (
        <div className={cn(
            'p-3 border rounded-lg',
            colors[trend]
        )}>
            <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{label}</span>
                <Icon className="w-3 h-3" />
            </div>
            <div className="text-xl font-black font-mono">{value}</div>
        </div>
    );
}
