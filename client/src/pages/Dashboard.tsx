import { Layout } from "@/components/Layout";
import { StatsCard } from "@/components/StatsCard";
import { FeedPlayer } from "@/components/FeedPlayer";
// MapBackground removed
import { TelemetryCard } from "@/components/TelemetryCard";
import { SecurityScore } from "@/components/SecurityScore";
import React from "react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { NetworkTraffic } from "@/components/NetworkTraffic";
import { useAlerts } from "@/hooks/use-alerts";
import { useDevices } from "@/hooks/use-devices";
import { useIncidents } from "@/hooks/use-incidents";
import { useLogs } from "@/hooks/use-logs";
import { AlertTriangle, Wifi, Shield, Activity, Plus, Database, Battery, Navigation, Signal, Crosshair, Cpu, Lock, Terminal, MapPin, Clock, BarChart3, PieChart as PieChartIcon, HardDrive, Zap, TrendingUp, Thermometer, Radio, Scan } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { TiltCard } from "@/components/TiltCard";
import { GlitchText } from "@/components/GlitchText";
import { BootScreen } from "@/components/BootScreen";

const mockActivityData = Array.from({ length: 24 }, (_, i) => ({
  time: `${i}:00`,
  activity: Math.floor(Math.random() * 50) + 10,
  threats: Math.floor(Math.random() * 5),
  bandwidth: Math.floor(Math.random() * 1000) + 200,
}));

const mockThermalData = Array.from({ length: 12 }, (_, i) => ({
  node: `NODE_${i.toString().padStart(2, '0')} `,
  temp: Math.floor(Math.random() * 20) + 35,
  load: Math.floor(Math.random() * 40) + 20,
}));

const pieData = [
  { name: 'Cameras', value: 40, color: '#22c55e' },
  { name: 'Sensors', value: 30, color: '#3b82f6' },
  { name: 'Drones', value: 20, color: '#a855f7' },
  { name: 'Access', value: 10, color: '#f59e0b' },
];

