import React, { useState, useEffect } from 'react';
import { Globe, Calendar, Save, CheckCircle2, ShieldCheck, DollarSign, AlertCircle, Lock } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useStore } from '../../contexts/CentralStore';
import { canSwitchCountry } from '../../utils/permissions';
import {
    Country,
    getCountryProfile,
    sanitizeLanguageForCountry,
} from '../../utils/localization';
import type { SystemConfig } from '../../types';
import { useGeneralSettingsMutation } from '../../hooks/useGeneralSettingsMutation';

interface LocalizationSettingsCardProps {
    settings?: SystemConfig | null;
    selectedCountry: Country;
    onCountryChange?: (country: Country) => void;
    cardBase: string;
}

export const LocalizationSettingsCard: React.FC<LocalizationSettingsCardProps> = ({
    settings,
    selectedCountry,
    onCountryChange,
    cardBase
}) => {
    const { setLanguage: setContextLanguage } = useLanguage();
    const { user, showToast } = useStore();
    const isCeo = canSwitchCountry(user);
    const mutation = useGeneralSettingsMutation();

    const [currency, setCurrency] = useState<string>(() => {
        const profile = getCountryProfile(selectedCountry);
        return settings?.currency || profile.currency;
    });

    const [timezone, setTimezone] = useState<string>(() => {
        const profile = getCountryProfile(selectedCountry);
        return settings?.timezone || profile.timezone;
    });

    const [dateFormat, setDateFormat] = useState<'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'>(
        settings?.dateFormat || 'DD/MM/YYYY'
    );

    const [language, setLanguage] = useState<string>(() => {
        return sanitizeLanguageForCountry(settings?.language, selectedCountry);
    });

    // Sync state when selected country or settings change
    useEffect(() => {
        const profile = getCountryProfile(selectedCountry);
        const countryPartition = settings?.countryConfigs?.[selectedCountry];

        setCurrency(countryPartition?.currency || (settings?.country === selectedCountry ? settings?.currency : '') || profile.currency);
        setTimezone(countryPartition?.timezone || (settings?.country === selectedCountry ? settings?.timezone : '') || profile.timezone);
        setDateFormat(countryPartition?.dateFormat || (settings?.country === selectedCountry ? settings?.dateFormat : '') || profile.dateFormat);
        setLanguage(sanitizeLanguageForCountry(countryPartition?.language || settings?.language, selectedCountry));
    }, [selectedCountry, settings]);

    const activeProfile = getCountryProfile(selectedCountry);
    const isKenya = selectedCountry === 'KE';



    const handleSaveLocalization = async () => {
        if (!isCeo) {
            showToast('Only CEO or Super Admin can apply market localization changes.', 'error');
            return;
        }

        const profile = getCountryProfile(selectedCountry);
        const cleanLang = sanitizeLanguageForCountry(language, selectedCountry);

        const payload: Partial<SystemConfig> = {
            country: selectedCountry,
            currency,
            timezone,
            dateFormat,
            language: cleanLang,
            taxRate: profile.taxRate,
            defaultVatRate: profile.taxRate,
            taxAuthority: profile.taxAuthority,
            complianceStandard: profile.complianceStandard,
            eTimsEnabled: selectedCountry === 'KE',
            posReceiptTaxId: selectedCountry === 'KE' ? 'P051234567Z' : '0001234567',
            supportPhone: selectedCountry === 'KE' ? '+254 712 345 678' : '+251 911 234 567',
        };

        await mutation.mutateAsync({
            section: 'localization',
            targetCountry: selectedCountry,
            data: payload,
        });

        setContextLanguage(cleanLang as 'en' | 'am' | 'or');
    };

    const getFormattedDatePreview = (fmt: string) => {
        const d = new Date();
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        if (fmt === 'DD/MM/YYYY') return `${day}/${month}/${year}`;
        if (fmt === 'MM/DD/YYYY') return `${month}/${day}/${year}`;
        return `${year}-${month}-${day}`;
    };

    const isSaving = mutation.isPending;

    return (
        <div className={cardBase}>
            <div className="mb-6 pb-4 border-b border-[#E2DCCE]/60 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                    <h3 className="text-base font-black text-[#1E3F27] dark:text-[#EAE5D9] tracking-tight flex items-center gap-2">
                        <Globe size={18} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                        Market Localization & Country System
                    </h3>
                    <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83]">
                        Isolated sovereign configurations for East African retail markets.
                    </p>
                </div>
                <div className="flex items-center gap-1.5 self-start sm:self-auto px-3 py-1 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 rounded-full">
                    <span className="text-xs">{activeProfile.flag}</span>
                    <span className="text-[11px] font-black text-[#1E3F27] dark:text-white uppercase tracking-wider font-mono">
                        {activeProfile.code} Active
                    </span>
                </div>
            </div>

            <div className="space-y-6">
                {/* 1. ACTIVE NATIONAL COUNTRY PROFILE */}
                <div>
                    <div className="flex items-center justify-between mb-2.5">
                        <label className="text-xs text-stone-600 dark:text-gray-400 font-bold uppercase tracking-wider block">
                            Operating Market & Fiscal Profile
                        </label>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1 font-mono">
                            <ShieldCheck size={11} /> {activeProfile.name}
                        </span>
                    </div>
                    <div className="p-4 rounded-2xl border-2 bg-[#2C5E3B]/5 dark:bg-[#A9CBA2]/5 border-[#2C5E3B] dark:border-[#A9CBA2] shadow-sm">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">{activeProfile.flag}</span>
                                <div>
                                    <h4 className="text-sm font-black text-[#1E3F27] dark:text-white">{activeProfile.name}</h4>
                                    <p className="text-[11px] text-stone-500 dark:text-gray-400 font-mono truncate max-w-[280px]">{activeProfile.complianceStandard}</p>
                                </div>
                            </div>
                            <CheckCircle2 size={18} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                        </div>
                        <div className="mt-3 pt-3 border-t border-[#E2DCCE]/50 dark:border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
                            <div><span className="opacity-60">Currency:</span> <strong className="text-[#1E3F27] dark:text-white">{activeProfile.currencySymbol} ({activeProfile.currencyCode})</strong></div>
                            <div><span className="opacity-60">Tax:</span> <strong className="text-[#1E3F27] dark:text-white">{activeProfile.taxRate}% VAT ({activeProfile.taxIdLabel})</strong></div>
                            <div><span className="opacity-60">Mobile:</span> <strong className="text-[#1E3F27] dark:text-white truncate block">{activeProfile.primaryMobileMoney.split('&')[0]}</strong></div>
                            <div><span className="opacity-60">Languages:</span> <strong className="text-[#1E3F27] dark:text-white">{activeProfile.supportedLanguages.map(l => l.code.toUpperCase()).join(', ')}</strong></div>
                        </div>
                    </div>
                </div>

                {/* 2. REGIONAL ADAPTIVE NOTICE */}
                {isKenya && (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-xs text-stone-700 dark:text-stone-300">
                            <strong className="font-bold text-amber-700 dark:text-amber-300 block mb-0.5">
                                Kenya Localization Active:
                            </strong>
                            Ethiopian regional languages (Amharic and Afaan Oromoo) are disabled. Primary mobile money tender is locked to M-Pesa. Standard KRA tax rate is 16%.
                        </div>
                    </div>
                )}

                {/* 3. CORE FIELD CONTROLS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Currency */}
                    <div>
                        <label className="text-xs text-stone-600 dark:text-gray-400 font-bold uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                            <DollarSign size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> Base Currency
                        </label>
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#1E3F27] dark:text-white font-bold outline-none focus:border-[#2C5E3B]"
                        >
                            <option value="KSh">Kenyan Shilling (KSh)</option>
                            <option value="ETB">Ethiopian Birr (ETB)</option>
                            <option value="USh">Ugandan Shilling (USh)</option>
                            <option value="RWF">Rwandan Franc (RWF)</option>
                            <option value="TSh">Tanzanian Shilling (TSh)</option>
                            <option value="USD">US Dollar (USD)</option>
                        </select>
                        <p className="text-[10px] text-stone-500 dark:text-gray-500 mt-1">
                            Applied across POS catalog, sales reports, inventory valuations, and receipts.
                        </p>
                    </div>

                    {/* Timezone */}
                    <div>
                        <label className="text-xs text-stone-600 dark:text-gray-400 font-bold uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                            <Globe size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> Timezone
                        </label>
                        <select
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                            className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#1E3F27] dark:text-white font-bold outline-none focus:border-[#2C5E3B]"
                        >
                            <option value="Africa/Nairobi">East Africa Time - Nairobi (UTC+3)</option>
                            <option value="Africa/Addis_Ababa">East Africa Time - Addis Ababa (UTC+3)</option>
                            <option value="Africa/Kampala">East Africa Time - Kampala (UTC+3)</option>
                            <option value="Africa/Kigali">Central Africa Time - Kigali (UTC+2)</option>
                            <option value="Africa/Dar_es_Salaam">East Africa Time - Dar es Salaam (UTC+3)</option>
                            <option value="UTC">Universal Coordinated Time (UTC)</option>
                        </select>
                        <p className="text-[10px] text-stone-500 dark:text-gray-500 mt-1">
                            Used for timestamps in audit logs, shifts, receipts, and order tracking.
                        </p>
                    </div>

                    {/* System Language */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs text-stone-600 dark:text-gray-400 font-bold uppercase tracking-wider">
                                System Language
                            </label>
                            {isKenya && (
                                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                    Ethiopian Dialects Disabled
                                </span>
                            )}
                        </div>
                        <select
                            value={language}
                            disabled={isKenya}
                            onChange={(e) => setLanguage(e.target.value)}
                            className={`w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#1E3F27] dark:text-white font-bold outline-none ${
                                isKenya ? 'opacity-70 cursor-not-allowed' : 'focus:border-[#2C5E3B]'
                            }`}
                        >
                            <option value="en">English (Official System Language)</option>
                            {!isKenya && <option value="am">አማርኛ (Amharic)</option>}
                            {!isKenya && <option value="or">Afaan Oromoo (Oromo)</option>}
                        </select>
                        <p className="text-[10px] text-stone-500 dark:text-gray-500 mt-1">
                            {isKenya
                                ? 'Kenya operations are standardized in English.'
                                : 'Select default language for terminals, navigation, and receipts.'}
                        </p>
                    </div>

                    {/* Date Format */}
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="text-xs text-stone-600 dark:text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <Calendar size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> Date Format
                            </label>
                            <span className="text-[10px] bg-emerald-50 dark:bg-[#2C5E3B]/20 text-emerald-800 dark:text-[#A9CBA2] border border-emerald-200 dark:border-emerald-950/30 px-2 py-0.5 rounded-md font-mono font-bold">
                                {getFormattedDatePreview(dateFormat)}
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] as const).map(fmt => (
                                <button
                                    key={fmt}
                                    type="button"
                                    onClick={() => setDateFormat(fmt)}
                                    className={`min-h-[44px] py-2.5 rounded-xl text-xs font-bold transition-colors border cursor-pointer ${
                                        dateFormat === fmt
                                            ? 'bg-[#2C5E3B] text-white border-[#2C5E3B] shadow-sm'
                                            : 'bg-white dark:bg-black/20 text-stone-600 dark:text-gray-400 border-[#E2DCCE] dark:border-white/10 hover:border-[#2C5E3B]/30'
                                    }`}
                                >
                                    {fmt}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 4. LIVE REGIONAL PREVIEW DECK */}
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10">
                    <h5 className="text-xs font-black uppercase tracking-wider text-stone-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                        <ShieldCheck size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                        Active Market Configuration Summary ({activeProfile.name})
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="p-2.5 rounded-xl bg-white dark:bg-black/40 border border-[#E2DCCE]/60 dark:border-white/5">
                            <span className="text-[9px] uppercase tracking-wider text-stone-400 font-bold block mb-0.5">Sample Price</span>
                            <span className="font-mono font-black text-[#1E3F27] dark:text-white text-sm">
                                {activeProfile.currencySymbol} 2,499.00
                            </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-black/40 border border-[#E2DCCE]/60 dark:border-white/5">
                            <span className="text-[9px] uppercase tracking-wider text-stone-400 font-bold block mb-0.5">Tax Standard</span>
                            <span className="font-mono font-bold text-[#1E3F27] dark:text-white">
                                {activeProfile.taxRate}% ({activeProfile.taxIdLabel})
                            </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-black/40 border border-[#E2DCCE]/60 dark:border-white/5">
                            <span className="text-[9px] uppercase tracking-wider text-stone-400 font-bold block mb-0.5">Tax ID Format</span>
                            <span className="font-mono font-bold text-[#1E3F27] dark:text-white">
                                {activeProfile.taxIdLabel} ({activeProfile.taxIdPlaceholder})
                            </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-black/40 border border-[#E2DCCE]/60 dark:border-white/5">
                            <span className="text-[9px] uppercase tracking-wider text-stone-400 font-bold block mb-0.5">Mobile Money</span>
                            <span className="font-mono font-bold text-[#00A859] truncate block">
                                {activeProfile.primaryMobileMoney.split('&')[0]}
                            </span>
                        </div>
                    </div>
                </div>

                {/* SAVE BUTTON */}
                <div className="pt-2 flex justify-end">
                    <button
                        type="button"
                        onClick={handleSaveLocalization}
                        disabled={isSaving || !isCeo}
                        className="min-h-[44px] px-6 py-2.5 bg-[#2C5E3B] hover:opacity-90 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-opacity disabled:opacity-50"
                    >
                        {isSaving ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save size={14} />
                        )}
                        Apply & Save Localization ({selectedCountry})
                    </button>
                </div>
            </div>
        </div>
    );
};
