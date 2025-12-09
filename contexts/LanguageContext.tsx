import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TRANSLATIONS, Language } from '../utils/translations';
import { useData } from './DataContext';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Initialize from localStorage only - completely independent
    const [language, setLocalLanguage] = useState<Language>(() => {
        const saved = localStorage.getItem('siifmart_language') as Language;
        return saved || 'en';
    });

    // Persist to localStorage whenever language changes
    useEffect(() => {
        localStorage.setItem('siifmart_language', language);

        // Update document dir for RTL if needed
        // document.dir = language === 'ar' ? 'rtl' : 'ltr'; 
    }, [language]);

    const setLanguage = (lang: Language) => {
        setLocalLanguage(lang);
    };

    const t = (path: string): string => {
        const keys = path.split('.');
        let current: any = TRANSLATIONS;

        for (const key of keys) {
            if (current[key] === undefined) {
                console.warn(`Translation missing for key: ${path} in language: ${language}`);
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
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
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
