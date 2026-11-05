import {formatPreferredDate} from '../../utils/datePreferences';
import {useRef} from 'react';
import {useSettingsDraft} from '../../hooks/useSettingsDraft';
import {resolveCountryGeneralSettings} from '../../utils/generalSettings';
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
    const { t,setLanguage: setContextLanguage } = useLanguage();
    const { user, showToast } = useStore();
    const isCeo = canSwitchCountry(user);
    const mutation = useGeneralSettingsMutation();

    const resolved=resolveCountryGeneralSettings(settings,selectedCountry);
    const draft=useSettingsDraft({currency:resolved.currency,timezone:resolved.timezone,dateFormat:resolved.dateFormat,language:resolved.language});
    const {currency,timezone,dateFormat,language}=draft.value;
    const setCurrency=(currency:string)=>draft.setValue(previous=>({...previous,currency}));
    const setTimezone=(timezone:string)=>draft.setValue(previous=>({...previous,timezone}));
    const setDateFormat=(dateFormat:'DD/MM/YYYY'|'MM/DD/YYYY'|'YYYY-MM-DD')=>draft.setValue(previous=>({...previous,dateFormat}));
    const setLanguage=(language:string)=>draft.setValue(previous=>({...previous,language:language as typeof previous.language}));
    const alive=useRef(true);
    useEffect(()=>{alive.current=true;return ()=>{alive.current=false;};},[]);

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

        };

        const submitted=draft.value;
        try { await mutation.mutateAsync({
            section: 'localization',
            targetCountry: selectedCountry,
            data: payload,
        }); }catch{return;}
        if(!alive.current)return;
        draft.acknowledge(submitted);

        setContextLanguage(cleanLang as 'en' | 'am' | 'or');
        showToast(`Market localization updated for ${activeProfile.name}`, 'success');
    };

    const isSaving = mutation.isPending;

    return (
        <div className={cardBase}>
            <div className="flex items-center justify-between border-b border-[var(--theme-border)] pb-4 mb-5">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[var(--theme-status-info-bg)] text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center shrink-0">
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
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border-[var(--theme-border)] font-mono">
                    {activeProfile.code} Active
                </span>
            </div>

            <div className="space-y-4">
                {/* Fiscal Profile Summary Tile */}
                <div className="p-4 rounded-xl border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] space-y-3">
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
                        <CheckCircle2 size={16} className="text-[var(--theme-status-success-text)]" />
                    </div>

                    <div className="grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono border-t border-[var(--theme-border)] pt-2.5">
                        <div>
                            <span className="text-[var(--theme-text-muted)] block">Currency:</span>
                            <strong className="text-[var(--theme-text-primary)]">{activeProfile.currencySymbol} ({activeProfile.currencyCode})</strong>
                        </div>
                        <div>
                            <span className="text-[var(--theme-text-muted)] block">Reference VAT:</span>
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
                    <div className="p-3.5 rounded-xl bg-[var(--theme-status-warning-bg)] border-[var(--theme-status-warning-border)] flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-[var(--theme-status-warning-text)] shrink-0 mt-0.5" />
                        <div className="text-[11px] text-[var(--theme-text-secondary)] leading-relaxed">
                            <strong className="font-semibold text-[var(--theme-status-warning-text)] block mb-0.5">
                                Kenya language availability:
                            </strong>
                            Ethiopian regional languages are disabled. Tender and tax policies are managed in their dedicated settings.
                        </div>
                    </div>
                )}

                {/* Core Field Controls */}
                <div className="grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Currency */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider block flex items-center gap-1.5">
                            <DollarSign size={13} className="text-[var(--theme-text-muted)]" /> Base Currency
                        </label>
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            disabled={!isCeo || isSaving}
                            className="w-full h-10 bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] rounded-xl px-3.5 text-xs text-[var(--theme-text-primary)] font-normal focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/20 focus:border-[var(--theme-accent)] transition-all disabled:opacity-50"
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
                            disabled={!isCeo || isSaving}
                            className="w-full h-10 bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] rounded-xl px-3.5 text-xs text-[var(--theme-text-primary)] font-normal focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/20 focus:border-[var(--theme-accent)] transition-all disabled:opacity-50"
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
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-status-warning-text)] bg-[var(--theme-status-warning-bg)] px-2 py-0.5 rounded-full border-[var(--theme-status-warning-border)]">
                                    English Standard
                                </span>
                            )}
                        </div>
                        <select
                            value={language}
                            disabled={isKenya || !isCeo}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full h-10 bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] rounded-xl px-3.5 text-xs text-[var(--theme-text-primary)] font-normal focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/20 focus:border-[var(--theme-accent)] transition-all disabled:opacity-50"
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
                            <span className="text-[11px] bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border-[var(--theme-border)] px-2 py-0.5 rounded-full font-mono font-semibold">
                                {formatPreferredDate(new Date(),timezone,dateFormat)}
                            </span>
                        </div>
                        <div className="bg-[var(--theme-bg-subtle)] p-1 rounded-xl border-[var(--theme-border)] grid-cols-3 gap-1">
                            {(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] as const).map(fmt => (
                                <button
                                    key={fmt}
                                    aria-pressed={dateFormat===fmt}
                                    aria-label={t('warehouse.datePreferences.'+(fmt==='DD/MM/YYYY'?'dmy':fmt==='MM/DD/YYYY'?'mdy':'ymd'))}
                                    type="button"
                                    disabled={!isCeo || isSaving}
                                    onClick={() => setDateFormat(fmt)}
                                    className={`h-8 rounded-lg text-xs font-medium transition-all cursor-pointer disabled:opacity-50 ${
                                        dateFormat === fmt
                                            ? 'bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] text-[var(--theme-text-primary)] shadow-xs font-semibold'
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
                        disabled={isSaving || !isCeo || !draft.dirty}
                        className="h-10 px-5 bg-[var(--theme-accent)] text-[var(--theme-accent-contrast)] hover:opacity-95 font-semibold rounded-xl text-xs flex items-center gap-2 shadow-[0_2px_8px_rgba(0,113,227,0.25)] transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                    >
                        {isSaving ? (
                            <span className="w-3.5 h-3.5 border-2 border-[color-mix(in_srgb,var(--theme-border)_30%,transparent)] border-t-[var(--theme-border)] rounded-full animate-spin" />
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
