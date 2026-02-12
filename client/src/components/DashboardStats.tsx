import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "./StatsCard";
import { Activity, AlertTriangle, Battery, Shield } from "lucide-react";
import { motion } from "framer-motion";

interface DashboardStatsData {
    active_drones: number;
    recent_threats: number;
    avg_fleet_battery: number;
    critical_alerts_hourly: number;
    last_updated: string;
}

export function DashboardStats() {
    const { data, isLoading, error, refetch } = useQuery<DashboardStatsData>({
        queryKey: ["/api/dashboard/stats"],
        refetchInterval: 30000, // Auto-refresh every 30 seconds
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-5 h-32 animate-pulse"
                    />
                ))}
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="bg-red-950/20 border border-red-500/30 rounded-lg p-6 text-center">
                <p className="text-red-500 text-sm font-mono">
                    Failed to load dashboard stats
                </p>
                <button
                    onClick={() => refetch()}
                    className="mt-4 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded text-red-500 text-xs font-mono hover:bg-red-500/30 transition-all"
                >
                    RETRY
                </button>
            </div>
        );
    }

    const batteryPercentage = Math.round(data.avg_fleet_battery || 0);
    const batteryStatus = batteryPercentage > 70 ? false : batteryPercentage > 30 ? false : true;

    return (
        <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
            <StatsCard
                title="Active Drones"
                value={data.active_drones}
                icon={Activity}
                trend={data.active_drones > 0 ? "+12%" : "0%"}
                trendUp={data.active_drones > 0}
            />
            <StatsCard
                title="Threats (24h)"
                value={data.recent_threats}
                icon={AlertTriangle}
                alert={data.recent_threats > 0}
            />
            <StatsCard
                title="Avg Battery"
                value={`${batteryPercentage}%`}
                icon={Battery}
                alert={batteryStatus}
            />
            <StatsCard
                title="Critical Alerts"
                value={data.critical_alerts_hourly}
                icon={Shield}
                alert={data.critical_alerts_hourly > 0}
            />
        </motion.div>
    );
}
