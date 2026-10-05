import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../../contexts/DataContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getCountryProfile, type Country } from '../../../utils/localization';

interface CyberClockProps {
    country?: Country;
    compact?: boolean;
    showCalendar?: boolean;
}

export const CyberClock: React.FC<CyberClockProps> = ({ country, compact = false, showCalendar = true }) => {
    const { effectiveCountry, settings } = useData();
    const { language } = useLanguage();
    const activeCountry = (country || effectiveCountry || settings?.country || 'ET') as Country;
    const profile = useMemo(() => getCountryProfile(activeCountry), [activeCountry]);
    const timezone = profile.timezone || (activeCountry === 'KE' ? 'Africa/Nairobi' : 'Africa/Addis_Ababa');

    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // ── 1. Sovereign Live Time ──
    const timeString = useMemo(() => {
        try {
            return new Intl.DateTimeFormat('en-GB', {
                timeZone: timezone,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }).format(time);
        } catch {
            return time.toTimeString().split(' ')[0];
        }
    }, [time, timezone]);

    // ── 2. Sovereign Local Clock Offset & Secondary Subtitle (Strict Language Separation) ──
    const clockSubtitle = useMemo(() => {
        if (activeCountry === 'ET') {
            try {
                const parts = new Intl.DateTimeFormat('en-US', {
                    timeZone: timezone,
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: false
                }).formatToParts(time);

                const hours = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
                const minutes = parts.find(p => p.type === 'minute')?.value || '00';

                // Ethiopian 12h cycle starting at 6:00 AM (dawn)
                let ethHour = (hours + 6) % 12;
                if (ethHour === 0) ethHour = 12;

                if (language === 'or') {
                    // Pure Afaan Oromoo — NEVER mix with Amharic
                    let period = 'Ganama';
                    if (hours >= 6 && hours < 12) period = 'Ganama';
                    else if (hours >= 12 && hours < 18) period = 'Guyyaa';
                    else if (hours >= 18 && hours < 24) period = 'Galgala';
                    else period = 'Halkan';

                    return `${String(ethHour).padStart(2, '0')}:${minutes} ${period} (Sa'aatii Itoophiyaa) • EAT`;
                } else if (language === 'en') {
                    // English
                    let period = 'Morning';
                    if (hours >= 6 && hours < 12) period = 'Morning';
                    else if (hours >= 12 && hours < 18) period = 'Afternoon';
                    else if (hours >= 18 && hours < 24) period = 'Evening';
                    else period = 'Night';

                    return `${String(ethHour).padStart(2, '0')}:${minutes} ${period} (Ethiopian Time) • EAT`;
                } else {
                    // Pure Amharic — NEVER mix with Oromo
                    let period = 'ጠዋት';
                    if (hours >= 6 && hours < 12) period = 'ጠዋት';
                    else if (hours >= 12 && hours < 18) period = 'ቀን';
                    else if (hours >= 18 && hours < 24) period = 'ማታ';
                    else period = 'ሌሊት';

                    return `${String(ethHour).padStart(2, '0')}:${minutes} ${period} (የኢትዮጵያ ሰዓት) • EAT`;
                }
            } catch {
                return 'ADDIS ABABA • EAT (UTC+3)';
            }
        } else if (activeCountry === 'KE') {
            return 'NAIROBI • EAT (UTC+3)';
        } else if (activeCountry === 'UG') {
            return 'KAMPALA • EAT (UTC+3)';
        } else if (activeCountry === 'RW') {
            return 'KIGALI • CAT (UTC+2)';
        } else if (activeCountry === 'TZ') {
            return 'DAR ES SALAAM • EAT (UTC+3)';
        }
        return `${profile.name} • ${timezone}`;
    }, [activeCountry, time, timezone, language, profile.name]);

    // ── 3. Sovereign National Calendar (Strict Language Separation — Zero Oromo/Amharic Mixing) ──
    const calendarData = useMemo(() => {
        if (activeCountry === 'ET') {
            try {
                let raw = new Intl.DateTimeFormat('en-US', {
                    calendar: 'ethiopic',
                    dateStyle: 'full',
                    timeZone: timezone
                }).format(time).toLowerCase();

                // Clean era markers and trailing AM/PM artifacts
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
                        title: '🇪🇹 Kalandara Itoophiyaa',
                        date: raw
                    };
                } else if (language === 'en') {
                    // English Ethiopic
                    return {
                        title: '🇪🇹 Ethiopian Solar Calendar',
                        date: raw.charAt(0).toUpperCase() + raw.slice(1)
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
                        title: '🇪🇹 የኢትዮጵያ ዘመን አቆጣጠር',
                        date: `${raw} ዓ.ም`
                    };
                }
            } catch {
                return {
                    title: '🇪🇹 Ethiopian Calendar',
                    date: 'ETHIOPIAN CALENDAR'
                };
            }
        } else if (activeCountry === 'KE') {
            try {
                if (language === 'en') {
                    const en = new Intl.DateTimeFormat('en-KE', {
                        dateStyle: 'full',
                        timeZone: timezone
                    }).format(time);
                    return {
                        title: '🇰🇪 Kenyan National Calendar',
                        date: en
                    };
                } else {
                    const sw = new Intl.DateTimeFormat('sw-KE', {
                        dateStyle: 'full',
                        timeZone: timezone
                    }).format(time);
                    return {
                        title: '🇰🇪 Kalenda ya Kitaifa',
                        date: sw
                    };
                }
            } catch {
                return {
                    title: '🇰🇪 Kenyan Calendar',
                    date: time.toDateString()
                };
            }
        } else {
            try {
                const standard = new Intl.DateTimeFormat('en-US', {
                    dateStyle: 'full',
                    timeZone: timezone
                }).format(time);
                return {
                    title: `${profile.flag} ${profile.name} Calendar`,
                    date: standard
                };
            } catch {
                return {
                    title: `${profile.name} Calendar`,
                    date: time.toDateString()
                };
            }
        }
    }, [activeCountry, time, timezone, language, profile.flag, profile.name]);

    const tzAbbr = useMemo(() => {
        if (activeCountry === 'ET' || activeCountry === 'KE' || activeCountry === 'UG' || activeCountry === 'TZ') return 'EAT';
        if (activeCountry === 'RW') return 'CAT';
        return 'UTC';
    }, [activeCountry]);

    if (compact) {
        return (
            <div className="flex flex-col items-end font-mono px-3 py-1.5 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-xs shrink-0 select-none whitespace-nowrap">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--theme-text-primary)] shrink-0 whitespace-nowrap">
                    <span className="text-sm shrink-0">{profile.flag}</span>
                    <span className="tracking-wider shrink-0 text-[var(--theme-text-primary)]">{timeString}</span>
                    <span className="text-[9px] text-[var(--theme-text-muted)] font-semibold shrink-0">{tzAbbr}</span>
                </div>
                {showCalendar && (
                    <span className="text-[9px] text-[var(--theme-text-secondary)] font-bold whitespace-nowrap shrink-0 mt-0.5 max-w-[200px] truncate">
                        {calendarData.date}
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3.5 px-4 py-2 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] shadow-xs shrink-0 select-none">
            {/* Left: Sovereign Calendar Details (Zero Duplication) */}
            {showCalendar && (
                <div className="text-right border-r border-[var(--theme-border)] pr-3.5 hidden sm:block shrink-0">
                    <p className="text-[9px] text-[var(--theme-text-secondary)] font-bold uppercase tracking-wider leading-none mb-1 whitespace-nowrap">
                        {calendarData.title}
                    </p>
                    <p className="text-xs font-mono font-bold text-[var(--theme-text-primary)] leading-none whitespace-nowrap">
                        {calendarData.date}
                    </p>
                </div>
            )}

            {/* Right: Digital Monospace Live Clock (Flex-Nowrap Guaranteed) */}
            <div className="flex flex-col items-end shrink-0 font-mono">
                <div className="text-xl sm:text-2xl font-bold text-[var(--theme-text-primary)] tracking-widest leading-none flex items-center flex-nowrap whitespace-nowrap shrink-0">
                    {timeString.split('').map((char, i) => (
                        <span key={i} className={`inline-block shrink-0 ${char === ':' ? 'animate-pulse text-[var(--theme-text-secondary)] mx-0.5' : ''}`}>
                            {char}
                        </span>
                    ))}
                </div>
                <div className="text-[9px] text-[var(--theme-text-muted)] font-bold tracking-wider mt-1 whitespace-nowrap shrink-0">
                    {clockSubtitle}
                </div>
            </div>
        </div>
    );
};

