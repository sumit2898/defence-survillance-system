import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  alert?: boolean;
}

export function StatsCard({ title, value, icon: Icon, trend, trendUp, alert }: StatsCardProps) {
  return (
    <div className={cn(
      "bg-card border border-white/5 rounded-lg p-5 relative overflow-hidden group hover:border-white/10 transition-colors",
      alert && "border-red-500/20 bg-red-950/10"
    )}>
      {alert && (
        <div className="absolute top-0 right-0 p-1">
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        </div>
      )}
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-white mt-1 font-mono">{value}</h3>
        </div>
        <div className={cn("p-2 rounded-md bg-white/5 text-muted-foreground group-hover:text-white transition-colors", alert && "text-red-400 bg-red-500/10")}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      
      {trend && (
        <div className="flex items-center text-xs">
          <span className={cn(
            "font-medium mr-2",
            trendUp ? "text-green-500" : "text-red-500"
          )}>
            {trend}
          </span>
          <span className="text-muted-foreground">vs last hour</span>
        </div>
      )}
    </div>
  );
}
