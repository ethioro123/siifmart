
import React, { useState, useEffect, useRef } from 'react';
import {
    Save, Globe, ShoppingCart, Box, Shield, Bell, Server,
    Database, Cpu, Wifi, Printer, Key, Download, Upload,
    Trash2, RefreshCw, Activity, CheckCircle, AlertTriangle,
    Smartphone, Terminal, HardDrive, CloudLightning, Lock, CreditCard,
    FileText, Percent, Tag, Banknote, Keyboard, Link, Plug, Mail, MessageSquare,
    Eye, EyeOff, List, Plus, Code, Briefcase, Users, DollarSign, MapPin, Building, Store, Sparkles, Truck, Loader2, Trophy,
    FileDown, ChevronDown
} from 'lucide-react';
import { encodeLocation, extractSitePrefix } from '../utils/locationEncoder';
import { CURRENCY_SYMBOL } from '../constants';
import Logo from '../components/Logo';
import { useData } from '../contexts/DataContext';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import PromptModal from '../components/PromptModal';
import { Site, SiteType } from '../types';
import { useStore } from '../contexts/CentralStore';
import { Protected } from '../components/Protected';

import { sitesService, logisticsZonesService } from '../services/supabase.service';
import GeneralSettings from '../components/settings/GeneralSettings';
import WMSSettings from '../components/settings/WMSSettings';
import POSSettings from '../components/settings/POSSettings';
import FinanceSettings from '../components/settings/FinanceSettings';
import InfrastructureSettings from '../components/settings/InfrastructureSettings';
import IntegrationsSettings from '../components/settings/IntegrationsSettings';
import SecuritySettings from '../components/settings/SecuritySettings';
import NotificationSettings from '../components/settings/NotificationSettings';
import AuditSettings from '../components/settings/AuditSettings';
import DataSettings from '../components/settings/DataSettings';
import RoleSettings from '../components/settings/RoleSettings';
import GamificationSettings from '../components/settings/GamificationSettings';
import DiscountCodesSettings from '../components/settings/DiscountCodesSettings';

type SettingsTab = 'general' | 'inventory' | 'pos' | 'discounts' | 'finance' | 'roles' | 'locations' | 'infrastructure' | 'integrations' | 'security' | 'notifications' | 'data' | 'audit' | 'gamification';

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

interface ToggleGroupProps {
    label: string;
    sub?: string;
    checked?: boolean;
    onChange: () => void;
    warning?: string;
}

