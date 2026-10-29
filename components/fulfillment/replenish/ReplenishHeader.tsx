import React from 'react';
import { RefreshCw, Search, Filter, ChevronDown, CheckCircle, Box, AlertTriangle, Hash, Zap, Loader2 } from 'lucide-react';
import { SortDropdown } from '../FulfillmentShared';
import { WMSJob, Product } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';

interface ReplenishHeaderProps {
    viewMode?: 'Process' | 'History';
    setViewMode?: (val: 'Process' | 'History') => void;
    filteredProducts: Product[];
    products: Product[];
    replenishSearch: string;
    setReplenishSearch: (val: string) => void;
    replenishFilter: 'all' | 'critical' | 'low' | 'optimal';
    setReplenishFilter: (val: 'all' | 'critical' | 'low' | 'optimal') => void;
    isReplenishFilterDropdownOpen: boolean;
    setIsReplenishFilterDropdownOpen: (val: boolean) => void;
    replenishSortBy: 'urgency' | 'stock' | 'name';
    setReplenishSortBy: (val: 'urgency' | 'stock' | 'name') => void;
    isReplenishSortDropdownOpen: boolean;
    setIsReplenishSortDropdownOpen: (val: boolean) => void;
    selectedReplenishItems: Set<string>;
    setSelectedReplenishItems: (val: Set<string>) => void;
    isSubmitting: boolean;
    setIsSubmitting: (val: boolean) => void;
    wmsJobsService: any;
    addNotification: (type: 'alert' | 'success' | 'info', message: string) => void;
    activeSite: any;
}

