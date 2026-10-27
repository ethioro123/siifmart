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
    t: (key: string, params?: Record<string, string | number>) => string;
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

    const t = (path: string, params?: Record<string, string | number>): string => {
        const keys = path.split('.');
        let current: any = TRANSLATIONS;

        for (const key of keys) {
            if (current[key] === undefined) {
                return path; // Fallback to key
            }
            current = current[key];
        }

        let result = path;
        if (typeof current === 'object' && current[language]) {
            result = current[language];
        } else if (typeof current === 'object' && current['en']) {
            result = current['en'];
        }

        if (params && typeof result === 'string') {
            for (const [paramKey, paramVal] of Object.entries(params)) {
                result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
            }
        }

        return result;
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

const fallbackLanguageContext: LanguageContextType = {
    language: 'en',
    setLanguage: () => {},
    t: (path: string, params?: Record<string, string | number>): string => {
        const keys = path.split('.');
        let current: any = TRANSLATIONS;
        for (const key of keys) {
            if (!current || current[key] === undefined) {
                return path;
            }
            current = current[key];
        }
        let result = path;
        if (typeof current === 'object' && current['en']) {
            result = current['en'];
        }
        if (params && typeof result === 'string') {
            for (const [paramKey, paramVal] of Object.entries(params)) {
                result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
            }
        }
        return result;
    },
    country: 'ET',
    countryProfile: getCountryProfile('ET'),
    isKenya: false,
    isEthiopia: true,
    availableLanguages: getAllowedLanguages('ET'),
    currency: 'ETB',
    currencySymbol: 'ETB',
    formatCurrency: (amount) => formatLocalizedPrice(amount || 0, 'ET')
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        logger.warn('LanguageContext', 'useLanguage called outside LanguageProvider; using safe fallback context');
        return fallbackLanguageContext;
    }
    return context;
};

export const useLocalization = useLanguage;