export default function Dashboard() {
  const [showBoot, setShowBoot] = React.useState(true);
  const { data: alerts } = useAlerts();
  const { data: devices } = useDevices();
  const { data: logs } = useLogs();

  const activeAlerts = alerts?.filter(a => a.status === 'active').length || 0;

  // Security simulation
  const securityScore = Math.max(0, 100 - (activeAlerts * 15));

  return (
    <Layout className="flex flex-col p-6 pointer-events-auto border-none">
      <AnimatePresence>
        {showBoot && <BootScreen onComplete={() => setShowBoot(false)} />}
      </AnimatePresence>

      {/* Cinematic Background Layer */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-green-500/[0.05] to-transparent" />
        <div className="absolute inset-y-0 left-0 w-[1px] bg-gradient-to-b from-transparent via-green-500/20 to-transparent" />
        {/* Animated Scanning Beam */}
        <motion.div
          animate={{ y: ['-100%', '200%'] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute inset-x-0 h-[1px] bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.2)]"
        />
      </div>

      <div className="relative z-10 w-full max-w-[1600px] mx-auto space-y-8 pb-20">
        {/* Top HUD Header */}
        <motion.header
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="sticky top-6 z-50 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex justify-between items-center shadow-2xl mb-12"
        >
          <div className="flex items-center gap-8">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/20 blur-md animate-pulse" />
              <motion.div
                whileHover={{ rotate: 90 }}
                className="relative w-16 h-16 bg-gradient-to-br from-zinc-800 to-zinc-950 border border-white/10 rounded-2xl flex items-center justify-center cursor-crosshair shadow-2xl group"
              >
                <div className="absolute inset-0 rounded-2xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Shield className="w-8 h-8 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
              </motion.div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" />
                <h1 className="text-4xl font-black tracking-widest uppercase text-white leading-none flex gap-2">
                  <GlitchText text="SKY" />
                  <span className="text-green-500"><GlitchText text="WATCH" className="text-green-500" /></span>
                </h1>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <p className="text-[10px] text-zinc-500 font-mono tracking-[0.5em] uppercase leading-none">GLOBAL_CORE_v3.0.4</p>
                <div className="h-3 w-[1px] bg-white/10" />
                <p className="text-[10px] text-green-500/60 font-mono uppercase tracking-widest">SECURE_LINK_CONNECTED</p>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex gap-8 items-center">
            {/* Functional Scroll Indicator */}
            <div className="flex flex-col items-end border-r border-white/10 pr-8">
              <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-[0.2em] mb-1.5">Sector depth</span>
              <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div
                  className="h-full bg-green-500 shadow-[0_0_10px_#22c55e]"
                  initial={{ width: "30%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                />
              </div>
            </div>

            <div className="flex flex-col items-end border-r border-white/10 pr-8">
              <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-[0.2em]">Authority level</span>
              <span className="text-xs font-black font-mono text-purple-400 uppercase tracking-[0.3em]">LEVEL_5_ADMIN</span>
            </div>

            <div className="flex gap-4">
              <motion.button whileHover={{ scale: 1.05 }} className="w-12 h-12 bg-zinc-800/50 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center hover:bg-zinc-700 transition-all shadow-lg group">
                <Lock className="h-5 w-5 text-zinc-400 group-hover:text-white" />
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} className="w-12 h-12 bg-zinc-800/50 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center hover:bg-zinc-700 transition-all shadow-lg group">
                <Terminal className="h-5 w-5 text-zinc-400 group-hover:text-white" />
              </motion.button>
            </div>
          </div>
        </motion.header>

        {/* SECTION 1: Summary Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          id="section-summary"
          className="scroll-mt-32 space-y-4"
        >
          <div className="flex items-center gap-4 mb-6 px-2">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-white/10 flex items-center justify-center shadow-lg">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] block mb-1">SECTION_01</span>
              <span className="text-xl font-black text-white uppercase tracking-widest leading-none">QUICK_METRICS</span>
            </div>
            <div className="flex-1 h-px bg-white/5" />
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-mono text-green-500 uppercase">Status: Nominal</span>
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <TiltCard>
              <SecurityScore score={securityScore} className="h-64 shadow-2xl" />
            </TiltCard>
            <div className="grid grid-rows-2 gap-4">
              <TiltCard className="h-full"><TelemetryCard label="Active Threats" value={activeAlerts.toString()} icon={AlertTriangle} status={activeAlerts > 0 ? 'critical' : 'normal'} className="h-full" /></TiltCard>
              <TiltCard className="h-full"><TelemetryCard label="System Load" value="44.2" unit="%" icon={Cpu} className="h-full" /></TiltCard>
            </div>
            <div className="grid grid-rows-2 gap-4">
              <TiltCard className="h-full"><TelemetryCard label="Throughput" value="1.2" unit="Gbps" icon={Zap} className="h-full" /></TiltCard>
              <TiltCard className="h-full"><TelemetryCard label="Stored Data" value="84" unit="TB" icon={Database} className="h-full" /></TiltCard>
            </div>
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden relative p-6 flex flex-col justify-between group">
              <div className="absolute top-0 right-0 p-2 bg-green-500/10 text-[8px] font-mono text-green-500 rounded-bl tracking-widest px-3 py-1 uppercase">Network_Flux</div>
              <div className="flex-1">
                <NetworkTraffic className="h-full opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-end">
                <div>
                  <p className="text-[8px] text-zinc-500 uppercase tracking-widest">Global latency</p>
                  <p className="text-xl font-black text-white font-mono leading-none mt-1">12ms</p>
                </div>
                <div className="bg-green-500/10 px-2 py-1 rounded text-[10px] text-green-500 font-mono font-bold uppercase tracking-tighter">OPTIMAL</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* SECTION 2: Map & Analytics Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          id="section-map"
          className="scroll-mt-32 space-y-4"
        >
          <div className="flex items-center gap-4 mb-6 px-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-lg shadow-blue-500/5">
              <MapPin className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <span className="text-[10px] font-black text-blue-500/60 uppercase tracking-[0.2em] block mb-1">SECTION_02</span>
              <span className="text-xl font-black text-white uppercase tracking-widest leading-none">GEOSPATIAL_INTEL</span>
            </div>
            <div className="flex-1 h-px bg-white/5" />
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-mono text-blue-400 uppercase">Uplink: Active</span>
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Map Viewport */}
            <div className="lg:col-span-8 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden min-h-[600px] relative shadow-2xl group transition-all duration-500 hover:shadow-[0_0_50px_rgba(0,0,0,0.5)] border-white/10 hover:border-white/20">
              <div className="absolute inset-0 z-0 bg-black/50">
                {/* MapBackground container removed */}
                <div className="absolute inset-0 bg-green-500/[0.02] mix-blend-overlay pointer-events-none" />
              </div>

              {/* Map HUD Overlays */}
              <div className="absolute top-8 left-8 z-10 p-6 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl">
                <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]" />
                  SATELLITE_LINK_ALPHA
                </h3>
                <p className="text-[8px] text-zinc-500 font-mono mt-2 uppercase tracking-widest">LAT: 40.7128 | LONG: -74.0060</p>
              </div>

              <div className="absolute top-8 right-8 z-10 flex flex-col gap-3">
                <button className="p-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl text-zinc-400 hover:text-white transition-all hover:scale-110"><Scan className="h-5 w-5" /></button>
                <button className="p-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl text-zinc-400 hover:text-white transition-all hover:scale-110"><Navigation className="h-5 w-5" /></button>
              </div>

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <div className="w-[500px] h-[500px] border border-green-500/20 rounded-full animate-spin-slow flex items-center justify-center">
                  <div className="w-[400px] h-[400px] border border-dashed border-green-500/30 rounded-full" />
                  <Crosshair className="h-20 w-20 text-green-500/40" />
                </div>
              </div>

              {/* Bottom Map Info */}
              <div className="absolute bottom-8 left-8 right-8 z-10 grid grid-cols-4 gap-4">
                {['Grid_S1', 'Grid_S2', 'Grid_S3', 'Grid_S4'].map((sector) => (
                  <div key={sector} className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-4 flex flex-col pointer-events-auto hover:bg-white/5 transition-all">
                    <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-widest mb-1">{sector}</span>
                    <div className="flex justify-between items-end">
                      <span className="text-lg font-black text-white leading-none uppercase">Clear</span>
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Side Analytics Column */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Real-time Activity Card */}
              <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col flex-1 hover:border-white/20 transition-all duration-300">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    GLOBAL_TRAFFIC_METRICS
                  </h3>
                  <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-tighter">Rolling_24H</span>
                </div>
                <div className="flex-1 min-h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockActivityData}>
                      <defs>
                        <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        itemStyle={{ color: '#22c55e', fontSize: '10px' }}
                        labelStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="activity" stroke="#22c55e" fillOpacity={1} fill="url(#colorActivity)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                    <p className="text-[8px] text-zinc-500 uppercase tracking-widest">Peak Load</p>
                    <p className="text-xl font-black text-white uppercase">2.4 Gbps</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                    <p className="text-[8px] text-zinc-500 uppercase tracking-widest">Avg Temp</p>
                    <p className="text-xl font-black text-white uppercase">42.1 °C</p>
                  </div>
                </div>
              </div>

              {/* Asset Distribution Pie */}
              <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden hover:border-white/20 transition-all duration-300">
                <div className="flex justify-between items-center mb-6 relative z-10">
                  <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 text-blue-400" />
                    ASSET_DISTRIBUTION
                  </h3>
                </div>
                <div className="h-56 relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell - ${index} `} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Total assets in center */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-white">{devices?.length || 0}</span>
                    <span className="text-[8px] text-zinc-500 uppercase font-mono tracking-widest">UNITS</span>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex justify-between items-center text-[9px] uppercase font-mono font-bold">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-zinc-400">{item.name}</span>
                      </div>
                      <span className="text-white">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* SECTION 3: Live Feeds & Tactical Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          id="section-feeds"
          className="scroll-mt-32 space-y-4"
        >
          <div className="flex items-center gap-4 mb-6 px-2">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shadow-lg shadow-green-500/5">
              <Radio className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <span className="text-[10px] font-black text-green-500/60 uppercase tracking-[0.2em] block mb-1">SECTION_03</span>
              <span className="text-xl font-black text-white uppercase tracking-widest leading-none">CLUSTER_MONITOR</span>
            </div>
            <div className="flex-1 h-px bg-white/5" />
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-mono text-green-500 uppercase">Nodes: 14/14 Online</span>
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_5px_#22c55e]" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Live Feed Hub - Updated to col-span-8 for alignment */}
            <div className="lg:col-span-8 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group hover:border-white/20 transition-all duration-300">
              <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/[0.02] blur-[100px] pointer-events-none" />

              <div className="flex justify-between items-end mb-8 border-b border-white/5 pb-6">
                <div>
                  <span className="text-[10px] text-zinc-500 font-mono tracking-[0.5em] uppercase">SURVEILLANCE_CLUSTER_04</span>
                  <h2 className="text-2xl font-black text-white uppercase tracking-widest mt-2 flex items-center gap-4">
                    <Radio className="h-6 w-6 text-green-500 animate-pulse" />
                    ACTIVE_FIELD_NODES
                  </h2>
                </div>
                <div className="flex gap-4">
                  <button className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-zinc-400 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest">SELECT_ALL</button>
                  <button className="px-5 py-2.5 bg-green-500/10 border border-green-500/20 rounded-xl text-[10px] font-black text-green-500 hover:bg-green-500/20 transition-all uppercase tracking-widest shadow-[0_0_20px_rgba(34,197,94,0.1)]">OPTIMIZE_MESH</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(devices?.filter(d => d.videoUrl) || []).slice(0, 4).map(device => (
                  <motion.div
                    whileHover={{ scale: 1.02, y: -4 }}
                    key={device.id}
                    className="aspect-video bg-zinc-950 rounded-2xl border border-white/10 relative overflow-hidden group/feed shadow-2xl"
                  >
                    <FeedPlayer id={device.id} videoUrl={device.videoUrl} name="" status={device.status as any} />
                    <div className="absolute top-4 left-4 px-3 py-1 bg-black/80 backdrop-blur-md text-[10px] font-black font-mono text-white rounded-lg border border-white/10 group-hover/feed:border-green-500/30 transition-all uppercase tracking-[0.2em] z-10">
                      NODE_{device.id.toString().padStart(3, '0')} // {device.name}
                    </div>
                    {/* Kinetic HUD Scanning Frame */}
                    <div className="absolute inset-0 border border-green-500/0 group-hover/feed:border-green-500/20 transition-all pointer-events-none z-20" />
                    <div className="absolute inset-x-0 h-px bg-green-500/20 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover/feed:opacity-100 transition-opacity" />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* System Health/Hardware Summary - Updated to col-span-4 */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden hover:border-white/20 transition-all duration-300">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500/40 via-transparent to-transparent" />
                <h3 className="text-[10px] font-black text-white mb-6 uppercase tracking-widest flex items-center gap-3">
                  <Thermometer className="h-4 w-4 text-orange-500" />
                  THERMAL_TOPOLOGY
                </h3>
                <div className="space-y-4">
                  {mockThermalData.slice(0, 5).map((node) => (
                    <div key={node.node} className="space-y-1.5">
                      <div className="flex justify-between text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
                        <span>{node.node}</span>
                        <span className={cn(node.temp > 50 ? "text-red-500" : "text-green-500")}>{node.temp} °C</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                        <div
                          className={cn("h-full transition-all duration-1000",
                            node.temp > 50 ? "bg-red-500 shadow-[0_0_10px_#ef4444]" : "bg-green-500 shadow-[0_0_10px_#22c55e]"
                          )}
                          style={{ width: `${(node.temp / 60) * 100}% ` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative group hover:border-white/20 transition-all duration-300">
                <h3 className="text-[10px] font-black text-white mb-6 uppercase tracking-widest flex items-center gap-3">
                  <HardDrive className="h-4 w-4 text-blue-500" />
                  STORAGE_NODES
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5 group-hover:border-blue-500/20 transition-all">
                    <p className="text-[8px] text-zinc-500 uppercase tracking-widest mb-1">Vol_Arc_Primary</p>
                    <div className="flex justify-between items-end">
                      <span className="text-lg font-black text-white leading-none font-mono">2.4 PB</span>
                      <span className="text-[8px] font-mono text-zinc-500 uppercase">92%_USED</span>
                    </div>
                  </div>
                  <button className="w-full py-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] transition-all">
                    INIT_PURGE_PROTOCOL
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* SECTION 4: Threat Log Terminal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.3 }}
          id="section-logs"
          className="scroll-mt-32 space-y-4"
        >
          <div className="flex items-center gap-4 mb-6 px-2">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-lg shadow-red-500/5">
              <Shield className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <span className="text-[10px] font-black text-red-500/60 uppercase tracking-[0.2em] block mb-1">SECTION_04</span>
              <span className="text-xl font-black text-white uppercase tracking-widest leading-none">NETWORK_AUDIT</span>
            </div>
            <div className="flex-1 h-px bg-white/5" />
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-mono text-red-500 uppercase">Alerts: {activeAlerts} Active</span>
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Long Scrolling Log Console */}
            <div className="lg:col-span-8 bg-zinc-950 border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative min-h-[500px] hover:border-white/20 transition-all duration-300">
              <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between sticky top-0 bg-zinc-950/80 backdrop-blur-md z-20">
                <div className="flex items-center gap-4">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  </div>
                  <span className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.3em]">ROOT_AUDIT_STREAM</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-[8px] font-mono text-zinc-500 uppercase">Buffer_nominal: 100%</span>
                  <div className="w-[1px] h-4 bg-white/10" />
                  <button className="text-[10px] font-black text-white/40 hover:text-white transition-colors uppercase tracking-widest">Clear_Terminal</button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 font-mono text-xs custom-scrollbar space-y-3">
                {logs?.map((log, i) => (
                  <div key={i} className="flex gap-6 group/log py-2 hover:bg-white/5 px-4 rounded-xl transition-all border border-transparent hover:border-white/5">
                    <span className="text-zinc-600 shrink-0 font-bold uppercase tracking-tighter">[{format(new Date(log.timestamp), 'HH:mm:ss:SSS')}]</span>
                    <div className="flex items-start gap-4 flex-1">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest min-w-[80px] text-center",
                        log.level === 'error' ? "bg-red-500 text-white" :
                          log.level === 'warning' ? "bg-yellow-500 text-black" : "bg-green-500 text-white"
                      )}>
                        {log.level}
                      </span>
                      <div className="flex-1">
                        <span className="text-white font-black uppercase text-[11px] mr-3">{log.action}:</span>
                        <span className="text-zinc-400 leading-relaxed text-[11px]">{log.details}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-2 text-green-500 animate-pulse mt-4 px-4">
                  <span className="text-sm">_</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em]">SYSTEM_AWAITING_INPUT...</span>
                </div>
              </div>
            </div>

            {/* High Priority Alerts Panel */}
            <div className="lg:col-span-4 bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl flex flex-col overflow-hidden shadow-2xl hover:border-white/20 transition-all duration-300">
              <div className="p-6 border-b border-white/10 bg-red-500/[0.05] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent animate-pulse" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-4 text-red-500 relative z-10">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  CRITICAL_OVERRIDE
                </h3>
                <span className="absolute top-8 right-6 z-10 text-[10px] font-black bg-red-500 text-white px-3 py-1 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                  {activeAlerts} ACTIVE_NODES
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {alerts?.filter(a => a.status === 'active').map((alert, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={alert.id}
                    className="p-5 border border-red-500/30 bg-red-500/[0.03] rounded-2xl hover:bg-red-500/[0.08] transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500 shadow-[0_0_15px_#ef4444]" />
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-xs font-black text-red-500 uppercase tracking-tight">{alert.title}</h4>
                      <span className="text-[9px] font-mono text-zinc-600 bg-black/40 px-2 py-0.5 rounded border border-white/5">PRI_01</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-medium leading-relaxed mb-4">{alert.description}</p>
                    <div className="flex justify-between items-center text-[9px] text-zinc-500 uppercase font-black tracking-widest font-mono border-t border-white/5 pt-3">
                      <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{alert.location}</span>
                      <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" />{format(new Date(alert.timestamp), 'HH:mm:ss')}</span>
                    </div>
                  </motion.div>
                ))}
                {!activeAlerts && (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-800 p-10 text-center grayscale opacity-30">
                    <Shield className="h-24 w-24 mb-6 stroke-1" />
                    <p className="font-black text-[10px] uppercase tracking-[0.5em]">SYSTEM_STABLE_ALL_SECTORS_NOMINAL</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Floating Section Navigator */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col gap-8 items-center bg-black/40 backdrop-blur-md p-3 rounded-full border border-white/5 shadow-2xl">
        {['summary', 'map', 'feeds', 'logs'].map((section, i) => (
          <motion.a
            key={section}
            href={`#section - ${section} `}
            whileHover={{ scale: 1.2, x: -4 }}
            className="group relative"
          >
            <div className="w-2 h-2 rounded-full bg-white/20 group-hover:bg-green-500 transition-colors shadow-[0_0_0_4px_rgba(255,255,255,0.02)]" />
            <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
              <div className="bg-black/80 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-lg whitespace-nowrap">
                <span className="text-[9px] font-black text-white uppercase tracking-widest">0{i + 1}_{section.toUpperCase()}</span>
              </div>
            </div>
          </motion.a>
        ))}
      </div>
    </Layout>
  );
}
