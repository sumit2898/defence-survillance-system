import { Layout } from "@/components/Layout";
import { useAlerts } from "@/hooks/use-alerts";
import { AlertTriangle, Clock, MapPin, CheckCircle, Search } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function Alerts() {
  const { data: alerts } = useAlerts();
  const [filter, setFilter] = useState<'all' | 'critical' | 'active'>('all');

  const filteredAlerts = alerts?.filter(alert => {
    if (filter === 'critical') return alert.severity === 'critical';
    if (filter === 'active') return alert.status === 'active';
    return true;
  });

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Alert Center</h1>
          <p className="text-muted-foreground mt-1">Incident timeline and management</p>
        </div>
        
        <div className="flex gap-2">
          {['all', 'active', 'critical'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={cn(
                "px-4 py-2 rounded text-sm font-medium transition-colors uppercase tracking-wide",
                filter === f 
                  ? "bg-white text-black" 
                  : "bg-white/5 text-muted-foreground hover:bg-white/10"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 max-w-4xl">
        {filteredAlerts?.map((alert) => (
          <div 
            key={alert.id}
            className={cn(
              "group relative overflow-hidden bg-card border rounded-lg p-6 transition-all hover:-translate-y-0.5",
              alert.severity === 'critical' ? "border-red-500/30" : "border-white/5 hover:border-white/20"
            )}
          >
            {/* Status Stripe */}
            <div className={cn(
              "absolute left-0 top-0 bottom-0 w-1",
              alert.severity === 'critical' ? "bg-red-500" : 
              alert.severity === 'high' ? "bg-orange-500" : "bg-blue-500"
            )} />

            <div className="flex flex-col md:flex-row gap-6 items-start">
               {/* Icon Area */}
               <div className={cn(
                 "p-3 rounded bg-white/5 shrink-0",
                 alert.severity === 'critical' && "bg-red-500/10 text-red-500"
               )}>
                 <AlertTriangle size={24} />
               </div>

               {/* Content */}
               <div className="flex-1">
                 <div className="flex justify-between items-start mb-2">
                   <h3 className="text-lg font-bold text-white">{alert.title}</h3>
                   <span className={cn(
                     "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest",
                     alert.status === 'active' ? "bg-white/10 text-white" : "bg-green-500/10 text-green-500"
                   )}>
                     {alert.status}
                   </span>
                 </div>
                 
                 <p className="text-muted-foreground mb-4">{alert.description}</p>
                 
                 <div className="flex flex-wrap gap-4 text-xs font-mono text-zinc-500">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} />
                      {format(new Date(alert.timestamp), 'MMM dd, HH:mm:ss')}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} />
                      {alert.location}
                    </div>
                    {alert.metadata && (alert.metadata as any).confidence && (
                       <div className="flex items-center gap-1.5">
                         <Search size={12} />
                         CONF: {(alert.metadata as any).confidence}%
                       </div>
                    )}
                 </div>
               </div>

               {/* Actions */}
               <div className="flex flex-row md:flex-col gap-2 shrink-0">
                 <button className="px-4 py-2 bg-white text-black text-xs font-bold uppercase rounded hover:bg-gray-200 transition-colors">
                   Investigate
                 </button>
                 {alert.status === 'active' && (
                   <button className="px-4 py-2 border border-white/10 text-white text-xs font-bold uppercase rounded hover:bg-white/5 transition-colors">
                     Resolve
                   </button>
                 )}
               </div>
            </div>
          </div>
        ))}
        
        {filteredAlerts?.length === 0 && (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-lg">
            <CheckCircle className="mx-auto h-12 w-12 text-zinc-700 mb-4" />
            <h3 className="text-lg font-medium text-white">No Alerts Found</h3>
            <p className="text-muted-foreground">Adjust filters or check back later.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
