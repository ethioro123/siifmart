import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageSwitcher = () => {
    const { language, setLanguage, availableLanguages, countryProfile, isKenya } = useLanguage();

    if (availableLanguages.length <= 1) {
        return (
            <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2.5 py-1 border border-white/10 text-xs font-bold text-gray-300">
                <span>{countryProfile.flag}</span>
                <span>English</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1 border border-white/10">
            <span className="text-xs ml-1.5">{countryProfile.flag}</span>
            <select
                aria-label="Select Language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-transparent text-white text-xs outline-none border-none p-1 cursor-pointer font-bold"
            >
                {availableLanguages.map(lang => (
                    <option key={lang.code} value={lang.code} className="bg-gray-800 text-white">
                        {lang.label} ({lang.nativeLabel})
                    </option>
                ))}
            </select>
        </div>
    );
};
