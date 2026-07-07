import React, { useState, useEffect } from 'react';
import { formatDateTime } from '../../../utils/formatting';

export const CyberClock = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        try {
            // Use 'medium' time to get the WB/WD (AM/PM) translation in Oromo
            return new Intl.DateTimeFormat('om-ET', { timeStyle: 'medium' }).format(date);
        } catch {
            return formatDateTime(date, { showTime: true }).split(', ')[1];
        }
    };

    const formatDate = (date: Date) => {
        try {
            return new Intl.DateTimeFormat('om-ET', { dateStyle: 'full' }).format(date).toUpperCase();
        } catch {
            return formatDateTime(date).toUpperCase();
        }
    };

    return (
        <div className="flex flex-col items-end font-mono">
            <div className="text-3xl font-bold text-white tracking-widest leading-none flex gap-1">
                {formatTime(time).split('').map((char, i) => (
                    <span key={i} className={`inline-block ${char === ':' ? 'animate-pulse text-cyber-primary' : ''}`}>
                        {char}
                    </span>
                ))}
            </div>
            <div className="text-xs text-cyber-primary font-bold tracking-[0.2em] mt-1.5 opacity-80 border-t border-white/5 pt-1 w-full text-right">
                {formatDate(time)}
            </div>
        </div>
    );
};
