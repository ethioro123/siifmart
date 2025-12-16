
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

import { sitesService } from '../services/supabase.service';
import GeneralSettings from '../components/settings/GeneralSettings';
import WMSSettings from '../components/settings/WMSSettings';
import POSSettings from '../components/settings/POSSettings';
import FinanceSettings from '../components/settings/FinanceSettings';
import TaxSettings from '../components/settings/TaxSettings';
import InfrastructureSettings from '../components/settings/InfrastructureSettings';
import IntegrationsSettings from '../components/settings/IntegrationsSettings';
import SecuritySettings from '../components/settings/SecuritySettings';
import NotificationSettings from '../components/settings/NotificationSettings';
import AuditSettings from '../components/settings/AuditSettings';
import DataSettings from '../components/settings/DataSettings';
import RoleSettings from '../components/settings/RoleSettings';

type SettingsTab = 'general' | 'inventory' | 'pos' | 'finance' | 'roles' | 'locations' | 'infrastructure' | 'integrations' | 'security' | 'notifications' | 'tax' | 'data' | 'audit';

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
                aria-checked={checked ? 'true' : 'false'}
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



    // Site Modal State
    const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
    const [newSite, setNewSite] = useState<Partial<Site>>({});
    const [isSavingSite, setIsSavingSite] = useState(false);

    // Delete Confirmation State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [siteToDelete, setSiteToDelete] = useState<Site | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    // Confirmation Modals



    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            addNotification('success', "System Configuration Updated Successfully.\nOperational rules have been applied globally.");
        }, 1000);
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
                    code: newSite.code || newSite.name?.substring(0, 3).toUpperCase() || 'UNK' // Use existing code if available
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
                    code: 'GENERATED_BY_DB' // Placeholder, will be overwritten by sitesService
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
                        <TabButton id="infrastructure" icon={Printer} label="Infrastructure" />
                    </Protected>

                    {user?.role === 'super_admin' && (
                        <>
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
                        </>
                    )}
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
                    {activeTab === 'general' && <GeneralSettings />}

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
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="text-white font-bold text-lg leading-tight pr-2">{site.name}</h4>
                                                    <span className="font-mono text-[10px] font-bold px-2 py-1 rounded bg-black/40 border border-white/10 backdrop-blur-md tracking-widest text-cyber-primary shadow-[0_0_10px_rgba(0,255,157,0.15)] group-hover:shadow-[0_0_15px_rgba(0,255,157,0.3)] group-hover:border-cyber-primary/40 transition-all shrink-0">
                                                        {site.code || 'N/A'}
                                                    </span>
                                                </div>
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
                    {/* --- POS SETTINGS --- */}
                    {activeTab === 'pos' && <POSSettings />}

                    {/* --- FINANCE SETTINGS --- */}
                    {activeTab === 'finance' && <FinanceSettings />}

                    {/* --- ROLES --- */}
                    {activeTab === 'roles' && <RoleSettings />}

                    {activeTab === 'integrations' && <IntegrationsSettings />}

                    {/* --- SECURITY --- */}
                    {activeTab === 'security' && <SecuritySettings />}

                    {/* --- AUDIT LOG --- */}
                    {activeTab === 'audit' && <AuditSettings />}

                    {/* --- TAX RULES --- */}
                    {activeTab === 'tax' && <TaxSettings />}

                    {/* --- NOTIFICATIONS --- */}
                    {activeTab === 'notifications' && <NotificationSettings />}

                    {/* --- WMS RULES --- */}
                    {/* --- WMS RULES --- */}
                    {activeTab === 'inventory' && <WMSSettings />}

                    {/* --- INFRASTRUCTURE (Formerly Hardware) --- */}
                    {activeTab === 'infrastructure' && <InfrastructureSettings />}

                    {/* --- DATA MANAGEMENT --- */}
                    {activeTab === 'data' && <DataSettings />}
                </div >
            </div >

            {/* LOCATION MODAL - Professional & Context-Aware */}
            < Modal isOpen={isSiteModalOpen} onClose={() => setIsSiteModalOpen(false)
            } title={newSite.id ? "Edit Location" : "Add New Location"} size="lg" >
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
                                        <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Site Code (ID)</label>
                                        <input
                                            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-cyber-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                                            placeholder="Auto-generated (e.g. ADD)"
                                            value={newSite.code || ''}
                                            onChange={(e) => {
                                                // Only allow editing if it's a new site (no ID yet)
                                                if (!newSite.id) {
                                                    setNewSite({ ...newSite, code: e.target.value.toUpperCase().substring(0, 6) })
                                                }
                                            }}
                                            disabled={!!newSite.id} // Immutable once created
                                            aria-label="Site Code"
                                        />
                                        {newSite.id && <p className="text-[10px] text-yellow-500 mt-1 flex items-center gap-1"><Lock size={10} /> Immutable Identifier</p>}
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
                                        <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Site Code (ID)</label>
                                        <input
                                            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-cyber-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                                            placeholder="Auto-generated (e.g. RET)"
                                            value={newSite.code || ''}
                                            onChange={(e) => {
                                                // Only allow editing if it's a new site (no ID yet)
                                                if (!newSite.id) {
                                                    setNewSite({ ...newSite, code: e.target.value.toUpperCase().substring(0, 6) })
                                                }
                                            }}
                                            disabled={!!newSite.id} // Immutable once created
                                            aria-label="Site Code"
                                        />
                                        {newSite.id && <p className="text-[10px] text-yellow-500 mt-1 flex items-center gap-1"><Lock size={10} /> Immutable Identifier</p>}
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
            </Modal >

            {/* DELETE CONFIRMATION MODAL */}
            < Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="⚠️ Delete Location" >
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
            </Modal >


        </div >
    );
}
