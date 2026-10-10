import React, { useState, useEffect } from 'react';
import { Globe, Building, Mail, Phone, Hash, MapPin, Save, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import {
    Country,
    getCountryProfile,
    getCountryLegalDefaults,
    getCountryBrandingDefaults,
} from '../../utils/localization';
import { LocalizationSettingsCard } from './LocalizationSettingsCard';
import { useGeneralSettingsMutation } from '../../hooks/useGeneralSettingsMutation';

interface InputGroupProps {
    label: string;
    type?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    sub?: string;
    icon?: React.ElementType;
    id?: string;
    disabled?: boolean;
}

const InputGroup: React.FC<InputGroupProps> = ({
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    sub,
    icon: Icon,
    id,
    disabled = false,
}) => {
    const inputId = id || `input-${label.replace(/\s+/g, '-').toLowerCase()}`;
    return (
        <div className="space-y-1.5">
            <label
                htmlFor={inputId}
                className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider block flex items-center gap-1.5"
            >
                {Icon && <Icon size={13} className="text-[var(--theme-text-muted)]" />} {label}
            </label>
            <div className="relative">
                <input
                    id={inputId}
                    title={label}
                    type={type}
                    value={value || ''}
                    disabled={disabled}
                    onChange={onChange}
                    placeholder={placeholder}
                    className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 text-[var(--theme-text-primary)] text-xs font-normal focus:outline-hidden focus:ring-2 focus:ring-[#0071E3]/40 dark:focus:ring-[#2997FF]/40 focus:border-[#0071E3] dark:focus:border-[#2997FF] transition-all placeholder:text-[var(--theme-text-muted)] disabled:opacity-50"
                />
                {sub && <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1 ml-0.5">{sub}</p>}
            </div>
        </div>
    );
};

export default function GeneralSettings() {
    const { user, showToast } = useStore();
    const { settings, effectiveCountry } = useData();
    const mutation = useGeneralSettingsMutation();

    const isAuthorized = ['super_admin', 'CEO'].includes(user?.role || '');

    // Multi-country isolation: country scoped by central global switch
    const activeCountry: Country = (effectiveCountry || settings?.country || 'ET') as Country;

    const [slogan, setSlogan] = useState<string>(() => {
        return getCountryBrandingDefaults('ET').slogan || '';
    });

    const [legal, setLegal] = useState<{
        legalBusinessName: string;
        taxVatNumber: string;
        taxId: string;
        registeredAddress: string;
        supportContact: string;
        supportPhone: string;
    }>(() => getCountryLegalDefaults('ET'));

    // Synchronize slogan and legal state per country partition
    useEffect(() => {
        const countryDefaults = getCountryBrandingDefaults(activeCountry);
        const legalDefaults = getCountryLegalDefaults(activeCountry);
        const countryPartition = settings?.countryConfigs?.[activeCountry] || {};

        setSlogan(
            countryPartition.slogan ||
            (settings?.country === activeCountry ? settings?.slogan : '') ||
            countryDefaults.slogan ||
            ''
        );

        setLegal({
            legalBusinessName: countryPartition.legalBusinessName || (settings?.country === activeCountry ? settings?.legalBusinessName : '') || legalDefaults.legalBusinessName,
            taxVatNumber: countryPartition.taxVatNumber || (settings?.country === activeCountry ? settings?.taxVatNumber : '') || legalDefaults.taxVatNumber,
            taxId: countryPartition.posReceiptTaxId || (settings?.country === activeCountry ? settings?.posReceiptTaxId : '') || legalDefaults.taxId,
            registeredAddress: countryPartition.registeredAddress || (settings?.country === activeCountry ? settings?.registeredAddress : '') || legalDefaults.registeredAddress,
            supportContact: countryPartition.supportContact || (settings?.country === activeCountry ? settings?.supportContact : '') || legalDefaults.supportContact,
            supportPhone: countryPartition.supportPhone || (settings?.country === activeCountry ? settings?.supportPhone : '') || legalDefaults.supportPhone,
        });
    }, [activeCountry, settings]);

    const handleSaveSection = async (section: 'branding' | 'legal') => {
        if (!isAuthorized) {
            showToast('Permission denied: Only CEO or Super Admin can modify corporate settings.', 'error');
            return;
        }

        if (section === 'legal' && !legal.legalBusinessName.trim()) {
            showToast('Legal business name is required', 'warning');
            return;
        }

        const dataPayload = section === 'branding'
            ? {
                storeName: 'SIIFMART',
                slogan: slogan.trim(),
                brandColor: '#00FF9D',
                logoUrl: '',
                country: activeCountry,
            }
            : {
                legalBusinessName: legal.legalBusinessName.trim(),
                taxVatNumber: legal.taxVatNumber.trim(),
                posReceiptTaxId: legal.taxId.trim(),
                registeredAddress: legal.registeredAddress.trim(),
                supportContact: legal.supportContact.trim(),
                supportPhone: legal.supportPhone.trim(),
                country: activeCountry,
            };

        await mutation.mutateAsync({
            section,
            targetCountry: activeCountry,
            data: dataPayload,
        });

        if (section === 'branding') {
            showToast('Corporate slogan updated successfully', 'success');
        } else {
            showToast('Legal entity details saved successfully', 'success');
        }
    };

    const isSaving = mutation.isPending;
    const activeProfile = getCountryProfile(activeCountry);
    const cardBase = "bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 sm:p-6 shadow-xs transition-all";

    return (
        <div className="w-full max-w-full space-y-6 animate-in fade-in">
            {/* CORPORATE SLOGAN & RECEIPT TAGLINE CARD */}
            <div className={cardBase}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--theme-border)] pb-4 mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF] flex items-center justify-center shrink-0">
                            <Globe size={16} />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold tracking-tight text-[var(--theme-text-primary)]">
                                Corporate Slogan & Customer Displays
                            </h3>
                            <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                                Customer-facing value proposition displayed on receipts, quotes, and customer displays in {activeProfile.name}.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)] flex items-center gap-1.5 font-mono">
                            <ShieldCheck size={12} className="text-emerald-500" />
                            <span>SIIFMART Permanent Brand</span>
                        </span>
                        {!isAuthorized && (
                            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1.5">
                                <Lock size={12} /> View-Only (L1 Required)
                            </span>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <InputGroup
                        label="Store Slogan / Value Proposition"
                        value={slogan}
                        disabled={!isAuthorized}
                        onChange={(e) => setSlogan(e.target.value)}
                        placeholder="e.g. Your trusted retail and wholesale marketplace"
                        icon={Sparkles}
                        sub={`Printed on the top header of till receipts, quotations, and customer displays for ${activeProfile.name} operations.`}
                    />

                    <div className="pt-2 flex justify-end">
                        <button
                            type="button"
                            onClick={() => handleSaveSection('branding')}
                            disabled={isSaving || !isAuthorized}
                            className="h-10 px-5 bg-[#0071E3] dark:bg-[#2997FF] hover:opacity-95 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-[0_2px_8px_rgba(0,113,227,0.25)] transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                        >
                            {isSaving ? (
                                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save size={14} />
                            )}
                            <span>Save Slogan</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* LEGAL ENTITY & LOCALIZATION GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEGAL ENTITY CARD */}
                <div className={cardBase}>
                    <div className="flex items-center justify-between border-b border-[var(--theme-border)] pb-4 mb-5">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-stone-500/10 text-[var(--theme-text-primary)] flex items-center justify-center shrink-0">
                                <Building size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">
                                    Legal Entity & Tax Registration
                                </h3>
                                <p className="text-[11px] text-[var(--theme-text-secondary)]">
                                    Official business identifiers for invoicing in {activeProfile.name}.
                                </p>
                            </div>
                        </div>
                        {!isAuthorized && (
                            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1.5">
                                <Lock size={12} /> Locked
                            </span>
                        )}
                    </div>

                    <div className="space-y-3.5">
                        <InputGroup
                            label="Legal Business Name"
                            value={legal.legalBusinessName}
                            disabled={!isAuthorized}
                            onChange={(e) => setLegal(prev => ({ ...prev, legalBusinessName: e.target.value }))}
                            placeholder={activeProfile.code === 'KE' ? 'e.g. SiifMart Kenya Limited' : 'e.g. SiifMart Technologies PLC'}
                            icon={Building}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <InputGroup
                                label={`Tax ID / ${activeProfile.taxIdLabel}`}
                                value={legal.taxId}
                                disabled={!isAuthorized}
                                onChange={(e) => setLegal(prev => ({ ...prev, taxId: e.target.value }))}
                                placeholder={activeProfile.taxIdPlaceholder}
                                icon={Hash}
                            />
                            <InputGroup
                                label="VAT Registration No"
                                value={legal.taxVatNumber}
                                disabled={!isAuthorized}
                                onChange={(e) => setLegal(prev => ({ ...prev, taxVatNumber: e.target.value }))}
                                placeholder={`VAT-${activeProfile.taxIdLabel}`}
                                icon={Hash}
                            />
                        </div>

                        <InputGroup
                            label="Registered Business Address"
                            value={legal.registeredAddress}
                            disabled={!isAuthorized}
                            onChange={(e) => setLegal(prev => ({ ...prev, registeredAddress: e.target.value }))}
                            placeholder={activeProfile.code === 'KE' ? 'Westlands Commercial Centre, Nairobi' : 'Bole Sub-City, Addis Ababa'}
                            icon={MapPin}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <InputGroup
                                label="Support Email"
                                value={legal.supportContact}
                                disabled={!isAuthorized}
                                onChange={(e) => setLegal(prev => ({ ...prev, supportContact: e.target.value }))}
                                placeholder={`support.${activeCountry.toLowerCase()}@siifmart.com`}
                                icon={Mail}
                            />
                            <InputGroup
                                label="Support Telephone"
                                value={legal.supportPhone}
                                disabled={!isAuthorized}
                                onChange={(e) => setLegal(prev => ({ ...prev, supportPhone: e.target.value }))}
                                placeholder={activeProfile.phonePlaceholder}
                                icon={Phone}
                            />
                        </div>
                    </div>

                    <div className="pt-5 mt-4 border-t border-[var(--theme-border)] flex justify-end">
                        <button
                            type="button"
                            onClick={() => handleSaveSection('legal')}
                            disabled={isSaving || !isAuthorized}
                            className="h-10 px-5 bg-[#0071E3] dark:bg-[#2997FF] hover:opacity-95 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-[0_2px_8px_rgba(0,113,227,0.25)] transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                        >
                            {isSaving ? (
                                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save size={14} />
                            )}
                            <span>Save Legal Details</span>
                        </button>
                    </div>
                </div>

                {/* LOCALIZATION CARD */}
                <LocalizationSettingsCard
                    settings={settings}
                    selectedCountry={activeCountry}
                    cardBase={cardBase}
                />
            </div>
        </div>
    );
}
