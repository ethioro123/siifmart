import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../../contexts/DataContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getCountryProfile, type Country } from '../../../utils/localization';

export interface SovereignDateWidgetProps {
    country?: Country;
    className?: string;
    compact?: boolean;
}

export const SovereignDateWidget: React.FC<SovereignDateWidgetProps> = ({
    country,
    className = '',
    compact = false
}) => {
    const { effectiveCountry, settings } = useData();
    const { language } = useLanguage();
    const activeCountry = (country || effectiveCountry || settings?.country || 'ET') as Country;
    const profile = useMemo(() => getCountryProfile(activeCountry), [activeCountry]);
    const timezone = profile.timezone || (activeCountry === 'KE' ? 'Africa/Nairobi' : 'Africa/Addis_Ababa');

    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const calendarInfo = useMemo(() => {
        if (activeCountry === 'ET') {
            try {
                let raw = new Intl.DateTimeFormat('en-US', {
                    calendar: 'ethiopic',
                    dateStyle: 'full',
                    timeZone: timezone
                }).format(time).toLowerCase();

                raw = raw.replace(/\s*(era[0-9]|am)\b/ig, '').trim();

                if (language === 'or') {
                    // Pure Afaan Oromoo (Zero Amharic)
                    raw = raw.replace('sunday', 'Dilbata');
                    raw = raw.replace('monday', 'Wiixata');
                    raw = raw.replace('tuesday', 'Kibxata');
                    raw = raw.replace('wednesday', 'Roobii');
                    raw = raw.replace('thursday', 'Kamisa');
                    raw = raw.replace('friday', 'Jimaata');
                    raw = raw.replace('saturday', 'Sanbata');

                    raw = raw.replace('meskerem', 'Fulbaana');
                    raw = raw.replace('tikimt', 'Onkoloolessa');
                    raw = raw.replace('hidar', 'Sadaasa');
                    raw = raw.replace('tahsas', 'Muddee');
                    raw = raw.replace('tirr', 'Amajjii');
                    raw = raw.replace('yakatit', 'Guraandhala');
                    raw = raw.replace('megabit', 'Bitooteessa');
                    raw = raw.replace('miyazya', 'Ebla');
                    raw = raw.replace('ginbot', 'Caamsaa');
                    raw = raw.replace('sene', 'Waxabajjii');
                    raw = raw.replace('hamle', 'Adoolessa');
                    raw = raw.replace('nehase', 'Hagayya');
                    raw = raw.replace('pagume', 'Qaammee');

                    return {
                        title: 'ET · Kalandara Itoophiyaa',
                        dateString: raw,
                        badgeTheme: 'border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-500/10'
                    };
                } else if (language === 'en') {
                    // Pure English
                    return {
                        title: 'ET · Ethiopian Solar Calendar',
                        dateString: raw.charAt(0).toUpperCase() + raw.slice(1),
                        badgeTheme: 'border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-500/10'
                    };
                } else {
                    // Pure Amharic (Zero Oromo)
                    raw = raw.replace('sunday', 'እሁድ');
                    raw = raw.replace('monday', 'ሰኞ');
                    raw = raw.replace('tuesday', 'ማክሰኞ');
                    raw = raw.replace('wednesday', 'ረቡዕ');
                    raw = raw.replace('thursday', 'ሐሙስ');
                    raw = raw.replace('friday', 'ዓርብ');
                    raw = raw.replace('saturday', 'ቅዳሜ');

                    raw = raw.replace('meskerem', 'መስከረም');
                    raw = raw.replace('tikimt', 'ጥቅምት');
                    raw = raw.replace('hidar', 'ኅዳር');
                    raw = raw.replace('tahsas', 'ታኅሣሥ');
                    raw = raw.replace('tirr', 'ጥር');
                    raw = raw.replace('yakatit', 'የካቲት');
                    raw = raw.replace('megabit', 'መጋቢት');
                    raw = raw.replace('miyazya', 'ሚያዝያ');
                    raw = raw.replace('ginbot', 'ግንቦት');
                    raw = raw.replace('sene', 'ሰኔ');
                    raw = raw.replace('hamle', 'ሐምሌ');
                    raw = raw.replace('nehase', 'ነሐሴ');
                    raw = raw.replace('pagume', 'ጳጉሜ');

                    return {
                        title: 'ET · የኢትዮጵያ ዘመን አቆጣጠር',
                        dateString: `${raw} ዓ.ም`,
                        badgeTheme: 'border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-500/10'
                    };
                }
            } catch {
                return {
                    title: 'ET · Ethiopian Calendar',
                    dateString: 'ETHIOPIAN CALENDAR',
                    badgeTheme: 'border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-500/10'
                };
            }
        } else if (activeCountry === 'KE') {
            try {
                const sw = new Intl.DateTimeFormat('sw-KE', {
                    dateStyle: 'full',
                    timeZone: timezone
                }).format(time).toUpperCase();
                return {
                    title: 'KE · Kenyan National Calendar',
                    dateString: sw,
                    badgeTheme: 'border-emerald-600/30 text-emerald-800 dark:text-emerald-400 bg-emerald-600/10'
                };
            } catch {
                return {
                    title: 'KE · Kenyan Calendar',
                    dateString: time.toDateString().toUpperCase(),
                    badgeTheme: 'border-emerald-600/30 text-emerald-800 dark:text-emerald-400 bg-emerald-600/10'
                };
            }
        } else {
            try {
                const dateStr = new Intl.DateTimeFormat('en-US', {
                    dateStyle: 'full',
                    timeZone: timezone
                }).format(time).toUpperCase();
                return {
                    title: `${profile.name} Calendar`,
                    dateString: dateStr,
                    badgeTheme: 'border-stone-400/30 text-stone-700 dark:text-stone-300 bg-stone-500/10'
                };
            } catch {
                return {
                    title: `${profile.name} Calendar`,
                    dateString: time.toDateString().toUpperCase(),
                    badgeTheme: 'border-stone-400/30 text-stone-700 dark:text-stone-300 bg-stone-500/10'
                };
            }
        }
    }, [activeCountry, time, timezone, profile.name]);

    if (compact) {
        return (
            <div className={`flex flex-col items-end px-3 py-1.5 rounded-xl border ${calendarInfo.badgeTheme} ${className}`}>
                <span className="text-[11px] font-semibold uppercase tracking-wider leading-none mb-0.5">
                    {calendarInfo.title}
                </span>
                <span className="text-[11px] font-mono font-bold leading-none truncate max-w-[200px]">
                    {calendarInfo.dateString}
                </span>
            </div>
        );
    }

    return (
        <div className={`hidden lg:flex px-4 py-2 rounded-xl border h-[42px] flex-col justify-center items-end text-right relative overflow-hidden group shadow-xs ${calendarInfo.badgeTheme} ${className}`}>
            <p className="text-[11px] font-semibold uppercase tracking-wider leading-none mb-0.5">
                {calendarInfo.title}
            </p>
            <p className="text-[11px] font-mono font-bold leading-none tracking-wider truncate max-w-[280px]">
                {calendarInfo.dateString}
            </p>
        </div>
    );
};

export const EthiopianDateWidget = SovereignDateWidget;

