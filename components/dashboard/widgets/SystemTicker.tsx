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
        <div className="w-full bg-white dark:bg-[#252525] border-y border-[#545454]/30 dark:border-[#545454]/50 backdrop-blur-md h-8 flex items-center overflow-hidden relative mb-6 rounded-xl">
            <div className="absolute left-0 bg-[#545454]/15 dark:bg-[#1E1E1E] px-3 h-full flex items-center z-10 border-r border-[#545454]/40">
                <Terminal size={12} className="text-[#252525] dark:text-[#CFCFCF] mr-1.5" />
                <span className="text-[10px] font-bold text-[#252525] dark:text-[#CFCFCF] font-mono tracking-wider">SYS.TELEMETRY</span>
            </div>
            <div className="animate-marquee whitespace-nowrap flex gap-12 items-center pl-36">
                {messages.concat(messages).map((msg, i) => (
                    <span key={i} className="text-[10px] font-mono font-medium text-[#7D7D7D] dark:text-[#7D7D7D] flex items-center">
                        <span className="w-1.5 h-1.5 bg-[#CFCFCF] rounded-full mr-2 animate-pulse"></span>
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
