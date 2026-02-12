import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useLocation } from 'wouter';
import { Shield, ArrowRight, Activity, Cpu, Scan, Cloud, Radio, Eye, Server, ChevronDown, Zap, Crosshair, Map as MapIcon, Database, Lock, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRef, useState } from 'react';
import CinematicBackground from '@/components/CinematicBackground';
import { ScrollProgress } from '@/components/ui/ScrollProgress';
import { TextReveal } from '@/components/ui/TextReveal';
import { TiltCard } from '@/components/ui/TiltCard';
import { cn } from '@/lib/utils';

// --- SUB-COMPONENTS ---

const Section = ({ children, className, id }: { children: React.ReactNode, className?: string, id?: string }) => (
    <section id={id} className={cn("min-h-screen relative flex items-center justify-center py-24 overflow-hidden", className)}>
        {children}
    </section>
);

const RevealCard = ({ children, delay = 0, className }: { children: React.ReactNode, delay?: number, className?: string }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-10% 0px" });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

const MagneticButton = ({ children, onClick, className }: { children: React.ReactNode, onClick?: () => void, className?: string }) => {
    const ref = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const { left, top, width, height } = ref.current?.getBoundingClientRect() || { left: 0, top: 0, width: 0, height: 0 };
        const x = clientX - (left + width / 2);
        const y = clientY - (top + height / 2);
        setPosition({ x: x * 0.1, y: y * 0.1 });
    };

    const handleMouseLeave = () => {
        setPosition({ x: 0, y: 0 });
    };

    return (
        <motion.button
            ref={ref}
            animate={{ x: position.x, y: position.y }}
            transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            className={className}
        >
            {children}
        </motion.button>
    );
};

// --- VISUAL FLOW CONNECTORS ---

const FlowLine = ({ className }: { className?: string }) => (
    <svg className={cn("absolute pointer-events-none opacity-20", className)} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="flow-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="50%" stopColor="white" />
                <stop offset="100%" stopColor="transparent" />
            </linearGradient>
        </defs>
        <line x1="50%" y1="0" x2="50%" y2="100%" stroke="url(#flow-gradient)" strokeWidth="1" strokeDasharray="4 4" />
    </svg>
);

// --- MAIN PAGE ---

