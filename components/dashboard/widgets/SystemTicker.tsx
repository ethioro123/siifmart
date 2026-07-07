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
        <div className="w-full bg-white/80 dark:bg-black/40 border-y border-gray-200 dark:border-white/5 backdrop-blur-md h-8 flex items-center overflow-hidden relative mb-6">
            <div className="absolute left-0 bg-cyber-primary/10 dark:bg-cyber-primary/20 px-2 h-full flex items-center z-10 border-r border-cyber-primary/20 dark:border-cyber-primary/30">
                <Terminal size={12} className="text-cyber-primary mr-1" />
                <span className="text-[10px] font-bold text-cyber-primary">SYS.LOG</span>
            </div>
            <div className="animate-marquee whitespace-nowrap flex gap-12 items-center pl-24">
                {messages.concat(messages).map((msg, i) => (
                    <span key={i} className="text-[10px] font-mono font-medium text-gray-500 dark:text-gray-400 flex items-center">
                        <span className="w-1.5 h-1.5 bg-cyber-primary/50 rounded-full mr-2 animate-pulse"></span>
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
