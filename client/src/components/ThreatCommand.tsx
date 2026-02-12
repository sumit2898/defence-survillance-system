import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Eye, Lock, AlertOctagon, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Threat {
    id: string;
    threatLevel: string;
    decision: string;
    createdAt: string;
}

export function ThreatCommand({ className }: { className?: string }) {
    const [role, setRole] = useState<'analyst' | 'commander'>('analyst');
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({ level: 'LOW', decision: '' });

    // Fetch threats based on selected role (RLS Demo)
    const { data: threats, refetch } = useQuery<Threat[]>({
        queryKey: ['threats', role],
        queryFn: async () => {
            const res = await fetch(`/api/threats?role=${role}`);
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Access Denied");
            }
            return res.json();
        }
    });

    const mutation = useMutation({
        mutationFn: async (data: { threatLevel: string; decision: string; role: string }) => {
            const res = await fetch('/api/threats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to record threat');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['threats'] });
            queryClient.invalidateQueries({ queryKey: ['audit-logs'] }); // Audit log updates too
            setFormData(prev => ({ ...prev, decision: '' }));
        }
    });

    const recallMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/fleet/recall', { method: 'POST' });
            if (!res.ok) throw new Error('Recall Failed');
            return res.json();
        },
        onSuccess: () => {
            alert("FLEET RECALL INITIATED: All units returning to base.");
        }
    });

    return (
        <div className={cn("flex flex-col h-full bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden", className)}>
            {/* Role Switcher Header */}
            <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Lock className="h-4 w-4 text-cyan-400" />
                    ACCESS_CONTROL_SIM
                </h3>
                <div className="flex bg-black/50 rounded-lg p-1 border border-white/10">
                    <button
                        onClick={() => setRole('analyst')}
                        className={cn(
                            "px-3 py-1 text-[9px] font-bold uppercase tracking-wider rounded transition-all",
                            role === 'analyst' ? "bg-blue-500/20 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]" : "text-zinc-500 hover:text-white"
                        )}
                    >
                        Analyst
                    </button>
                    <button
                        onClick={() => setRole('commander')}
                        className={cn(
                            "px-3 py-1 text-[9px] font-bold uppercase tracking-wider rounded transition-all",
                            role === 'commander' ? "bg-red-500/20 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]" : "text-zinc-500 hover:text-white"
                        )}
                    >
                        Commander
                    </button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 p-6 gap-6">
                {/* Input Form */}
                <div className="space-y-4">
                    <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-4">Input_Vector</h4>

                    <div className="space-y-2">
                        <label className="text-[9px] font-mono text-zinc-400 uppercase">Threat Level</label>
                        <div className="grid grid-cols-4 gap-2">
                            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(lvl => (
                                <button
                                    key={lvl}
                                    onClick={() => setFormData(prev => ({ ...prev, level: lvl }))}
                                    className={cn(
                                        "py-2 border text-[8px] font-black rounded uppercase tracking-wider transition-all",
                                        formData.level === lvl
                                            ? lvl === 'CRITICAL' ? "bg-red-500 text-white border-red-500" : "bg-cyan-500 text-black border-cyan-500"
                                            : "bg-transparent border-white/10 text-zinc-500 hover:border-white/30"
                                    )}
                                >
                                    {lvl}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-mono text-zinc-400 uppercase">Tactical Decision</label>
                        <textarea
                            value={formData.decision}
                            onChange={(e) => setFormData(prev => ({ ...prev, decision: e.target.value }))}
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-white font-mono focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-zinc-700"
                            placeholder="ENTER STRATEGIC DECISION..."
                            rows={3}
                        />

                    </div>

                    {role === 'commander' && (
                        <button
                            onClick={() => {
                                if (confirm("WARNING: INITIATING EMERGENCY FLEET RECALL. CONFIRM?")) {
                                    recallMutation.mutate();
                                }
                            }}
                            disabled={recallMutation.isPending}
                            className="w-full py-4 bg-red-500 hover:bg-red-600 border border-red-400 rounded-lg text-xs font-black text-white uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse"
                        >
                            {recallMutation.isPending ? 'TRANSMITTING...' : '⚠️ EMERGENCY FLEET RECALL'}
                        </button>
                    )}

                    <button
                        onClick={() => mutation.mutate({ threatLevel: formData.level, decision: formData.decision, role })}
                        disabled={mutation.isPending}
                        className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-[10px] font-black text-white uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                    >
                        {mutation.isPending ? 'PROCESSING...' : 'SUBMIT_ASSESSMENT'}
                    </button>
                    <p className="text-[8px] text-zinc-600 font-mono text-center">
                        *Submissions will differ based on Active Role
                    </p>
                </div>

                {/* View Panel (RLS Restricted) */}
                <div className="relative border-l border-white/5 pl-6 flex flex-col">
                    <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-4 flex justify-between">
                        <span>Restricted_View_Feed</span>
                        <span className={cn("text-[8px]", role === 'commander' ? "text-red-500" : "text-blue-500")}>
                            {role === 'commander' ? 'FULL_CLEARANCE' : 'LEVEL_3_CLEARANCE'}
                        </span>
                    </h4>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 relative">
                        {threats?.map((threat) => (
                            <div key={threat.id} className="bg-white/5 p-3 rounded border border-white/5 flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <span className={cn(
                                        "text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider",
                                        threat.threatLevel === 'CRITICAL' ? "bg-red-500 text-white" : "bg-cyan-500/20 text-cyan-400"
                                    )}>
                                        {threat.threatLevel}
                                    </span>
                                    <span className="text-[8px] font-mono text-zinc-600">{new Date(threat.createdAt).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-[10px] text-zinc-300 font-mono leading-relaxed">{threat.decision}</p>
                            </div>
                        ))}

                        {role === 'analyst' && (
                            <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black via-black/80 to-transparent flex items-end justify-center pb-4">
                                <div className="text-center">
                                    <Lock className="h-6 w-6 text-zinc-700 mx-auto mb-2" />
                                    <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">HIGHER_LEVEL_INTEL_REDACTED</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
