import React from 'react';
import {
    Activity, LayoutDashboard, DollarSign, Box,
    Network, Server, Eye, Building2, Store, Warehouse, Users, Layers
} from 'lucide-react';
import { Country, getCountryProfile } from '../../utils/localization';
import { DateRangeOption } from '../../hooks/useDateFilter';
import { CentralOpsViewMode, FacilityScope } from './types';
import DateRangeSelector from '../DateRangeSelector';
import { CyberClock } from './widgets/CyberClock';

interface CentralOperationsHeaderProps {
    activeCountry: Country;
    viewMode: CentralOpsViewMode;
    onViewModeChange: (mode: CentralOpsViewMode) => void;
    facilityScope: FacilityScope;
    onFacilityScopeChange: (scope: FacilityScope) => void;
    totalSitesCount: number;
    filteredSitesCount: number;
    dateRange: DateRangeOption;
    onDateRangeChange: (range: DateRangeOption) => void;
    onGenerateReport?: () => void;
}

export const CentralOperationsHeader: React.FC<CentralOperationsHeaderProps> = ({
    activeCountry,
    viewMode,
    onViewModeChange,
    facilityScope,
    onFacilityScopeChange,
    totalSitesCount,
    filteredSitesCount,
    dateRange,
    onDateRangeChange,
    onGenerateReport
}) => {
    const countryProfile = getCountryProfile(activeCountry);

    const navTabs: { id: CentralOpsViewMode; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
        { id: 'executive', label: 'Executive Deck', icon: LayoutDashboard },
        { id: 'regional', label: 'Regional Command', icon: Building2 },
        { id: 'catalog', label: 'Catalog Governance', icon: Layers },
        { id: 'team', label: 'Central Ops Team', icon: Users },
        { id: 'financial', label: 'Financials', icon: DollarSign },
        { id: 'inventory', label: 'Logistics & Supply', icon: Box },
        { id: 'network', label: 'Network Hubs', icon: Network },
        { id: 'telemetry', label: 'Telemetry & Audit', icon: Server },
        { id: 'all', label: 'All Modules', icon: Eye }
    ];

    return (
        <div className="space-y-4 mb-6">
            {/* Top Operational Bar */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                {/* Brand & National Identity */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="p-2.5 bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] rounded-xl border border-[var(--theme-accent)]/20">
                        <Activity size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--theme-text-primary)]">
                                CENTRAL<span className="text-[var(--theme-text-secondary)]">OPS</span>
                            </h1>
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)]">
                                {activeCountry} · {countryProfile.name.split(' (')[0]}
                            </span>
                        </div>
                        <p className="text-xs text-[var(--theme-text-secondary)] font-medium flex items-center gap-2 mt-0.5">
                            <Activity size={13} aria-hidden="true" className="text-[var(--theme-accent)]" />
                            <span className="font-semibold tracking-wide text-[11px] text-[var(--theme-text-secondary)]">Operations overview</span>
                            <span className="text-[var(--theme-border)]">•</span>
                            <span className="text-[var(--theme-text-primary)] font-semibold">{filteredSitesCount} of {totalSitesCount} facilities in view</span>
                        </p>
                    </div>
                </div>

                {/* Right Action Controls */}
                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-start xl:justify-end">
                    <DateRangeSelector
                        value={dateRange}
                        onChange={onDateRangeChange}
                        className="w-full sm:w-auto"
                    />

                    {/* Sovereign Clock & Calendar Suite */}
                    <div className="hidden sm:block shrink-0">
                        <CyberClock country={activeCountry} />
                    </div>
                </div>
            </div>

            {/* View Mode & Facility Scope Segmented Bar */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-2 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] shadow-sm">
                {/* Domain Navigation Tabs */}
                <div role="group" aria-label="Central operations views" className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-1 lg:pb-0">
                    {navTabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = viewMode === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => onViewModeChange(tab.id)}
                                aria-pressed={isActive}
                                className={`min-h-11 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
                                    isActive
                                        ? 'bg-[var(--theme-accent-muted)] text-[var(--theme-text-primary)] font-bold border border-[var(--theme-accent)]'
                                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)]'
                                }`}
                            >
                                <Icon size={15} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Facility Scope Filter Pill */}
                <div role="group" aria-label="Filter by facility type" className="flex items-center gap-1 bg-[var(--theme-bg-subtle)] p-1 rounded-xl self-stretch lg:self-center shrink-0 border border-[var(--theme-border)]">
                    <button
                        type="button"
                        onClick={() => onFacilityScopeChange('all')}
                        aria-pressed={facilityScope === 'all'}
                        className={`min-h-11 flex flex-1 lg:flex-none items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
                            facilityScope === 'all'
                                ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs font-semibold border border-[var(--theme-border)]'
                                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                        }`}
                        title="Show all network facilities"
                    >
                        <Building2 size={13} />
                        <span>All Sites</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onFacilityScopeChange('store')}
                        aria-pressed={facilityScope === 'store'}
                        className={`min-h-11 flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
                            facilityScope === 'store'
                                ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs font-semibold border border-[var(--theme-border)]'
                                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                        }`}
                        title="Filter retail stores only"
                    >
                        <Store size={13} />
                        <span>Retail Stores</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onFacilityScopeChange('warehouse')}
                        aria-pressed={facilityScope === 'warehouse'}
                        className={`min-h-11 flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
                            facilityScope === 'warehouse'
                                ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs font-semibold border border-[var(--theme-border)]'
                                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                        }`}
                        title="Filter warehouses and distribution hubs only"
                    >
                        <Warehouse size={13} />
                        <span>Warehouses / DCs</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
