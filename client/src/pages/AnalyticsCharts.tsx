import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { Activity, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';

interface ChartProps {
    data: any[];
}

export const InferenceLatencyChart = ({ data }: ChartProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900/60 border border-white/15 rounded-xl p-5 backdrop-blur-md flex flex-col h-full relative group overflow-hidden shadow-lg shadow-black/20"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2 relative z-10">
                <Activity className="w-4 h-4 text-cyan-400" />
                Inference Latency (ms)
            </h3>
            <div className="flex-1 w-full min-h-0 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#000000dd', borderColor: '#333', backdropFilter: 'blur(10px)' }}
                            itemStyle={{ color: '#22d3ee', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', fontWeight: '600' }}
                            labelStyle={{ display: 'none' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="latency"
                            stroke="#22d3ee"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#colorLatency)"
                            isAnimationActive={true}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

export const ClassDistributionChart = () => {
    const data = [
        { name: 'Person', value: 65, fill: '#06b6d4' },
        { name: 'Vehicle', value: 25, fill: '#8b5cf6' },
        { name: 'Weapon', value: 10, fill: '#ef4444' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-900/60 border border-white/15 rounded-xl p-5 backdrop-blur-md flex flex-col h-full relative group overflow-hidden shadow-lg shadow-black/20"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2 relative z-10">
                <PieChartIcon className="w-4 h-4 text-purple-400" />
                Class Distribution
            </h3>
            <div className="flex-1 w-full min-h-0 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#000000dd', borderColor: '#333', backdropFilter: 'blur(10px)' }}
                            itemStyle={{ fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', fontWeight: '600' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center Label */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <div className="text-3xl font-black text-white font-mono drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">4.2k</div>
                        <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">Total</div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export const CameraLoadChart = () => {
    const data = [
        { name: 'CAM-01', events: 45 },
        { name: 'CAM-02', events: 30 },
        { name: 'CAM-03', events: 55 },
        { name: 'CAM-04', events: 20 },
        { name: 'CAM-05', events: 10 },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900/60 border border-white/15 rounded-xl p-5 backdrop-blur-md flex flex-col h-full relative group overflow-hidden shadow-lg shadow-black/20"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2 relative z-10">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Camera Activity Load
            </h3>
            <div className="flex-1 w-full min-h-0 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#ffffff10" />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: '600' }}
                            width={50}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{ backgroundColor: '#000000dd', borderColor: '#333', backdropFilter: 'blur(10px)' }}
                            itemStyle={{ color: '#10b981', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', fontWeight: '600' }}
                        />
                        <Bar
                            dataKey="events"
                            fill="#10b981"
                            radius={[0, 4, 4, 0]}
                            barSize={15}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};
