import React, { useState, useEffect } from 'react';
import { Upload, Globe, Building, Mail, Phone, Hash, MapPin, Save, Sparkles, Lock, ShieldCheck } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { useLanguage } from '../../contexts/LanguageContext';
import {
    Country,
    getCountryProfile,
    getCountryLegalDefaults,
    getCountryBrandingDefaults,
} from '../../utils/localization';
import Logo from '../Logo';
import { logger } from '../../utils/logger';
import { LocalizationSettingsCard } from './LocalizationSettingsCard';
import { useGeneralSettingsMutation } from '../../hooks/useGeneralSettingsMutation';

// --- STRICT SUB-COMPONENT INTERFACES (NO ANY) ---
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
        <div className="group">
            <label
                htmlFor={inputId}
                className="text-xs text-stone-600 dark:text-gray-400 font-bold uppercase tracking-wide mb-2 block group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors flex items-center gap-2"
            >
                {Icon && <Icon size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />} {label}
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
                    className="w-full bg-[#FAF8F5] dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-3 text-[#1E3F27] dark:text-white text-sm focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] outline-none transition-colors placeholder:text-stone-400 dark:placeholder:text-gray-600 disabled:opacity-60"
                />
                {sub && <p className="text-[10px] text-stone-500 dark:text-gray-400 mt-2 ml-1">{sub}</p>}
            </div>
        </div>
    );
};

// Sand / Emerald / Amber Brand Design Tokens
const BRAND_PALETTES = [
    { name: 'Emerald Forest (Primary)', color: '#2C5E3B' },
    { name: 'Sage Green (Accent)', color: '#5B8C69' },
    { name: 'Warm Amber (Highlight)', color: '#D97706' },
    { name: 'Deep Midnight (Dark Base)', color: '#1E3F27' },
    { name: 'Sand Muted (Border/Subtle)', color: '#8C7E6A' },
];