export default function LandingPage() {
    const [_, setLocation] = useLocation();
    const { scrollYProgress } = useScroll();

    // Smooth Parallax
    const yHero = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
    const opacityHero = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

    const drones = [
        { name: "S-1 SCOUT", role: "RECON", speed: "120km/h", range: "15km", endurance: "4h", payload: "Optical/IR", icon: Eye, img: "/assets/drone_recon_matte_black_1770468023287.png" },
        { name: "I-4 INTERCEPTOR", role: "PURSUIT", speed: "240km/h", range: "8km", endurance: "45m", payload: "Net-Gun", icon: Crosshair, img: "/assets/drone_interceptor_carbon_1770468045466.png" },
        { name: "H-9 GOLIATH", role: "LOGISTICS", speed: "80km/h", range: "40km", endurance: "6h", payload: "15kg", icon: Server, img: "/assets/drone_goliath_heavy_1770468119127.png" },
    ];

    const architectureSteps = [
        { title: "SENSORY GRID", desc: "4K RTSP Ingest", icon: Eye },
        { title: "NEURAL CORE", desc: "YOLOv8 Inference", icon: Cpu },
        { title: "SYNAPSE BUS", desc: "WebSocket Telemetry", icon: Activity },
        { title: "COMMAND LINK", desc: "Autonomous Response", icon: Radio },
    ];

    return (
        <div className="bg-background text-foreground font-sans selection:bg-white/10 selection:text-white overflow-x-hidden">
            <ScrollProgress />

            {/* Background Noise Texture */}
            <div className="fixed inset-0 z-0 pointer-events-none bg-noise opacity-30 mix-blend-overlay"></div>

            {/* --- HERO SECTION --- */}
            <Section className="h-screen relative z-10">
                <CinematicBackground />
                <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background pointer-events-none" />

                {/* Vertical Flow Line */}
                <FlowLine className="top-0 h-full z-0" />

                <motion.div style={{ y: yHero, opacity: opacityHero }} className="relative z-20 text-center px-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-50"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                        </span>
                        <span className="text-xs font-mono text-zinc-400 tracking-widest uppercase">System Online // v3.2.0</span>
                    </motion.div>

                    <h1 className="text-7xl md:text-9xl font-light tracking-tighter mb-8 text-gradient-silver">
                        <TextReveal>AUTONOMOUS</TextReveal><br />
                        <span className="font-serif italic font-medium text-white"><TextReveal>SHIELD</TextReveal></span>
                    </h1>

                    <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed mb-12">
                        Next-generation perimeter defense powered by logic-gated AI.
                        <br /><span className="text-zinc-500 font-mono text-sm uppercase tracking-widest">[ BEYOND HUMAN REACTION TIME ]</span>
                    </p>

                    <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
                        <MagneticButton
                            onClick={() => setLocation('/system')}
                            className="group relative px-10 py-5 bg-white text-black font-semibold text-sm tracking-widest uppercase rounded-sm hover:bg-zinc-200 transition-all duration-500"
                        >
                            <span className="flex items-center gap-3">
                                Initialize System
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </MagneticButton>
                        <Button variant="ghost" className="text-zinc-500 hover:text-white font-mono tracking-widest uppercase text-xs" onClick={() => document.getElementById('architecture')?.scrollIntoView({ behavior: 'smooth' })}>
                            View_Blueprint v1.0
                        </Button>
                    </div>
                </motion.div>

                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 text-zinc-600"
                >
                    <ChevronDown className="w-6 h-6 opacity-30" />
                </motion.div>
            </Section>

            {/* --- NEURAL CORE --- */}
            <Section className="bg-zinc-950/30 border-t border-white/5">
                {/* Connecting Line from Hero */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-white/20 to-transparent" />

                <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <RevealCard>
                            <h2 className="text-4xl md:text-6xl font-light mb-8 tracking-tight">
                                <span className="text-white"><TextReveal>NEURAL CORE</TextReveal></span>
                            </h2>
                            <p className="text-zinc-400 text-lg font-light leading-relaxed mb-8 border-l border-white/10 pl-6">
                                Powered by a custom-tuned YOLOv8 engine, the system processes 4K video streams in real-time, identifying threats with 98.4% confidence before they breach the perimeter.
                            </p>
                            <ul className="space-y-4 font-mono text-sm text-zinc-500">
                                <li className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full" />
                                    20ms Inference Latency
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full" />
                                    Multi-Class Object Detection
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full" />
                                    Behavioral Anomaly Analysis
                                </li>
                            </ul>
                        </RevealCard>

                        <RevealCard delay={0.2}>
                            <div className="relative h-[400px] w-full glass-panel-strong rounded-lg overflow-hidden group">
                                {/* Neural Core Graphic */}
                                <img src="/assets/neural_core_abstract_1770468170121.png" alt="Neural Core" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen group-hover:scale-105 transition-transform duration-1000" />

                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

                                {/* Overlay Data */}
                                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                                    <div className="font-mono text-[10px] text-zinc-400">
                                        <div>STATUS: ONLINE</div>
                                        <div>LOAD: 12%</div>
                                        <div>TEMP: 42°C</div>
                                    </div>
                                    <Scan className="w-8 h-8 text-white/50 animate-pulse" />
                                </div>

                                {/* Scanning Line - Silver */}
                                <motion.div
                                    animate={{ top: ["0%", "100%"] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className="absolute left-0 w-full h-[1px] bg-white/40 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                                />
                            </div>
                        </RevealCard>
                    </div>
                </div>
            </Section>

            {/* --- DRONE FLEET --- */}
            <Section className="bg-background relative">
                {/* Flow Connector */}
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10" style={{ zIndex: 0 }}>
                    <path d="M 50% 0 L 50% 100 L 100 200" fill="none" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
                </svg>

                <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
                    <RevealCard className="text-center mb-24">
                        <span className="text-zinc-500 font-mono tracking-widest uppercase text-xs">Hardware Assets</span>
                        <h2 className="text-5xl font-light mt-4 text-gradient-platinum">
                            <TextReveal>ACTIVE SQUADRON</TextReveal>
                        </h2>
                        <p className="text-zinc-400 max-w-2xl mx-auto text-lg font-light leading-relaxed mb-12">
                            The Autonomous Shield fleet operates on a unified swarm protocol.
                            <span className="text-white"> S-1 Scouts</span> provide target acquisition, handing off to
                            <span className="text-white"> I-4 Interceptors</span> for neutralization, while
                            <span className="text-white"> H-9 Goliaths</span> maintain continuous supply lines.
                        </p>

                        <div className="flex flex-wrap justify-center gap-8 mb-16 border-y border-white/5 py-6">
                            <div className="flex flex-col items-center">
                                <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1">Fleet Status</span>
                                <span className="text-emerald-500 font-mono text-xl">OPTIMAL</span>
                            </div>
                            <div className="w-px h-12 bg-white/10 hidden md:block" />
                            <div className="flex flex-col items-center">
                                <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1">Active Units</span>
                                <span className="text-white font-mono text-xl">42</span>
                            </div>
                            <div className="w-px h-12 bg-white/10 hidden md:block" />
                            <div className="flex flex-col items-center">
                                <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1">Global Coverage</span>
                                <span className="text-white font-mono text-xl">14.2 km²</span>
                            </div>
                        </div>
                    </RevealCard>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {drones.map((drone, i) => (
                            <RevealCard key={i} delay={i * 0.1}>
                                <TiltCard className="h-full">
                                    <div className="group relative h-96 glass-panel border border-white/5 rounded-sm overflow-hidden h-full transition-all duration-700 hover:border-white/20">
                                        {/* Drone Image Base */}
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 z-10" />
                                        <img src={drone.img} alt={drone.name} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700" />

                                        <div className="absolute top-0 right-0 p-6 z-20 opacity-50 group-hover:opacity-100 transition-all duration-700">
                                            <drone.icon className="w-6 h-6 text-white" />
                                        </div>

                                        <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
                                            <h3 className="text-2xl font-light text-white mb-2">{drone.name}</h3>
                                            <p className="text-zinc-400 font-mono text-xs mb-6 tracking-wider">{drone.role} CLASS</p>

                                            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                                                <div>
                                                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Speed</div>
                                                    <div className="text-sm font-mono text-zinc-300">{drone.speed}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Range</div>
                                                    <div className="text-sm font-mono text-zinc-300">{drone.range}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Endurance</div>
                                                    <div className="text-sm font-mono text-zinc-300">{drone.endurance}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Payload</div>
                                                    <div className="text-sm font-mono text-zinc-300">{drone.payload}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TiltCard>
                            </RevealCard>
                        ))}
                    </div>
                </div>
            </Section>

            {/* --- ARCHITECTURE --- */}
            <Section id="architecture" className="bg-zinc-950 border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6 w-full">
                    <RevealCard className="mb-20 text-center md:text-left">
                        <h2 className="text-4xl font-light mb-6">System Architecture</h2>
                        <p className="text-zinc-500 max-w-xl font-light text-lg">
                            From lens to logic in under 50 milliseconds.
                        </p>
                    </RevealCard>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-12 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent -z-10" />

                        {architectureSteps.map((step, i) => (
                            <RevealCard key={i} delay={i * 0.2}>
                                <div className="glass-panel p-8 rounded-sm relative z-10 hover:-translate-y-2 transition-transform duration-500 group bg-black/50">
                                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/5 group-hover:border-white/20 transition-colors">
                                        <step.icon className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                                    </div>
                                    <h3 className="text-sm font-bold mb-2 tracking-wide uppercase text-zinc-200">{step.title}</h3>
                                    <p className="text-xs text-zinc-500 font-mono">{step.desc}</p>

                                    <div className="absolute top-4 right-4 text-4xl font-serif italic text-white/[0.05] pointer-events-none">
                                        0{i + 1}
                                    </div>
                                </div>
                            </RevealCard>
                        ))}
                    </div>
                </div>
            </Section>

            {/* --- SECTION 1: GLOBAL THREAT INTELLIGENCE --- */}
            <Section className="bg-background relative border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
                    <div className="grid md:grid-cols-2 gap-20 items-center">
                        <RevealCard>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-[10px] font-mono mb-8 tracking-wider uppercase">
                                <Activity className="w-3 h-3" />
                                Live Threat Monitoring
                            </div>
                            <h2 className="text-4xl md:text-6xl font-light mb-8">Global <span className="font-serif italic">Intel</span> Grid</h2>
                            <p className="text-zinc-400 text-lg font-light leading-relaxed mb-12">
                                Autonomous Shield doesn't just watch locally. It aggregates threat signatures from 14 sovereign borders to predict incursions before they happen.
                            </p>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="p-6 glass-panel rounded-sm border-l-2 border-zinc-700">
                                    <div className="text-4xl font-light text-white mb-2">14,203</div>
                                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Threats Neutralized</div>
                                </div>
                                <div className="p-6 glass-panel rounded-sm border-l-2 border-zinc-700">
                                    <div className="text-4xl font-light text-white mb-2">99.9%</div>
                                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Uptime SLA</div>
                                </div>
                            </div>
                        </RevealCard>

                        <RevealCard delay={0.2} className="relative aspect-square glass-panel rounded-full border border-white/5 flex items-center justify-center p-12 overflow-hidden group">
                            {/* Map Image */}
                            <img src="/assets/global_intel_map_1770468196036.png" alt="Global Intel Map" className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-lighten group-hover:scale-105 transition-transform duration-1000" />

                            {/* Rotating Rings Overlay */}
                            <div className="absolute inset-0 rounded-full border border-white/5 animate-[spin_60s_linear_infinite]" />
                            <div className="absolute inset-12 rounded-full border border-dashed border-white/10 animate-[spin_40s_linear_infinite_reverse]" />

                            {/* Hotspots - Monochromatic Overlay */}
                            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-ping opacity-80" />
                            <div className="absolute bottom-1/3 right-1/4 w-1.5 h-1.5 bg-white rounded-full animate-ping delay-700 opacity-80" />
                        </RevealCard>
                    </div>
                </div>
            </Section>

            {/* --- SECTION 2: MILITARY-GRADE ENCRYPTION --- */}
            <Section className="bg-zinc-950">
                <div className="max-w-4xl mx-auto px-6 w-full text-center">
                    <RevealCard>
                        <Lock className="w-12 h-12 text-zinc-600 mx-auto mb-10" />
                        <h2 className="text-4xl md:text-5xl font-light mb-8">Zero-Trust <span className="font-serif italic font-normal">Security</span></h2>
                        <p className="text-xl text-zinc-400 font-light leading-relaxed mb-12 max-w-2xl mx-auto">
                            Every byte of telemetry is encrypted with AES-256 before it leaves the sensor.
                            Our proprietary "Synapse" protocol ensures that even if a node is physically compromised, the network remains impenetrable.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            {['End-to-End Encryption', 'Rotating Keys', 'Air-Gapped Core', 'Biometric Auth'].map((tag, i) => (
                                <span key={i} className="px-6 py-3 bg-zinc-900/50 border border-white/10 rounded-full text-xs font-mono text-zinc-400 uppercase tracking-wider hover:border-white/30 transition-colors">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </RevealCard>
                </div>
            </Section>

            {/* --- SECTION 3: 'THE OBSERVER' AI MODELS --- */}
            <Section className="bg-background border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6 w-full">
                    <div className="flex flex-col md:flex-row gap-20">
                        <div className="flex-1">
                            <RevealCard>
                                <h2 className="text-4xl font-light mb-8 uppercase tracking-tight">The <span className="font-serif italic font-normal text-white">Observer</span> Engine</h2>
                                <p className="text-zinc-400 mb-12 text-lg font-light leading-relaxed">
                                    Unlike generic computer vision, 'The Observer' is fine-tuned on <span className="text-white font-medium">2.5 million</span> localized threat scenarios. It distinguishes between a stray dog and a crawling combatant in low-light conditions.
                                </p>
                                <div className="space-y-8">
                                    <div>
                                        <div className="flex justify-between text-xs font-mono mb-3 uppercase tracking-widest">
                                            <span className="text-zinc-500">Human Detection Accuracy</span>
                                            <span className="text-white">99.2%</span>
                                        </div>
                                        <div className="h-1 bg-zinc-900 w-full">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                whileInView={{ width: "99.2%" }}
                                                transition={{ duration: 1.5, ease: "easeOut" }}
                                                className="h-full bg-white"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs font-mono mb-3 uppercase tracking-widest">
                                            <span className="text-zinc-500">Weapon Classification</span>
                                            <span className="text-zinc-300">96.8%</span>
                                        </div>
                                        <div className="h-1 bg-zinc-900 w-full">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                whileInView={{ width: "96.8%" }}
                                                transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                                                className="h-full bg-zinc-400"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </RevealCard>
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-6">
                            {['YOLOv8-L', 'ResNet-50', 'DeepSort', 'Custom-CNN'].map((model, i) => (
                                <RevealCard key={i} delay={i * 0.1} className="p-8 glass-panel rounded-sm flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors group">
                                    <Cpu className="w-8 h-8 text-zinc-700 mb-6 group-hover:text-white transition-colors" />
                                    <div className="font-medium text-lg text-white mb-2">{model}</div>
                                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Active Module</div>
                                </RevealCard>
                            ))}
                        </div>
                    </div>
                </div>
            </Section>

            {/* --- SECTION 4: HARDWARE ECOSYSTEM --- */}
            <Section className="bg-zinc-950">
                <div className="max-w-7xl mx-auto px-6 w-full text-center">
                    <RevealCard className="mb-20">
                        <span className="text-zinc-500 font-mono uppercase tracking-widest text-xs">Agnostic Integration</span>
                        <h2 className="text-4xl md:text-5xl font-light mt-4">Sensor <span className="font-serif italic">Ecosystem</span></h2>
                    </RevealCard>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { icon: Eye, label: "Optical", desc: "4K Visible Light" },
                            { icon: Zap, label: "Thermal", desc: "Long-Wave IR" },
                            { icon: Radio, label: "LIDAR", desc: "3D Point Cloud" },
                            { icon: Activity, label: "Seismic", desc: "Ground Vibration" },
                            { icon: Cloud, label: "Radar", desc: "mmWave Detection" },
                            { icon: Server, label: "Edge", desc: "On-Prem Compute" },
                            { icon: Lock, label: "Access", desc: "Biometric Gates" },
                            { icon: Database, label: "Storage", desc: "PB-Scale Retention" }
                        ].map((item, i) => (
                            <RevealCard key={i} delay={i * 0.05} className="group p-8 border border-white/5 rounded-sm hover:border-white/20 transition-all bg-black hover:bg-zinc-900">
                                <item.icon className="w-6 h-6 text-zinc-600 group-hover:text-white transition-colors mb-6 mx-auto" />
                                <h3 className="font-medium text-sm text-zinc-200 mb-2">{item.label}</h3>
                                <p className="text-[10px] text-zinc-500 font-mono uppercase">{item.desc}</p>
                            </RevealCard>
                        ))}
                    </div>
                </div>
            </Section>

            {/* --- SECTION 8: ENTERPRISE --- */}


            {/* --- SECTION 9: FINAL CTA --- */}
            <Section className="bg-black text-center border-t border-white/5">
                <div className="absolute inset-0 bg-white/[0.02] bg-[radial-gradient(circle_at_center,_transparent_0%,_black_70%)]" />
                <div className="relative z-10 max-w-4xl mx-auto px-6">
                    <RevealCard>
                        <h2 className="text-5xl md:text-8xl font-light mb-12 leading-tight tracking-tight">
                            SECURE THE<br /><span className="font-serif italic text-zinc-400">FUTURE.</span>
                        </h2>
                        <MagneticButton
                            onClick={() => setLocation('/system')}
                            className="bg-white text-black text-sm font-bold px-12 py-5 rounded-sm hover:scale-105 transition-all duration-500"
                        >
                            <span className="tracking-[0.2em] uppercase">Initialize System Now</span>
                        </MagneticButton>
                    </RevealCard>
                </div>
            </Section>

            {/* --- FOOTER --- */}
            <footer className="bg-zinc-950 py-24 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity">
                        <Shield className="w-5 h-5 text-white" />
                        <span className="font-medium tracking-tight text-sm text-white">AUTONOMOUS<span className="font-serif italic font-normal ml-1 text-zinc-500">SHIELD</span></span>
                    </div>
                    <div className="text-zinc-600 text-[10px] font-mono tracking-widest uppercase">
                        &copy; 2026 Defense Systems Inc // RESTRICTED
                    </div>
                </div>
            </footer>
        </div>
    );
}
