
import React, { useState, useEffect, useRef } from 'react';
import {
    Save, Globe, ShoppingCart, Box, Shield, Bell, Server,
    Database, Cpu, Wifi, Printer, Key, Download, Upload,
    Trash2, RefreshCw, Activity, CheckCircle, AlertTriangle,
    Smartphone, Terminal, HardDrive, CloudLightning, Lock, CreditCard,
    FileText, Percent, Tag, Banknote, Keyboard, Link, Plug, Mail, MessageSquare,
    Eye, EyeOff, List, Plus, Code, Briefcase, Users, DollarSign, MapPin, Building, Store, Sparkles, Truck
} from 'lucide-react';
import { CURRENCY_SYMBOL } from '../constants';
import Logo from '../components/Logo';
import { useData } from '../contexts/DataContext';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import PromptModal from '../components/PromptModal';
import { Site, SiteType } from '../types';
import { useStore } from '../contexts/CentralStore';
import { Protected } from '../components/Protected';
import { openRouterService } from '../services/openrouter.service';

type SettingsTab = 'general' | 'inventory' | 'pos' | 'finance' | 'roles' | 'locations' | 'hardware' | 'integrations' | 'security' | 'notifications' | 'tax' | 'data' | 'audit';

// --- REUSABLE COMPONENTS ---

const SectionHeader = ({ title, desc }: { title: string, desc: string }) => (
    <div className="mb-6 pb-4 border-b border-white/5">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-sm text-gray-400 mt-1">{desc}</p>
    </div>
);

