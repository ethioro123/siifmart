import React, { useState, useEffect } from 'react';
import {
    Building, Store, Plus, Globe, MapPin, Lock
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { Protected } from '../Protected';
import { Site } from '../../types';
import { logisticsZonesService } from '../../services/supabase.service';
import { SiteModal } from './SiteModal';
import { DeleteSiteModal } from './DeleteSiteModal';
import { ZoneManagerModal } from './ZoneManagerModal';
import { SiteCard } from './SiteCard';
import { generateLocationBarcodesCSV } from './locationBarcodeHelper';
import { logger } from '../../utils/logger';

const SectionHeader = ({ title, desc }: { title: string, desc: string }) => (
    <div className="mb-6 pb-4 border-b border-white/5">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-sm text-gray-400 mt-1">{desc}</p>
    </div>
);

export default function LocationSettings() {
    const { user } = useStore();
    const {
        settings, updateSettings, sites, addSite, updateSite, deleteSite,
        addNotification, refreshData
    } = useData();

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

    const [isGenerating, setIsGenerating] = useState(false);

    const fetchZones = async () => {
        setIsLoadingZones(true);
        try {
            const data = await logisticsZonesService.getAll();
            setLogisticsZones(data);
        } catch (error) {
            logger.error('LocationSettings', 'Failed to load logistics zones:', error);
        } finally {
            setIsLoadingZones(false);
        }
    };

    useEffect(() => {
        fetchZones();
    }, []);

    const generateBarcodes = async (site: Partial<Site> & { barcodePrefix?: string }) => {
        await generateLocationBarcodesCSV(site, addNotification, setIsGenerating);
    };

    const handleSaveSite = async () => {
        if (!newSite.name || !newSite.type) {
            addNotification('alert', "Name and Type are required");
            return;
        }

        setIsSavingSite(true);
        try {
            if (newSite.id) {
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
            logger.error('LocationSettings', '❌ Error saving site:', error);
            const errorMsg = error?.message || error?.details || 'Failed to save location. Please try again.';
            addNotification('alert', `Error: ${errorMsg}`);
        } finally {
            setIsSavingSite(false);
        }
    };

    const handleDeleteSite = (id: string) => {
        const site = sites.find((s: Site) => s.id === id);
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
            logger.error('LocationSettings', 'Error deleting site:', error);
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

    const renderSiteCard = (site: Site) => {
        return (
            <SiteCard
                key={site.id}
                site={site}
                expandedSiteId={expandedSiteId}
                setExpandedSiteId={setExpandedSiteId}
                setNewSite={setNewSite}
                setIsSiteModalOpen={setIsSiteModalOpen}
                handleDeleteSite={handleDeleteSite}
                isDeleting={isDeleting}
                logisticsZones={logisticsZones}
            />
        );
    };

    return (
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
                                <span className="text-gray-400">{sites.filter((s: Site) => s.type === 'Administration').length} Administration</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Building className="text-blue-400" size={16} />
                                <span className="text-gray-400">{sites.filter((s: Site) => s.type === 'Warehouse').length} Warehouses</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Store className="text-green-400" size={16} />
                                <span className="text-gray-400">{sites.filter((s: Site) => s.type === 'Store').length} Stores</span>
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
                        {logisticsZones.map(zone => {
                            const zoneSites = sites.filter((s: Site) => s.logisticsZoneId === zone.id);
                            return (
                                <div key={zone.id} className="bg-black/15 border border-white/5 rounded-2xl p-4 flex flex-col gap-3 min-h-[300px] hover:border-white/10 transition-colors">
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

                                    {zoneSites.length === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center opacity-40">
                                            <MapPin size={16} className="text-gray-600 mb-1" />
                                            <span className="text-[10px] text-gray-500 italic">No locations</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2.5 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                                            {zoneSites.map((site: Site) => renderSiteCard(site))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {(() => {
                            const unassignedSites = sites.filter((s: Site) => !s.logisticsZoneId);
                            return (
                                <div key="unassigned" className="bg-black/15 border border-white/5 rounded-2xl p-4 flex flex-col gap-3 min-h-[300px] hover:border-white/10 transition-colors">
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

                                    {unassignedSites.length === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center opacity-40">
                                            <MapPin size={16} className="text-gray-600 mb-1" />
                                            <span className="text-[10px] text-gray-500 italic">No locations</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2.5 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                                            {unassignedSites.map((site: Site) => renderSiteCard(site))}
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
                                shadowColor: 'shadow-[0_0_8px_rgba(168,85,247,0.5)]',
                                iconColor: 'bg-purple-500/20 text-purple-300'
                            },
                            {
                                types: ['Warehouse'],
                                label: 'Warehouse',
                                desc: 'Storage & Fulfillment',
                                dotColor: 'bg-blue-500',
                                shadowColor: 'shadow-[0_0_8px_rgba(59,130,246,0.5)]',
                                iconColor: 'bg-blue-500/20 text-blue-400'
                            },
                            {
                                types: ['Distribution Center'],
                                label: 'Distribution Center',
                                desc: 'Regional Hub',
                                dotColor: 'bg-cyan-500',
                                shadowColor: 'shadow-[0_0_8px_rgba(6,182,212,0.5)]',
                                iconColor: 'bg-cyan-500/20 text-cyan-400'
                            },
                            {
                                types: ['Store'],
                                label: 'Retail Store',
                                desc: 'Customer-facing',
                                dotColor: 'bg-green-500',
                                shadowColor: 'shadow-[0_0_8px_rgba(34,197,94,0.5)]',
                                iconColor: 'bg-green-500/20 text-green-400'
                            },
                            {
                                types: ['Dark Store'],
                                label: 'Online Store',
                                desc: 'Online Fulfillment',
                                dotColor: 'bg-orange-500',
                                shadowColor: 'shadow-[0_0_8px_rgba(249,115,22,0.5)]',
                                iconColor: 'bg-orange-500/20 text-orange-400'
                            }
                        ].map(cat => {
                            const catSites = sites.filter((s: Site) => cat.types.includes(s.type));

                            return (
                                <div key={cat.label} className="bg-black/15 border border-white/5 rounded-2xl p-4 flex flex-col gap-3 min-h-[300px] hover:border-white/10 transition-colors">
                                    <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                                        <span
                                            className={`w-2 h-2 rounded-full ${cat.dotColor} ${cat.shadowColor} shrink-0`}
                                        />
                                        <h5 className="text-white font-bold text-xs uppercase tracking-wider truncate" title={cat.label}>{cat.label}s</h5>
                                        <span className="text-[9px] text-gray-400 bg-white/5 px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ml-auto">
                                            {catSites.length}
                                        </span>
                                    </div>

                                    {catSites.length === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center opacity-40">
                                            <MapPin size={16} className="text-gray-600 mb-1" />
                                            <span className="text-[10px] text-gray-500 italic">No locations</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2.5 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                                            {catSites.map((site: Site) => renderSiteCard(site))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                <SiteModal
                    isOpen={isSiteModalOpen}
                    onClose={() => setIsSiteModalOpen(false)}
                    newSite={newSite}
                    setNewSite={setNewSite}
                    isSavingSite={isSavingSite}
                    logisticsZones={logisticsZones}
                    testLocation={testLocation}
                    setTestLocation={setTestLocation}
                    isGenerating={isGenerating}
                    generateBarcodes={generateBarcodes}
                    handleSaveSite={handleSaveSite}
                />

                <DeleteSiteModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    siteToDelete={siteToDelete}
                    confirmDeleteSite={confirmDeleteSite}
                    deleteConfirmText={deleteConfirmText}
                    setDeleteConfirmText={setDeleteConfirmText}
                    isDeleting={isDeleting}
                />

                <ZoneManagerModal
                    isOpen={isZoneManagerOpen}
                    onClose={() => { setIsZoneManagerOpen(false); setEditingZone(null); setZoneNameInput(''); setZoneDescInput(''); }}
                    settings={settings}
                    updateSettings={updateSettings}
                    user={user}
                    addNotification={addNotification}
                    logisticsZones={logisticsZones}
                    isLoadingZones={isLoadingZones}
                    editingZone={editingZone}
                    setEditingZone={setEditingZone}
                    zoneNameInput={zoneNameInput}
                    setZoneNameInput={setZoneNameInput}
                    zoneDescInput={zoneDescInput}
                    setZoneDescInput={setZoneDescInput}
                    isZoneSaving={isZoneSaving}
                    handleSaveZone={handleSaveZone}
                    handleDeleteZone={handleDeleteZone}
                />
            </div>
        </Protected>
    );
}
