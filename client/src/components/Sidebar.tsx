import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Activity, 
  ShieldAlert, 
  Video, 
  HardDrive, 
  Settings, 
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/monitoring", label: "Live Monitoring", icon: Video },
  { href: "/alerts", label: "Alerts & Incidents", icon: ShieldAlert },
  { href: "/devices", label: "Assets & Devices", icon: HardDrive },
  { href: "/logs", label: "System Logs", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();
  const { sidebarOpen, toggleSidebar } = useStore();

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 md:hidden p-2 bg-card border border-white/10 rounded-md text-white"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar Container */}
      <AnimatePresence mode="wait">
        {(sidebarOpen || window.innerWidth >= 768) && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-white/5 flex flex-col",
              "md:relative md:translate-x-0"
            )}
          >
            {/* Header */}
            <div className="h-16 flex items-center px-6 border-b border-white/5">
              <div className="w-8 h-8 bg-white/10 rounded mr-3 flex items-center justify-center">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-widest uppercase text-white">Autonomous</h1>
                <p className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase">Shield System</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 space-y-1 px-3">
              {navItems.map((item) => {
                const isActive = location === item.href;
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <div 
                      className={cn(
                        "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer group relative",
                        isActive 
                          ? "bg-white/10 text-white" 
                          : "text-muted-foreground hover:bg-white/5 hover:text-white"
                      )}
                    >
                      {isActive && (
                        <div className="absolute left-0 w-1 h-full bg-red-500 rounded-r-sm" />
                      )}
                      <Icon className={cn("mr-3 h-5 w-5", isActive ? "text-red-500" : "text-muted-foreground group-hover:text-white")} />
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-white/5">
              <div className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground hover:text-white cursor-pointer rounded-md hover:bg-white/5 transition-colors" onClick={() => window.location.href = '/'}>
                <LogOut className="mr-3 h-5 w-5" />
                Sign Out
              </div>
              <div className="mt-4 px-3 flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-mono">v2.4.1-RC</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  ONLINE
                </span>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
