import { Layout } from "@/components/Layout";
import { Moon, Bell, Shield, Database, Users } from "lucide-react";

export default function Settings() {
  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">System Settings</h1>
        <p className="text-muted-foreground mt-1">Configure system parameters and preferences</p>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Appearance */}
        <div className="bg-card border border-white/5 rounded-lg p-6">
           <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
             <Moon className="h-5 w-5" /> Appearance
           </h3>
           <div className="flex items-center justify-between py-4 border-b border-white/5">
             <div>
               <p className="text-sm font-medium text-white">Dark Mode</p>
               <p className="text-xs text-muted-foreground">Force high contrast dark theme</p>
             </div>
             <div className="h-6 w-11 bg-green-500 rounded-full relative cursor-pointer">
               <div className="absolute right-1 top-1 h-4 w-4 bg-white rounded-full shadow-sm" />
             </div>
           </div>
           <div className="flex items-center justify-between py-4">
             <div>
               <p className="text-sm font-medium text-white">Compact Mode</p>
               <p className="text-xs text-muted-foreground">Increase data density in tables</p>
             </div>
             <div className="h-6 w-11 bg-white/10 rounded-full relative cursor-pointer">
               <div className="absolute left-1 top-1 h-4 w-4 bg-white/50 rounded-full shadow-sm" />
             </div>
           </div>
        </div>

        {/* Notifications */}
        <div className="bg-card border border-white/5 rounded-lg p-6">
           <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
             <Bell className="h-5 w-5" /> Notifications
           </h3>
           <div className="space-y-4">
             {['Critical Alerts', 'System Status Changes', 'Device Offline'].map((item) => (
                <div key={item} className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">{item}</span>
                  <div className="h-6 w-11 bg-green-500 rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 h-4 w-4 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
             ))}
           </div>
        </div>
        
        {/* System */}
        <div className="bg-card border border-white/5 rounded-lg p-6">
           <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
             <Shield className="h-5 w-5" /> Security
           </h3>
           <div className="space-y-4">
             <button className="w-full py-3 border border-white/10 rounded text-sm text-white hover:bg-white/5 text-left px-4 flex justify-between items-center">
               Manage API Keys
               <span className="text-xs text-muted-foreground">3 Active</span>
             </button>
             <button className="w-full py-3 border border-white/10 rounded text-sm text-white hover:bg-white/5 text-left px-4 flex justify-between items-center">
               Audit Logs Retention
               <span className="text-xs text-muted-foreground">90 Days</span>
             </button>
           </div>
        </div>
      </div>
    </Layout>
  );
}
