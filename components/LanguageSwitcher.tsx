import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageSwitcher = () => {
    const { language, setLanguage, availableLanguages, countryProfile, isKenya } = useLanguage();

    if (availableLanguages.length <= 1) {
        return (
            <div className="flex items-center gap-1.5 bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)] rounded-lg px-2.5 py-1 border border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] text-xs font-bold text-[var(--theme-text-muted)]">
                <span>{countryProfile.flag}</span>
                <span>English</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)] rounded-lg p-1 border border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)]">
            <span className="text-xs ml-1.5">{countryProfile.flag}</span>
            <select
                aria-label="Select Language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-transparent text-[var(--theme-text-primary)] text-xs outline-none border-none p-1 cursor-pointer font-bold"
            >
                {availableLanguages.map(lang => (
                    <option key={lang.code} value={lang.code} className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">
                        {lang.label} ({lang.nativeLabel})
                    </option>
                ))}
            </select>
        </div>
    );
};
