import React from 'react';
import { RefreshCw, X, Search, Store, AlertTriangle, AlertCircle, ArrowUpRight } from 'lucide-react';
import { ProgressBar } from '../../../shared/ProgressBar';
import { Site } from '../../../../types';
import { formatTransferStock, getTransferQuantityConfig } from '../transferQuantity';

interface CriticalNeedsPanelProps {
    filteredItems: any[];
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    filterStoreId: string;
    setFilterStoreId: (val: string) => void;
    filterStatus: 'ALL' | 'CRITICAL' | 'LOW';
    setFilterStatus: (val: 'ALL' | 'CRITICAL' | 'LOW') => void;
    distHubLowStockItems: any[];
    distHubLoading: boolean;
    fetchDistHubData: () => Promise<void>;
    distHubSelectedSku: string;
    distHubSelectedDestSite: string;
    handleSelectLowStockProduct: (item: any) => void;
    sites: Site[];
}

export const CriticalNeedsPanel: React.FC<CriticalNeedsPanelProps> = ({
    filteredItems,
    searchQuery,
    setSearchQuery,
    filterStoreId,
    setFilterStoreId,
    filterStatus,
    setFilterStatus,
    distHubLowStockItems,
    distHubLoading,
    fetchDistHubData,
    distHubSelectedSku,
    distHubSelectedDestSite,
    handleSelectLowStockProduct,
    sites
}) => {
    return (
        <div className="lg:w-[55%] xl:w-[58%] bg-[var(--theme-bg-card)] border-r border-[var(--theme-border)] flex flex-col h-full overflow-hidden">
            {/* Header & Controls */}
            <div className="p-4 md:p-5 border-b border-[var(--theme-border)] flex flex-col gap-3.5 bg-[var(--theme-bg-subtle)] shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-1.5 h-6 bg-primary rounded-full" />
                        <div>
                            <h3 className="text-sm md:text-base font-bold text-[var(--theme-text-primary)] tracking-tight">Store Stock Gaps</h3>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase tracking-wider font-semibold">Select a store gap to stage replenishment</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        <div className="px-3 py-1 bg-primary/10 text-primary rounded-xl text-[11px] font-semibold border border-primary/20 shadow-xs tabular-nums">
                            {distHubLowStockItems.length} Needs Found
                        </div>
                        <button
                            onClick={fetchDistHubData}
                            disabled={distHubLoading}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-all active:scale-95 border border-[var(--theme-border)] shadow-xs touch-manipulation"
                            title="Rescan Network Gaps"
                            aria-label="Rescan Network Gaps"
                        >
                            <RefreshCw size={15} className={`${distHubLoading ? 'animate-spin text-primary' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Search & Store Filters */}
                <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="flex-1 relative">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)]" />
                        <input
                            type="text"
                            placeholder="Search by product, SKU, or store..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            aria-label="Search needs"
                            className="w-full min-h-[44px] bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl pl-10 pr-9 py-2 text-xs text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)] focus:outline-none focus:border-primary transition-all font-sans shadow-xs touch-manipulation"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                title="Clear search"
                                aria-label="Clear search"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <select
                            value={filterStoreId}
                            onChange={(e) => setFilterStoreId(e.target.value)}
                            title="Filter by destination store"
                            aria-label="Filter by destination store"
                            className="min-h-[44px] bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs text-[var(--theme-text-primary)] focus:outline-none focus:border-primary transition-all font-semibold shadow-xs cursor-pointer touch-manipulation"
                        >
                            <option value="ALL">All Stores ({Array.from(new Set(distHubLowStockItems.map(item => item.siteId || item.site_id))).length})</option>
                            {Array.from(new Set(distHubLowStockItems.map(item => item.siteId || item.site_id))).map(storeId => {
                                const name = sites.find(s => s.id === storeId)?.name || 'Store';
                                return <option key={storeId} value={storeId}>{name}</option>;
                            })}
                        </select>
                    </div>
                </div>

                {/* Severity Filters */}
                <div className="flex items-center gap-1 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl p-1 self-start">
                    <button
                        onClick={() => setFilterStatus('ALL')}
                        className={`min-h-[36px] px-3 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-all touch-manipulation cursor-pointer ${
                            filterStatus === 'ALL'
                                ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-xs'
                                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                        }`}
                    >
                        All ({distHubLowStockItems.length})
                    </button>
                    <button
                        onClick={() => setFilterStatus('CRITICAL')}
                        className={`min-h-[36px] px-3 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-all flex items-center gap-1 touch-manipulation ${
                            filterStatus === 'CRITICAL'
                                ? 'bg-[var(--theme-status-danger-bg)] text-white shadow-xs'
                                : 'text-[var(--theme-text-secondary)] text-[var(--theme-status-danger-text)]'
                        }`}
                    >
                        <AlertCircle size={12} />
                        Critical ({distHubLowStockItems.filter(item => (item.stock / (item.minStock || 1)) <= 0.3).length})
                    </button>
                    <button
                        onClick={() => setFilterStatus('LOW')}
                        className={`min-h-[36px] px-3 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-all flex items-center gap-1 touch-manipulation ${
                            filterStatus === 'LOW'
                                ? 'bg-[var(--theme-status-warning-bg)] text-white shadow-xs'
                                : 'text-[var(--theme-text-secondary)] text-[var(--theme-status-warning-text)]'
                        }`}
                    >
                        <AlertTriangle size={12} />
                        Low Stock ({distHubLowStockItems.filter(item => (item.stock / (item.minStock || 1)) > 0.3).length})
                    </button>
                </div>
            </div>

            {/* List of Store Needs */}
            <div className="flex-1 overflow-y-auto p-4 md:p-5 custom-scrollbar relative">
                {filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <Store size={36} className="text-[var(--theme-text-secondary)] opacity-40 mb-3" />
                        <p className="text-xs uppercase font-semibold tracking-wider text-[var(--theme-text-secondary)]">No matching store gaps</p>
                        <p className="text-[11px] text-[var(--theme-text-secondary)] opacity-80 mt-1">All stores are within healthy safety stock levels.</p>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {filteredItems.map(item => {
                            const isSelected = distHubSelectedSku === item.sku && distHubSelectedDestSite === (item.siteId || item.site_id);
                            const stockRatio = item.stock / (item.minStock || 1);
                            const isCritical = stockRatio <= 0.3;
                            const siteName = sites.find(s => s.id === (item.siteId || item.site_id))?.name || 'Local Store';
                            const targetStock = item.maxStock > 0 ? item.maxStock * 0.7 : item.minStock * 2;
                            const deficit = Math.max(0, targetStock - item.stock);
                            const quantityUnit = getTransferQuantityConfig(item).quantityLabel;

                            return (
                                <button
                                    key={`${item.id}-${item.sku}`}
                                    onClick={() => handleSelectLowStockProduct(item)}
                                    title={`Select ${item.name} for distribution`}
                                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 relative group active:scale-[0.99] touch-manipulation ${
                                        isSelected
                                            ? 'bg-primary/10 border-primary shadow-sm ring-1 ring-primary/30'
                                            : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] hover:border-primary/40 shadow-xs'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        {/* Product Details */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                <span className="text-[11px] font-mono font-semibold text-[var(--theme-text-primary)] bg-[var(--theme-bg-card)] border border-[var(--theme-border)] px-2 py-0.5 rounded-md">
                                                    {item.sku}
                                                </span>
                                                <span className="text-[11px] font-semibold text-primary uppercase tracking-wide flex items-center gap-1">
                                                    <Store size={12} />
                                                    {siteName}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider border ${
                                                    isCritical
                                                        ? 'bg-[var(--theme-status-danger-bg)] bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] border-[var(--theme-status-danger-border)] border-[var(--theme-status-danger-border)]'
                                                        : 'bg-[var(--theme-status-warning-bg)] bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)] border-[var(--theme-status-warning-border)]'
                                                }`}>
                                                    {isCritical ? 'CRITICAL (≤30%)' : 'LOW STOCK'}
                                                </span>
                                            </div>
                                            <p className="text-xs md:text-sm font-bold text-[var(--theme-text-primary)] truncate leading-snug">
                                                {item.name}
                                            </p>
                                        </div>

                                        {/* Deficit Badge & Action Arrow */}
                                        <div className="flex flex-col items-end shrink-0">
                                            <span className="text-[11px] font-mono font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider leading-none mb-1">
                                                Deficit Gap
                                            </span>
                                            <div className="px-2.5 py-1 bg-[var(--theme-status-warning-bg)] bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] border-[var(--theme-status-warning-border)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] rounded-lg text-xs font-mono font-bold tabular-nums">
                                                +{deficit} {quantityUnit}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stock Progress Bar */}
                                    <div className="mt-3 pt-3 border-t border-[var(--theme-border)] flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[var(--theme-text-secondary)] tabular-nums">
                                            <span className="text-[11px] text-[var(--theme-text-secondary)] uppercase tracking-wider">Current:</span>
                                            <span className={isCritical ? 'text-[var(--theme-status-danger-text)] font-bold' : 'text-[var(--theme-status-warning-text)] font-bold'}>
                                                {formatTransferStock(item.stock, item)}
                                            </span>
                                            <span className="text-[var(--theme-text-secondary)] opacity-50">/</span>
                                            <span className="text-[var(--theme-text-secondary)] text-[11px]">
                                                {item.minStock} {quantityUnit} min
                                            </span>
                                        </div>

                                        <div className="flex-1 max-w-[140px] h-2 rounded-full bg-[var(--theme-bg-card)] overflow-hidden border border-[var(--theme-border)]">
                                            <ProgressBar
                                                progress={Math.min(100, (item.stock / (item.minStock || 1)) * 100)}
                                                containerClassName="h-full w-full bg-transparent"
                                                fillClassName={`h-full ${isCritical ? 'bg-[var(--theme-status-danger-bg)]' : 'bg-[var(--theme-status-warning-bg)]'}`}
                                            />
                                        </div>

                                        <div className={`flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider ${
                                            isSelected ? 'text-primary' : 'text-[var(--theme-text-secondary)] group-hover:text-[var(--theme-text-primary)]'
                                        }`}>
                                            <span>{isSelected ? 'Configuring' : 'Allocate'}</span>
                                            <ArrowUpRight size={14} className={isSelected ? 'rotate-45 transition-transform' : ''} />
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
