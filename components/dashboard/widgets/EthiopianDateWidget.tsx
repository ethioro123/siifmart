import React, { useState, useEffect } from 'react';

export const EthiopianDateWidget = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const formatOromoDate = (date: Date) => {
        try {
            // Generate English standard Ethiopic string (e.g. "Sunday, Megabit 27, 2018 ERA1")
            let str = new Intl.DateTimeFormat('en-US', { calendar: 'ethiopic', dateStyle: 'full' }).format(date).toLowerCase();
            
            // Map English Weekdays to Oromo
            str = str.replace('sunday', 'Dilbata');
            str = str.replace('monday', 'Wiixata');
            str = str.replace('tuesday', 'Kibxata');
            str = str.replace('wednesday', 'Roobii');
            str = str.replace('thursday', 'Kamisa');
            str = str.replace('friday', 'Jimaata');
            str = str.replace('saturday', 'Sanbata');

            // Map Ethiopian Months (Amharic transliteration) to Oromo Names
            str = str.replace('meskerem', 'Fuulbana');
            str = str.replace('tikimt', 'Onkoloolessa');
            str = str.replace('hidar', 'Sadaasa');
            str = str.replace('tahsas', 'Muddee');
            str = str.replace('tirr', 'Amajjii');
            str = str.replace('yakatit', 'Guraandhala');
            str = str.replace('megabit', 'Bitooteessa');
            str = str.replace('miyazya', 'Ebla');
            str = str.replace('ginbot', 'Caamsaa');
            str = str.replace('sene', 'Waxabajjii');
            str = str.replace('hamle', 'Adoolessa');
            str = str.replace('nehase', 'Hagayya');
            str = str.replace('pagume', 'Qaammee');

            // Clean up ERA markers
            return str.replace(/ era[0-9]/ig, '').toUpperCase();
        } catch (e) {
            return '';
        }
    };

    return (
        <div className="hidden lg:flex px-5 py-2 bg-gradient-to-r from-orange-500/10 to-yellow-500/5 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-orange-500/20 dark:border-white/10 h-[46px] flex-col justify-center items-end text-right relative overflow-hidden group shadow-inner">
            <p className="text-[8px] text-orange-600 dark:text-orange-400 font-black uppercase tracking-[0.25em] leading-none mb-1 shadow-sm">Ethiopian Calendar</p>
            <p className="text-[10px] sm:text-[11px] font-mono font-bold text-gray-900 dark:text-orange-55 leading-none tracking-widest truncate max-w-[250px] drop-shadow-sm">
                {formatOromoDate(time)}
            </p>
        </div>
    );
};
