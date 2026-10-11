import React, { useState, useEffect } from 'react';
import { Server } from 'lucide-react';

export const SystemLoadWidget = () => {
    const [load, setLoad] = useState({ cpu: 24, mem: 41, net: 68 });

    useEffect(() => {
        const interval = setInterval(() => {
            setLoad({
                cpu: 20 + Math.floor(Math.random() * 15),
                mem: 40 + Math.floor(Math.random() * 5),
                net: 60 + Math.floor(Math.random() * 20),
            });
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const metrics = [
        { label: 'CPU CORE_01', value: load.cpu },
        { label: 'MEM_ALLOC', value: load.mem },
        { label: 'NET_THROUGHPUT', value: load.net, unit: ' MB/s' }
    ];

    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 flex flex-col justify-center relative overflow-hidden shadow-sm h-full w-full min-w-0">
            <div className="flex items-center justify-between mb-4 relative z-10 w-full">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                        <Server size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <span className="text-[11px] text-[var(--theme-text-primary)] font-bold uppercase tracking-wider block truncate">System Load</span>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold tracking-wider truncate block">OPTIMAL</span>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
            </div>

            <div className="space-y-4 relative z-10">
                {metrics.map((m, i) => (
                    <div key={i}>
                        <div className="flex justify-between text-[11px] uppercase font-semibold text-[var(--theme-text-secondary)] mb-1.5 tracking-wider">
                            <span>{m.label}</span>
                            <span className="font-mono text-xs font-bold text-[var(--theme-text-primary)] tabular-nums">
                                {m.value}{m.unit || '%'}
                            </span>
                        </div>
                        <div className="w-full bg-[var(--theme-border)] h-1.5 rounded-full overflow-hidden">
                            {/* eslint-disable-next-line react/forbid-dom-props */}
                            <div
                                className="h-full bg-[var(--theme-accent)] rounded-full transition-all duration-500 ease-out"
                                ref={(el) => { if (el) el.style.width = `${m.value}%`; }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
