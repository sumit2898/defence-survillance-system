import { Layout } from "@/components/Layout";
import { StatsCard } from "@/components/StatsCard";
import { FeedPlayer } from "@/components/FeedPlayer";
import { useAlerts } from "@/hooks/use-alerts";
import { useDevices } from "@/hooks/use-devices";
import { useIncidents } from "@/hooks/use-incidents";
import { AlertTriangle, Wifi, Camera, Shield, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from "date-fns";
import { motion } from "framer-motion";

const mockChartData = Array.from({ length: 24 }, (_, i) => ({
  time: `${i}:00`,
  activity: Math.floor(Math.random() * 50) + 10,
  threats: Math.floor(Math.random() * 5),
}));

export default function Dashboard() {
  const { data: alerts } = useAlerts();
  const { data: devices } = useDevices();
  const { data: incidents } = useIncidents();

  const activeAlerts = alerts?.filter(a => a.status === 'active').length || 0;
  const criticalAlerts = alerts?.filter(a => a.severity === 'critical' && a.status === 'active').length || 0;
  const onlineDevices = devices?.filter(d => d.status === 'online').length || 0;
  
  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Overview Dashboard</h1>
            <p className="text-muted-foreground mt-1">System status and key metrics</p>
          </div>
          <div className="flex gap-2 text-xs font-mono">
            <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded border border-green-500/20">
              NETWORK: SECURE
            </span>
            <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded border border-blue-500/20">
              UPTIME: 99.9%
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard 
            title="Active Alerts" 
            value={activeAlerts} 
            icon={AlertTriangle} 
            trend="+2" 
            trendUp={false} 
            alert={criticalAlerts > 0}
          />
          <StatsCard 
            title="Online Devices" 
            value={onlineDevices} 
            icon={Wifi} 
            trend="Stable" 
            trendUp={true} 
          />
          <StatsCard 
            title="Total Incidents" 
            value={incidents?.length || 0} 
            icon={Shield} 
            trend="+12%" 
            trendUp={false} 
          />
          <StatsCard 
            title="Storage Used" 
            value="82%" 
            icon={Activity} 
            trend="+1%" 
            trendUp={false} 
          />
        </div>

        {/* Main Content Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Live Feeds & Chart */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-card border border-white/5 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  <Camera className="h-4 w-4" /> Live Feeds Preview
                </h3>
                <button className="text-xs text-primary hover:text-white transition-colors uppercase tracking-wider font-bold">
                  View All
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(devices || []).slice(0, 2).map((device) => (
                  <FeedPlayer 
                    key={device.id} 
                    id={device.id} 
                    name={device.name} 
                    status={device.status as any} 
                  />
                ))}
              </div>
            </div>

            <div className="bg-card border border-white/5 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-6">Detection Volume (24h)</h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockChartData}>
                    <defs>
                      <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fff" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#fff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#525252" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="activity" stroke="#fff" strokeWidth={2} fillOpacity={1} fill="url(#colorActivity)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Right Column: Recent Critical Alerts */}
          <div className="bg-card border border-white/5 rounded-lg p-6 h-fit">
            <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" /> Recent Alerts
            </h3>
            
            <div className="space-y-4">
              {alerts?.slice(0, 5).map((alert, i) => (
                <motion.div 
                  key={alert.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-4 p-4 rounded bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                    alert.severity === 'critical' ? 'bg-red-500 animate-pulse' : 
                    alert.severity === 'high' ? 'bg-orange-500' : 'bg-blue-500'
                  }`} />
                  <div>
                    <div className="flex justify-between items-start w-full">
                      <h4 className="text-sm font-medium text-white leading-none mb-1">{alert.title}</h4>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {format(new Date(alert.timestamp), 'HH:mm')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{alert.description}</p>
                    <div className="flex gap-2">
                       <span className="text-[10px] uppercase bg-black/40 px-1.5 py-0.5 rounded text-zinc-400 border border-white/5">
                         {alert.location}
                       </span>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {!alerts?.length && (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  No active alerts. System secure.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