export default function GeneralSettings() {
    const { user, showToast } = useStore();
    const { settings, effectiveCountry } = useData();
    const { setLanguage } = useLanguage();
    const mutation = useGeneralSettingsMutation();

    const isAuthorized = ['super_admin', 'CEO'].includes(user?.role || '');

    // ── INVISIBLE MULTI-TENANCY & BACKGROUND ISOLATION (AGENTS.md Rule 8 / §6) ──
    // Country is determined exclusively by the central global switch (effectiveCountry).
    // Individual settings pages MUST NEVER render country selector chips, dropdowns,
    // or partition banners. Non-CEO users experience a native, single-nation interface.
    const activeCountry: Country = (effectiveCountry || settings?.country || 'ET') as Country;

    const [branding, setBranding] = useState<{
        storeName: string;
        slogan: string;
        logoUrl: string;
        brandColor: string;
    }>(() => ({
        ...getCountryBrandingDefaults('ET'),
        logoUrl: '',
    }));

    const [legal, setLegal] = useState<{
        legalBusinessName: string;
        taxVatNumber: string;
        taxId: string;
        registeredAddress: string;
        supportContact: string;
        supportPhone: string;
    }>(() => getCountryLegalDefaults('ET'));

    // Synchronize branding and legal state per country partition
    useEffect(() => {
        const countryDefaults = getCountryBrandingDefaults(activeCountry);
        const legalDefaults = getCountryLegalDefaults(activeCountry);

        const countryPartition = settings?.countryConfigs?.[activeCountry] || {};

        setBranding({
            storeName: countryPartition.storeName || (settings?.country === activeCountry ? settings?.storeName : '') || countryDefaults.storeName,
            slogan: countryPartition.slogan || (settings?.country === activeCountry ? settings?.slogan : '') || countryDefaults.slogan,
            logoUrl: countryPartition.logoUrl || (settings?.country === activeCountry ? settings?.logoUrl : '') || '',
            brandColor: countryPartition.brandColor || (settings?.country === activeCountry ? settings?.brandColor : '') || countryDefaults.brandColor,
        });

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

        if (section === 'branding' && !branding.storeName.trim()) {
            showToast('Store name is required', 'warning');
            return;
        }

        if (section === 'legal' && !legal.legalBusinessName.trim()) {
            showToast('Legal business name is required', 'warning');
            return;
        }

        const dataPayload = section === 'branding'
            ? { ...branding, country: activeCountry }
            : {
                legalBusinessName: legal.legalBusinessName,
                taxVatNumber: legal.taxVatNumber,
                posReceiptTaxId: legal.taxId,
                registeredAddress: legal.registeredAddress,
                supportContact: legal.supportContact,
                supportPhone: legal.supportPhone,
                country: activeCountry,
            };

        await mutation.mutateAsync({
            section,
            targetCountry: activeCountry,
            data: dataPayload,
        });
    };

    const handleUploadLogo = () => {
        if (!isAuthorized) {
            showToast('Permission denied: Only CEO or Super Admin can upload brand logos.', 'error');
            return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/png,image/jpeg,image/jpg,image/webp';

        input.onchange = async (e: Event) => {
            const target = e.target as HTMLInputElement;
            const file = target?.files?.[0];
            if (!file) return;

            if (file.size > 2 * 1024 * 1024) {
                showToast('Logo file must be less than 2MB', 'warning');
                return;
            }

            try {
                const { systemConfigService } = await import('../../services/supabase.service');
                showToast('Uploading logo...', 'info');
                const publicUrl = await systemConfigService.uploadFile(file, 'logos');
                setBranding(prev => ({ ...prev, logoUrl: publicUrl }));
                showToast('Logo uploaded! Click Save Branding to apply.', 'success');
            } catch (err) {
                logger.error('GeneralSettings', 'Logo upload failed:', err);
                showToast('Failed to upload logo.', 'error');
            }
        };

        input.click();
    };

    const isSaving = mutation.isPending;
    const activeProfile = getCountryProfile(activeCountry);
    const cardBase = "bg-white/85 dark:bg-[#18201B]/60 lg:backdrop-blur-2xl border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[32px] p-6 lg:p-8 shadow-[0_4px_24px_-4px_rgba(34,50,38,0.04)] dark:shadow-[0_8px_32px_-4px_rgba(5,8,6,0.5)]";

    return (
        <div className="w-full max-w-full space-y-8">
            {/* BRANDING CARD */}
            <div className={cardBase}>
                <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                    {/* Logo Section */}
                    <div className="w-full md:w-auto flex flex-col items-center md:items-start gap-3 shrink-0">
                        <div
                            className="w-36 h-36 rounded-3xl bg-[#FAF8F5] dark:bg-black/40 border-2 border-dashed border-[#E2DCCE] dark:border-white/20 flex items-center justify-center overflow-hidden relative group/logo cursor-pointer hover:border-[#2C5E3B] transition-colors"
                            onClick={handleUploadLogo}
                        >
                            {branding.logoUrl ? (
                                <img src={branding.logoUrl} alt="Company Logo" className="w-full h-full object-contain p-3" />
                            ) : (
                                <Logo size={56} showText={false} />
                            )}
                            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity">
                                <Upload className="text-[#A9CBA2] mb-1" size={22} />
                                <span className="text-[11px] font-black text-white uppercase tracking-wider">Upload Logo</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-stone-500 uppercase tracking-widest text-center md:text-left w-full font-bold">2MB Max • PNG/JPG</p>
                    </div>

                    {/* Brand Details form */}
                    <div className="flex-1 w-full min-0 space-y-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-black text-[#1E3F27] dark:text-[#EAE5D9] tracking-tight">Brand Identity</h3>
                                <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83]">Define how {activeProfile.name} operations appear on customer receipts and displays.</p>
                            </div>
                            {!isAuthorized && (
                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                                    <Lock size={10} /> View-Only (L1 Required)
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <InputGroup
                                label="Store Name"
                                value={branding.storeName}
                                disabled={!isAuthorized}
                                onChange={(e) => setBranding(prev => ({ ...prev, storeName: e.target.value }))}
                                icon={Building}
                                placeholder="e.g. SIIFMART Retail"
                            />

                            <div className="group">
                                <label className="text-xs text-stone-600 dark:text-gray-400 font-bold uppercase tracking-wide mb-2 block group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors flex items-center gap-2">
                                    <Sparkles size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> Brand Accent Color
                                </label>
                                <div className="flex items-center gap-2 p-2 bg-[#FAF8F5] dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-2xl">
                                    <input
                                        type="color"
                                        aria-label="Brand Color"
                                        title="Choose brand color"
                                        disabled={!isAuthorized}
                                        className="w-11 h-11 rounded-xl cursor-pointer bg-transparent border-0 p-0 shrink-0"
                                        value={branding.brandColor}
                                        onChange={(e) => setBranding(prev => ({ ...prev, brandColor: e.target.value }))}
                                    />
                                    <div className="flex items-center gap-2 overflow-x-auto flex-1 py-1">
                                        {BRAND_PALETTES.map(p => (
                                            <button
                                                key={p.color}
                                                type="button"
                                                title={p.name}
                                                disabled={!isAuthorized}
                                                onClick={() => setBranding(prev => ({ ...prev, brandColor: p.color }))}
                                                style={{ backgroundColor: p.color }}
                                                className={`min-w-[44px] min-h-[44px] rounded-xl shrink-0 border-2 transition-transform hover:scale-105 ${branding.brandColor.toLowerCase() === p.color.toLowerCase() ? 'border-white ring-2 ring-[#2C5E3B]' : 'border-transparent'}`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-xs font-mono text-[#1E3F27] dark:text-white font-bold uppercase pr-2">{branding.brandColor}</span>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <InputGroup
                                    label="Slogan / Value Prop"
                                    value={branding.slogan}
                                    disabled={!isAuthorized}
                                    onChange={(e) => setBranding(prev => ({ ...prev, slogan: e.target.value }))}
                                    placeholder="e.g. Your trusted marketplace"
                                    icon={Globe}
                                    sub="Displayed on customer-facing screens and receipts"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E2DCCE]/60 dark:border-white/10 flex justify-end">
                    <button
                        type="button"
                        onClick={() => handleSaveSection('branding')}
                        disabled={isSaving || !isAuthorized}
                        className="min-h-[44px] px-6 py-2.5 bg-[#2C5E3B] hover:opacity-90 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-opacity disabled:opacity-50"
                    >
                        {isSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                        Save Branding
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* LEGAL ENTITY CARD */}
                <div className={cardBase}>
                    <div className="mb-5 pb-3 border-b border-[#E2DCCE]/60 dark:border-white/10 flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-black text-[#1E3F27] dark:text-[#EAE5D9] tracking-tight">Legal Entity</h3>
                            <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83]">Official business identifiers for invoicing and tax compliance in {activeProfile.name}.</p>
                        </div>
                        {!isAuthorized && (
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                                <Lock size={10} /> Locked
                            </span>
                        )}
                    </div>

                    <div className="space-y-4">
                        <InputGroup
                            label="Legal Business Name"
                            value={legal.legalBusinessName}
                            disabled={!isAuthorized}
                            onChange={(e) => setLegal(prev => ({ ...prev, legalBusinessName: e.target.value }))}
                            placeholder={activeProfile.code === 'KE' ? 'e.g. SiifMart Kenya Limited' : 'e.g. SiifMart Technologies PLC'}
                            icon={Building}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup
                                label={`Tax ID / ${activeProfile.taxIdLabel}`}
                                value={legal.taxId}
                                disabled={!isAuthorized}
                                onChange={(e) => setLegal(prev => ({ ...prev, taxId: e.target.value }))}
                                placeholder={activeProfile.taxIdPlaceholder}
                                icon={Hash}
                            />
                            <InputGroup
                                label="VAT Reg No"
                                value={legal.taxVatNumber}
                                disabled={!isAuthorized}
                                onChange={(e) => setLegal(prev => ({ ...prev, taxVatNumber: e.target.value }))}
                                placeholder={`VAT-${activeProfile.taxIdLabel}`}
                                icon={Hash}
                            />
                        </div>

                        <InputGroup
                            label="Registered Address"
                            value={legal.registeredAddress}
                            disabled={!isAuthorized}
                            onChange={(e) => setLegal(prev => ({ ...prev, registeredAddress: e.target.value }))}
                            placeholder={activeProfile.code === 'KE' ? 'Westlands Commercial Centre, Nairobi' : 'Bole Sub-City, Addis Ababa'}
                            icon={MapPin}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup
                                label="Support Email"
                                value={legal.supportContact}
                                disabled={!isAuthorized}
                                onChange={(e) => setLegal(prev => ({ ...prev, supportContact: e.target.value }))}
                                placeholder={`support.${activeCountry.toLowerCase()}@siifmart.com`}
                                icon={Mail}
                            />
                            <InputGroup
                                label="Support Phone"
                                value={legal.supportPhone}
                                disabled={!isAuthorized}
                                onChange={(e) => setLegal(prev => ({ ...prev, supportPhone: e.target.value }))}
                                placeholder={activeProfile.phonePlaceholder}
                                icon={Phone}
                            />
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#E2DCCE]/60 dark:border-white/10 flex justify-end">
                        <button
                            type="button"
                            onClick={() => handleSaveSection('legal')}
                            disabled={isSaving || !isAuthorized}
                            className="min-h-[44px] px-6 py-2.5 bg-[#2C5E3B] hover:opacity-90 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-opacity disabled:opacity-50"
                        >
                            {isSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                            Save Legal Details
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
