import React from 'react';
import { Upload, Globe, Building, Mail, Phone, Calendar, Hash, MapPin, CheckCircle, AlertTriangle } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import Logo from '../Logo';

// --- SUB-COMPONENTS ---
const SectionHeader = ({ title, desc }: { title: string, desc: string }) => (
    <div className="mb-6 pb-4 border-b border-white/5">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-sm text-gray-400 mt-1">{desc}</p>
    </div>
);

const InputGroup = ({ label, type = "text", defaultValue, value, onChange, placeholder, sub, icon: Icon }: any) => (
    <div className="group">
        <label className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-2 block group-hover:text-cyber-primary transition-colors flex items-center gap-2">
            {Icon && <Icon size={14} />} {label}
        </label>
        <div className="relative">
            <input
                type={type}
                defaultValue={defaultValue}
                value={value}
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
                value={value}
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
                updateSettings({ logoUrl }, user?.name || 'Admin');
                addNotification('success', 'Logo uploaded successfully!');
            };
            reader.readAsDataURL(file);
        };

        input.click();
    };

    // Helper to format date for preview
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
                            {settings.logoUrl ? (
                                <img src={settings.logoUrl} alt="Company Logo" className="w-full h-full object-contain p-4" />
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
                    <div className="flex-1 w-full min-w-0 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <SectionHeader title="Brand Identity" desc="Define how your organization appears on receipts, invoices, and the dashboard." />
                        </div>

                        <InputGroup
                            label="Store Name"
                            value={settings.storeName}
                            onChange={(e: any) => updateSettings({ storeName: e.target.value }, user?.name || 'Admin')}
                            icon={Building}
                            placeholder="e.g. SiifMart Cloud Retail"
                        />

                        <div className="group">
                            <label className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-2 block group-hover:text-cyber-primary transition-colors flex items-center gap-2 truncate">
                                Brand Color
                            </label>
                            <div className="flex items-center gap-3 p-3 bg-black/40 border border-white/10 rounded-xl">
                                <input type="color" className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0" defaultValue="#00ff9d" />
                                <span className="text-sm font-mono text-gray-300">#00FF9D (Cyber Green)</span>
                            </div>
                        </div>

                        <InputGroup
                            label="Slogan / Value Prop"
                            placeholder="e.g. The Future of Retail"
                            sub="Displayed on customer-facing screens"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* LEGAL ENTITY CARD */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-white/20 transition-all duration-500">
                    <SectionHeader title="Legal Entity" desc="Official details for tax and compliance." />

                    <div className="space-y-6">
                        <InputGroup
                            label="Legal Business Name"
                            placeholder="e.g. SiifMart Technologies PLC"
                            icon={Building}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup
                                label="Tax ID / TIN"
                                value={settings.taxVatNumber || ''}
                                onChange={(e: any) => updateSettings({ taxVatNumber: e.target.value }, user?.name || 'Admin')}
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
                            placeholder="Full physical address for invoices..."
                            icon={MapPin}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup
                                label="Support Email"
                                value={settings.supportContact || ''}
                                onChange={(e: any) => updateSettings({ supportContact: e.target.value }, user?.name || 'Admin')}
                                placeholder="support@siifmart.com"
                                icon={Mail}
                            />
                            <InputGroup
                                label="Support Phone"
                                placeholder="+251 911 234 567"
                                icon={Phone}
                            />
                        </div>
                    </div>
                </div>

                {/* LOCALIZATION CARD */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-white/20 transition-all duration-500">
                    <SectionHeader title="System Localization" desc="Regional formats and standards." />

                    <div className="space-y-6">
                        <SelectGroup
                            label="Base Currency"
                            value={settings.currency}
                            onChange={(e: any) => updateSettings({ currency: e.target.value }, user?.name || 'Admin')}
                            options={[
                                { value: "ETB", label: "Ethiopian Birr (ETB)" },
                                { value: "KES", label: "Kenyan Shilling (KES)" },
                                { value: "USD", label: "US Dollar (USD)" },
                                { value: "EUR", label: "Euro (EUR)" }
                            ]}
                            icon={Globe}
                            sub={`Current Exchange: 1 USD ≈ ${120} ${settings.currency}`}
                        />

                        <div className="p-4 bg-black/30 rounded-xl border border-white/5">
                            <div className="flex justify-between items-center mb-4">
                                <label className="text-xs text-gray-400 font-bold uppercase flex items-center gap-2">
                                    <Calendar size={14} /> Date Format
                                </label>
                                <span className="text-[10px] bg-cyber-primary/10 text-cyber-primary px-2 py-1 rounded font-mono">
                                    Preview: {getFormattedDatePreview(settings.dateFormat || 'DD/MM/YYYY')}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'].map(fmt => (
                                    <button
                                        key={fmt}
                                        onClick={() => updateSettings({ dateFormat: fmt }, user?.name || 'Admin')}
                                        className={`px-2 py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all border truncate ${settings.dateFormat === fmt
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
                            value={settings.timezone || 'Africa/Addis_Ababa'}
                            onChange={(e: any) => updateSettings({ timezone: e.target.value }, user?.name || 'Admin')}
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
                            value={settings.language || 'en'}
                            onChange={(e: any) => updateSettings({ language: e.target.value }, user?.name || 'Admin')}
                            options={[
                                { value: "en", label: "English (US)" },
                                { value: "om", label: "Afaan Oromo" },
                                { value: "am", label: "Amharic" },
                            ]}
                            sub="Translation completeness: 100%"
                        />

                    </div>
                </div>
            </div>
        </div>
    );
}
