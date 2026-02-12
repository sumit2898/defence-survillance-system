import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Shield, AlertTriangle, FileText, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface AuditLog {
    id: string;
    tableName: string;
    action: 'INSERT' | 'UPDATE' | 'DELETE';
    oldData: any;
    newData: any;
    changedBy: string;
    createdAt: string;
}

export function SecurityAuditLog({ className }: { className?: string }) {
    const { data: logs, isLoading } = useQuery<AuditLog[]>({
        queryKey: ['audit-logs'],
        queryFn: async () => {
            const res = await fetch('/api/audit-logs');
            if (!res.ok) throw new Error('Failed to fetch logs');
            return res.json();
        },
        refetchInterval: 2000,
    });

    return (
        <div className={cn("flex flex-col h-full", className)}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    IMMUTABLE_AUDIT_LEDGER
                </h3>
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-tighter">
                    {isLoading ? 'SYNCING...' : 'LIVE_FEED'}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                {logs?.map((log, i) => {
                    // Calculate quick diff or summary
                    // For brevity, we just show cleaner json
                    return (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={log.id}
                            className="group relative bg-white/5 border border-white/5 hover:border-green-500/30 rounded-lg p-3 transition-all"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        "text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider",
                                        log.action === 'INSERT' ? "bg-green-500/20 text-green-400" :
                                            log.action === 'UPDATE' ? "bg-blue-500/20 text-blue-400" :
                                                "bg-red-500/20 text-red-400"
                                    )}>
                                        {log.action}
                                    </span>
                                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                                        {log.tableName}
                                    </span>
                                </div>
                                <span className="text-[9px] font-mono text-zinc-600">
                                    {format(new Date(log.createdAt), 'HH:mm:ss')}
                                </span>
                            </div>

                            <div className="space-y-1">
                                {log.action === 'UPDATE' && log.newData && log.oldData ? (
                                    <div className="text-[10px] font-mono text-zinc-500">
                                        {Object.keys(log.newData).map(key => {
                                            if (log.newData[key] !== log.oldData[key] && key !== 'updatedAt') {
                                                return (
                                                    <div key={key} className="flex gap-2">
                                                        <span className="text-zinc-600">{key}:</span>
                                                        <span className="text-red-500 line-through opacity-70">{String(log.oldData[key]).slice(0, 20)}</span>
                                                        <span className="text-green-500">{String(log.newData[key]).slice(0, 20)}</span>
                                                    </div>
                                                )
                                            }
                                            return null;
                                        })}
                                    </div>
                                ) : (
                                    <>
                                        {log.newData && (
                                            <div className="text-[10px] font-mono text-zinc-400 break-all">
                                                <span className="text-green-500/70 mr-2">+</span>
                                                {JSON.stringify(log.newData).slice(0, 80)}...
                                            </div>
                                        )}
                                        {log.oldData && !log.newData && (
                                            <div className="text-[10px] font-mono text-zinc-600 break-all">
                                                <span className="text-red-500/70 mr-2">-</span>
                                                {JSON.stringify(log.oldData).slice(0, 80)}...
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Details Hover */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2">
                                <FileText className="h-3 w-3 text-zinc-500 hover:text-white cursor-pointer" />
                            </div>
                        </motion.div>
                    )
                })}

                {(!logs || logs.length === 0) && (
                    <div className="text-center py-8 text-zinc-600 text-[10px] font-mono uppercase tracking-widest">
                        No_Audit_Records_Found
                    </div>
                )}
            </div>
        </div>
    );
}