const InputGroup = ({ label, type = "text", defaultValue, value, onChange, placeholder, sub, sensitive }: any) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start py-4 border-b border-white/5 last:border-0 group">
        <div>
            <label className="text-sm text-gray-300 font-bold block group-hover:text-white transition-colors">{label}</label>
            {sub && <p className="text-[10px] text-gray-500 mt-1">{sub}</p>}
        </div>
        <div className="md:col-span-2 relative">
            <input
                type={type}
                defaultValue={defaultValue}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-cyber-primary/50 focus:ring-1 focus:ring-cyber-primary/50 outline-none transition-all ${sensitive ? 'font-mono tracking-widest' : ''}`}
                aria-label={label}
                title={label}
            />
            {sensitive && <Lock className="absolute right-3 top-3 text-gray-500 w-4 h-4" />}
        </div>
    </div>
);

const ToggleGroup = ({ label, sub, checked = false, onChange, warning }: any) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center py-4 border-b border-white/5 last:border-0 group">
        <div>
            <label className="text-sm text-gray-300 font-bold block group-hover:text-white transition-colors">{label}</label>
            {sub && <p className="text-[10px] text-gray-500 mt-1">{sub}</p>}
        </div>
        <div className="md:col-span-2 flex items-center justify-between">
            <div
                className="flex items-center cursor-pointer"
                onClick={onChange}
                role="switch"
                aria-checked={checked}
                tabIndex={0}
                aria-label={label}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(); } }}
            >
                <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${checked ? 'bg-cyber-primary' : 'bg-gray-700'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
                <span className="ml-3 text-xs text-gray-400 font-mono uppercase">{checked ? 'Enabled' : 'Disabled'}</span>
            </div>
            {warning && checked && (
                <div className="flex items-center gap-2 text-yellow-500 text-xs bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">
                    <AlertTriangle size={12} /> {warning}
                </div>
            )}
        </div>
    </div>
);

export default function SettingsPage() {
    const { user } = useStore();
    const { settings, updateSettings, resetData, sites, addSite, updateSite, deleteSite, systemLogs, exportSystemData, addNotification, cleanupAdminProducts, addProduct } = useData();
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [isSaving, setIsSaving] = useState(false);

    // --- MOCK LOCAL STATES FOR DEMO ---
    const [apiKeys, setApiKeys] = useState([
        { id: 1, name: 'External Storefront', key: 'sk_live_99283492384', created: '2024-01-15' },
        { id: 2, name: 'Legacy ERP Sync', key: 'sk_test_88237482374', created: '2024-02-20' },
    ]);

    const [security, setSecurity] = useState({
        mfa: true,
        ipWhitelist: '192.168.1.1/24',
        sessionTimeout: 30, // mins
        passwordExpiry: 90 // days
    });

    const [notifications, setNotifications] = useState({
        emailOrder: true,
        smsLowStock: true,
        pushAuth: true,
        emailTemplate: "Dear {Customer},\n\nThank you for your order #{OrderId} of {Amount}.\nWe appreciate your business!\n\n- SIIFMART Team"
    });

    const [taxRules, setTaxRules] = useState([
        { id: 1, category: 'Electronics', rate: 15, region: 'All' },
        { id: 2, category: 'Food', rate: 0, region: 'All' },
        { id: 3, category: 'Alcohol', rate: 25, region: 'All' },
    ]);

    // Site Modal State
    const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
    const [newSite, setNewSite] = useState<Partial<Site>>({});
    const [isSavingSite, setIsSavingSite] = useState(false);

    // Delete Confirmation State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [siteToDelete, setSiteToDelete] = useState<Site | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    // Confirmation Modals
    const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
    const [deleteApiKeyConfirm, setDeleteApiKeyConfirm] = useState<{ open: boolean; key: typeof apiKeys[0] | null }>({ open: false, key: null });
    const [deleteTaxRuleConfirm, setDeleteTaxRuleConfirm] = useState<{ open: boolean; rule: typeof taxRules[0] | null }>({ open: false, rule: null });

    // Prompt Modals
    const [apiKeyNamePrompt, setApiKeyNamePrompt] = useState(false);
    const [taxCategoryPrompt, setTaxCategoryPrompt] = useState(false);
    const [taxRatePrompt, setTaxRatePrompt] = useState(false);
    const [pendingTaxCategory, setPendingTaxCategory] = useState('');

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            addNotification('success', "System Configuration Updated Successfully.\nOperational rules have been applied globally.");
        }, 1000);
    };

    const handleUploadLogo = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/png,image/jpeg,image/jpg,image/webp';

        input.onchange = (e: any) => {
            const file = e.target?.files?.[0];
            if (!file) return;

            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                addNotification('alert', 'Logo file must be less than 2MB');
                return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                addNotification('alert', 'Please upload an image file (PNG, JPEG, or WebP)');
                return;
            }

            // Read and convert to base64
            const reader = new FileReader();
            reader.onload = (event) => {
                const logoUrl = event.target?.result as string;
                updateSettings({ logoUrl }, user?.name || 'Admin');
                addNotification('success', 'Logo uploaded successfully!');
            };
            reader.onerror = () => {
                addNotification('alert', 'Failed to read logo file');
            };
            reader.readAsDataURL(file);
        };

        input.click();
    };

    const handleFactoryReset = () => {
        setResetConfirmOpen(true);
    };

    const confirmFactoryReset = () => {
        resetData();
        addNotification('success', 'System has been reset to defaults');
    };

    const handleBackup = () => {
        const json = exportSystemData();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `siifmart_backup_${new Date().toISOString()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSaveSite = async () => {
        console.log('🔍 handleSaveSite called with newSite:', newSite);
        console.log('Validation check - name:', newSite.name, 'type:', newSite.type);

        if (!newSite.name || !newSite.type) {
            console.log('❌ Validation failed!');
            addNotification('alert', "Name and Type are required");
            return;
        }

        console.log('✅ Validation passed, attempting to save site:', newSite);
        setIsSavingSite(true);
        try {
            if (newSite.id) {
                // Update existing site
                const siteData: Site = {
                    id: newSite.id,
                    name: newSite.name,
                    type: newSite.type,
                    address: newSite.address || '',
                    status: newSite.status || 'Active',
                    manager: newSite.manager,
                    capacity: newSite.capacity,
                    terminalCount: newSite.terminalCount,
                    code: newSite.name?.substring(0, 3).toUpperCase() || 'UNK'
                };
                console.log('📝 Updating site:', siteData);
                await updateSite(siteData, user?.name || 'Admin');
            } else {
                // Create new site (don't include ID, let Supabase generate it)
                const siteData: Omit<Site, 'id'> = {
                    name: newSite.name,
                    type: newSite.type,
                    address: newSite.address || '',
                    status: newSite.status || 'Active',
                    manager: newSite.manager,
                    capacity: newSite.capacity,
                    terminalCount: newSite.terminalCount,
                    code: newSite.name?.substring(0, 3).toUpperCase() || 'UNK'
                };
                console.log('➕ Creating new site:', siteData);
                await addSite(siteData as Site, user?.name || 'Admin');
            }
            console.log('✅ Site saved successfully');
            setIsSiteModalOpen(false);
            setNewSite({});
        } catch (error: any) {
            console.error('❌ Error saving site:', error);
            console.error('Error details:', {
                message: error?.message,
                code: error?.code,
                details: error?.details,
                hint: error?.hint
            });
            const errorMsg = error?.message || error?.details || 'Failed to save location. Please try again.';
            addNotification('alert', `Error: ${errorMsg}`);
        } finally {
            setIsSavingSite(false);
        }
    };

    const handleDeleteSite = (id: string) => {
        const site = sites.find(s => s.id === id);
        if (!site) return;

        setSiteToDelete(site);
        setDeleteConfirmText('');
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteSite = () => {
        if (!siteToDelete) return;

        if (deleteConfirmText !== "DELETE") {
            addNotification('alert', 'Please type "DELETE" to confirm.');
            return;
        }

        deleteSite(siteToDelete.id, user?.name || 'Admin');
        addNotification('success', `Location "${siteToDelete.name}" has been deleted`);
        setIsDeleteModalOpen(false);
        setSiteToDelete(null);
        setDeleteConfirmText('');
    };

    const TabButton = ({ id, icon: Icon, label }: { id: SettingsTab, icon: any, label: string }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium mb-2 ${activeTab === id
                ? 'bg-cyber-primary text-black shadow-[0_0_15px_rgba(0,255,157,0.3)] font-bold'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
        >
            <Icon size={18} />
            <span>{label}</span>
        </button>
    );

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-140px)]">
            {/* Sidebar */}
            <div className="w-full lg:w-64 shrink-0">
                <div className="bg-cyber-gray border border-white/5 rounded-2xl p-4 h-full overflow-y-auto custom-scrollbar">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 px-2">System Config</p>
                    <Protected permission="ACCESS_SETTINGS">
                        <TabButton id="general" icon={Globe} label="General" />
                    </Protected>
                    <Protected permission="MANAGE_WAREHOUSE">
                        <TabButton id="locations" icon={MapPin} label="Locations" />
                    </Protected>
                    <Protected permission="MANAGE_WAREHOUSE">
                        <TabButton id="inventory" icon={Box} label="WMS Rules" />
                    </Protected>
                    <Protected permission="EDIT_OPERATIONAL_SETTINGS">
                        <TabButton id="pos" icon={ShoppingCart} label="POS & Retail" />
                    </Protected>
                    <Protected permission="ACCESS_FINANCE">
                        <TabButton id="finance" icon={DollarSign} label="Finance" />
                    </Protected>
                    <Protected permission="ACCESS_FINANCE">
                        <TabButton id="tax" icon={Percent} label="Tax Matrix" />
                    </Protected>
                    <Protected permission="EDIT_SYSTEM_SETTINGS">
                        <TabButton id="hardware" icon={Printer} label="Hardware" />
                    </Protected>

                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-6 mb-4 px-2">Infrastructure</p>
                    <Protected permission="MANAGE_ROLES">
                        <TabButton id="roles" icon={Users} label="Roles & Access" />
                    </Protected>
                    <Protected permission="EDIT_SYSTEM_SETTINGS">
                        <TabButton id="integrations" icon={CloudLightning} label="Integrations" />
                    </Protected>
                    <Protected permission="EDIT_SYSTEM_SETTINGS">
                        <TabButton id="security" icon={Shield} label="Security" />
                    </Protected>
                    <Protected permission="VIEW_AUDIT_LOGS">
                        <TabButton id="audit" icon={FileText} label="Audit Log" />
                    </Protected>
                    <Protected permission="ACCESS_SETTINGS">
                        <TabButton id="notifications" icon={Bell} label="Notifications" />
                    </Protected>
                    <Protected permission="EDIT_SYSTEM_SETTINGS">
                        <TabButton id="data" icon={Database} label="Data Mgmt" />
                    </Protected>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-cyber-gray border border-white/5 rounded-2xl flex flex-col relative overflow-hidden">

                {/* Toolbar */}
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20 backdrop-blur-md z-10 sticky top-0">
                    <div className="text-xs text-gray-500">
                        Configuration / <span className="text-white capitalize">{activeTab}</span>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-cyber-primary text-black px-6 py-2 rounded-lg font-bold text-sm hover:bg-cyber-accent transition-all shadow-[0_0_15px_rgba(0,255,157,0.2)] flex items-center gap-2 disabled:opacity-70"
                    >
                        {isSaving ? <RefreshCw className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                    {/* --- GENERAL --- */}
                    {activeTab === 'general' && (
                        <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-right-4">
                            <SectionHeader title="Store Identity" desc="Manage company details shown on receipts and invoices." />
                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-24 h-24 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center overflow-hidden relative group cursor-pointer" onClick={handleUploadLogo}>
                                    {settings.logoUrl ? (
                                        <img src={settings.logoUrl} alt="Company Logo" className="w-full h-full object-contain" />
                                    ) : (
                                        <Logo size={48} showText={false} />
                                    )}
                                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Upload className="text-white" size={24} />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-white font-bold">Company Logo</h4>
                                    <p className="text-xs text-gray-500 mt-1">Recommended: 500x500px PNG</p>
                                    <button onClick={handleUploadLogo} className="mt-2 text-xs text-cyber-primary hover:underline">Upload New</button>
                                </div>
                            </div>
                            <InputGroup
                                label="Store Name"
                                value={settings.storeName}
                                onChange={(e: any) => updateSettings({ storeName: e.target.value }, user?.name || 'Admin')}
                            />
                            <InputGroup
                                label="Tax / VAT Number"
                                value={settings.taxVatNumber || ''}
                                onChange={(e: any) => updateSettings({ taxVatNumber: e.target.value }, user?.name || 'Admin')}
                                placeholder="ET-123456789"
                            />
                            <InputGroup
                                label="Support Contact"
                                value={settings.supportContact || ''}
                                onChange={(e: any) => updateSettings({ supportContact: e.target.value }, user?.name || 'Admin')}
                                placeholder="+251 911 000 000"
                            />

                            <SectionHeader title="Localization" desc="Currency, timezones, and language." />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center py-4 border-b border-white/5">
                                <label className="text-sm text-gray-300 font-bold">Base Currency</label>
                                <div className="md:col-span-2">
                                    <select
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-cyber-primary/50"
                                        value={settings.currency}
                                        onChange={(e) => updateSettings({ currency: e.target.value }, user?.name || 'Admin')}
                                        title="Select Currency"
                                        aria-label="Select Currency"
                                    >
                                        <option value="ETB">Ethiopian Birr (ETB)</option>
                                        <option value="KES">Kenyan Shilling (KES)</option>
                                        <option value="UGX">Ugandan Shilling (UGX)</option>
                                        <option value="USD">US Dollar (USD)</option>
                                        <option value="EUR">Euro (EUR)</option>
                                    </select>
                                </div>
                            </div>
                            <ToggleGroup
                                label="Multi-Currency Support"
                                sub="Accept payments in foreign currencies"
                                checked={settings.multiCurrency}
                                onChange={() => updateSettings({ multiCurrency: !settings.multiCurrency }, user?.name || 'Admin')}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center py-4 border-b border-white/5">
                                <label className="text-sm text-gray-300 font-bold">Timezone</label>
                                <div className="md:col-span-2">
                                    <select
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-cyber-primary/50"
                                        value={settings.timezone || 'Africa/Addis_Ababa'}
                                        onChange={(e) => updateSettings({ timezone: e.target.value }, user?.name || 'Admin')}
                                        title="Select Timezone"
                                        aria-label="Select Timezone"
                                    >
                                        <option value="Africa/Addis_Ababa">East Africa Time - Addis Ababa (EAT)</option>
                                        <option value="Africa/Nairobi">East Africa Time - Nairobi (EAT)</option>
                                        <option value="Africa/Kampala">East Africa Time - Kampala (EAT)</option>
                                        <option value="Africa/Dar_es_Salaam">East Africa Time - Dar es Salaam (EAT)</option>
                                        <option value="UTC">Coordinated Universal Time (UTC)</option>
                                        <option value="Europe/London">Greenwich Mean Time (GMT)</option>
                                        <option value="America/New_York">Eastern Time - New York (ET)</option>
                                    </select>
                                    <p className="text-[10px] text-gray-500 mt-1">Used for timestamps and reports</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center py-4 border-b border-white/5">
                                <label className="text-sm text-gray-300 font-bold">Date Format</label>
                                <div className="md:col-span-2">
                                    <select
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-cyber-primary/50"
                                        value={settings.dateFormat || 'DD/MM/YYYY'}
                                        onChange={(e) => updateSettings({ dateFormat: e.target.value as any }, user?.name || 'Admin')}
                                        title="Select Date Format"
                                        aria-label="Select Date Format"
                                    >
                                        <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</option>
                                        <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
                                        <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</option>
                                    </select>
                                    <p className="text-[10px] text-gray-500 mt-1">How dates are displayed throughout the system</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center py-4 border-b border-white/5">
                                <label className="text-sm text-gray-300 font-bold">Number Format</label>
                                <div className="md:col-span-2">
                                    <select
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-cyber-primary/50"
                                        value={settings.numberFormat || '1,000.00'}
                                        onChange={(e) => updateSettings({ numberFormat: e.target.value as any }, user?.name || 'Admin')}
                                        title="Select Number Format"
                                        aria-label="Select Number Format"
                                    >
                                        <option value="1,000.00">1,000.00 (English)</option>
                                        <option value="1.000,00">1.000,00 (European)</option>
                                    </select>
                                    <p className="text-[10px] text-gray-500 mt-1">Decimal and thousand separators</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center py-4 border-b border-white/5">
                                <label className="text-sm text-gray-300 font-bold">System Language</label>
                                <div className="md:col-span-2">
                                    <select
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-cyber-primary/50"
                                        value={settings.language || 'en'}
                                        onChange={(e) => updateSettings({ language: e.target.value }, user?.name || 'Admin')}
                                        title="Select Language"
                                        aria-label="Select Language"
                                    >
                                        <option value="en">English</option>
                                        <option value="om">Afaan Oromo (Oromiffa)</option>
                                        <option value="am">Amharic (አማርኛ)</option>
                                        <option value="sw">Swahili (Kiswahili)</option>
                                    </select>
                                    <p className="text-[10px] text-gray-500 mt-1">Interface language (English only for now)</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- LOCATIONS (MULTI-SITE) --- */}
                    {activeTab === 'locations' && (
                        <Protected permission="MANAGE_SITES" fallback={
                            <div className="max-w-4xl">
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center">
                                    <Lock className="w-16 h-16 text-red-400 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-white mb-2">Access Restricted</h3>
                                    <p className="text-gray-400">Only Super Administrators can manage locations.</p>
                                </div>
                            </div>
                        }>
                            <div className="max-w-6xl space-y-6 animate-in fade-in slide-in-from-right-4">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <SectionHeader title="Physical Locations" desc="Manage Warehouses, Distribution Centers, and Retail Stores across Ethiopia." />
                                        <div className="flex flex-wrap items-center gap-4 mt-4">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Building className="text-purple-400" size={16} />
                                                <span className="text-gray-400">{sites.filter(s => s.type === 'Administration').length} Administration</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Building className="text-blue-400" size={16} />
                                                <span className="text-gray-400">{sites.filter(s => s.type === 'Warehouse').length} Warehouses</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Store className="text-green-400" size={16} />
                                                <span className="text-gray-400">{sites.filter(s => s.type === 'Store').length} Stores</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setNewSite({ type: 'Store', status: 'Active' }); setIsSiteModalOpen(true); }}
                                        className="bg-cyber-primary text-black px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-cyber-accent shadow-[0_0_15px_rgba(0,255,157,0.2)] transition-all"
                                    >
                                        <Plus size={18} /> Add Location
                                    </button>
                                </div>

                                {sites.length === 0 ? (
                                    <div className="bg-black/20 border-2 border-dashed border-white/10 rounded-2xl p-12 text-center">
                                        <MapPin className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                        <h3 className="text-xl font-bold text-white mb-2">No Locations Yet</h3>
                                        <p className="text-gray-400 mb-6">Start by adding your first warehouse or store.</p>
                                        <button
                                            onClick={() => { setNewSite({ type: 'Store', status: 'Active' }); setIsSiteModalOpen(true); }}
                                            className="bg-cyber-primary text-black px-6 py-3 rounded-xl font-bold text-sm inline-flex items-center gap-2 hover:bg-cyber-accent"
                                        >
                                            <Plus size={18} /> Add First Location
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {sites.map(site => (
                                            <div key={site.id} className="bg-gradient-to-br from-cyber-gray to-black/40 border border-white/10 rounded-2xl p-6 relative group hover:border-cyber-primary/50 hover:shadow-[0_0_30px_rgba(0,255,157,0.1)] transition-all duration-300">
                                                {/* Type Badge */}
                                                <div className="absolute top-4 right-4 flex gap-2">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold border ${site.status === 'Active' ? 'text-green-400 border-green-500/30 bg-green-500/10' :
                                                        site.status === 'Maintenance' ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' :
                                                            'text-red-400 border-red-500/30 bg-red-500/10'
                                                        }`}>
                                                        {site.status}
                                                    </span>
                                                </div>

                                                {/* Icon */}
                                                <div
                                                    className={`w-16 h-16 rounded-2xl mb-4 flex items-center justify-center ${site.type === 'Warehouse'
                                                        ? 'bg-blue-500/20 text-blue-400'
                                                        : site.type === 'Store' || site.type === 'Dark Store'
                                                            ? 'bg-green-500/20 text-green-400'
                                                            : 'bg-purple-500/20 text-purple-300'
                                                        }`}
                                                >
                                                    {site.type === 'Warehouse' ? (
                                                        <Building size={32} />
                                                    ) : site.type === 'Store' || site.type === 'Dark Store' ? (
                                                        <Store size={32} />
                                                    ) : (
                                                        <Building size={32} />
                                                    )}
                                                </div>

                                                {/* Name & Type */}
                                                <h4 className="text-white font-bold text-lg mb-1">{site.name}</h4>
                                                <p className="text-xs text-gray-500 uppercase font-bold mb-3">
                                                    {site.type === 'Administration' ? 'Administration Office' : site.type}
                                                </p>

                                                {/* Address */}
                                                <p className="text-sm text-gray-400 flex items-start gap-2 mb-4">
                                                    <MapPin size={14} className="mt-0.5 shrink-0" />
                                                    <span>{site.address}</span>
                                                </p>

                                                {/* Details Grid */}
                                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                                                    <div>
                                                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Manager</p>
                                                        <p className="text-sm text-white font-medium">{site.manager || 'Unassigned'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">
                                                            {site.type === 'Warehouse' || site.type === 'Distribution Center'
                                                                ? 'Capacity (m²)'
                                                                : site.type === 'Administration'
                                                                    ? 'Offices'
                                                                    : 'Terminals'}
                                                        </p>
                                                        <p className="text-sm text-cyber-primary font-mono font-bold">
                                                            {site.type === 'Warehouse' || site.type === 'Distribution Center'
                                                                ? `${site.capacity || 0} m²`
                                                                : site.type === 'Administration'
                                                                    ? `${site.capacity || 0} staff`
                                                                    : `${site.terminalCount || 0} POS`}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                                    <button
                                                        onClick={() => { setNewSite(site); setIsSiteModalOpen(true); }}
                                                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white backdrop-blur-sm transition-colors"
                                                        title="Edit Location"
                                                    >
                                                        <Code size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSite(site.id)}
                                                        className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg text-red-400 backdrop-blur-sm transition-colors"
                                                        title="Delete Location"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Protected>
                    )}

                    {/* --- POS SETTINGS --- */}
                    {activeTab === 'pos' && (
                        <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-right-4">
                            <SectionHeader title="Retail Terminal Config" desc="Customize the Point of Sale experience." />

                            <InputGroup
                                label="Receipt Header"
                                value={settings.posReceiptHeader}
                                onChange={(e: any) => updateSettings({ posReceiptHeader: e.target.value }, user?.name || 'Admin')}
                                placeholder="e.g. *** SIIFMART ***"
                            />
                            <InputGroup
                                label="Receipt Footer"
                                value={settings.posReceiptFooter}
                                onChange={(e: any) => updateSettings({ posReceiptFooter: e.target.value }, user?.name || 'Admin')}
                                placeholder="e.g. Thank you for shopping!"
                            />
                            <InputGroup
                                label="Terminal ID"
                                value={settings.posTerminalId}
                                onChange={(e: any) => updateSettings({ posTerminalId: e.target.value }, user?.name || 'Admin')}
                                sub="Unique identifier for this checkout station"
                            />

                            <ToggleGroup
                                label="Require Shift Closure"
                                sub="Force Z-Report before logging out"
                                checked={settings.requireShiftClosure}
                                onChange={() => updateSettings({ requireShiftClosure: !settings.requireShiftClosure }, user?.name || 'Admin')}
                            />

                            <ToggleGroup
                                label="Enable Loyalty Program"
                                sub="Allow earning and redeeming points"
                                checked={settings.enableLoyalty}
                                onChange={() => updateSettings({ enableLoyalty: !settings.enableLoyalty }, user?.name || 'Admin')}
                            />
                        </div>
                    )}

                    {/* --- FINANCE SETTINGS --- */}
                    {activeTab === 'finance' && (
                        <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-right-4">
                            <SectionHeader title="Accounting Preferences" desc="Fiscal year and ledger configuration." />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center py-4 border-b border-white/5">
                                <div>
                                    <label className="text-sm text-gray-300 font-bold">Fiscal Year Start</label>
                                    <p className="text-[10px] text-gray-500 mt-1">Start month for financial reporting</p>
                                </div>
                                <div className="md:col-span-2">
                                    <select
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-cyber-primary/50"
                                        value={settings.fiscalYearStart}
                                        onChange={(e) => updateSettings({ fiscalYearStart: e.target.value }, user?.name || 'Admin')}
                                        title="Select Fiscal Year Start"
                                        aria-label="Select Fiscal Year Start"
                                    >
                                        {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center py-4 border-b border-white/5">
                                <div>
                                    <label className="text-sm text-gray-300 font-bold">Accounting Method</label>
                                    <p className="text-[10px] text-gray-500 mt-1">Basis for recognizing revenue</p>
                                </div>
                                <div className="md:col-span-2 flex gap-2">
                                    <button
                                        onClick={() => updateSettings({ accountingMethod: 'Accrual' }, user?.name || 'Admin')}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold border ${settings.accountingMethod === 'Accrual' ? 'bg-cyber-primary text-black border-cyber-primary' : 'bg-white/5 text-gray-400 border-white/10'}`}
                                    >
                                        Accrual
                                    </button>
                                    <button
                                        onClick={() => updateSettings({ accountingMethod: 'Cash' }, user?.name || 'Admin')}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold border ${settings.accountingMethod === 'Cash' ? 'bg-cyber-primary text-black border-cyber-primary' : 'bg-white/5 text-gray-400 border-white/10'}`}
                                    >
                                        Cash Basis
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- ROLES & PERMISSIONS (Visual) --- */}
                    {activeTab === 'roles' && (
                        <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-right-4">
                            <SectionHeader title="Role & Access Matrix" desc="View permission levels for system roles." />

                            <div className="bg-black/20 border border-white/5 rounded-xl overflow-hidden overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white/5 text-gray-400 uppercase font-bold text-xs">
                                        <tr>
                                            <th className="p-4 border-b border-white/10">Module</th>
                                            <th className="p-4 border-b border-white/10 text-center">Admin</th>
                                            <th className="p-4 border-b border-white/10 text-center">Manager</th>
                                            <th className="p-4 border-b border-white/10 text-center">WMS</th>
                                            <th className="p-4 border-b border-white/10 text-center">POS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {[
                                            { mod: 'Dashboard', a: true, m: true, w: true, p: true },
                                            { mod: 'Sales History', a: true, m: true, w: false, p: true },
                                            { mod: 'Inventory Edit', a: true, m: true, w: true, p: false },
                                            { mod: 'Purchasing (PO)', a: true, m: true, w: true, p: false },
                                            { mod: 'Finance & Tax', a: true, m: false, w: false, p: false },
                                            { mod: 'HR / Payroll', a: true, m: false, w: false, p: false },
                                            { mod: 'System Settings', a: true, m: false, w: false, p: false },
                                        ].map((row, i) => (
                                            <tr key={i} className="hover:bg-white/5 transition-colors">
                                                <td className="p-4 font-bold text-white">{row.mod}</td>
                                                <td className="p-4 text-center"><div className={`w-4 h-4 rounded-full mx-auto ${row.a ? 'bg-green-500' : 'bg-red-900/30'}`} /></td>
                                                <td className="p-4 text-center"><div className={`w-4 h-4 rounded-full mx-auto ${row.m ? 'bg-green-500' : 'bg-red-900/30'}`} /></td>
                                                <td className="p-4 text-center"><div className={`w-4 h-4 rounded-full mx-auto ${row.w ? 'bg-green-500' : 'bg-red-900/30'}`} /></td>
                                                <td className="p-4 text-center"><div className={`w-4 h-4 rounded-full mx-auto ${row.p ? 'bg-green-500' : 'bg-red-900/30'}`} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="p-4 bg-white/5 text-xs text-gray-500 flex items-center justify-between">
                                    <span>Green = Full Access, Red = Restricted</span>
                                    <button
                                        onClick={() => {
                                            addNotification('info', 'To request a custom role, please contact your system administrator or email: admin@siifmart.com');
                                        }}
                                        className="text-cyber-primary hover:underline"
                                    >
                                        Request Custom Role
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- INTEGRATIONS (FLEXIBLE) --- */}
                    {activeTab === 'integrations' && (
                        <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-right-4">

                            <SectionHeader
                                title="AI Assistant"
                                desc="Your AI is pre-configured and ready to use with OpenRouter."
                            />

                            {/* SIMPLE OPENROUTER-ONLY CARD */}
                            <div className="bg-gradient-to-br from-purple-900/10 to-blue-900/10 border border-purple-500/20 rounded-2xl overflow-hidden">

                                {/* Header */}
                                <div className="p-6 border-b border-white/5 bg-black/20">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                                                <Sparkles className="text-purple-400" size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-white font-bold text-lg">SIIF INTELLIGENCE</h3>
                                                <p className="text-xs text-gray-400 mt-0.5">Powered by OpenRouter AI</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-green-500/10 border-green-500/30">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-xs font-bold text-green-400">READY</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 space-y-4">

                                    {/* Model Selector */}
                                    <div>
                                        <label className="text-sm font-bold text-white block mb-2">AI Model</label>
                                        <select
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                                            value={openRouterService.getModel()}
                                            onChange={(e) => {
                                                openRouterService.setModel(e.target.value);
                                                addNotification('success', `AI model switched to ${e.target.options[e.target.selectedIndex].text}`);
                                                updateSettings({}, user?.name || 'Admin');
                                            }}
                                            title="Select AI Model"
                                            aria-label="Select AI Model"
                                        >
                                            {openRouterService.AVAILABLE_MODELS.map((model) => (
                                                <option key={model.id} value={model.id}>
                                                    {model.name} - {model.description}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-gray-500 mt-2">
                                            ✨ All models are 100% free and don't use your GPU
                                        </p>
                                    </div>

                                    {/* Pre-Configured Message */}
                                    <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="text-green-400 shrink-0 mt-0.5" size={20} />
                                            <div>
                                                <p className="text-sm font-bold text-green-400 mb-1">Pre-Configured & Ready!</p>
                                                <p className="text-xs text-gray-400 leading-relaxed">
                                                    Your AI Assistant is already set up with OpenRouter and ready to use.
                                                    No configuration needed! Just press <kbd className="px-2 py-1 bg-black/40 rounded text-purple-400 font-mono text-xs">Ctrl+K</kbd> or click the purple sparkle button.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Test Button */}
                                    <div className="pt-4 border-t border-white/5">
                                        <button
                                            onClick={() => {
                                                addNotification('success', 'AI is ready! Press Ctrl+K or click the purple sparkle button (bottom-right) to start.');
                                            }}
                                            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-purple-500/20"
                                        >
                                            <Sparkles size={20} />
                                            Test AI Assistant
                                        </button>
                                        <p className="text-xs text-center text-gray-500 mt-3">
                                            ✨ AI Assistant available via <kbd className="px-1.5 py-0.5 bg-black/40 rounded text-purple-400 font-mono text-xs">Ctrl+K</kbd> or purple button (bottom-right)
                                        </p>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="px-6 py-4 bg-black/20 border-t border-white/5 grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 mb-1">Provider</p>
                                        <p className="text-sm font-bold text-white">OpenRouter</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 mb-1">Daily Limit</p>
                                        <p className="text-sm font-bold text-white">50 Requests</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 mb-1">Speed</p>
                                        <p className="text-sm font-bold text-white">Fast</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-cyber-primary/5 border border-cyber-primary/20 p-6 rounded-xl mb-6">
                                <h4 className="text-cyber-primary font-bold text-sm flex items-center gap-2">
                                    <Code size={16} /> Developer API Access
                                </h4>
                                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                                    SiifMart provides a fully flexible REST API to connect with any third-party service.
                                    Instead of pre-built connectors, generate API keys below to authenticate your custom integrations
                                    (eCommerce, CRM, Accounting, or custom mobile apps).
                                </p>
                                <div className="mt-4 flex gap-3">
                                    <button
                                        onClick={() => {
                                            window.open('https://docs.siifmart.com/api', '_blank');
                                            addNotification('info', 'Opening API Documentation in new tab...');
                                        }}
                                        className="text-xs bg-cyber-primary text-black px-3 py-1.5 rounded font-bold hover:bg-cyber-accent transition-colors"
                                    >
                                        View API Documentation
                                    </button>
                                    <button
                                        onClick={() => {
                                            addNotification('info', 'Sandbox environment: https://sandbox.siifmart.com/api\nUse test API keys for development.');
                                        }}
                                        className="text-xs bg-white/5 text-white border border-white/10 px-3 py-1.5 rounded font-bold hover:bg-white/10 transition-colors"
                                    >
                                        Test in Sandbox
                                    </button>
                                </div>
                            </div>

                            <SectionHeader title="API Keys" desc="Manage authentication tokens for your custom integrations." />

                            <div className="space-y-3">
                                {apiKeys.map(key => (
                                    <div key={key.id} className="bg-black/20 border border-white/5 p-4 rounded-xl flex items-center justify-between group hover:border-white/20 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-white/5 rounded-lg text-cyber-primary">
                                                <Key size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-white font-bold text-sm">{key.name}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <code className="text-[10px] bg-black/40 px-2 py-0.5 rounded text-gray-400 font-mono">{key.key}</code>
                                                    <span className="text-[10px] text-green-400 bg-green-500/10 px-1.5 rounded">Active</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] text-gray-600 font-mono">Created: {key.created}</span>
                                            <button
                                                onClick={() => {
                                                    setDeleteApiKeyConfirm({ open: true, key });
                                                }}
                                                className="p-2 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-lg transition-colors"
                                                title="Delete API key"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    onClick={() => {
                                        setApiKeyNamePrompt(true);
                                    }}
                                    className="px-4 py-2 bg-cyber-primary text-black font-bold rounded-lg hover:bg-cyber-accent transition-colors flex items-center gap-2"
                                >
                                    <Plus size={16} /> Add API Key
                                </button>
                            </div>

                            <div className="mt-8 pt-8 border-t border-white/5">
                                <SectionHeader title="Webhooks" desc="Configure real-time event endpoints." />
                                <div className="space-y-4">
                                    <InputGroup label="Order Created" placeholder="https://api.yourapp.com/webhooks/orders/create" sub="Payload: Order Object" />
                                    <InputGroup label="Inventory Low" placeholder="https://api.yourapp.com/webhooks/stock/low" sub="Payload: Product ID, SKU, Stock" />
                                    <InputGroup label="Customer Signup" placeholder="https://api.yourapp.com/webhooks/customers/new" sub="Payload: Customer Object" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- SECURITY --- */}
                    {activeTab === 'security' && (
                        <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-right-4">
                            <SectionHeader title="Security Policy" desc="Access control and authentication rules." />

                            <ToggleGroup
                                label="Enforce 2FA"
                                sub="Require 2-Factor Auth for all Admin/Manager roles"
                                checked={security.mfa}
                                onChange={() => setSecurity({ ...security, mfa: !security.mfa })}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center py-4 border-b border-white/5">
                                <div>
                                    <label className="text-sm text-gray-300 font-bold">Session Timeout</label>
                                    <p className="text-[10px] text-gray-500 mt-1">Auto-logout inactive users</p>
                                </div>
                                <div className="md:col-span-2 flex items-center gap-4">
                                    <input
                                        type="range" min="5" max="120" step="5"
                                        value={security.sessionTimeout}
                                        aria-label="Session Timeout"
                                        onChange={(e) => setSecurity({ ...security, sessionTimeout: parseInt(e.target.value) })}
                                        className="flex-1 accent-cyber-primary"
                                    />
                                    <span className="text-cyber-primary font-mono font-bold w-16 text-right">{security.sessionTimeout} min</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center py-4 border-b border-white/5">
                                <div>
                                    <label className="text-sm text-gray-300 font-bold">Password Expiry</label>
                                    <p className="text-[10px] text-gray-500 mt-1">Force reset every X days</p>
                                </div>
                                <div className="md:col-span-2 flex items-center gap-4">
                                    <input
                                        type="number"
                                        value={security.passwordExpiry}
                                        aria-label="Password Expiry Days"
                                        onChange={(e) => setSecurity({ ...security, passwordExpiry: parseInt(e.target.value) })}
                                        className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white w-24 text-center"
                                    />
                                    <span className="text-sm text-gray-400">Days</span>
                                </div>
                            </div>

                            <InputGroup
                                label="IP Whitelist"
                                value={security.ipWhitelist}
                                onChange={(e: any) => setSecurity({ ...security, ipWhitelist: e.target.value })}
                                placeholder="e.g. 192.168.1.1/24"
                                sub="CIDR ranges allowed to access Admin Panel"
                            />
                        </div>
                    )}

                    {/* --- AUDIT LOG --- */}
                    {activeTab === 'audit' && (
                        <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-right-4">
                            <SectionHeader title="System Audit Log" desc="Immutable record of all administrative actions." />

                            <div className="bg-black/20 border border-white/5 rounded-xl overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white/5 text-gray-400 uppercase font-bold text-xs">
                                        <tr>
                                            <th className="p-4">Timestamp</th>
                                            <th className="p-4">User</th>
                                            <th className="p-4">Module</th>
                                            <th className="p-4">Action</th>
                                            <th className="p-4">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {systemLogs.length === 0 ? (
                                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">No system logs found.</td></tr>
                                        ) : (
                                            systemLogs.slice(0, 50).map((log) => (
                                                <tr key={log.id} className="hover:bg-white/5">
                                                    <td className="p-4 text-xs text-gray-400">{log.timestamp}</td>
                                                    <td className="p-4 text-white font-bold">{log.user}</td>
                                                    <td className="p-4">
                                                        <span className="text-[10px] uppercase bg-white/5 px-2 py-1 rounded border border-white/10">{log.module}</span>
                                                    </td>
                                                    <td className="p-4 text-cyber-primary">{log.action}</td>
                                                    <td className="p-4 text-gray-400 truncate max-w-xs">{log.details}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* --- TAX RULES --- */}
                    {activeTab === 'tax' && (
                        <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-right-4">
                            <SectionHeader title="Tax Rules Engine" desc="Configure granular tax rates per category." />

                            <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-white/5 text-xs text-gray-400 uppercase font-bold">
                                        <tr>
                                            <th className="p-4">Category</th>
                                            <th className="p-4">Region</th>
                                            <th className="p-4 text-right">Tax Rate (%)</th>
                                            <th className="p-4 w-16"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {taxRules.map(rule => (
                                            <tr key={rule.id} className="group hover:bg-white/5">
                                                <td className="p-4 text-sm font-bold text-white">{rule.category}</td>
                                                <td className="p-4 text-sm text-gray-400">{rule.region}</td>
                                                <td className="p-4 text-right font-mono text-cyber-primary">{rule.rate}%</td>
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={() => {
                                                            setDeleteTaxRuleConfirm({ open: true, rule });
                                                        }}
                                                        className="text-gray-600 group-hover:text-red-400 transition-colors"
                                                        title="Delete tax rule"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="p-4 border-t border-white/5 bg-white/5">
                                    <button
                                        onClick={() => {
                                            setTaxCategoryPrompt(true);
                                        }}
                                        className="px-4 py-2 bg-cyber-primary text-black font-bold rounded-lg hover:bg-cyber-accent transition-colors flex items-center gap-2"
                                    >
                                        <Plus size={16} /> Add Tax Rule
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- NOTIFICATIONS --- */}
                    {activeTab === 'notifications' && (
                        <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-right-4">
                            <SectionHeader title="Communication Center" desc="Manage automated alerts and customer messaging." />

                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className={`p-4 rounded-xl border text-center cursor-pointer transition-all ${notifications.emailOrder ? 'bg-cyber-primary/10 border-cyber-primary text-cyber-primary' : 'bg-black/20 border-white/10 text-gray-500'}`} onClick={() => setNotifications({ ...notifications, emailOrder: !notifications.emailOrder })}>
                                    <Mail className="mx-auto mb-2" />
                                    <p className="text-xs font-bold">Email Receipts</p>
                                </div>
                                <div className={`p-4 rounded-xl border text-center cursor-pointer transition-all ${notifications.smsLowStock ? 'bg-cyber-primary/10 border-cyber-primary text-cyber-primary' : 'bg-black/20 border-white/10 text-gray-500'}`} onClick={() => setNotifications({ ...notifications, smsLowStock: !notifications.smsLowStock })}>
                                    <MessageSquare className="mx-auto mb-2" />
                                    <p className="text-xs font-bold">SMS Alerts</p>
                                </div>
                                <div className={`p-4 rounded-xl border text-center cursor-pointer transition-all ${notifications.pushAuth ? 'bg-cyber-primary/10 border-cyber-primary text-cyber-primary' : 'bg-black/20 border-white/10 text-gray-500'}`} onClick={() => setNotifications({ ...notifications, pushAuth: !notifications.pushAuth })}>
                                    <Bell className="mx-auto mb-2" />
                                    <p className="text-xs font-bold">Push Auth</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-gray-300 font-bold block mb-2">Receipt Email Template</label>
                                <textarea
                                    className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-sm text-white font-mono h-32 outline-none focus:border-cyber-primary/50"
                                    value={notifications.emailTemplate}
                                    aria-label="Receipt Email Template"
                                    onChange={(e) => setNotifications({ ...notifications, emailTemplate: e.target.value })}
                                />
                                <p className="text-[10px] text-gray-500 mt-2">Variables: {`{Customer}, {OrderId}, {Amount}, {Date}`}</p>
                            </div>
                        </div>
                    )}

                    {/* --- WMS RULES --- */}
                    {activeTab === 'inventory' && (
                        <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-right-4">
                            <SectionHeader title="Warehouse Rules Engine" desc="Define operational logic, rotation policies, and picking strategies." />

                            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-6">
                                <h4 className="text-blue-400 font-bold text-sm flex items-center gap-2">
                                    <Shield size={16} /> Role Policy Active
                                </h4>
                                <p className="text-xs text-gray-400 mt-1">
                                    These settings are enforced globally. Warehouse Admins (WMS) cannot override these rules without Super Admin approval.
                                </p>
                            </div>

                            <ToggleGroup
                                label="Enforce FEFO Rotation"
                                sub="Strictly direct pickers to oldest expiry batch first"
                                checked={settings.fefoRotation}
                                onChange={() => updateSettings({ fefoRotation: !settings.fefoRotation }, user?.name || 'Admin')}
                            />

                            <ToggleGroup
                                label="Mandatory Bin Scanning"
                                sub="Require barcode verification at bin location"
                                checked={settings.binScan}
                                onChange={() => updateSettings({ binScan: !settings.binScan }, user?.name || 'Admin')}
                                warning="Disabling this increases pick errors"
                            />

                            <InputGroup
                                label="Global Low Stock Threshold"
                                type="number"
                                value={settings.lowStockThreshold}
                                onChange={(e: any) => updateSettings({ lowStockThreshold: parseInt(e.target.value) }, user?.name || 'Admin')}
                                sub="Trigger reorder alerts"
                            />

                            <InputGroup
                                label="Reserve Stock Buffer (%)"
                                type="number"
                                value={settings.reserveStockBuffer || 5}
                                onChange={(e: any) => updateSettings({ reserveStockBuffer: parseInt(e.target.value) || 5 }, user?.name || 'Admin')}
                                sub="Safety stock hidden from available quantity"
                            />
                        </div>
                    )}

                    {/* --- HARDWARE --- */}
                    {activeTab === 'hardware' && (
                        <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-right-4">
                            <SectionHeader title="Peripheral Configuration" desc="Manage connected devices for POS and WMS." />

                            <div className="p-4 bg-white/5 rounded-xl border border-white/5 mb-6">
                                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                    <Printer size={16} className="text-cyber-primary" />
                                    Active Printers
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center bg-black/30 p-3 rounded-lg">
                                        <div>
                                            <p className="text-sm text-white font-mono">POS-PRINTER-01</p>
                                            <p className="text-[10px] text-green-400 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-400" /> Online • 192.168.1.20</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                addNotification('success', 'Test print sent to POS-PRINTER-01\nCheck printer for test receipt.');
                                            }}
                                            className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-white transition-colors"
                                        >
                                            Test Print
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <InputGroup
                                label="Scale IP Address"
                                value={settings.scaleIpAddress || ''}
                                onChange={(e: any) => updateSettings({ scaleIpAddress: e.target.value }, user?.name || 'Admin')}
                                placeholder="192.168.x.x"
                                sub="For automated weight capture"
                            />
                            <InputGroup
                                label="Scanner COM Port"
                                value={settings.scannerComPort || ''}
                                onChange={(e: any) => updateSettings({ scannerComPort: e.target.value }, user?.name || 'Admin')}
                                placeholder="COM3"
                                sub="Serial barcode scanner port"
                            />
                        </div>
                    )}

                    {/* --- DATA MANAGEMENT --- */}
                    {activeTab === 'data' && (
                        <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-right-4">
                            <SectionHeader title="Data Operations" desc="Backup, Restore, and Reset." />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                    <h4 className="text-white font-bold flex items-center gap-2 mb-2"><Download size={18} className="text-cyber-primary" /> Backup System</h4>
                                    <p className="text-xs text-gray-400 mb-4">Export full database snapshot (JSON).</p>
                                    <button onClick={handleBackup} className="w-full py-2 bg-cyber-primary/10 text-cyber-primary font-bold rounded-lg border border-cyber-primary/20 hover:bg-cyber-primary/20 transition-colors">
                                        Download Backup
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 border border-yellow-500/30 bg-yellow-500/5 rounded-xl mb-4">
                                <h4 className="text-yellow-400 font-bold flex items-center gap-2 mb-2"><Database size={18} /> Data Cleanup</h4>
                                <p className="text-xs text-gray-400 mb-4">Remove invalid or misplaced data from the system.</p>
                                <button
                                    onClick={async () => {
                                        if (window.confirm('Remove all products from Administration site?\n\nAdministration is administrative only and should not hold inventory.\n\nThis will delete all products with siteId = Administration.')) {
                                            await cleanupAdminProducts();
                                        }
                                    }}
                                    className="px-4 py-2 bg-yellow-500/20 text-yellow-400 font-bold rounded-lg hover:bg-yellow-500/30 transition-colors text-sm border border-yellow-500/30 flex items-center gap-2"
                                >
                                    <Trash2 size={16} /> Cleanup Admin Products
                                </button>
                                <p className="text-xs text-gray-500 mt-2">
                                    💡 Tip: You can also use <kbd className="px-1.5 py-0.5 bg-black/40 rounded text-yellow-400 font-mono text-xs">Ctrl+Shift+H</kbd> keyboard shortcut
                                </p>
                            </div>

                            <div className="p-4 border border-red-500/30 bg-red-500/5 rounded-xl">
                                <h4 className="text-red-400 font-bold flex items-center gap-2 mb-2"><AlertTriangle size={18} /> Danger Zone</h4>
                                <p className="text-xs text-gray-400 mb-4">Irreversible actions affecting all users.</p>
                                <button
                                    onClick={handleFactoryReset}
                                    className="px-4 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors text-sm"
                                >
                                    Factory Reset System
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* LOCATION MODAL - Professional & Context-Aware */}
            <Modal isOpen={isSiteModalOpen} onClose={() => setIsSiteModalOpen(false)} title={newSite.id ? "Edit Location" : "Add New Location"} size="lg">
                <div className="space-y-6">
                    {/* Step 1: Location Type Selection */}
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold mb-3 block">Select Location Type</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {[
                                { type: 'Administration', label: 'Administration', desc: 'Central Operations', icon: Building, color: 'purple' },
                                { type: 'Warehouse', label: 'Warehouse', desc: 'Storage & Fulfillment', icon: Box, color: 'blue' },
                                { type: 'Distribution Center', label: 'Distribution', desc: 'Regional Hub', icon: Truck, color: 'cyan' },
                                { type: 'Store', label: 'Retail Store', desc: 'Customer-facing', icon: Store, color: 'green' },
                                { type: 'Dark Store', label: 'Dark Store', desc: 'Online Fulfillment', icon: ShoppingCart, color: 'orange' },
                            ].map(({ type, label, desc, icon: Icon, color }) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setNewSite({ ...newSite, type: type as SiteType, manager: type === 'Administration' ? undefined : newSite.manager })}
                                    className={`p-4 rounded-xl border-2 transition-all text-left ${newSite.type === type
                                        ? `border-${color}-500 bg-${color}-500/10`
                                        : 'border-white/10 bg-black/20 hover:border-white/30'
                                        }`}
                                >
                                    <Icon size={24} className={`mb-2 ${newSite.type === type ? `text-${color}-400` : 'text-gray-500'}`} />
                                    <p className={`font-bold text-sm ${newSite.type === type ? 'text-white' : 'text-gray-300'}`}>{label}</p>
                                    <p className="text-[10px] text-gray-500">{desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-white/5 pt-6">
                        {/* Step 2: Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">
                                    {newSite.type === 'Administration' ? 'Office Name' : 'Location Name'} *
                                </label>
                                <input
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-cyber-primary transition-colors"
                                    placeholder={
                                        newSite.type === 'Administration' ? 'e.g. Central Administration' :
                                            newSite.type === 'Warehouse' ? 'e.g. Addis Ababa Central Warehouse' :
                                                newSite.type === 'Distribution Center' ? 'e.g. East Africa Distribution Hub' :
                                                    'e.g. Bole Road Branch'
                                    }
                                    value={newSite.name || ''}
                                    onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                                    aria-label="Location Name"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">
                                    {newSite.type === 'Administration' ? 'Office Address' : 'Physical Address'} *
                                </label>
                                <input
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-cyber-primary transition-colors"
                                    placeholder="Full street address..."
                                    value={newSite.address || ''}
                                    onChange={(e) => setNewSite({ ...newSite, address: e.target.value })}
                                    aria-label="Location Address"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Status</label>
                                <select
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-cyber-primary transition-colors"
                                    value={newSite.status || 'Active'}
                                    onChange={(e) => setNewSite({ ...newSite, status: e.target.value as any })}
                                    aria-label="Location Status"
                                >
                                    <option value="Active">🟢 Active</option>
                                    <option value="Maintenance">🟡 Under Maintenance</option>
                                    <option value="Closed">🔴 Closed</option>
                                </select>
                            </div>

                            {/* Context-Aware Fields based on Site Type */}
                            {newSite.type === 'Administration' ? (
                                <>
                                    {/* Administration-specific: Staff Capacity instead of Manager */}
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Staff Capacity</label>
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder="e.g. 50 employees"
                                            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-cyber-primary transition-colors"
                                            value={newSite.capacity || ''}
                                            onChange={(e) => setNewSite({ ...newSite, capacity: e.target.value === '' ? undefined : parseInt(e.target.value) })}
                                            aria-label="Staff Capacity"
                                        />
                                    </div>
                                </>
                            ) : newSite.type === 'Warehouse' || newSite.type === 'Distribution Center' ? (
                                <>
                                    {/* Warehouse/DC-specific fields */}
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Warehouse Manager</label>
                                        <input
                                            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-cyber-primary transition-colors"
                                            placeholder="Manager name..."
                                            value={newSite.manager || ''}
                                            onChange={(e) => setNewSite({ ...newSite, manager: e.target.value })}
                                            aria-label="Warehouse Manager"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Storage Capacity (m²)</label>
                                        <input
                                            type="number"
                                            min="100"
                                            placeholder="e.g. 5000"
                                            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-cyber-primary transition-colors"
                                            value={newSite.capacity || ''}
                                            onChange={(e) => setNewSite({ ...newSite, capacity: e.target.value === '' ? undefined : parseInt(e.target.value) })}
                                            aria-label="Storage Capacity"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Loading Docks</label>
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="e.g. 4"
                                            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-cyber-primary transition-colors"
                                            value={newSite.terminalCount || ''}
                                            onChange={(e) => setNewSite({ ...newSite, terminalCount: e.target.value === '' ? undefined : parseInt(e.target.value) })}
                                            aria-label="Loading Docks"
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Store/Dark Store-specific fields */}
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Store Manager</label>
                                        <input
                                            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-cyber-primary transition-colors"
                                            placeholder="Manager name..."
                                            value={newSite.manager || ''}
                                            onChange={(e) => setNewSite({ ...newSite, manager: e.target.value })}
                                            aria-label="Store Manager"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">POS Terminals</label>
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder="e.g. 3"
                                            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-cyber-primary transition-colors"
                                            value={newSite.terminalCount || ''}
                                            onChange={(e) => setNewSite({ ...newSite, terminalCount: e.target.value === '' ? undefined : parseInt(e.target.value) })}
                                            aria-label="POS Terminals"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Type-specific info banner */}
                    <div className={`p-4 rounded-xl border ${newSite.type === 'Administration' ? 'bg-purple-500/10 border-purple-500/20' :
                        newSite.type === 'Warehouse' || newSite.type === 'Distribution Center' ? 'bg-blue-500/10 border-blue-500/20' :
                            'bg-green-500/10 border-green-500/20'
                        }`}>
                        <p className="text-xs text-gray-400">
                            {newSite.type === 'Administration' ? (
                                <>💼 <span className="text-purple-400 font-bold">Administrative locations</span> are central offices for management, HR, Finance, and other non-operational departments.</>
                            ) : newSite.type === 'Warehouse' || newSite.type === 'Distribution Center' ? (
                                <>📦 <span className="text-blue-400 font-bold">{newSite.type}s</span> are inventory storage facilities that handle receiving, putaway, and fulfillment operations.</>
                            ) : newSite.type === 'Dark Store' ? (
                                <>🌙 <span className="text-orange-400 font-bold">Dark Stores</span> are fulfillment-only locations for online orders. No walk-in customers.</>
                            ) : (
                                <>🏪 <span className="text-green-400 font-bold">Retail Stores</span> are customer-facing locations with point-of-sale terminals.</>
                            )}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsSiteModalOpen(false)}
                            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                console.log('🖱️ Save button clicked!');
                                handleSaveSite();
                            }}
                            disabled={isSavingSite || !newSite.name || !newSite.type}
                            className="flex-1 py-3 bg-cyber-primary text-black font-bold rounded-xl hover:bg-cyber-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSavingSite ? (
                                <>
                                    <RefreshCw className="animate-spin" size={18} />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    {newSite.id ? 'Update Location' : 'Create Location'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* DELETE CONFIRMATION MODAL */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="⚠️ Delete Location">
                <div className="space-y-4">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                        <h4 className="text-red-400 font-bold mb-2 flex items-center gap-2">
                            <AlertTriangle size={20} />
                            Permanent Deletion Warning
                        </h4>
                        <p className="text-sm text-gray-300 mb-3">
                            You are about to permanently delete <span className="font-bold text-white">"{siteToDelete?.name}"</span>
                        </p>
                        <div className="text-xs text-gray-400 space-y-1">
                            <p>• All products at this location will be deleted</p>
                            <p>• All employees assigned here will be unassigned</p>
                            <p>• All sales and inventory records will be affected</p>
                            <p className="text-red-400 font-bold mt-2">⚠️ This action cannot be undone!</p>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm text-gray-300 font-bold mb-2 block">
                            To confirm, type <span className="font-mono font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded">DELETE</span> below:
                        </label>
                        <input
                            type="text"
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-red-500 font-mono"
                            placeholder="Type DELETE to confirm"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') confirmDeleteSite();
                            }}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white font-bold transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDeleteSite}
                            disabled={deleteConfirmText !== siteToDelete?.name}
                            className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Trash2 size={18} />
                            Delete Permanently
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Factory Reset Confirmation */}
            <ConfirmationModal
                isOpen={resetConfirmOpen}
                onClose={() => setResetConfirmOpen(false)}
                onConfirm={confirmFactoryReset}
                title="Factory Reset"
                message="DANGER: This will erase all data and reset the system to defaults. This action is irreversible. Are you sure?"
                confirmText="Reset System"
                cancelText="Cancel"
                variant="danger"
            />

            {/* Delete API Key Confirmation */}
            <ConfirmationModal
                isOpen={deleteApiKeyConfirm.open}
                onClose={() => setDeleteApiKeyConfirm({ open: false, key: null })}
                onConfirm={() => {
                    if (deleteApiKeyConfirm.key) {
                        setApiKeys(apiKeys.filter(k => k.id !== deleteApiKeyConfirm.key!.id));
                        addNotification('success', `API key "${deleteApiKeyConfirm.key.name}" deleted`);
                    }
                }}
                title="Delete API Key"
                message={`Are you sure you want to delete API key "${deleteApiKeyConfirm.key?.name}"?`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />

            {/* API Key Name Prompt */}
            <PromptModal
                isOpen={apiKeyNamePrompt}
                onClose={() => setApiKeyNamePrompt(false)}
                onConfirm={(name) => {
                    if (name) {
                        const newKey = {
                            id: Date.now(),
                            name: name,
                            key: `sk_live_${Math.random().toString(36).substring(2, 18)}`,
                            created: new Date().toISOString().split('T')[0]
                        };
                        setApiKeys([...apiKeys, newKey]);
                        addNotification('success', `API key "${name}" generated successfully`);
                    }
                }}
                title="Add API Key"
                message="Enter a name for this API key:"
                placeholder="e.g. External Storefront"
                confirmText="Generate"
                cancelText="Cancel"
                required
            />

            {/* Delete Tax Rule Confirmation */}
            <ConfirmationModal
                isOpen={deleteTaxRuleConfirm.open}
                onClose={() => setDeleteTaxRuleConfirm({ open: false, rule: null })}
                onConfirm={() => {
                    if (deleteTaxRuleConfirm.rule) {
                        setTaxRules(taxRules.filter(r => r.id !== deleteTaxRuleConfirm.rule!.id));
                        addNotification('success', `Tax rule for ${deleteTaxRuleConfirm.rule.category} deleted`);
                    }
                }}
                title="Delete Tax Rule"
                message={`Are you sure you want to delete the tax rule for ${deleteTaxRuleConfirm.rule?.category}?`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />

            {/* Tax Category Prompt */}
            <PromptModal
                isOpen={taxCategoryPrompt}
                onClose={() => {
                    setTaxCategoryPrompt(false);
                    setPendingTaxCategory('');
                }}
                onConfirm={(category) => {
                    if (category) {
                        setPendingTaxCategory(category);
                        setTaxCategoryPrompt(false);
                        setTaxRatePrompt(true);
                    }
                }}
                title="Add Tax Rule"
                message="Enter category name:"
                placeholder="e.g. Electronics"
                confirmText="Next"
                cancelText="Cancel"
                required
            />

            {/* Tax Rate Prompt */}
            <PromptModal
                isOpen={taxRatePrompt}
                onClose={() => {
                    setTaxRatePrompt(false);
                    setPendingTaxCategory('');
                }}
                onConfirm={(rate) => {
                    if (rate && !isNaN(parseFloat(rate))) {
                        const newRule = {
                            id: Date.now(),
                            category: pendingTaxCategory,
                            rate: parseFloat(rate),
                            region: 'All'
                        };
                        setTaxRules([...taxRules, newRule]);
                        addNotification('success', `Tax rule added: ${pendingTaxCategory} at ${rate}%`);
                        setPendingTaxCategory('');
                    } else {
                        addNotification('alert', 'Invalid tax rate. Please enter a number.');
                    }
                }}
                title="Add Tax Rule"
                message={`Enter tax rate (%) for ${pendingTaxCategory}:`}
                placeholder="e.g. 15"
                type="number"
                confirmText="Add Rule"
                cancelText="Cancel"
                required
            />
        </div>
    );
}