const ToggleGroup = ({ label, sub, checked = false, onChange, warning }: ToggleGroupProps) => (
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
                aria-checked={checked ? true : false}
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
    const { settings, updateSettings, resetData, sites, addSite, updateSite, deleteSite, systemLogs, exportSystemData, addNotification, cleanupAdminProducts, addProduct, refreshData } = useData();
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [isSaving, setIsSaving] = useState(false);
    const [isNavOpen, setIsNavOpen] = useState(false);



    // Site Modal State
    const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
    const [newSite, setNewSite] = useState<Partial<Site>>({});
    const [isSavingSite, setIsSavingSite] = useState(false);
    const [expandedSiteId, setExpandedSiteId] = useState<string | null>(null);
    const [locationViewMode, setLocationViewMode] = useState<'category' | 'zone'>('category');

    // Independent Logistics Zones State
    const [logisticsZones, setLogisticsZones] = useState<any[]>([]);
    const [isLoadingZones, setIsLoadingZones] = useState(false);
    const [isZoneManagerOpen, setIsZoneManagerOpen] = useState(false);
    const [isZoneSaving, setIsZoneSaving] = useState(false);

    // Zone Form / Editing state
    const [editingZone, setEditingZone] = useState<any | null>(null);
    const [zoneNameInput, setZoneNameInput] = useState('');
    const [zoneDescInput, setZoneDescInput] = useState('');

    // Test Location State for Barcode Preview
    const [testLocation, setTestLocation] = useState({
        zone: 'A',
        aisle: '01',
        bay: '01'
    });

    // Delete Confirmation State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [siteToDelete, setSiteToDelete] = useState<Site | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    // Confirmation Modals

    const [isGenerating, setIsGenerating] = useState(false);

    const fetchZones = async () => {
        setIsLoadingZones(true);
        try {
            const data = await logisticsZonesService.getAll();
            setLogisticsZones(data);
        } catch (error) {
            console.error('Failed to load logistics zones:', error);
        } finally {
            setIsLoadingZones(false);
        }
    };

    useEffect(() => {
        fetchZones();
    }, []);

    const generateBarcodes = async (site: Partial<Site> & { barcodePrefix?: string }) => {
        // Use centralized utility for site prefix
        const usePrefix = site.barcodePrefix || extractSitePrefix(site.code);

        if (!site.id && !site.code) {
            // Fallback for testing/unsaved sites
            addNotification('alert', 'Please ensure the site has a valid code to generate a barcode prefix.');
            return;
        }

        // Defaults: 10 Zones (A-J), 20 Aisles, 20 Bays
        const zoneCount = site.zoneCount || 10;
        const aisleCount = site.aisleCount || 20;
        const bayCount = site.bayCount || 20;

        setIsGenerating(true);
        try {
            // Generate Rows
            const rows = [['Location Label', 'Barcode', 'Zone', 'Aisle', 'Bay', 'Site Prefix', 'Site Name']];
            const zones = Array.from({ length: zoneCount }, (_, i) => String.fromCharCode(65 + i)); // A, B, C...

            zones.forEach(zone => {
                for (let a = 1; a <= aisleCount; a++) {
                    for (let b = 1; b <= bayCount; b++) {
                        const aisleStr = a.toString().padStart(2, '0');
                        const bayStr = b.toString().padStart(2, '0');
                        const label = `${zone}-${aisleStr}-${bayStr}`;

                        // Generate 15-digit barcode (encodeLocation handles 15-digit logic)
                        const barcode = encodeLocation(label, usePrefix);

                        if (barcode) {
                            rows.push([label, barcode, zone, aisleStr, bayStr, usePrefix, site.name || 'Unknown']);
                        }
                    }
                }
            });

            // Convert to CSV
            const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `barcodes_${(site.name || 'site').replace(/\s+/g, '_')}_${usePrefix}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            addNotification('success', `Generated ${rows.length - 1} barcodes for ${site.name}`);
        } catch (error) {
            console.error('Barcode generation failed:', error);
            addNotification('alert', 'Failed to generate barcodes');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            addNotification('success', "System Configuration Updated Successfully.\nOperational rules have been applied globally.");
        }, 1000);
    };





    const handleSaveSite = async () => {

        if (!newSite.name || !newSite.type) {
            addNotification('alert', "Name and Type are required");
            return;
        }

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
                    zoneCount: newSite.zoneCount,
                    aisleCount: newSite.aisleCount,
                    bayCount: newSite.bayCount,
                    code: newSite.code || newSite.name?.substring(0, 3).toUpperCase() || 'UNK',
                    replenishmentSourceIds: newSite.replenishmentSourceIds ?? [],
                    replenishmentSourceId: (newSite.replenishmentSourceIds ?? [])[0],
                    logisticsZoneId: newSite.logisticsZoneId || undefined
                };
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
                    zoneCount: newSite.zoneCount,
                    aisleCount: newSite.aisleCount,
                    bayCount: newSite.bayCount,
                    code: 'GENERATED_BY_DB',
                    replenishmentSourceIds: newSite.replenishmentSourceIds ?? [],
                    replenishmentSourceId: (newSite.replenishmentSourceIds ?? [])[0],
                    logisticsZoneId: newSite.logisticsZoneId || undefined
                };
                await addSite(siteData as Site, user?.name || 'Admin');
            }
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

    const confirmDeleteSite = async () => {
        if (!siteToDelete) return;

        if (deleteConfirmText !== "DELETE") {
            addNotification('alert', 'Please type "DELETE" to confirm.');
            return;
        }

        setIsDeleting(true);
        try {
            await deleteSite(siteToDelete.id, user?.name || 'Admin');
            addNotification('success', `Location "${siteToDelete.name}" has been deleted`);
            setIsDeleteModalOpen(false);
            setSiteToDelete(null);
            setDeleteConfirmText('');
        } catch (error) {
            console.error('Error deleting site:', error);
            addNotification('alert', 'Failed to delete location');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSaveZone = async () => {
        if (!zoneNameInput.trim()) {
            addNotification('alert', 'Zone name is required');
            return;
        }
        setIsZoneSaving(true);
        try {
            if (editingZone) {
                await logisticsZonesService.update(editingZone.id, {
                    name: zoneNameInput.trim(),
                    description: zoneDescInput.trim()
                });
                addNotification('success', 'Logistics Zone updated successfully');
            } else {
                await logisticsZonesService.create({
                    name: zoneNameInput.trim(),
                    description: zoneDescInput.trim()
                });
                addNotification('success', 'Logistics Zone created successfully');
            }
            setZoneNameInput('');
            setZoneDescInput('');
            setEditingZone(null);
            fetchZones();
            refreshData();
        } catch (error: any) {
            addNotification('alert', `Failed to save Logistics Zone: ${error.message}`);
        } finally {
            setIsZoneSaving(false);
        }
    };

    const handleDeleteZone = async (id: string) => {
        if (!confirm('Are you sure you want to delete this Logistics Zone? Any locations in it will become unassigned.')) return;
        try {
            await logisticsZonesService.delete(id);
            addNotification('success', 'Logistics Zone deleted successfully');
            fetchZones();
            refreshData();
        } catch (error: any) {
            addNotification('alert', `Failed to delete Logistics Zone: ${error.message}`);
        }
    };

    const TabButton = ({ id, icon: Icon, label }: { id: SettingsTab, icon: any, label: string }) => (
        <button
            onClick={() => {
                setActiveTab(id);
                setIsNavOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium mb-2 ${activeTab === id
                ? 'bg-cyber-primary text-black shadow-[0_0_15px_rgba(0,255,157,0.3)] font-bold'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
        >
            <Icon size={18} />
            <span>{label}</span>
        </button>
    );

    const renderSiteCard = (site: Site) => {
        return (
            <div 
                key={site.id} 
                onClick={() => setExpandedSiteId(expandedSiteId === site.id ? null : site.id)}
                className={`bg-white/5 hover:bg-white/10 border ${
                    expandedSiteId === site.id ? 'border-cyber-primary/40 bg-cyber-primary/5' : 'border-white/5'
                } rounded-xl p-3 cursor-pointer transition-all duration-200 group`}
            >
                <div className="flex items-start justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                site.status === 'Active' ? 'bg-green-500' :
                                site.status === 'Maintenance' ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                            <h6 className="text-white font-bold text-xs leading-tight truncate group-hover:text-cyber-primary transition-colors" title={site.name}>
                                {site.name}
                            </h6>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 line-clamp-2" title={site.address}>
                            {site.address}
                        </p>
                    </div>
                    <ChevronDown
                        size={14}
                        className={`text-gray-500 shrink-0 transition-transform mt-0.5 ${
                            expandedSiteId === site.id ? 'rotate-180 text-cyber-primary' : ''
                        }`}
                    />
                </div>

                {/* Expanded details inside card */}
                {expandedSiteId === site.id && (
                    <div className="mt-2.5 pt-2.5 border-t border-white/5 space-y-2 text-[10px] text-gray-400" onClick={(e) => e.stopPropagation()}>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <span className="font-bold text-gray-500 block uppercase tracking-wider text-[8px]">Code</span>
                                <span className="font-mono text-cyber-primary font-bold">{site.code || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="font-bold text-gray-500 block uppercase tracking-wider text-[8px]">Status</span>
                                <span className={`font-semibold ${
                                    site.status === 'Active' ? 'text-green-400' :
                                    site.status === 'Maintenance' ? 'text-yellow-400' : 'text-red-400'
                                }`}>{site.status}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <span className="font-bold text-gray-500 block uppercase tracking-wider text-[8px]">Manager</span>
                                <span className="text-white font-medium truncate block font-bold" title={site.manager || 'Unassigned'}>
                                    {site.manager || 'Unassigned'}
                                </span>
                            </div>
                            <div>
                                <span className="font-bold text-gray-500 block uppercase tracking-wider text-[8px]">Logistics Zone</span>
                                <span className="text-yellow-400 font-medium truncate block font-bold" title={
                                    site.logisticsZoneId 
                                        ? (logisticsZones.find(z => z.id === site.logisticsZoneId)?.name || 'Unknown') 
                                        : 'Unassigned'
                                }>
                                    {site.logisticsZoneId 
                                        ? (logisticsZones.find(z => z.id === site.logisticsZoneId)?.name || 'Unknown') 
                                        : 'Unassigned'}
                                </span>
                            </div>
                        </div>
                        <div>
                            <span className="font-bold text-gray-500 block uppercase tracking-wider text-[8px]">
                                {site.type === 'Warehouse' || site.type === 'Distribution Center'
                                    ? 'Capacity'
                                    : site.type === 'Administration'
                                        ? 'Staff Limit'
                                        : 'Terminals'}
                            </span>
                            <span className="text-white font-semibold">
                                {site.type === 'Warehouse' || site.type === 'Distribution Center'
                                    ? `${site.capacity || 0} m²`
                                    : site.type === 'Administration'
                                        ? `${site.capacity || 0} staff`
                                        : `${site.terminalCount || 0} POS`}
                            </span>
                        </div>


                        {/* Action Buttons */}
                        <div className="flex gap-2 justify-end pt-2 border-t border-white/5">
                            <button
                                onClick={() => { setNewSite(site); setIsSiteModalOpen(true); }}
                                className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-[9px] font-bold transition-colors flex items-center gap-1"
                                title="Edit Location"
                            >
                                <Code size={10} className="text-cyber-primary" />
                                <span>Edit</span>
                            </button>
                            <button
                                onClick={() => handleDeleteSite(site.id)}
                                className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 text-[9px] font-bold transition-colors flex items-center gap-1"
                                title="Delete Location"
                                disabled={isDeleting}
                            >
                                <Trash2 size={10} />
                                <span>Delete</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-140px)]">
            {/* Sidebar Overlay */}
            {isNavOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[40] animate-in fade-in duration-300"
                    onClick={() => setIsNavOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 w-72 z-[50]
                transition-all duration-500 ease-out transform
                ${isNavOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="bg-cyber-gray border border-white/5 rounded-2xl p-4 h-full overflow-y-auto custom-scrollbar shadow-2xl">
                    <div className="flex items-center justify-between mb-6 px-2">
                        <p className="text-xs font-black text-cyber-primary uppercase tracking-widest">Configuration</p>
                        <button onClick={() => setIsNavOpen(false)} title="Close Menu" className="text-gray-500 hover:text-white">
                            <Plus className="rotate-45" size={24} />
                        </button>
                    </div>

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
                    <Protected permission="EDIT_OPERATIONAL_SETTINGS">
                        <TabButton id="discounts" icon={Tag} label="Discount Codes" />
                    </Protected>
                    <Protected permission="ACCESS_FINANCE">
                        <TabButton id="finance" icon={DollarSign} label="Finance" />
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
                            <Protected permission="MANAGE_WAREHOUSE">
                                <TabButton id="gamification" icon={Trophy} label="Gamification" />
                            </Protected>
                        </>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-cyber-gray border border-white/5 rounded-2xl flex flex-col relative overflow-hidden h-full">

                {/* Toolbar */}
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20 backdrop-blur-md z-10 sticky top-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsNavOpen(true)}
                            title="Open Configuration Menu"
                            className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                        >
                            <List size={20} />
                        </button>
                        <div className="text-xs text-gray-500">
                            Configuration / <span className="text-white capitalize">{activeTab}</span>
                        </div>
                    </div>
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
                                    <p className="text-gray-400">Only the CEO can manage locations.</p>
                                </div>
                            </div>
                        }>
                            <div className="w-full space-y-6 animate-in fade-in slide-in-from-right-4">
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
                                        <div className="flex items-center gap-2 mt-4 bg-white/5 p-1 rounded-xl w-fit border border-white/5">
                                            <button
                                                onClick={() => setLocationViewMode('category')}
                                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                    locationViewMode === 'category'
                                                        ? 'bg-cyber-primary text-black shadow-[0_0_10px_rgba(0,255,157,0.2)]'
                                                        : 'text-gray-400 hover:text-white'
                                                }`}
                                            >
                                                By Category
                                            </button>
                                            <button
                                                onClick={() => setLocationViewMode('zone')}
                                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                    locationViewMode === 'zone'
                                                        ? 'bg-cyber-primary text-black shadow-[0_0_10px_rgba(0,255,157,0.2)]'
                                                        : 'text-gray-400 hover:text-white'
                                                }`}
                                            >
                                                By Logistics Zone
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setIsZoneManagerOpen(true)}
                                            className="bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/30 px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all"
                                        >
                                            <Globe size={18} /> Manage Zones
                                        </button>
                                        <button
                                            onClick={() => { setNewSite({ type: 'Store', status: 'Active' }); setIsSiteModalOpen(true); }}
                                            className="bg-cyber-primary text-black px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-cyber-accent shadow-[0_0_15px_rgba(0,255,157,0.2)] transition-all"
                                        >
                                            <Plus size={18} /> Add Location
                                        </button>
                                    </div>
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
                                ) : locationViewMode === 'zone' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
                                        {/* Dynamic zones columns */}
                                        {logisticsZones.map(zone => {
                                            const zoneSites = sites.filter(s => s.logisticsZoneId === zone.id);
                                            return (
                                                <div key={zone.id} className="bg-black/15 border border-white/5 rounded-2xl p-4 flex flex-col gap-3 min-h-[300px] hover:border-white/10 transition-colors">
                                                    {/* Column Header */}
                                                    <div className="flex flex-col gap-1 border-b border-white/5 pb-2.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-yellow-500 shrink-0 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                                                            <h5 className="text-white font-bold text-xs uppercase tracking-wider truncate" title={zone.name}>{zone.name}</h5>
                                                            <span className="text-[9px] text-gray-400 bg-white/5 px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ml-auto">
                                                                {zoneSites.length}
                                                            </span>
                                                        </div>
                                                        {zone.description && (
                                                            <p className="text-[10px] text-gray-500 truncate" title={zone.description}>
                                                                {zone.description}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Column contents */}
                                                    {zoneSites.length === 0 ? (
                                                        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center opacity-40">
                                                            <MapPin size={16} className="text-gray-600 mb-1" />
                                                            <span className="text-[10px] text-gray-500 italic">No locations</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col gap-2.5 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                                                            {zoneSites.map(site => renderSiteCard(site))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {/* Unassigned / Free Zone column */}
                                        {(() => {
                                            const unassignedSites = sites.filter(s => !s.logisticsZoneId);
                                            return (
                                                <div key="unassigned" className="bg-black/15 border border-white/5 rounded-2xl p-4 flex flex-col gap-3 min-h-[300px] hover:border-white/10 transition-colors">
                                                    {/* Column Header */}
                                                    <div className="flex flex-col gap-1 border-b border-white/5 pb-2.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-gray-500 shrink-0 shadow-[0_0_8px_rgba(156,163,175,0.5)]" />
                                                            <h5 className="text-white font-bold text-xs uppercase tracking-wider truncate">Unassigned / Free Zone</h5>
                                                            <span className="text-[9px] text-gray-400 bg-white/5 px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ml-auto">
                                                                {unassignedSites.length}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 truncate">
                                                            Locations with no zoning restrictions
                                                        </p>
                                                    </div>

                                                    {/* Column contents */}
                                                    {unassignedSites.length === 0 ? (
                                                        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center opacity-40">
                                                            <MapPin size={16} className="text-gray-600 mb-1" />
                                                            <span className="text-[10px] text-gray-500 italic">No locations</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col gap-2.5 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                                                            {unassignedSites.map(site => renderSiteCard(site))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
                                        {[
                                            {
                                                types: ['Administration', 'Administrative', 'Central Operations', 'HQ', 'Headquarters'],
                                                label: 'Administration',
                                                desc: 'Central Operations',
                                                dotColor: 'bg-purple-500',
                                                shadowColor: 'rgba(168,85,247,0.5)',
                                                iconColor: 'bg-purple-500/20 text-purple-300'
                                            },
                                            {
                                                types: ['Warehouse'],
                                                label: 'Warehouse',
                                                desc: 'Storage & Fulfillment',
                                                dotColor: 'bg-blue-500',
                                                shadowColor: 'rgba(59,130,246,0.5)',
                                                iconColor: 'bg-blue-500/20 text-blue-400'
                                            },
                                            {
                                                types: ['Distribution Center'],
                                                label: 'Distribution Center',
                                                desc: 'Regional Hub',
                                                dotColor: 'bg-cyan-500',
                                                shadowColor: 'rgba(6,182,212,0.5)',
                                                iconColor: 'bg-cyan-500/20 text-cyan-400'
                                            },
                                            {
                                                types: ['Store'],
                                                label: 'Retail Store',
                                                desc: 'Customer-facing',
                                                dotColor: 'bg-green-500',
                                                shadowColor: 'rgba(34,197,94,0.5)',
                                                iconColor: 'bg-green-500/20 text-green-400'
                                            },
                                            {
                                                types: ['Dark Store'],
                                                label: 'Online Store',
                                                desc: 'Online Fulfillment',
                                                dotColor: 'bg-orange-500',
                                                shadowColor: 'rgba(249,115,22,0.5)',
                                                iconColor: 'bg-orange-500/20 text-orange-400'
                                            }
                                        ].map(cat => {
                                            const catSites = sites.filter(s => cat.types.includes(s.type));

                                            return (
                                                <div key={cat.label} className="bg-black/15 border border-white/5 rounded-2xl p-4 flex flex-col gap-3 min-h-[300px] hover:border-white/10 transition-colors">
                                                    {/* Column Header */}
                                                    <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                                                        <span 
                                                            className={`w-2 h-2 rounded-full ${cat.dotColor} shrink-0`} 
                                                            ref={(el) => { if (el) el.style.boxShadow = `0 0 8px ${cat.shadowColor}`; }}
                                                        />
                                                        <h5 className="text-white font-bold text-xs uppercase tracking-wider truncate" title={cat.label}>{cat.label}s</h5>
                                                        <span className="text-[9px] text-gray-400 bg-white/5 px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ml-auto">
                                                            {catSites.length}
                                                        </span>
                                                    </div>

                                                    {/* Column contents */}
                                                    {catSites.length === 0 ? (
                                                        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center opacity-40">
                                                            <MapPin size={16} className="text-gray-600 mb-1" />
                                                            <span className="text-[10px] text-gray-500 italic">No locations</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col gap-2.5 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                                                            {catSites.map(site => renderSiteCard(site))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </Protected>
                    )}

                    {/* --- POS SETTINGS --- */}
                    {/* --- POS SETTINGS --- */}
                    {activeTab === 'pos' && <POSSettings />}

                    {/* --- DISCOUNT CODES --- */}
                    {activeTab === 'discounts' && <DiscountCodesSettings />}

                    {/* --- FINANCE SETTINGS --- */}
                    {activeTab === 'finance' && <FinanceSettings />}

                    {/* --- ROLES --- */}
                    {activeTab === 'roles' && <RoleSettings />}

                    {activeTab === 'integrations' && <IntegrationsSettings />}

                    {/* --- SECURITY --- */}
                    {activeTab === 'security' && <SecuritySettings />}

                    {/* --- AUDIT LOG --- */}
                    {activeTab === 'audit' && <AuditSettings />}

                    {/* --- TAX RULES moved to Finance --- */}

                    {/* --- NOTIFICATIONS --- */}
                    {activeTab === 'notifications' && <NotificationSettings />}

                    {/* --- WMS RULES --- */}
                    {activeTab === 'inventory' && <WMSSettings />}

                    {/* --- INFRASTRUCTURE (Formerly Hardware) --- */}
                    {activeTab === 'infrastructure' && <InfrastructureSettings />}

                    {/* --- DATA MANAGEMENT --- */}
                    {activeTab === 'data' && <DataSettings />}

                    {/* --- GAMIFICATION & BONUS SETTINGS --- */}
                    {activeTab === 'gamification' && <GamificationSettings />}
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
                                { type: 'Dark Store', label: 'Online Store', desc: 'Online Fulfillment', icon: ShoppingCart, color: 'orange' },
                            ].map(({ type, label, desc, icon: Icon, color }) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => !newSite.id && setNewSite({ ...newSite, type: type as SiteType, manager: type === 'Administration' ? undefined : newSite.manager })}
                                    disabled={!!newSite.id}
                                    className={`p-4 rounded-xl border-2 transition-all text-left ${newSite.type === type
                                        ? `border-${color}-500 bg-${color}-500/10`
                                        : 'border-white/10 bg-black/20 hover:border-white/30'
                                        } ${!!newSite.id ? 'opacity-50 cursor-not-allowed' : ''}`}
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

                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Logistics Zone</label>
                                <select
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-cyber-primary transition-colors"
                                    value={newSite.logisticsZoneId || ''}
                                    onChange={(e) => setNewSite({ ...newSite, logisticsZoneId: e.target.value || undefined })}
                                    aria-label="Logistics Zone"
                                >
                                    <option value="">🌐 Unassigned / Free Zone</option>
                                    {logisticsZones.map(zone => (
                                        <option key={zone.id} value={zone.id}>
                                            📍 {zone.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[9px] text-gray-500 mt-1">
                                    Configure zones via the 'Manage Zones' button on the main Locations screen.
                                </p>
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
                                    {newSite.id && (
                                        <div>
                                            <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Site Code (ID)</label>
                                            <div className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-gray-400 font-mono text-sm">
                                                {newSite.code}
                                            </div>
                                            <p className="text-[10px] text-yellow-500 mt-1 flex items-center gap-1"><Lock size={10} /> Immutable Identifier</p>
                                        </div>
                                    )}
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

                                    {/* Warehouse Structure Inputs Removed as per request */}

                                    {/* Barcode Configuration Section */}
                                    <div className="md:col-span-2 pt-4 border-t border-white/5 mt-2">
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="text-xs text-cyber-primary uppercase font-bold block">Barcode Configuration</label>
                                            <div className="px-2 py-1 rounded bg-cyber-primary/10 border border-cyber-primary/20 text-[10px] text-cyber-primary font-mono">
                                                PROTOCOL: 15-DIGIT
                                            </div>
                                        </div>

                                        {/* Location Tester */}
                                        <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-4">
                                            <label className="text-[10px] text-cyber-primary uppercase font-bold mb-2 block flex items-center gap-2">
                                                <MapPin size={12} /> Test Location Barcode
                                            </label>
                                            <div className="flex gap-2 items-end">
                                                <div className="flex-1">
                                                    <label className="text-[9px] text-gray-500 uppercase font-bold mb-1 block">Zone</label>
                                                    <select
                                                        className="w-full bg-black/30 border border-white/10 rounded px-2 py-1.5 text-white text-xs outline-none focus:border-cyber-primary"
                                                        value={testLocation.zone}
                                                        onChange={(e) => setTestLocation({ ...testLocation, zone: e.target.value })}
                                                        aria-label="Test Zone"
                                                    >
                                                        {Array.from({ length: newSite.zoneCount || 10 }, (_, i) => String.fromCharCode(65 + i)).map(z => (
                                                            <option key={z} value={z}>{z}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-[9px] text-gray-500 uppercase font-bold mb-1 block">Aisle</label>
                                                    <select
                                                        className="w-full bg-black/30 border border-white/10 rounded px-2 py-1.5 text-white text-xs outline-none focus:border-cyber-primary"
                                                        value={parseInt(testLocation.aisle)}
                                                        onChange={(e) => setTestLocation({ ...testLocation, aisle: e.target.value.padStart(2, '0') })}
                                                        aria-label="Test Aisle"
                                                    >
                                                        {Array.from({ length: newSite.aisleCount || 20 }, (_, i) => i + 1).map(num => (
                                                            <option key={num} value={num}>
                                                                {num.toString().padStart(2, '0')}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-[9px] text-gray-500 uppercase font-bold mb-1 block">Bay</label>
                                                    <select
                                                        className="w-full bg-black/30 border border-white/10 rounded px-2 py-1.5 text-white text-xs outline-none focus:border-cyber-primary"
                                                        value={parseInt(testLocation.bay)}
                                                        onChange={(e) => setTestLocation({ ...testLocation, bay: e.target.value.padStart(2, '0') })}
                                                        aria-label="Test Bay"
                                                    >
                                                        {Array.from({ length: newSite.bayCount || 20 }, (_, i) => i + 1).map(num => (
                                                            <option key={num} value={num}>
                                                                {num.toString().padStart(2, '0')}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex items-center justify-between bg-black/40 p-2 rounded border border-white/5">
                                                <span className="text-[10px] text-gray-500 font-mono">
                                                    {testLocation.zone}-{testLocation.aisle.toString().padStart(2, '0')}-{testLocation.bay.toString().padStart(2, '0')}
                                                </span>
                                                <span className="text-xs font-mono font-bold text-cyber-primary">
                                                    {(() => {
                                                        const label = `${testLocation.zone}-${testLocation.aisle.toString().padStart(2, '0')}-${testLocation.bay.toString().padStart(2, '0')}`;
                                                        // STRICT 4-DIGIT PREFIX for 15-digit barcode
                                                        const prefix = newSite.barcodePrefix || extractSitePrefix(newSite.code);
                                                        return encodeLocation(label, prefix);
                                                    })()}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 items-end">
                                            <div className="w-1/3">
                                                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Validation Prefix (System)</label>
                                                <div className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-cyber-primary text-sm font-mono tracking-widest text-center backdrop-blur-sm">
                                                    {newSite.barcodePrefix || extractSitePrefix(newSite.code)}
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const prefix = newSite.barcodePrefix || extractSitePrefix(newSite.code);
                                                        generateBarcodes({ ...newSite, barcodePrefix: prefix });
                                                    }}
                                                    disabled={false}
                                                    className="w-full h-[38px] bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-gray-300 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                                                    Download Location Labels (CSV)
                                                </button>
                                            </div>
                                        </div>
                                        {/* Live Preview */}
                                        <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-500 bg-white/5 p-2 rounded-lg border border-white/5">
                                            <span className="uppercase font-bold">Preview:</span>
                                            {newSite.code || newSite.barcodePrefix ? (
                                                <span className="font-mono text-cyber-primary">
                                                    {encodeLocation('A-01-01', newSite.barcodePrefix || extractSitePrefix(newSite.code))} (A-01-01)
                                                </span>
                                            ) : (
                                                <span className="italic text-gray-600">Site Code or Prefix required for preview</span>
                                            )}
                                        </div>
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
                                    {newSite.id && (
                                        <div>
                                            <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Site Code (ID)</label>
                                            <div className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-gray-400 font-mono text-sm">
                                                {newSite.code}
                                            </div>
                                            <p className="text-[10px] text-yellow-500 mt-1 flex items-center gap-1"><Lock size={10} /> Immutable Identifier</p>
                                        </div>
                                    )}
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
                                <>🌙 <span className="text-orange-400 font-bold">Online Stores</span> are fulfillment-only locations for online orders. No walk-in customers.</>
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
                                handleSaveSite();
                            }}
                            disabled={isSavingSite || !newSite.name || !newSite.type}
                            className="flex-1 py-3 bg-cyber-primary text-black font-bold rounded-xl hover:bg-cyber-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSavingSite ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
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
                            disabled={deleteConfirmText !== "DELETE" || isDeleting}
                            className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isDeleting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                            {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                        </button>
                    </div>
                </div>
            </Modal >

            <Modal isOpen={isZoneManagerOpen} onClose={() => { setIsZoneManagerOpen(false); setEditingZone(null); setZoneNameInput(''); setZoneDescInput(''); }} title="🌐 Manage Logistics Zones" size="lg">
                <div className="space-y-6">
                    {/* Global Enforcement Toggle */}
                    <div className="flex items-start justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                        <div className="space-y-1 pr-4">
                            <p className="text-sm font-bold text-white flex items-center gap-2">
                                <Shield className="text-cyber-primary" size={16} /> Enforce Regional Replenishment
                            </p>
                            <p className="text-[10px] text-gray-500 leading-relaxed">
                                Restrict stock transfer requests to stores and warehouses within the same Logistics Zone. Bypass authorization is reserved for the CEO.
                            </p>
                        </div>
                        <div
                            onClick={async () => {
                                try {
                                    await updateSettings({ enforceRegionalZoning: !settings.enforceRegionalZoning }, user?.name || 'Admin');
                                    addNotification('success', 'Regional zoning enforcement status updated');
                                } catch (error) {
                                    console.error(error);
                                    addNotification('alert', 'Failed to update regional zoning enforcement');
                                }
                            }}
                            className={`w-11 h-6 rounded-full p-1 cursor-pointer transition-colors relative shrink-0 ${
                                settings.enforceRegionalZoning ? 'bg-cyber-primary' : 'bg-white/10'
                            }`}
                        >
                            <div className={`w-4 h-4 bg-black rounded-full shadow-md transition-transform transform ${
                                settings.enforceRegionalZoning ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                        </div>
                    </div>

                    {/* Add/Edit Form */}
                    <div className="bg-cyber-gray border border-white/10 rounded-xl p-4 space-y-4 shadow-lg">
                        <h4 className="text-sm font-bold text-cyber-primary uppercase tracking-wider">
                            {editingZone ? '✏️ Edit Logistics Zone' : '➕ Create New Logistics Zone'}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Zone Name *</label>
                                <input
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-cyber-primary transition-colors text-sm"
                                    placeholder="e.g. South Hub Zone"
                                    value={zoneNameInput}
                                    onChange={(e) => setZoneNameInput(e.target.value)}
                                    aria-label="Zone Name"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Description</label>
                                <input
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-cyber-primary transition-colors text-sm"
                                    placeholder="e.g. Southern region stores and Warehouses"
                                    value={zoneDescInput}
                                    onChange={(e) => setZoneDescInput(e.target.value)}
                                    aria-label="Zone Description"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end pt-2">
                            {editingZone && (
                                <button
                                    onClick={() => {
                                        setEditingZone(null);
                                        setZoneNameInput('');
                                        setZoneDescInput('');
                                    }}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-colors"
                                >
                                    Cancel Edit
                                </button>
                            )}
                            <button
                                onClick={handleSaveZone}
                                disabled={isZoneSaving || !zoneNameInput.trim()}
                                className="px-5 py-2 bg-cyber-primary text-black rounded-lg text-xs font-bold hover:bg-cyber-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                            >
                                {isZoneSaving ? <Loader2 size={12} className="animate-spin" /> : editingZone ? <Save size={12} /> : <Plus size={12} />}
                                {editingZone ? 'Update Zone' : 'Create Zone'}
                            </button>
                        </div>
                    </div>

                    {/* Zones List */}
                    <div className="space-y-3">
                        <label className="text-xs text-gray-400 uppercase font-bold block">Active Logistics Zones ({logisticsZones.length})</label>
                        {isLoadingZones ? (
                            <div className="py-8 flex items-center justify-center gap-2 text-gray-400 text-sm">
                                <Loader2 className="animate-spin" size={16} /> Loading zones...
                            </div>
                        ) : logisticsZones.length === 0 ? (
                            <p className="text-xs text-gray-500 italic py-4 text-center">No zones configured yet. Create one above.</p>
                        ) : (
                            <div className="border border-white/5 rounded-xl overflow-hidden divide-y divide-white/5 max-h-80 overflow-y-auto custom-scrollbar">
                                {logisticsZones.map(zone => (
                                    <div key={zone.id} className="p-4 bg-black/10 hover:bg-white/5 transition-colors flex items-center justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <h5 className="text-white font-bold text-sm truncate flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.5)] shrink-0" />
                                                {zone.name}
                                            </h5>
                                            {zone.description && (
                                                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{zone.description}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => {
                                                    setEditingZone(zone);
                                                    setZoneNameInput(zone.name);
                                                    setZoneDescInput(zone.description || '');
                                                }}
                                                className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-[10px] font-bold transition-colors flex items-center gap-1"
                                                title="Edit Zone"
                                            >
                                                <Code size={10} className="text-cyber-primary" />
                                                <span>Edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteZone(zone.id)}
                                                className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 text-[10px] font-bold transition-colors flex items-center gap-1"
                                                title="Delete Zone"
                                            >
                                                <Trash2 size={10} />
                                                <span>Delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

        </div >
    );
}
