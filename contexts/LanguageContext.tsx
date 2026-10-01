import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { TRANSLATIONS, Language } from '../utils/translations';
import { useData } from './DataContext';
import { logger } from '../utils/logger';
import {
    Country,
    CountryProfile,
    getEffectiveCountry,
    getCountryProfile,
    getAllowedLanguages,
    sanitizeLanguageForCountry,
    formatLocalizedPrice
} from '../utils/localization';
import { setCurrencySymbol } from '../constants/categories';

export interface LanguageOption {
    code: Language;
    label: string;
    nativeLabel: string;
    isEthiopian?: boolean;
}

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
    country: Country;
    countryProfile: CountryProfile;
    isKenya: boolean;
    isEthiopia: boolean;
    availableLanguages: LanguageOption[];
    currency: string;
    currencySymbol: string;
    formatCurrency: (amount: number | undefined | null) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    let settingsContext: any = null;
    try {
        settingsContext = useData();
    } catch {
        // Safe fallback if used outside DataProvider in standalone tests
    }
    const settings = settingsContext?.settings;

    const country: Country = useMemo(() => {
        return (settingsContext?.effectiveCountry as Country) || getEffectiveCountry(settings);
    }, [settingsContext?.effectiveCountry, settings?.country, settings?.currency, settings?.timezone]);

    const countryProfile = useMemo(() => {
        return getCountryProfile(country);
    }, [country]);

    const isKenya = country === 'KE';
    const isEthiopia = country === 'ET';

    const availableLanguages = useMemo(() => {
        return getAllowedLanguages(country);
    }, [country]);

    const currency = countryProfile.currency;
    const currencySymbol = countryProfile.currencySymbol;

    // Sync categories CURRENCY_SYMBOL live binding
    useEffect(() => {
        setCurrencySymbol(currencySymbol);
    }, [currencySymbol]);

    // Initialize language from localStorage or settings, sanitized by country
    const [language, setLocalLanguage] = useState<Language>(() => {
        try {
            const saved = localStorage.getItem('siifmart_language') as Language;
            const initialLang = saved || settings?.language || 'en';
            return sanitizeLanguageForCountry(initialLang, country);
        } catch {
            logger.warn('LanguageContext', 'LocalStorage read failed for language settings');
            return 'en';
        }
    });

    // When country changes (e.g. switched to Kenya), ensure Ethiopian languages turn off!
    useEffect(() => {
        setLocalLanguage(prev => {
            const sanitized = sanitizeLanguageForCountry(prev, country);
            if (sanitized !== prev) {
                try {
                    localStorage.setItem('siifmart_language', sanitized);
                } catch {}
            }
            return sanitized;
        });
    }, [country]);

    // Persist to localStorage whenever language changes
    useEffect(() => {
        try {
            localStorage.setItem('siifmart_language', language);
        } catch {
            logger.warn('LanguageContext', 'LocalStorage write failed for language settings');
        }
    }, [language]);

    const setLanguage = (lang: Language) => {
        const sanitized = sanitizeLanguageForCountry(lang, country);
        setLocalLanguage(sanitized);
    };

    const formatCurrency = (amount: number | undefined | null): string => {
        return formatLocalizedPrice(amount, currency);
    };

    const t = (path: string): string => {
        const keys = path.split('.');
        let current: any = TRANSLATIONS;

        for (const key of keys) {
            if (current[key] === undefined) {
                return path; // Fallback to key
            }
            current = current[key];
        }

        if (typeof current === 'object' && current[language]) {
            return current[language];
        }

        // Fallback to English if specific language missing
        if (typeof current === 'object' && current['en']) {
            return current['en'];
        }

        return path;
    };

    return (
        <LanguageContext.Provider value={{
            language,
            setLanguage,
            t,
            country,
            countryProfile,
            isKenya,
            isEthiopia,
            availableLanguages,
            currency,
            currencySymbol,
            formatCurrency
        }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export const useLocalization = useLanguage;
