import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageSwitcher = () => {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1 border border-white/10">
            <Globe size={16} className="text-gray-400 ml-2" />
            <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-transparent text-white text-sm outline-none border-none p-1 cursor-pointer"
            >
                <option value="en" className="bg-gray-800">English</option>
                <option value="am" className="bg-gray-800">Amharic (አማርኛ)</option>
                <option value="or" className="bg-gray-800">Oromo (Afaan Oromoo)</option>
            </select>
        </div>
    );
};
