import { Layout } from "@/components/Layout";
import { useDevices } from "@/hooks/use-devices";
import { FeedPlayer } from "@/components/FeedPlayer";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Search, Filter } from "lucide-react";
import { useState } from "react";

export default function Monitoring() {
  const { data: devices } = useDevices();
  const { activeFeedId, setActiveFeed } = useStore();
  const [search, setSearch] = useState("");

  const activeDevice = devices?.find(d => d.id === activeFeedId) || devices?.[0];
  const filteredDevices = devices?.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout className="p-0 flex h-full overflow-hidden">
      {/* Sidebar List */}
      <div className="w-80 border-r border-white/5 bg-card flex flex-col h-full">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-lg font-bold text-white mb-4">Feed Selection</h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search cameras..."
              className="w-full bg-background border border-white/10 rounded px-9 py-2 text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredDevices?.map(device => (
            <div 
              key={device.id}
              onClick={() => setActiveFeed(device.id)}
              className={cn(
                "p-3 rounded cursor-pointer transition-all border border-transparent",
                activeFeedId === device.id 
                  ? "bg-white/10 border-white/10" 
                  : "hover:bg-white/5"
              )}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={cn(
                  "text-sm font-medium",
                  activeFeedId === device.id ? "text-white" : "text-zinc-400"
                )}>
                  {device.name}
                </span>
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  device.status === 'online' ? "bg-green-500" : "bg-red-500"
                )} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{device.location}</span>
                <span className="font-mono">{device.type}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main View */}
      <div className="flex-1 bg-black p-4 flex flex-col relative">
        {activeDevice ? (
          <>
             <div className="flex-1 relative rounded-lg overflow-hidden border border-white/10 bg-zinc-900">
               {/* Just reusing the component but made full size */}
               <FeedPlayer 
                 id={activeDevice.id} 
                 name={activeDevice.name} 
                 status={activeDevice.status as any} 
                 active={true}
               />
             </div>
             
             {/* Metadata Panel */}
             <div className="h-48 mt-4 grid grid-cols-3 gap-4">
               <div className="col-span-2 bg-card border border-white/10 rounded p-4">
                 <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-wide">Live Metadata</h3>
                 <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    <div className="space-y-2">
                       <div className="flex justify-between border-b border-white/5 pb-1">
                         <span className="text-muted-foreground">LATENCY</span>
                         <span className="text-green-500">24ms</span>
                       </div>
                       <div className="flex justify-between border-b border-white/5 pb-1">
                         <span className="text-muted-foreground">RESOLUTION</span>
                         <span className="text-white">4K / 60FPS</span>
                       </div>
                       <div className="flex justify-between border-b border-white/5 pb-1">
                         <span className="text-muted-foreground">AI MODEL</span>
                         <span className="text-white">YOLOv8-L</span>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between border-b border-white/5 pb-1">
                         <span className="text-muted-foreground">OBJECTS</span>
                         <span className="text-white">3 DETECTED</span>
                       </div>
                       <div className="flex justify-between border-b border-white/5 pb-1">
                         <span className="text-muted-foreground">IP ADDR</span>
                         <span className="text-white">{activeDevice.ipAddress || "192.168.1.104"}</span>
                       </div>
                    </div>
                 </div>
               </div>
               
               <div className="bg-card border border-white/10 rounded p-4 flex flex-col justify-center items-center text-center">
                  <div className="text-4xl font-bold text-white font-mono mb-1">98%</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest">Confidence Score</div>
               </div>
             </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a feed to begin monitoring
          </div>
        )}
      </div>
    </Layout>
  );
}
