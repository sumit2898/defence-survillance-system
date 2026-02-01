import { Link } from "wouter";
import { Shield, ArrowRight, Activity, Lock, Cpu } from "lucide-react";
import { motion } from "framer-motion";

// Landing Page
export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
        style={{ 
          backgroundImage: 'radial-gradient(circle at 50% 50%, #333 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }} 
      />
      
      {/* Header */}
      <header className="relative z-10 w-full px-6 py-6 md:px-12 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-white" />
          <span className="font-bold tracking-widest uppercase text-sm">Autonomous Shield</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-green-500">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          SYSTEM OPERATIONAL
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-block mb-6 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-muted-foreground uppercase tracking-widest">
            Next Gen Surveillance
          </div>
          <h1 className="text-4xl md:text-7xl font-bold tracking-tighter text-white mb-6">
            Command Center <br />
            <span className="text-white/40">Authorized Access Only</span>
          </h1>
          <p className="max-w-xl mx-auto text-muted-foreground mb-10 text-lg">
            Advanced threat detection, real-time monitoring, and autonomous response systems active. Identify yourself to proceed.
          </p>
          
          <Link href="/dashboard">
            <button className="group relative px-8 py-4 bg-white text-black font-bold text-sm tracking-wider uppercase rounded hover:bg-gray-200 transition-all active:scale-95">
              Enter System
              <ArrowRight className="inline-block ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </Link>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 max-w-5xl w-full text-left">
          {[
            { icon: Activity, title: "Real-time Analytics", desc: "Live data processing with sub-second latency." },
            { icon: Lock, title: "Military Grade", desc: "End-to-end encryption for all video streams." },
            { icon: Cpu, title: "AI Detection", desc: "Neural networks trained for anomaly recognition." }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + (i * 0.1) }}
              className="p-6 rounded border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
            >
              <feature.icon className="h-8 w-8 text-white mb-4 opacity-80" />
              <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-6 text-center text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
        Restricted Area // Class 4 Clearance Required // ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
      </footer>
    </div>
  );
}
