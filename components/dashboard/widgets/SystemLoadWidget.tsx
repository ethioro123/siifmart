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
        { label: 'CPU CORE_01', value: load.cpu, color: 'cyan', text: 'text-cyan-400', bg: 'bg-cyan-500', from: 'from-cyan-600', to: 'to-cyan-400' },
        { label: 'MEM_ALLOC', value: load.mem, color: 'purple', text: 'text-purple-400', bg: 'bg-purple-500', from: 'from-purple-600', to: 'to-purple-400' },
        { label: 'NET_THROUGHPUT', value: load.net, unit: ' MB/s', color: 'green', text: 'text-green-400', bg: 'bg-green-500', from: 'from-green-600', to: 'to-green-400' }
    ];

    return (
        <div className="glass-panel rounded-3xl p-5 flex flex-col justify-center relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] h-full w-full min-w-0">
            <div className="flex items-center justify-between mb-4 relative z-10 w-full">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded-lg bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors shrink-0">
                        <Server className="text-cyan-600 dark:text-cyan-400" size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-gray-900 dark:text-white font-bold uppercase tracking-widest block truncate">Status</span>
                        <span className="text-[9px] text-cyan-600 dark:text-cyan-400 font-mono tracking-wider truncate block">OPTIMAL</span>
                    </div>
                </div>
                <div className="flex gap-1.5">
                    <span className="w-1.5 h-6 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.5)]"></span>
                    <span className="w-1.5 h-4 bg-cyan-500/40 rounded-full my-auto"></span>
                    <span className="w-1.5 h-2 bg-cyan-500/20 rounded-full my-auto"></span>
                </div>
            </div>

            <div className="space-y-5 relative z-10">
                {metrics.map((m, i) => (
                    <div key={i} className="group/bar">
                        <div className="flex justify-between text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 mb-1.5 tracking-wider">
                            <span>{m.label}</span>
                            <span className={`${m.text} font-mono text-xs group-hover/bar:scale-110 transition-transform`}>
                                {m.value}{m.unit || '%'}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-black/40 h-2 rounded-full overflow-hidden border border-gray-100 dark:border-white/5">
                            {/* eslint-disable-next-line react/forbid-dom-props */}
                            <div
                                className={`h-full bg-gradient-to-r ${m.from} ${m.to} shadow-sm transition-all duration-1000 ease-out relative`}
                                ref={(el) => { if (el) el.style.width = `${m.value}%`; }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Premium Background FX */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/10 dark:group-hover:bg-cyan-500/20 transition-colors duration-700"></div>
        </div>
    );
};
