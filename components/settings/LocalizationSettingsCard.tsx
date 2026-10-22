import React, { useState, useEffect } from 'react';
import { Globe, Calendar, Save, CheckCircle2, ShieldCheck, DollarSign, AlertCircle } from 'lucide-react';
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
            showToast('Only the Group Chief Executive Officer can apply market localization changes.', 'error');
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
        showToast(`Market localization updated for ${activeProfile.name}`, 'success');
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
            <div className="flex items-center justify-between border-b border-[var(--theme-border)] pb-4 mb-5">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                        <Globe size={16} />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">
                            Market Localization & Country System
                        </h3>
                        <p className="text-[11px] text-[var(--theme-text-secondary)]">
                            Isolated sovereign configuration for {activeProfile.name}.
                        </p>
                    </div>
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] font-mono">
                    {activeProfile.code} Active
                </span>
            </div>

            <div className="space-y-4">
                {/* Fiscal Profile Summary Tile */}
                <div className="p-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-[var(--theme-accent)]/15 text-[var(--theme-accent)] dark:text-[var(--theme-accent)]">
                                {activeProfile.code}
                            </span>
                            <div>
                                <h4 className="text-xs font-bold text-[var(--theme-text-primary)]">{activeProfile.name}</h4>
                                <p className="text-[11px] text-[var(--theme-text-secondary)] font-mono truncate max-w-[260px]">{activeProfile.complianceStandard}</p>
                            </div>
                        </div>
                        <CheckCircle2 size={16} className="text-emerald-500" />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono border-t border-[var(--theme-border)] pt-2.5">
                        <div>
                            <span className="text-[var(--theme-text-muted)] block">Currency:</span>
                            <strong className="text-[var(--theme-text-primary)]">{activeProfile.currencySymbol} ({activeProfile.currencyCode})</strong>
                        </div>
                        <div>
                            <span className="text-[var(--theme-text-muted)] block">Tax Standard:</span>
                            <strong className="text-[var(--theme-text-primary)]">{activeProfile.taxRate}% VAT</strong>
                        </div>
                        <div>
                            <span className="text-[var(--theme-text-muted)] block">Mobile Money:</span>
                            <strong className="text-[var(--theme-text-primary)] truncate block">{activeProfile.primaryMobileMoney.split('&')[0]}</strong>
                        </div>
                        <div>
                            <span className="text-[var(--theme-text-muted)] block">Languages:</span>
                            <strong className="text-[var(--theme-text-primary)]">{activeProfile.supportedLanguages.map(l => l.code.toUpperCase()).join(', ')}</strong>
                        </div>
                    </div>
                </div>

                {/* Regional Adaptive Notice */}
                {isKenya && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-[11px] text-[var(--theme-text-secondary)] leading-relaxed">
                            <strong className="font-semibold text-amber-700 dark:text-amber-300 block mb-0.5">
                                Kenya Localization Active:
                            </strong>
                            Ethiopian regional languages are disabled. Primary tender locked to M-Pesa. Standard KRA tax rate is 16%.
                        </div>
                    </div>
                )}

                {/* Core Field Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Currency */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider block flex items-center gap-1.5">
                            <DollarSign size={13} className="text-[var(--theme-text-muted)]" /> Base Currency
                        </label>
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            disabled={!isCeo}
                            className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 text-xs text-[var(--theme-text-primary)] font-normal focus:outline-hidden focus:ring-2 focus:ring-[var(--theme-accent)]/40 dark:focus:ring-[var(--theme-accent)]/40 focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-all disabled:opacity-50"
                        >
                            <option value="KSh">Kenyan Shilling (KSh)</option>
                            <option value="ETB">Ethiopian Birr (ETB)</option>
                            <option value="USh">Ugandan Shilling (USh)</option>
                            <option value="RWF">Rwandan Franc (RWF)</option>
                            <option value="TSh">Tanzanian Shilling (TSh)</option>
                            <option value="USD">US Dollar (USD)</option>
                        </select>
                        <p className="text-[11px] text-[var(--theme-text-secondary)]">
                            Applied across POS catalog, sales reports, inventory valuations, and receipts.
                        </p>
                    </div>

                    {/* Timezone */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider block flex items-center gap-1.5">
                            <Globe size={13} className="text-[var(--theme-text-muted)]" /> Timezone
                        </label>
                        <select
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                            disabled={!isCeo}
                            className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 text-xs text-[var(--theme-text-primary)] font-normal focus:outline-hidden focus:ring-2 focus:ring-[var(--theme-accent)]/40 dark:focus:ring-[var(--theme-accent)]/40 focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-all disabled:opacity-50"
                        >
                            <option value="Africa/Nairobi">East Africa Time - Nairobi (UTC+3)</option>
                            <option value="Africa/Addis_Ababa">East Africa Time - Addis Ababa (UTC+3)</option>
                            <option value="Africa/Kampala">East Africa Time - Kampala (UTC+3)</option>
                            <option value="Africa/Kigali">Central Africa Time - Kigali (UTC+2)</option>
                            <option value="Africa/Dar_es_Salaam">East Africa Time - Dar es Salaam (UTC+3)</option>
                            <option value="UTC">Universal Coordinated Time (UTC)</option>
                        </select>
                        <p className="text-[11px] text-[var(--theme-text-secondary)]">
                            Used for timestamps in audit logs, shifts, receipts, and order tracking.
                        </p>
                    </div>

                    {/* System Language */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">
                                System Language
                            </label>
                            {isKenya && (
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                    English Standard
                                </span>
                            )}
                        </div>
                        <select
                            value={language}
                            disabled={isKenya || !isCeo}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 text-xs text-[var(--theme-text-primary)] font-normal focus:outline-hidden focus:ring-2 focus:ring-[var(--theme-accent)]/40 dark:focus:ring-[var(--theme-accent)]/40 focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-all disabled:opacity-50"
                        >
                            <option value="en">English (Official System Language)</option>
                            {!isKenya && <option value="am">አማርኛ (Amharic)</option>}
                            {!isKenya && <option value="or">Afaan Oromoo (Oromo)</option>}
                        </select>
                        <p className="text-[11px] text-[var(--theme-text-secondary)]">
                            {isKenya
                                ? 'Kenya operations are standardized in English.'
                                : 'Select default language for terminals, navigation, and receipts.'}
                        </p>
                    </div>

                    {/* Date Format */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <label className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                                <Calendar size={13} className="text-[var(--theme-text-muted)]" /> Date Format
                            </label>
                            <span className="text-[11px] bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] px-2 py-0.5 rounded-full font-mono font-semibold">
                                {getFormattedDatePreview(dateFormat)}
                            </span>
                        </div>
                        <div className="bg-[var(--theme-bg-subtle)] p-1 rounded-xl border border-[var(--theme-border)] grid grid-cols-3 gap-1">
                            {(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] as const).map(fmt => (
                                <button
                                    key={fmt}
                                    type="button"
                                    disabled={!isCeo}
                                    onClick={() => setDateFormat(fmt)}
                                    className={`h-8 rounded-lg text-xs font-medium transition-all cursor-pointer disabled:opacity-50 ${
                                        dateFormat === fmt
                                            ? 'bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] text-white shadow-xs font-semibold'
                                            : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)]'
                                    }`}
                                >
                                    {fmt}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="pt-3 border-t border-[var(--theme-border)] flex justify-end">
                    <button
                        type="button"
                        onClick={handleSaveLocalization}
                        disabled={isSaving || !isCeo}
                        className="h-10 px-5 bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] hover:opacity-95 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-[0_2px_8px_rgba(0,113,227,0.25)] transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                    >
                        {isSaving ? (
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save size={14} />
                        )}
                        <span>Apply & Save Localization</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
