import React from 'react';
import { Terminal } from 'lucide-react';

export const SystemTicker = () => {
    const messages = [
        "SYSTEM OPTIMAL",
        "WMS SYNC: ACTIVE",
        "NETWORK LATENCY: 12MS",
        "SECURITY SHIELD: ENGAGED",
        "BACKUP: COMPLETED 04:00Z",
        "NEW NODES DETECTED: 0",
        "AI CO-PILOT: STANDBY"
    ];

    return (
        <div className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] h-8 flex items-center overflow-hidden relative mb-6 rounded-xl shadow-xs">
            <div className="absolute left-0 bg-[var(--theme-bg-subtle)] px-3 h-full flex items-center z-10 border-r border-[var(--theme-border)]">
                <Terminal size={12} className="text-[var(--theme-accent)] mr-1.5" />
                <span className="text-[11px] font-bold text-[var(--theme-text-primary)] font-mono tracking-wider">SYS.TELEMETRY</span>
            </div>
            <div className="animate-marquee whitespace-nowrap flex gap-12 items-center pl-40">
                {messages.concat(messages).map((msg, i) => (
                    <span key={i} className="text-[11px] font-mono font-medium text-[var(--theme-text-secondary)] flex items-center">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                        {msg}
                    </span>
                ))}
            </div>
            <style>{`
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </div>
    );
};
