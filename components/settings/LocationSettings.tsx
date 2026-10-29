import React, { useState, useEffect, useCallback } from 'react';
import {
    Building, Store, Plus, Globe, Lock, Truck, Box
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { Protected } from '../Protected';
import type { Site, LogisticsZone } from '../../types';
import { logisticsZonesService } from '../../services/supabase.service';
import { supabase } from '../../lib/supabase';
import { SiteModal } from './SiteModal';
import { DeleteSiteModal } from './DeleteSiteModal';
import { ZoneManagerModal } from './ZoneManagerModal';
import { SiteCard } from './SiteCard';
import { LocationEmptyState } from './locations/LocationEmptyState';
import { LocationCategoryView } from './locations/LocationCategoryView';
import { LocationRegionView } from './locations/LocationRegionView';
import { LocationZoneView } from './locations/LocationZoneView';
import { generateLocationBarcodesCSV } from './locationBarcodeHelper';
import { logger } from '../../utils/logger';
import { getCountryProfile, Country } from '../../utils/localization';
import { isAdminSite } from '../../utils/countryAdmin';
import { generateNextSiteCode, generatePlaceSpecificSiteCode } from '../../utils/siteIdGenerator';

const SectionHeader = ({ title, desc }: { title: string, desc: string }) => (
    <div className="mb-6 pb-4 border-b border-[var(--theme-border)]">
        <h3 className="text-base font-semibold text-[var(--theme-text-primary)] tracking-tight">{title}</h3>
        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">{desc}</p>
    </div>
);

export default function LocationSettings() {
    const { user } = useStore();
    const {
        settings, updateSettings, sites, addSite, updateSite, deleteSite,
        addNotification, refreshData, effectiveCountry, regions
    } = useData();

    const activeCountry: Country = (effectiveCountry || settings?.country || 'ET') as Country;
    const countryProfile = getCountryProfile(activeCountry);

    // Site Modal State
    const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
    const [newSite, setNewSite] = useState<Partial<Site>>({});
    const [isSavingSite, setIsSavingSite] = useState(false);
    const [expandedSiteId, setExpandedSiteId] = useState<string | null>(null);
    const [locationViewMode, setLocationViewMode] = useState<'category' | 'region' | 'zone'>('category');

    // Logistics Zones State
    const [logisticsZones, setLogisticsZones] = useState<LogisticsZone[]>([]);
    const [isLoadingZones, setIsLoadingZones] = useState(false);
    const [isZoneManagerOpen, setIsZoneManagerOpen] = useState(false);
    const [isZoneSaving, setIsZoneSaving] = useState(false);

    // Zone Form / Editing state
    const [editingZone, setEditingZone] = useState<LogisticsZone | null>(null);
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

    const fetchZones = useCallback(async () => {
        setIsLoadingZones(true);
        try {
            const data = await logisticsZonesService.getAll(activeCountry);
            setLogisticsZones(data);
        } catch (error) {
            logger.error('LocationSettings', 'Failed to load logistics zones:', error);
        } finally {
            setIsLoadingZones(false);
        }
    }, [activeCountry]);

    useEffect(() => {
        fetchZones();
    }, [fetchZones]);

    const generateBarcodes = async (site: Partial<Site> & { barcodePrefix?: string }) => {
        await generateLocationBarcodesCSV(site, addNotification, setIsGenerating);
    };

    const handleOpenAddSite = () => {
        setNewSite({
            type: 'Store',
            status: 'Active',
            country: activeCountry,
            currency: countryProfile.currencySymbol
        });
        setIsSiteModalOpen(true);
    };

    const handleSaveSite = async () => {
        if (!newSite.name || !newSite.type) {
            addNotification('alert', 'Name and Type are required');
            return;
        }

        setIsSavingSite(true);
        try {
            const siteCountry = newSite.country || activeCountry;
            const siteCurrency = newSite.currency || (siteCountry === 'KE' ? 'KSh' : 'ETB');

            const commonData = {
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
                replenishmentSourceIds: newSite.replenishmentSourceIds ?? [],
                replenishmentSourceId: (newSite.replenishmentSourceIds ?? [])[0],
                logisticsZoneId: newSite.logisticsZoneId || undefined,
                region_code: newSite.region_code || newSite.regionCode || undefined,
                regionCode: newSite.region_code || newSite.regionCode || undefined,
                country: siteCountry,
                currency: siteCurrency
            };

            if (newSite.id) {
                const siteData: Site = {
                    ...commonData,
                    id: newSite.id,
                    code: newSite.code || newSite.name?.substring(0, 3).toUpperCase() || 'UNK'
                };
                await updateSite(siteData, user?.name || 'Admin');
                addNotification('success', `Location "${newSite.name}" updated successfully`);

                // Tamper-Proof Audit Logging
                await supabase.from('system_logs').insert({
                    action: 'Location Updated',
                    details: `Updated facility "${newSite.name}" (${siteCountry}) by ${user?.name || user?.email}`,
                    user_name: user?.name || user?.email || 'Admin',
                    module: 'Settings'
                });
            } else {
                const countryCode = (siteCountry || 'ET').toUpperCase();
                const placeCode = generatePlaceSpecificSiteCode({
                    country: countryCode,
                    regionCode: newSite.region_code || newSite.regionCode,
                    type: newSite.type,
                    name: newSite.name,
                    existingSites: sites
                });
                const siteData: Omit<Site, 'id'> = {
                    ...commonData,
                    code: newSite.code || placeCode
                };
                await addSite(siteData as Site, user?.name || 'Admin');
                addNotification('success', `Location "${newSite.name}" (${placeCode}) registered successfully for ${countryProfile.name}`);

                // Tamper-Proof Audit Logging
                await supabase.from('system_logs').insert({
                    action: 'Location Created',
                    details: `Registered new facility "${newSite.name}" [${placeCode}] in ${countryProfile.name} (${siteCountry}) by ${user?.name || user?.email}`,
                    user_name: user?.name || user?.email || 'Admin',
                    module: 'Settings'
                });
            }
            setIsSiteModalOpen(false);
            setNewSite({});
            refreshData();
        } catch (error: unknown) {
            logger.error('LocationSettings', 'Error saving site:', error);
            const err = error as { message?: string; details?: string };
            const errorMsg = err?.message || err?.details || 'Failed to save location. Please try again.';
            addNotification('alert', `Error: ${errorMsg}`);
        } finally {
            setIsSavingSite(false);
        }
    };

    const handleDeleteSite = (id: string) => {
        const site = sites.find((s: Site) => s.id === id);
        if (!site) return;

        if (isAdminSite(site)) {
            const countryAdminCount = sites.filter(s => (s.country || activeCountry) === (site.country || activeCountry) && isAdminSite(s)).length;
            if (countryAdminCount <= 1) {
                addNotification('alert', `Cannot delete "${site.name}". Every country must retain an Administration Central HQ.`);
                return;
            }
        }

        setSiteToDelete(site);
        setDeleteConfirmText('');
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteSite = async () => {
        if (!siteToDelete) return;

        if (deleteConfirmText !== 'DELETE') {
            addNotification('alert', 'Please type "DELETE" to confirm.');
            return;
        }

        setIsDeleting(true);
        try {
            await deleteSite(siteToDelete.id, user?.name || 'Admin');
            addNotification('success', `Location "${siteToDelete.name}" has been deleted`);

            await supabase.from('system_logs').insert({
                action: 'Location Deleted',
                details: `Deleted facility "${siteToDelete.name}" (${siteToDelete.country || activeCountry}) by ${user?.name || user?.email}`,
                user_name: user?.name || user?.email || 'Admin',
                module: 'Settings'
            });

            setIsDeleteModalOpen(false);
            setSiteToDelete(null);
            setDeleteConfirmText('');
            refreshData();
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
                    description: zoneDescInput.trim(),
                    country: activeCountry
                });
                addNotification('success', 'Logistics Zone created successfully');
            }
            setZoneNameInput('');
            setZoneDescInput('');
            setEditingZone(null);
            fetchZones();
            refreshData();
        } catch (error: unknown) {
            const err = error as Error;
            addNotification('alert', `Failed to save Logistics Zone: ${err.message}`);
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
        } catch (error: unknown) {
            const err = error as Error;
            addNotification('alert', `Failed to delete Logistics Zone: ${err.message}`);
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
                regions={regions}
            />
        );
    };

    return (
        <Protected permission="MANAGE_SITES" fallback={
            <div className="max-w-2xl mx-auto py-12">
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-8 text-center shadow-xs">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] flex items-center justify-center mx-auto mb-3">
                        <Lock size={20} />
                    </div>
                    <h3 className="text-base font-semibold text-[var(--theme-text-primary)] mb-1">Access Restricted</h3>
                    <p className="text-xs text-[var(--theme-text-secondary)]">Only executive leadership can configure physical facilities.</p>
                </div>
            </div>
        }>
            <div className="w-full space-y-6 animate-in fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <SectionHeader
                            title="Physical Locations"
                            desc={`Manage Warehouses, Distribution Centers, and Retail Stores across ${countryProfile.name}.`}
                        />
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
                                <Building size={14} />
                                <span>{sites.filter((s: Site) => ['Administration', 'Administrative', 'Central Operations', 'HQ'].includes(s.type)).length} Administration</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
                                <Truck size={14} />
                                <span>{sites.filter((s: Site) => s.type === 'Distribution Center').length} Distribution</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--theme-accent)] dark:text-[var(--theme-accent)] bg-[var(--theme-accent)]/10 px-2.5 py-1 rounded-full border border-[var(--theme-accent)]/20">
                                <Box size={14} />
                                <span>{sites.filter((s: Site) => s.type === 'Warehouse').length} Warehouses</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] bg-[var(--theme-status-success-bg)] px-2.5 py-1 rounded-full border border-[var(--theme-status-success-border)]">
                                <Store size={14} />
                                <span>{sites.filter((s: Site) => s.type === 'Store').length} Stores</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 mt-4 bg-[var(--theme-bg-subtle)] p-1 rounded-xl border border-[var(--theme-border)] w-fit">
                            <button
                                type="button"
                                onClick={() => setLocationViewMode('category')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                    locationViewMode === 'category'
                                        ? 'bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] text-white shadow-xs font-semibold'
                                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)]'
                                }`}
                            >
                                By Category
                            </button>
                            <button
                                type="button"
                                onClick={() => setLocationViewMode('region')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                    locationViewMode === 'region'
                                        ? 'bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] text-white shadow-xs font-semibold'
                                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)]'
                                }`}
                            >
                                By Region
                            </button>
                            <button
                                type="button"
                                onClick={() => setLocationViewMode('zone')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                    locationViewMode === 'zone'
                                        ? 'bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] text-white shadow-xs font-semibold'
                                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)]'
                                }`}
                            >
                                By Logistics Zone
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsZoneManagerOpen(true)}
                            className="h-10 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] px-4 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
                        >
                            <Globe size={15} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" /> Manage Zones
                        </button>
                        <button
                            type="button"
                            onClick={handleOpenAddSite}
                            className="h-10 bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] text-white hover:opacity-95 px-5 rounded-xl font-semibold text-xs flex items-center gap-2 shadow-[0_2px_8px_rgba(0,113,227,0.25)] transition-all cursor-pointer active:scale-[0.98]"
                        >
                            <Plus size={16} /> Add Location
                        </button>
                    </div>
                </div>

                {sites.length === 0 ? (
                    <LocationEmptyState
                        countryName={countryProfile.name}
                        onAddLocation={handleOpenAddSite}
                    />
                ) : locationViewMode === 'region' ? (
                    <LocationRegionView
                        sites={sites}
                        regions={regions.filter(r => !r.country || r.country.toUpperCase() === activeCountry)}
                        renderSiteCard={renderSiteCard}
                    />
                ) : locationViewMode === 'zone' ? (
                    <LocationZoneView
                        sites={sites}
                        logisticsZones={logisticsZones}
                        renderSiteCard={renderSiteCard}
                    />
                ) : (
                    <LocationCategoryView
                        sites={sites}
                        renderSiteCard={renderSiteCard}
                    />
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
                    existingSites={sites}
                    regions={regions}
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
