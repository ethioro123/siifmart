import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Building2, Plus, Search, Shield, Globe,
    Sliders, Store, DollarSign, Filter, RefreshCw
} from 'lucide-react';
import { useStore } from '../../contexts/CentralStore';
import { useData } from '../../contexts/DataContext';
import { getCountryProfile, Country } from '../../utils/localization';
import { normalizeCountryCode } from '../../utils/siteIdGenerator';
import type { Region } from '../../types';
import { useRegionalSettingsData } from '../../hooks/useRegionalSettingsData';
import { RegionCard } from './regions/RegionCard';
import { CreateRegionModal } from './regions/CreateRegionModal';
import { EditRegionModal } from './regions/EditRegionModal';

export default function RegionsSettingsTab() {
    const { user } = useStore();
    const {
        effectiveCountry,
        settings,
        refreshData,
        addNotification
    } = useData();

    const isHQExecutive = useMemo(() => {
        const r = (user?.role || '').toLowerCase().trim();
        return ['group_ceo', 'country_managing_director', 'country_operations_director', 'country_finance_director'].includes(r);
    }, [user?.role]);

    const activeCountry: Country = (effectiveCountry || settings?.country || 'ET') as Country;
    const selectedCountry = activeCountry;
    const countryProfile = getCountryProfile(selectedCountry);
    const currency = countryProfile.currency || 'KES';

    const queries = useRegionalSettingsData(user?.id || '', selectedCountry);
    const regions = queries.regions.data || [];
    const sites = queries.directory.data?.sites || [];
    const employees = queries.directory.data?.employees || [];
    const isLoading = queries.regions.isPending || queries.directory.isPending;
    const loadError = queries.regions.error?.message || queries.directory.error?.message || null;
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'planning'>('all');

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
    const [editingRegion, setEditingRegion] = useState<Region | null>(null);

    const loadRegions = async () => { await Promise.all([queries.regions.refetch(), queries.directory.refetch()]); };
    useEffect(() => { setIsCreateModalOpen(false); setEditingRegion(null); }, [selectedCountry]);
    const handleCreatedOrUpdated = async () => {
        await loadRegions();
        refreshData?.();
    };

    // Filter regions
    const filteredRegions = useMemo(() => {
        return regions.filter(r => {
            const matchesQuery =
                r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (r.city && r.city.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
            return matchesQuery && matchesStatus;
        });
    }, [regions, searchQuery, statusFilter]);

    // Country-scoped sites
    const countrySites = useMemo(() => {
        const normSelected = normalizeCountryCode(selectedCountry);
        return sites.filter(s => Boolean(s.country) && normalizeCountryCode(s.country) === normSelected);
    }, [sites, selectedCountry]);

    // Country-scoped employees
    const countryEmployees = useMemo(() => {
        const normSelected = normalizeCountryCode(selectedCountry);
        return employees.filter(e => {
            const employeeCountry = e.country || e.country_code;
            return Boolean(employeeCountry) && normalizeCountryCode(employeeCountry) === normSelected;
        });
    }, [employees, selectedCountry]);

    // KPI Metrics
    const totalRegionalBudget = useMemo(() => {
        return regions.reduce((sum, r) => sum + (r.monthly_procurement_budget || 0), 0);
    }, [regions]);

    const governedSitesCount = useMemo(() => {
        return countrySites.filter(s => s.regionCode || s.region_code).length;
    }, [countrySites]);

    return (
        <div className="space-y-6">
            {/* Header / Intro */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--theme-border)]">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold text-[var(--theme-text-primary)] tracking-tight">
                            Regional Administration & Decentralized Governance
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20">
                            {countryProfile.name}
                        </span>
                    </div>
                    <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                        Establish regional administrative units with delegated procurement, finance, and logistics authority under National HQ command.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={loadRegions}
                        title="Refresh regional status"
                        className="min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 p-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] transition-colors cursor-pointer flex items-center justify-center touch-manipulation"
                    >
                        <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    {isHQExecutive && (
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(true)}
                            className="min-h-11 sm:h-9 flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--theme-accent)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-accent)]/90 transition-all cursor-pointer shadow-xs touch-manipulation"
                        >
                            <Plus size={15} />
                            <span>Provision Region</span>
                        </button>
                    )}
                </div>
            </div>

            {/* KPI Summary Deck */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl p-4">
                    <div className="flex items-center justify-between text-xs text-[var(--theme-text-secondary)] mb-1">
                        <span>Active Regions</span>
                        <Building2 size={15} className="text-[var(--theme-accent)]" />
                    </div>
                    <p className="text-xl font-bold text-[var(--theme-text-primary)] tracking-tight">
                        {isLoading ? '—' : regions.filter(r => r.status === 'active').length}
                        <span className="text-xs font-normal text-[var(--theme-text-secondary)] ml-1">
                            / {regions.length} total
                        </span>
                    </p>
                </div>

                <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl p-4">
                    <div className="flex items-center justify-between text-xs text-[var(--theme-text-secondary)] mb-1">
                        <span>Allocated Monthly Budget</span>
                        <DollarSign size={15} className="text-[var(--theme-status-success-text)]" />
                    </div>
                    <p className="text-xl font-bold text-[var(--theme-text-primary)] tracking-tight">
                        {queries.regions.isPending ? '—' : totalRegionalBudget.toLocaleString()}
                        <span className="text-xs font-normal text-[var(--theme-text-secondary)] ml-1">
                            {currency}
                        </span>
                    </p>
                </div>

                <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl p-4">
                    <div className="flex items-center justify-between text-xs text-[var(--theme-text-secondary)] mb-1">
                        <span>Governed visible sites</span>
                        <Store size={15} className="text-[var(--theme-accent)]" />
                    </div>
                    <p className="text-xl font-bold text-[var(--theme-text-primary)] tracking-tight">
                        {queries.directory.isPending || queries.directory.isError ? '—' : governedSitesCount}
                        <span className="text-xs font-normal text-[var(--theme-text-secondary)] ml-1">
                            / {countrySites.length} visible sites
                        </span>
                    </p>
                </div>

                <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl p-4">
                    <div className="flex items-center justify-between text-xs text-[var(--theme-text-secondary)] mb-1">
                        <span>HQ Governance</span>
                        <Shield size={15} className="text-[var(--theme-status-warning-text)]" />
                    </div>
                    <p className="text-xs font-medium text-[var(--theme-text-primary)] tracking-tight mt-1">
                        Country-scoped authority
                    </p>
                    <p className="text-[10px] text-[var(--theme-text-secondary)] mt-0.5">
                        Authorized leadership changes are applied and audit logged.
                    </p>
                </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                    <Search size={14} className="absolute left-3 top-2.5 text-[var(--theme-text-secondary)]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search regions or codes..."
                        className="w-full pl-8 pr-3 py-1.5 min-h-11 sm:min-h-0 sm:py-1.5 text-xs bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Filter size={14} className="text-[var(--theme-text-secondary)] hidden sm:block" />
                    <div className="flex items-center gap-1 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl p-1 text-xs">
                        {(['all', 'active', 'suspended', 'planning'] as const).map(tab => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setStatusFilter(tab)}
                                className={`px-2.5 py-1 min-h-9 sm:min-h-0 rounded-lg capitalize font-medium transition-all cursor-pointer flex items-center justify-center touch-manipulation ${
                                    statusFilter === tab
                                        ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs'
                                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Regions Grid */}
            {isLoading && regions.length === 0 ? (
                <div className="py-16 text-center text-xs text-[var(--theme-text-secondary)]">
                    <Building2 size={28} className="mx-auto mb-2 text-[var(--theme-text-secondary)] animate-pulse" />
                    Loading regional governance structure...
                </div>
            ) : loadError ? (
                <div className="border border-[var(--theme-status-danger-border)] bg-[var(--theme-status-danger-bg)] rounded-2xl p-10 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--theme-status-danger-bg)] border border-[var(--theme-status-danger-border)] flex items-center justify-center text-[var(--theme-status-danger-text)] mx-auto mb-3">
                        <Shield size={24} />
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">
                        Unable to Load Regional Administrations
                    </h3>
                    <p className="text-xs text-[var(--theme-text-secondary)] mt-1 max-w-md mx-auto">
                        {loadError}
                    </p>
                    <button
                        type="button"
                        onClick={loadRegions}
                        className="mt-4 min-h-11 sm:h-9 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--theme-accent)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-accent)]/90 transition-all cursor-pointer shadow-xs touch-manipulation flex items-center justify-center mx-auto"
                    >
                        Retry Connection
                    </button>
                </div>
            ) : filteredRegions.length === 0 ? (
                <div className="border border-dashed border-[var(--theme-border)] rounded-2xl p-12 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-secondary)] mx-auto mb-3">
                        <Building2 size={24} />
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">
                        {searchQuery || statusFilter !== 'all' ? 'No regions match these filters' : `No regional administrations in ${countryProfile.name}`}
                    </h3>
                    <p className="text-xs text-[var(--theme-text-secondary)] mt-1 max-w-md mx-auto">
                        {searchQuery || statusFilter !== 'all'
                            ? 'Try clearing your search query or adjusting the status filter.'
                            : 'No regional administration records are available in this country. Authorized leadership can provision a region.'}
                    </p>
                    {!searchQuery && isHQExecutive && (
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(true)}
                            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--theme-accent)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-accent)]/90 transition-all cursor-pointer shadow-xs"
                        >
                            <Plus size={14} />
                            <span>Provision First Region</span>
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {filteredRegions.map(region => (
                        <RegionCard
                            key={region.code}
                            region={region}
                            sites={countrySites}
                            employees={countryEmployees}
                            onEdit={(r) => setEditingRegion(r)}
                            canManageGovernance={isHQExecutive}
                        />
                    ))}
                </div>
            )}

            {/* Create Region Modal */}
            <CreateRegionModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreated={handleCreatedOrUpdated}
                country={selectedCountry}
                currency={currency}
                sites={countrySites}
                employees={countryEmployees}
                addNotification={addNotification}
                existingRegions={regions}
            />

            {/* Edit Region Modal */}
            {editingRegion && (
                <EditRegionModal
                    isOpen={Boolean(editingRegion)}
                    onClose={() => setEditingRegion(null)}
                    onUpdated={handleCreatedOrUpdated}
                    region={editingRegion}
                    regions={regions}
                    sites={countrySites}
                    employees={countryEmployees}
                    addNotification={addNotification}
                />
            )}
        </div>
    );
}
