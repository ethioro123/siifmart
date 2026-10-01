import React, { useState, useEffect } from 'react';
import { formatDateTime } from '../../../utils/formatting';
import { useData } from '../../../contexts/DataContext';
import { getCountryProfile, type Country } from '../../../utils/localization';

interface CyberClockProps {
    country?: Country;
}

export const CyberClock: React.FC<CyberClockProps> = ({ country }) => {
    const { effectiveCountry, settings } = useData();
    const activeCountry = (country || effectiveCountry || settings?.country || 'ET') as Country;
    const profile = getCountryProfile(activeCountry);
    const timezone = profile.timezone || 'Africa/Addis_Ababa';

    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getLocale = () => {
        switch (activeCountry) {
            case 'ET': return 'om-ET';
            case 'KE': return 'en-KE';
            case 'UG': return 'en-UG';
            case 'RW': return 'en-RW';
            case 'TZ': return 'en-TZ';
            default: return 'en-US';
        }
    };

    const formatTime = (date: Date) => {
        try {
            return new Intl.DateTimeFormat(getLocale(), { timeStyle: 'medium', timeZone: timezone }).format(date);
        } catch {
            return formatDateTime(date, { showTime: true }).split(', ')[1];
        }
    };

    const formatDate = (date: Date) => {
        try {
            return new Intl.DateTimeFormat(getLocale(), { dateStyle: 'full', timeZone: timezone }).format(date).toUpperCase();
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