export const ReplenishHeader: React.FC<ReplenishHeaderProps> = ({
    viewMode = 'Process',
    setViewMode,
    filteredProducts,
    products,
    replenishSearch,
    setReplenishSearch,
    replenishFilter,
    setReplenishFilter,
    isReplenishFilterDropdownOpen,
    setIsReplenishFilterDropdownOpen,
    replenishSortBy,
    setReplenishSortBy,
    isReplenishSortDropdownOpen,
    setIsReplenishSortDropdownOpen,
    selectedReplenishItems,
    setSelectedReplenishItems,
    isSubmitting,
    setIsSubmitting,
    wmsJobsService,
    addNotification,
    activeSite
}) => {
    const { t } = useLanguage();
    const alertCount = filteredProducts.filter(p => p.stock < (p.minStock || 10)).length;

    const getFilterLabel = (filter: 'all' | 'critical' | 'low' | 'optimal', isArchive: boolean = false) => {
        switch (filter) {
            case 'all':
                return isArchive ? t('warehouse.allArchives') : t('warehouse.allLevels');
            case 'critical':
                return t('warehouse.critical');
            case 'low':
                return t('warehouse.low');
            case 'optimal':
                return t('warehouse.optimal');
            default:
                return filter;
        }
    };

    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-2 sm:p-5 shadow-xs mb-2">
            {/* Mobile compact top row */}
            <div className="flex sm:hidden items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                    <RefreshCw size={14} className="text-[var(--theme-accent)] shrink-0" />
                    <span className="text-xs font-bold text-[var(--theme-text-primary)] truncate">
                        {t('warehouse.replenish')}
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)] shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-status-warning-bg)]" />
                        {t('warehouse.alertsCount', { count: alertCount })}
                    </span>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 sm:gap-4">
                <div className="hidden sm:flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-accent)] shrink-0">
                        <RefreshCw size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-[var(--theme-text-primary)] tracking-tight uppercase">
                            {t('warehouse.replenishmentMatrix')}
                        </h3>
                        <p className="text-xs text-[var(--theme-text-secondary)] font-medium flex items-center gap-2">
                            <span>{t('warehouse.forwardPickHub')}</span>
                            <span className="w-1 h-1 rounded-full bg-[var(--theme-border)]" />
                            <span className="font-mono tabular-nums text-[var(--theme-accent)] font-semibold">
                                {t('warehouse.alertsCount', { count: alertCount })}
                            </span>
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    {/* View Mode Segmented Control */}
                    {setViewMode && (
                        <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] p-0.5 sm:p-1 rounded-lg sm:rounded-xl flex items-center">
                            <button
                                onClick={() => setViewMode('Process')}
                                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors min-h-[30px] sm:min-h-[36px] ${
                                    viewMode === 'Process'
                                        ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs'
                                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                                }`}
                            >
                                {t('warehouse.processMode')}
                            </button>
                            <button
                                onClick={() => setViewMode('History')}
                                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors min-h-[30px] sm:min-h-[36px] ${
                                    viewMode === 'History'
                                        ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs'
                                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                                }`}
                            >
                                {t('warehouse.historyMode')}
                            </button>
                        </div>
                    )}

                    {viewMode === 'Process' && (
                        <>
                            {/* Status Filter Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsReplenishFilterDropdownOpen(!isReplenishFilterDropdownOpen)}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-[var(--theme-bg-card)] rounded-xl border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider transition-colors min-h-[44px]"
                                >
                                    <Filter size={14} className={replenishFilter !== 'all' ? 'text-[var(--theme-accent)]' : 'text-[var(--theme-text-secondary)]'} />
                                    <span>{getFilterLabel(replenishFilter)}</span>
                                    <ChevronDown size={14} className={`transition-transform duration-200 text-[var(--theme-text-secondary)] ${isReplenishFilterDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isReplenishFilterDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-[50]" onClick={() => setIsReplenishFilterDropdownOpen(false)} />
                                        <div className="absolute top-full left-0 mt-2 w-48 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-1.5 shadow-xl z-[51] animate-in fade-in zoom-in-95 duration-150">
                                            {(['all', 'critical', 'low', 'optimal'] as const).map(filter => (
                                                <button
                                                    key={filter}
                                                    onClick={() => {
                                                        setReplenishFilter(filter);
                                                        setIsReplenishFilterDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between uppercase tracking-wider min-h-[38px] ${
                                                        replenishFilter === filter
                                                            ? 'bg-[var(--theme-accent)] text-white'
                                                            : 'text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-subtle)] hover:text-[var(--theme-text-primary)]'
                                                    }`}
                                                >
                                                    {getFilterLabel(filter, true)}
                                                    {replenishFilter === filter && <CheckCircle size={14} />}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Sort Dropdown */}
                            <SortDropdown
                                label={t('warehouse.sortByLabel') || 'Sort'}
                                options={[
                                    { id: 'urgency' as const, label: t('warehouse.urgency'), icon: <AlertTriangle size={14} /> },
                                    { id: 'stock' as const, label: t('warehouse.stock'), icon: <Box size={14} /> },
                                    { id: 'name' as const, label: t('warehouse.name'), icon: <Hash size={14} /> }
                                ]}
                                value={replenishSortBy}
                                onChange={(val) => setReplenishSortBy(val)}
                                isOpen={isReplenishSortDropdownOpen}
                                setIsOpen={setIsReplenishSortDropdownOpen}
                            />

                            {/* Bulk Actions */}
                            <button
                                onClick={() => {
                                    const lowStock = filteredProducts.filter(p => p.stock < (p.minStock || 10));
                                    setSelectedReplenishItems(new Set(lowStock.map(p => p.id)));
                                    addNotification('info', t('warehouse.selectedForOptimization', { count: lowStock.length }));
                                }}
                                className="px-3.5 py-2 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] hover:bg-[var(--theme-bg-card)] rounded-xl text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider transition-colors min-h-[44px]"
                            >
                                {t('warehouse.selectLowStock')}
                            </button>
                            <button
                                disabled={selectedReplenishItems.size === 0 || isSubmitting}
                                onClick={async () => {
                                    setIsSubmitting(true);
                                    try {
                                        let createdCount = 0;
                                        for (const id of Array.from(selectedReplenishItems)) {
                                            const p = products.find(prod => prod.id === id);
                                            if (!p) continue;
                                            const restockQty = Math.min((p.maxStock || 100) - p.stock, 50);
                                            if (restockQty <= 0) continue;

                                            const job: WMSJob = {
                                                id: `REP-${Date.now()}-${createdCount}`,
                                                siteId: activeSite?.id || '',
                                                site_id: activeSite?.id,
                                                sourceSiteId: activeSite?.id || '',
                                                source_site_id: activeSite?.id,
                                                destSiteId: activeSite?.id || '',
                                                dest_site_id: activeSite?.id,
                                                type: 'REPLENISH',
                                                status: 'Pending',
                                                priority: p.stock === 0 ? 'Critical' : p.stock < (p.minStock || 10) / 2 ? 'High' : 'Normal',
                                                location: p.location || 'Warehouse Floor',
                                                assignedTo: '',
                                                items: 1,
                                                lineItems: [{
                                                    productId: p.id,
                                                    sku: p.sku,
                                                    name: p.name,
                                                    image: p.image,
                                                    expectedQty: restockQty,
                                                    pickedQty: 0,
                                                    status: 'Pending'
                                                }],
                                                jobNumber: (p.sku || 'UNKNOWN').toUpperCase(),
                                                orderRef: `REPLENISH-${p.sku}`
                                            };
                                            await wmsJobsService.create(job);
                                            createdCount++;
                                        }
                                        addNotification('success', t('warehouse.initializedSequences', { count: createdCount }));
                                        setSelectedReplenishItems(new Set());
                                    } finally {
                                        setIsSubmitting(false);
                                    }
                                }}
                                className="px-4 py-2 bg-[var(--theme-accent)] hover:opacity-90 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-opacity flex items-center gap-2 min-h-[44px] shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                                {isSubmitting ? t('warehouse.processingProgress') : t('warehouse.executeCount', { count: selectedReplenishItems.size })}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Search Hub */}
            <div className="mt-4 relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--theme-text-secondary)]">
                    <Search size={16} />
                </div>
                <input
                    type="text"
                    placeholder={t('warehouse.scanInventoryPlaceholder')}
                    aria-label={t('warehouse.scanOrSearchInventory')}
                    title={t('warehouse.scanOrSearchInventory')}
                    value={replenishSearch}
                    onChange={(e) => setReplenishSearch(e.target.value)}
                    className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] focus:border-[var(--theme-accent)] rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)]/50 outline-none transition-colors min-h-[44px]"
                />
            </div>
        </div>
    );
};
