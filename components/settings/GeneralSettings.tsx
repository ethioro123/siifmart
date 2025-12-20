import React, { useState, useEffect } from 'react';
import { Upload, Globe, Building, Mail, Phone, Calendar, Hash, MapPin, CheckCircle, AlertTriangle, Save, Loader2 } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import Logo from '../Logo';
import Button from '../shared/Button';

// --- SUB-COMPONENTS ---
const SectionHeader = ({ title, desc }: { title: string, desc: string }) => (
    <div className="mb-6 pb-4 border-b border-white/5">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-sm text-gray-400 mt-1">{desc}</p>
    </div>
);

const InputGroup = ({ label, type = "text", value, onChange, placeholder, sub, icon: Icon }: any) => (
    <div className="group">
        <label className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-2 block group-hover:text-cyber-primary transition-colors flex items-center gap-2">
            {Icon && <Icon size={14} />} {label}
        </label>
        <div className="relative">
            <input
                type={type}
                value={value || ''}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary/50 outline-none transition-all placeholder:text-gray-600"
            />
            {sub && <p className="text-[10px] text-gray-500 mt-2 ml-1">{sub}</p>}
        </div>
    </div>
);

const SelectGroup = ({ label, value, onChange, options, sub, icon: Icon }: any) => (
    <div className="group">
        <label className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-2 block group-hover:text-cyber-primary transition-colors flex items-center gap-2">
            {Icon && <Icon size={14} />} {label}
        </label>
        <div>
            <select
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-cyber-primary transition-all appearance-none"
                value={value || ''}
                onChange={onChange}
            >
                {options.map((opt: any) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            {sub && <p className="text-[10px] text-gray-500 mt-2 ml-1">{sub}</p>}
        </div>
    </div>
);

export default function GeneralSettings() {
    const { user } = useStore();
    const { settings, updateSettings, addNotification } = useData();

    // Local States for sections
    const [branding, setBranding] = useState({
        storeName: '',
        slogan: '',
        logoUrl: '',
        brandColor: '#00ff9d'
    });

    const [legal, setLegal] = useState({
        legalBusinessName: '',
        taxVatNumber: '',
        registeredAddress: '',
        supportContact: '',
        supportPhone: ''
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

    // Sync from settings on load/change
    useEffect(() => {
        if (settings) {
            setBranding({
                storeName: settings.storeName || '',
                slogan: settings.slogan || '',
                logoUrl: settings.logoUrl || '',
                brandColor: settings.brandColor || '#00ff9d',
            });
            setLegal({
                legalBusinessName: settings.legalBusinessName || '',
                taxVatNumber: settings.taxVatNumber || '',
                registeredAddress: settings.registeredAddress || '',
                supportContact: settings.supportContact || '',
                supportPhone: settings.supportPhone || ''
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

        setSaving(true);
        try {
            await updateSettings(data, user?.name || 'Admin');
            addNotification('success', `${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully!`);
        } catch (err) {
            console.error(`Failed to save ${section} settings:`, err);
            addNotification('alert', `Failed to save ${section} settings.`);
        } finally {
            setSaving(false);
        }
    };

    const handleUploadLogo = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/png,image/jpeg,image/jpg,image/webp';

        input.onchange = (e: any) => {
            const file = e.target?.files?.[0];
            if (!file) return;

            if (file.size > 2 * 1024 * 1024) {
                addNotification('alert', 'Logo file must be less than 2MB');
                return;
            }

            if (!file.type.startsWith('image/')) {
                addNotification('alert', 'Please upload an image file');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const logoUrl = event.target?.result as string;
                setBranding(prev => ({ ...prev, logoUrl }));
                addNotification('info', 'Logo preview updated. Click Save to apply.');
            };
            reader.readAsDataURL(file);
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

    return (
        <div className="w-full max-w-full space-y-8 animate-in fade-in slide-in-from-right-4">

            {/* BRANDING CARD */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-white/20 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-cyber-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                    {/* Logo Section */}
                    <div className="w-full md:w-auto flex flex-col items-center md:items-start gap-4 shrink-0">
                        <div
                            className="w-40 h-40 rounded-3xl bg-black/40 border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden relative group/logo cursor-pointer hover:border-cyber-primary/50 transition-colors"
                            onClick={handleUploadLogo}
                        >
                            {branding.logoUrl ? (
                                <img src={branding.logoUrl} alt="Company Logo" className="w-full h-full object-contain p-4" />
                            ) : (
                                <Logo size={64} showText={false} />
                            )}
                            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity">
                                <Upload className="text-cyber-primary mb-2" size={24} />
                                <span className="text-xs font-bold text-white">Upload Logo</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest text-center md:text-left w-full">2MB Max • PNG/JPG</p>
                    </div>

                    {/* Brand Details form */}
                    <div className="flex-1 w-full min-0">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-white">Brand Identity</h3>
                                <p className="text-sm text-gray-400 mt-1">Define how your organization appears on receipts and dashboard.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputGroup
                                label="Store Name"
                                value={branding.storeName}
                                onChange={(e: any) => setBranding(prev => ({ ...prev, storeName: e.target.value }))}
                                icon={Building}
                                placeholder="e.g. SiifMart Cloud Retail"
                            />

                            <div className="group">
                                <label className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-2 block group-hover:text-cyber-primary transition-colors flex items-center gap-2 truncate">
                                    Brand Color
                                </label>
                                <div className="flex items-center gap-3 p-3 bg-black/40 border border-white/10 rounded-xl">
                                    <input
                                        type="color"
                                        className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                                        value={branding.brandColor}
                                        onChange={(e: any) => setBranding(prev => ({ ...prev, brandColor: e.target.value }))}
                                    />
                                    <span className="text-sm font-mono text-gray-300 uppercase">{branding.brandColor}</span>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <InputGroup
                                    label="Slogan / Value Prop"
                                    value={branding.slogan}
                                    onChange={(e: any) => setBranding(prev => ({ ...prev, slogan: e.target.value }))}
                                    placeholder="e.g. The Future of Retail"
                                    sub="Displayed on customer-facing screens"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section Footer */}
                <div className="mt-8 pt-6 border-t border-white/5 flex justify-end relative z-10">
                    <Button
                        onClick={() => handleSaveSection('branding')}
                        loading={isSavingBranding}
                        icon={<Save size={16} />}
                        variant="primary"
                        className="px-8"
                    >
                        Save Branding
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* LEGAL ENTITY CARD */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-white/20 transition-all duration-500">
                    <div className="mb-6 border-b border-white/5 pb-4">
                        <h3 className="text-xl font-bold text-white">Legal Entity</h3>
                        <p className="text-sm text-gray-400 mt-1">Official details for tax and compliance.</p>
                    </div>

                    <div className="space-y-6">
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
                                value={legal.taxVatNumber}
                                onChange={(e: any) => setLegal(prev => ({ ...prev, taxVatNumber: e.target.value }))}
                                placeholder="0001234567"
                                icon={Hash}
                            />
                            <InputGroup
                                label="VAT Reg No"
                                placeholder="VAT-998877"
                            />
                        </div>

                        <InputGroup
                            label="Registered Address"
                            value={legal.registeredAddress}
                            onChange={(e: any) => setLegal(prev => ({ ...prev, registeredAddress: e.target.value }))}
                            placeholder="Full physical address for invoices..."
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

                    <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                        <Button
                            onClick={() => handleSaveSection('legal')}
                            loading={isSavingLegal}
                            icon={<Save size={16} />}
                            variant="primary"
                            className="px-8"
                        >
                            Save Legal Details
                        </Button>
                    </div>
                </div>

                {/* LOCALIZATION CARD */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-white/20 transition-all duration-500">
                    <div className="mb-6 border-b border-white/5 pb-4">
                        <h3 className="text-xl font-bold text-white">Localization</h3>
                        <p className="text-sm text-gray-400 mt-1">Regional formats and standards.</p>
                    </div>

                    <div className="space-y-6">
                        <SelectGroup
                            label="Base Currency"
                            value={localization.currency}
                            onChange={(e: any) => setLocalization(prev => ({ ...prev, currency: e.target.value }))}
                            options={[
                                { value: "ETB", label: "Ethiopian Birr (ETB)" },
                                { value: "KES", label: "Kenyan Shilling (KES)" },
                                { value: "USD", label: "US Dollar (USD)" },
                                { value: "EUR", label: "Euro (EUR)" }
                            ]}
                            icon={Globe}
                            sub={`Current Exchange: 1 USD ≈ ${120} ${localization.currency}`}
                        />

                        <div className="p-4 bg-black/30 rounded-xl border border-white/5">
                            <div className="flex justify-between items-center mb-4">
                                <label className="text-xs text-gray-400 font-bold uppercase flex items-center gap-2">
                                    <Calendar size={14} /> Date Format
                                </label>
                                <span className="text-[10px] bg-cyber-primary/10 text-cyber-primary px-2 py-1 rounded font-mono">
                                    Preview: {getFormattedDatePreview(localization.dateFormat)}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'].map(fmt => (
                                    <button
                                        key={fmt}
                                        type="button"
                                        onClick={() => setLocalization(prev => ({ ...prev, dateFormat: fmt as 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' }))}
                                        className={`px-2 py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all border truncate ${localization.dateFormat === fmt
                                            ? 'bg-cyber-primary text-black border-cyber-primary'
                                            : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                                            }`}
                                        title={fmt}
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
                                { value: "Africa/Addis_Ababa", label: "East Africa Time (Addis Ababa)" },
                                { value: "Africa/Nairobi", label: "East Africa Time (Nairobi)" },
                                { value: "UTC", label: "UTC (Coordinated Universal Time)" },
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
                                { value: "om", label: "Afaan Oromo" },
                                { value: "am", label: "Amharic" },
                            ]}
                            sub="Translation completeness: 100%"
                        />
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                        <Button
                            onClick={() => handleSaveSection('localization')}
                            loading={isSavingLocalization}
                            icon={<Save size={16} />}
                            variant="primary"
                            className="px-8"
                        >
                            Save Localization
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
