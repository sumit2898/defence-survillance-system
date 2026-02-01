import { Layout } from "@/components/Layout";
import { useDevices } from "@/hooks/use-devices";
import { HardDrive, Battery, Signal, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Devices() {
  const { data: devices } = useDevices();

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Assets & Devices</h1>
        <p className="text-muted-foreground mt-1">Hardware status monitoring</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices?.map((device) => (
          <div 
            key={device.id} 
            className="bg-card border border-white/5 rounded-lg p-6 hover:border-white/20 transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
                <HardDrive className="h-6 w-6 text-white" />
              </div>
              <div className={cn(
                "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5",
                device.status === 'online' ? "bg-green-500/10 text-green-500" : 
                device.status === 'offline' ? "bg-red-500/10 text-red-500" : "bg-yellow-500/10 text-yellow-500"
              )}>
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  device.status === 'online' ? "bg-green-500" : "bg-red-500"
                )} />
                {device.status}
              </div>
            </div>

            <h3 className="text-lg font-bold text-white mb-1">{device.name}</h3>
            <p className="text-sm text-muted-foreground mb-6">{device.location}</p>

            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
              <div className="flex items-center gap-3">
                <Battery className={cn("h-4 w-4", device.battery && device.battery < 20 ? "text-red-500" : "text-zinc-500")} />
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase">Battery</div>
                  <div className="text-sm font-mono text-white">{device.battery ? `${device.battery}%` : 'WIRED'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {device.status === 'offline' ? <WifiOff className="h-4 w-4 text-zinc-500" /> : <Signal className="h-4 w-4 text-green-500" />}
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase">Signal</div>
                  <div className="text-sm font-mono text-white">{device.status === 'online' ? 'Strong' : '-'}</div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-xs font-mono text-zinc-500">
               <span>ID: {device.id.toString().padStart(4, '0')}</span>
               <span>{device.ipAddress}</span>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
