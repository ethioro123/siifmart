import React, { useState, useEffect } from 'react';
import { Upload, Globe, Building, Mail, Phone, Calendar, Hash, MapPin, CheckCircle, Save, Sparkles, ShieldCheck } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { useLanguage } from '../../contexts/LanguageContext';
import { Language } from '../../utils/translations';
import Logo from '../Logo';
import { logger } from '../../utils/logger';

// --- SUB-COMPONENTS ---
const InputGroup = ({ label, type = "text", value, onChange, placeholder, sub, icon: Icon, id }: any) => {
    const inputId = id || `input-${label.replace(/\s+/g, '-').toLowerCase()}`;
    return (
        <div className="group">
            <label htmlFor={inputId} className="text-xs text-stone-600 dark:text-gray-400 font-bold uppercase tracking-wide mb-2 block group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors flex items-center gap-2">
                {Icon && <Icon size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />} {label}
            </label>
            <div className="relative">
                <input
                    id={inputId}
                    title={label}
                    type={type}
                    value={value || ''}
                    onChange={onChange}
                    placeholder={placeholder}
                    className="w-full bg-[#FAF8F5] dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-3 text-[#1E3F27] dark:text-white text-sm focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] outline-none transition-all placeholder:text-stone-400 dark:placeholder:text-gray-600"
                />
                {sub && <p className="text-[10px] text-stone-500 dark:text-gray-400 mt-2 ml-1">{sub}</p>}
            </div>
        </div>
    );
};

const SelectGroup = ({ label, value, onChange, options, sub, icon: Icon, id }: any) => {
    const selectId = id || `select-${label.replace(/\s+/g, '-').toLowerCase()}`;
    return (
        <div className="group">
            <label htmlFor={selectId} className="text-xs text-stone-600 dark:text-gray-400 font-bold uppercase tracking-wide mb-2 block group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors flex items-center gap-2">
                {Icon && <Icon size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />} {label}
            </label>
            <div>
                <select
                    id={selectId}
                    title={label}
                    className="w-full bg-[#FAF8F5] dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-3 text-[#1E3F27] dark:text-white text-sm outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] transition-all"
                    value={value || ''}
                    onChange={onChange}
                >
                    {options.map((opt: any) => (
                        <option key={opt.value} value={opt.value} className="bg-white dark:bg-[#18201B] text-[#1E3F27] dark:text-white">
                            {opt.label}
                        </option>
                    ))}
                </select>
                {sub && <p className="text-[10px] text-stone-500 dark:text-gray-400 mt-2 ml-1">{sub}</p>}
            </div>
        </div>
    );
};

const BRAND_PALETTES = [
    { name: 'Emerald Forest (Default)', color: '#2C5E3B' },
    { name: 'Sage Green', color: '#5B8C69' },
    { name: 'Warm Amber', color: '#D97706' },
    { name: 'Deep Midnight', color: '#1E3F27' },
    { name: 'Royal Indigo', color: '#312E81' },
];

