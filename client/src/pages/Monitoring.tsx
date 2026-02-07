import { Layout } from "@/components/Layout";
import { useDevices } from "@/hooks/use-devices";
import { FeedPlayer } from "@/components/FeedPlayer";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Search, Radio, Activity, LayoutGrid, Maximize2, Database, ChevronRight, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { PageTransition } from "@/components/ui/PageTransition";
import { motion, AnimatePresence } from "framer-motion";
import { SystemPulse } from "@/components/SystemPulse";
import { DetectionLog } from "@/components/DetectionLog";

export default function Monitoring() {
  const { data: devices } = useDevices();
  const { activeFeedId, setActiveFeed } = useStore();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<'focus' | 'grid'>('focus');
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  const activeDevice = devices?.find(d => d.id === activeFeedId) || devices?.[0];
  const filteredDevices = devices?.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout fixedHeight={true} className="p-0 flex h-full overflow-hidden">
      {/* LEFT SIDEBAR: Device List (Only in Focus Mode) */}
      <AnimatePresence mode="wait">
        {viewMode === 'focus' && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r border-white/5 bg-black/40 backdrop-blur-xl flex flex-col h-full z-20 overflow-hidden relative shrink-0"
          >
            {/* HUD Accents */}
            <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-transparent via-green-500/20 to-transparent opacity-30" />

            <div className="p-6 border-b border-white/5 min-w-[320px] bg-white/[0.02]">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-zinc-900 border border-white/10 rounded">
                  <Database className="h-4 w-4 text-zinc-400" />
                </div>
                <div>
                  <h2 className="text-xs font-black text-white uppercase tracking-[0.2em] leading-none">FEED_REGISTRY</h2>
                  <p className="text-[8px] text-zinc-500 font-mono tracking-widest mt-1">VIRTUAL_MATRIX_04</p>
                </div>
              </div>

              <div className="relative group">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-600 group-focus-within:text-green-500 transition-colors" />
                <input
                  type="text"
                  placeholder="SEARCH_COORDINATES..."
                  className="w-full bg-zinc-900/50 border border-white/5 rounded px-9 py-2 text-[10px] font-mono text-white focus:outline-none focus:border-green-500/30 transition-all placeholder:text-zinc-700"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-w-[320px] custom-scrollbar">
              {filteredDevices?.map((device, i) => (
                <motion.div
                  whileHover={{ x: 4 }}
                  key={device.id}
                  onClick={() => setActiveFeed(device.id)}
                  className={cn(
                    "p-4 rounded border transition-all duration-300 cursor-pointer group relative overflow-hidden",
                    activeFeedId === device.id
                      ? "bg-white/5 border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]"
                      : "border-transparent hover:bg-white/[0.02] hover:border-white/5"
                  )}
                >
                  <div className="absolute top-0 left-0 w-0.5 h-full bg-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {activeFeedId === device.id && (
                    <motion.div
                      layoutId="active-feed-marker"
                      className="absolute top-0 left-0 w-0.5 h-full bg-green-500 shadow-[0_0_10px_#22c55e]"
                    />
                  )}

                  <div className="flex justify-between items-center mb-2">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-wider transition-colors",
                      activeFeedId === device.id ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"
                    )}>
                      {device.name}
                    </span>
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      device.status === 'online' ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-red-500 shadow-[0_0_8px_#ef4444]"
                    )} />
                  </div>
                  <div className="flex justify-between text-[8px] font-mono text-zinc-600 uppercase tracking-widest">
                    <span>{device.location}</span>
                    <span className="px-1.5 py-0.5 bg-black/40 rounded border border-white/5">{device.type}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CENTER: Main View */}
      <PageTransition className="flex-1 bg-black p-4 flex flex-col relative overflow-hidden min-w-0">
        {/* Scanning Line Overlay */}
        <div className="absolute inset-0 pointer-events-none z-10 opacity-10 flex flex-col gap-1 overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className="h-px w-full bg-green-500/20" />
          ))}
        </div>

        {/* View Toggle Header */}
        <div className="flex justify-between items-center mb-4 z-20 shrink-0">
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded text-[10px] font-mono text-green-500 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              MATRIX_STABLE
            </div>
            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest hidden md:inline">FPS: 60 // PING: 24ms</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-black/80 backdrop-blur-md rounded p-1 flex border border-white/10 shadow-2xl">
              <button
                onClick={() => setViewMode('focus')}
                className={cn("p-2 rounded transition-all duration-300",
                  viewMode === 'focus' ? "bg-white/10 text-white shadow-inner" : "text-zinc-600 hover:text-white"
                )}
                title="Focus View"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn("p-2 rounded transition-all duration-300",
                  viewMode === 'grid' ? "bg-white/10 text-white shadow-inner" : "text-zinc-600 hover:text-white"
                )}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              className={cn(
                "p-2.5 rounded bg-black/80 border border-white/10 hover:bg-white/5 transition-colors text-zinc-400 hover:text-white",
                rightPanelOpen && "bg-white/10 text-white"
              )}
            >
              {rightPanelOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {viewMode === 'focus' ? (
          activeDevice ? (
            <div className="flex-1 flex flex-col min-h-0">
              <motion.div
                layout
                className="flex-1 relative rounded-xl overflow-hidden border border-white/10 bg-zinc-950 group shadow-2xl min-h-0"
              >
                {/* HUD Corner Overlays */}
                <div className="absolute top-6 left-6 w-16 h-16 border-t-2 border-l-2 border-white/20 rounded-tl-xl z-20 pointer-events-none group-hover:border-green-500/40 transition-colors" />
                <div className="absolute top-6 right-6 w-16 h-16 border-t-2 border-r-2 border-white/20 rounded-tr-xl z-20 pointer-events-none group-hover:border-green-500/40 transition-colors" />
                <div className="absolute bottom-6 left-6 w-16 h-16 border-b-2 border-l-2 border-white/20 rounded-bl-xl z-20 pointer-events-none group-hover:border-green-500/40 transition-colors" />
                <div className="absolute bottom-6 right-6 w-16 h-16 border-b-2 border-r-2 border-white/20 rounded-br-xl z-20 pointer-events-none group-hover:border-green-500/40 transition-colors" />

                <FeedPlayer
                  id={activeDevice.id}
                  name={activeDevice.name}
                  status={activeDevice.status as any}
                  active={true}
                  videoUrl={activeDevice.videoUrl}
                />

                {/* Overlay Status */}
                <div className="absolute top-8 right-8 flex items-center gap-3 z-30 pointer-events-none">
                  <motion.div
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="flex items-center gap-2 bg-black/80 backdrop-blur-xl px-4 py-1.5 rounded-full border border-red-500/30"
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]" />
                    <span className="text-[10px] font-black text-red-500 tracking-[0.2em] uppercase">RECORDING</span>
                  </motion.div>
                  <div className="flex items-center gap-2 bg-black/80 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/10">
                    <Radio className="w-3.5 h-3.5 text-white" />
                    <span className="text-[10px] font-black text-white tracking-[0.2em] uppercase">LIVE_SIG</span>
                  </div>
                </div>

                {/* Viewfinder elements */}
                <div className="absolute inset-0 z-20 pointer-events-none opacity-20 border-[40px] border-transparent">
                  <div className="absolute top-1/2 left-0 w-8 h-[2px] bg-white -translate-y-1/2" />
                  <div className="absolute top-1/2 right-0 w-8 h-[2px] bg-white -translate-y-1/2" />
                  <div className="absolute top-0 left-1/2 w-[2px] h-8 -translate-x-1/2" />
                  <div className="absolute bottom-0 left-1/2 w-[2px] h-8 -translate-x-1/2" />
                </div>
              </motion.div>

              {/* Metadata Panel - Optional, hidden if space is tight */}
              <div className="h-auto mt-4 hidden xl:grid grid-cols-4 gap-4 shrink-0">
                <div className="col-span-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl p-4 relative overflow-hidden shadow-xl group">
                  <div className="absolute top-0 right-0 p-[2px] bg-gradient-to-l from-green-500/40 to-transparent w-full h-[1px]" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <h3 className="text-[10px] font-black text-white mb-4 uppercase tracking-[0.2em] flex items-center gap-3">
                    <Activity className="h-3 w-3 text-green-500" />
                    TELEMETRY_DATABANK
                  </h3>

                  <div className="grid grid-cols-3 gap-6 text-[10px] font-mono">
                    <div className="space-y-2">
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-zinc-500 uppercase">LATENCY</span>
                        <span className="text-green-500 font-bold">24.08ms</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-zinc-500 uppercase">RES</span>
                        <span className="text-white font-bold">UHD</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-zinc-500 uppercase">IP</span>
                        <span className="text-blue-400 font-bold">{activeDevice.ipAddress || "10.0.4.88"}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-zinc-500 uppercase">BAND</span>
                        <span className="text-white font-bold">5.8G</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-zinc-500 uppercase">CPU</span>
                        <span className="text-orange-400 font-bold">A50-T</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-zinc-500 uppercase">VER</span>
                        <span className="text-white font-bold">v4.2</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-4 flex flex-col justify-center items-center text-center relative overflow-hidden group shadow-xl">
                  {/* Glowing background */}
                  <div className="absolute inset-0 bg-green-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                  <div className="relative">
                    <div className="text-3xl font-black text-white font-mono tracking-tighter mb-1 relative z-10">98<span className="text-green-500">.4</span></div>
                    <motion.div
                      animate={{ height: ["10%", "98%"] }}
                      transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                      className="absolute -right-3 top-0 w-1 bg-green-500/20 rounded-full overflow-hidden"
                    >
                      <div className="w-full h-full bg-green-500 animate-pulse" />
                    </motion.div>
                  </div>
                  <div className="text-[8px] text-zinc-500 uppercase tracking-[0.3em] font-black relative z-10">CONF_SCORE</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a feed to begin monitoring
            </div>
          )
        ) : (
          // GRID VIEW
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 h-full overflow-y-auto custom-scrollbar pb-20">
            {filteredDevices?.map((device) => (
              <div key={device.id} className="relative aspect-video bg-zinc-900 rounded border border-white/10 group overflow-hidden">
                <FeedPlayer
                  id={device.id}
                  name={device.name}
                  status={device.status as any}
                  videoUrl={device.videoUrl}
                />
                <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 backdrop-blur rounded text-[10px] font-mono text-white border border-white/10">
                  {device.name}
                </div>
                {device.status === 'online' && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                )}
                <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between px-2 pb-1">
                  <span className="text-[9px] text-zinc-300 font-mono">{device.location}</span>
                  <button className="text-white hover:text-green-400" onClick={() => { setActiveFeed(device.id); setViewMode('focus'); }}>
                    <Maximize2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageTransition>

      {/* RIGHT SIDEBAR: System Pulse & Logs */}
      <AnimatePresence>
        {rightPanelOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="shrink-0 flex flex-col h-full z-20 overflow-hidden"
          >
            {/* System Pulse Top */}
            <div className="h-1/3 min-h-[250px] p-2 pr-0">
              <SystemPulse />
            </div>

            {/* Detection Log Bottom */}
            <div className="flex-1 min-h-0 relative">
              <DetectionLog />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