export default function GeneralSettings() {
    const { user, showToast } = useStore();
    const { settings, updateSettings } = useData();
    const { setLanguage } = useLanguage();

    const [branding, setBranding] = useState({
        storeName: 'SIIFMART',
        slogan: 'Your trusted marketplace',
        logoUrl: '',
        brandColor: '#2C5E3B'
    });

    const [legal, setLegal] = useState({
        legalBusinessName: 'SiifMart Technologies PLC',
        taxVatNumber: 'VAT-998877',
        taxId: '0001234567',
        registeredAddress: '',
        supportContact: 'support@siifmart.com',
        supportPhone: '+251 911 234 567'
    });

    const [localization, setLocalization] = useState<{
        currency: string;
        timezone: string;
        dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
        language: string;
    }>({
        currency: 'ETB',
        timezone: 'Africa/Addis_Ababa',
        dateFormat: 'DD/MM/YYYY',
        language: 'en'
    });

    const [isSavingBranding, setIsSavingBranding] = useState(false);
    const [isSavingLegal, setIsSavingLegal] = useState(false);
    const [isSavingLocalization, setIsSavingLocalization] = useState(false);

    useEffect(() => {
        if (settings) {
            setBranding({
                storeName: settings.storeName || 'SIIFMART',
                slogan: settings.slogan || 'Your trusted marketplace',
                logoUrl: settings.logoUrl || '',
                brandColor: settings.brandColor || '#2C5E3B',
            });
            setLegal({
                legalBusinessName: settings.legalBusinessName || 'SiifMart Technologies PLC',
                taxVatNumber: settings.taxVatNumber || 'VAT-998877',
                taxId: settings.posReceiptTaxId || '0001234567',
                registeredAddress: settings.registeredAddress || '',
                supportContact: settings.supportContact || 'support@siifmart.com',
                supportPhone: settings.supportPhone || '+251 911 234 567'
            });
            setLocalization({
                currency: settings.currency || 'ETB',
                timezone: settings.timezone || 'Africa/Addis_Ababa',
                dateFormat: settings.dateFormat || 'DD/MM/YYYY',
                language: settings.language || 'en'
            });
        }
    }, [settings]);

    const handleSaveSection = async (section: 'branding' | 'legal' | 'localization') => {
        const setSaving = section === 'branding' ? setIsSavingBranding :
            section === 'legal' ? setIsSavingLegal : setIsSavingLocalization;

        const data = section === 'branding' ? branding :
            section === 'legal' ? legal : localization;

        if (section === 'branding' && !branding.storeName.trim()) {
            showToast('Store name is required', 'warning');
            return;
        }

        setSaving(true);
        try {
            let saveData = { ...data };
            if (section === 'legal' && 'taxId' in (data as any)) {
                const { taxId, ...rest } = data as any;
                saveData = { ...rest, posReceiptTaxId: taxId };
            }

            await updateSettings(saveData, user?.name || 'Admin');

            if (section === 'localization' && localization.language) {
                setLanguage(localization.language as Language);
            }

            showToast(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved!`, 'success');
        } catch (err) {
            logger.error('GeneralSettings', `Failed to save ${section} settings:`, err);
            showToast(`Failed to save ${section} settings.`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleUploadLogo = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/png,image/jpeg,image/jpg,image/webp';

        input.onchange = async (e: any) => {
            const file = e.target?.files?.[0];
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

    const getFormattedDatePreview = (format: string) => {
        const date = new Date();
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();

        if (format === 'DD/MM/YYYY') return `${d}/${m}/${y}`;
        if (format === 'MM/DD/YYYY') return `${m}/${d}/${y}`;
        if (format === 'YYYY-MM-DD') return `${y}-${m}-${d}`;
        return date.toDateString();
    };

    const cardBase = "bg-white/85 dark:bg-[#18201B]/60 lg:backdrop-blur-2xl border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[32px] p-6 lg:p-8 shadow-[0_4px_24px_-4px_rgba(34,50,38,0.04)] dark:shadow-[0_8px_32px_-4px_rgba(5,8,6,0.5)]";

    return (
        <div className="w-full max-w-full space-y-8 animate-in fade-in slide-in-from-right-4">

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
                        <div>
                            <h3 className="text-lg font-black text-[#1E3F27] dark:text-[#EAE5D9] tracking-tight">Brand Identity</h3>
                            <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83]">Define how your organization appears on receipts, invoices, and dashboards.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <InputGroup
                                label="Store Name"
                                value={branding.storeName}
                                onChange={(e: any) => setBranding(prev => ({ ...prev, storeName: e.target.value }))}
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
                                        className="w-8 h-8 rounded-xl cursor-pointer bg-transparent border-0 p-0 shrink-0"
                                        value={branding.brandColor}
                                        onChange={(e: any) => setBranding(prev => ({ ...prev, brandColor: e.target.value }))}
                                    />
                                    <div className="flex items-center gap-1.5 overflow-x-auto flex-1 py-1">
                                        {BRAND_PALETTES.map(p => (
                                            <button
                                                key={p.color}
                                                type="button"
                                                title={p.name}
                                                onClick={() => setBranding(prev => ({ ...prev, brandColor: p.color }))}
                                                style={{ backgroundColor: p.color }}
                                                className={`w-6 h-6 rounded-lg shrink-0 border-2 transition-transform hover:scale-110 ${branding.brandColor.toLowerCase() === p.color.toLowerCase() ? 'border-white ring-2 ring-[#2C5E3B]' : 'border-transparent'}`}
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
                                    onChange={(e: any) => setBranding(prev => ({ ...prev, slogan: e.target.value }))}
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
                        disabled={isSavingBranding}
                        className="px-6 py-2.5 bg-[#2C5E3B] hover:opacity-90 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-50"
                    >
                        {isSavingBranding ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                        Save Branding
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* LEGAL ENTITY CARD */}
                <div className={cardBase}>
                    <div className="mb-5 pb-3 border-b border-[#E2DCCE]/60 dark:border-white/10">
                        <h3 className="text-base font-black text-[#1E3F27] dark:text-[#EAE5D9] tracking-tight">Legal Entity</h3>
                        <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83]">Official business identifiers for invoicing and tax compliance.</p>
                    </div>

                    <div className="space-y-4">
                        <InputGroup
                            label="Legal Business Name"
                            value={legal.legalBusinessName}
                            onChange={(e: any) => setLegal(prev => ({ ...prev, legalBusinessName: e.target.value }))}
                            placeholder="e.g. SiifMart Technologies PLC"
                            icon={Building}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup
                                label="Tax ID / TIN"
                                value={legal.taxId}
                                onChange={(e: any) => setLegal(prev => ({ ...prev, taxId: e.target.value }))}
                                placeholder="0001234567"
                                icon={Hash}
                            />
                            <InputGroup
                                label="VAT Reg No"
                                value={legal.taxVatNumber}
                                onChange={(e: any) => setLegal(prev => ({ ...prev, taxVatNumber: e.target.value }))}
                                placeholder="VAT-998877"
                                icon={Hash}
                            />
                        </div>

                        <InputGroup
                            label="Registered Address"
                            value={legal.registeredAddress}
                            onChange={(e: any) => setLegal(prev => ({ ...prev, registeredAddress: e.target.value }))}
                            placeholder="Addis Ababa, Bole Sub-City, Woreda 03"
                            icon={MapPin}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup
                                label="Support Email"
                                value={legal.supportContact}
                                onChange={(e: any) => setLegal(prev => ({ ...prev, supportContact: e.target.value }))}
                                placeholder="support@siifmart.com"
                                icon={Mail}
                            />
                            <InputGroup
                                label="Support Phone"
                                value={legal.supportPhone}
                                onChange={(e: any) => setLegal(prev => ({ ...prev, supportPhone: e.target.value }))}
                                placeholder="+251 911 234 567"
                                icon={Phone}
                            />
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#E2DCCE]/60 dark:border-white/10 flex justify-end">
                        <button
                            type="button"
                            onClick={() => handleSaveSection('legal')}
                            disabled={isSavingLegal}
                            className="px-6 py-2.5 bg-[#2C5E3B] hover:opacity-90 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-50"
                        >
                            {isSavingLegal ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                            Save Legal Details
                        </button>
                    </div>
                </div>

                {/* LOCALIZATION CARD */}
                <div className={cardBase}>
                    <div className="mb-5 pb-3 border-b border-[#E2DCCE]/60 dark:border-white/10">
                        <h3 className="text-base font-black text-[#1E3F27] dark:text-[#EAE5D9] tracking-tight">Localization & Formats</h3>
                        <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83]">Regional currencies, timezones, and system languages.</p>
                    </div>

                    <div className="space-y-4">
                        <SelectGroup
                            label="Base Currency"
                            value={localization.currency}
                            onChange={(e: any) => setLocalization(prev => ({ ...prev, currency: e.target.value }))}
                            options={[
                                { value: "ETB", label: "Ethiopian Birr (ETB)" },
                                { value: "USD", label: "US Dollar (USD)" },
                                { value: "KES", label: "Kenyan Shilling (KES)" },
                                { value: "EUR", label: "Euro (EUR)" }
                            ]}
                            icon={Globe}
                            sub={`Standard Currency: ${localization.currency}`}
                        />

                        <div className="p-3.5 bg-[#FAF8F5] dark:bg-black/30 rounded-2xl border border-[#E2DCCE] dark:border-white/5 space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs text-stone-600 dark:text-gray-400 font-bold uppercase flex items-center gap-1.5">
                                    <Calendar size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> Date Format
                                </label>
                                <span className="text-[10px] bg-emerald-50 dark:bg-[#2C5E3B]/20 text-emerald-800 dark:text-[#A9CBA2] border border-emerald-200 dark:border-emerald-950/30 px-2 py-0.5 rounded-lg font-mono font-bold">
                                    Preview: {getFormattedDatePreview(localization.dateFormat)}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'].map(fmt => (
                                    <button
                                        key={fmt}
                                        type="button"
                                        onClick={() => setLocalization(prev => ({ ...prev, dateFormat: fmt as any }))}
                                        className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${localization.dateFormat === fmt
                                            ? 'bg-[#2C5E3B] text-white border-[#2C5E3B] shadow-sm'
                                            : 'bg-white dark:bg-black/20 text-stone-600 dark:text-gray-400 border-[#E2DCCE] dark:border-white/10 hover:border-[#2C5E3B]/30'
                                            }`}
                                    >
                                        {fmt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <SelectGroup
                            label="Timezone"
                            value={localization.timezone}
                            onChange={(e: any) => setLocalization(prev => ({ ...prev, timezone: e.target.value }))}
                            options={[
                                { value: "Africa/Addis_Ababa", label: "East Africa Time (Addis Ababa - UTC+3)" },
                                { value: "Africa/Nairobi", label: "East Africa Time (Nairobi - UTC+3)" },
                                { value: "UTC", label: "UTC (Coordinated Universal Time)" },
                                { value: "Australia/Melbourne", label: "Australia Eastern (Melbourne)" },
                                { value: "Europe/London", label: "GMT (London)" },
                                { value: "America/New_York", label: "Eastern Time (New York)" }
                            ]}
                            icon={Globe}
                        />

                        <SelectGroup
                            label="System Language"
                            value={localization.language}
                            onChange={(e: any) => setLocalization(prev => ({ ...prev, language: e.target.value }))}
                            options={[
                                { value: "en", label: "English (US)" },
                                { value: "am", label: "አማርኛ (Amharic)" },
                                { value: "om", label: "Afaan Oromoo (Oromo)" },
                            ]}
                            sub="Translates POS, receipts, navigation, and command centers."
                        />
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#E2DCCE]/60 dark:border-white/10 flex justify-end">
                        <button
                            type="button"
                            onClick={() => handleSaveSection('localization')}
                            disabled={isSavingLocalization}
                            className="px-6 py-2.5 bg-[#2C5E3B] hover:opacity-90 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-50"
                        >
                            {isSavingLocalization ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                            Save Localization
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
