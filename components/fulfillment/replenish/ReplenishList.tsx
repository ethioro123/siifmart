import React from 'react';
import { RefreshCw, MapPin, AlertTriangle, Plus, Loader2, CheckCircle, Package, ChevronDown } from 'lucide-react';
import Pagination from '../../shared/Pagination';
import { Product, WMSJob } from '../../../types';

interface ReplenishListProps {
    sortedReplenishItems: Product[];
    paginatedReplenishItems: Product[];
    replenishCurrentPage: number;
    replenishTotalPages: number;
    REPLENISH_ITEMS_PER_PAGE: number;
    setReplenishCurrentPage: (page: number) => void;
    selectedReplenishItems: Set<string>;
    setSelectedReplenishItems: (val: Set<string>) => void;
    expandedReplenishItem: string | null;
    setExpandedReplenishItem: (val: string | null) => void;
    creatingReplenishTask: string | null;
    setCreatingReplenishTask: (val: string | null) => void;
    sales: any[];
    wmsJobsService: any;
    addNotification: (type: 'alert' | 'success' | 'info', message: string) => void;
    activeSite: any;
}

export const ReplenishList: React.FC<ReplenishListProps> = ({
    sortedReplenishItems,
    paginatedReplenishItems,
    replenishCurrentPage,
    replenishTotalPages,
    REPLENISH_ITEMS_PER_PAGE,
    setReplenishCurrentPage,
    selectedReplenishItems,
    setSelectedReplenishItems,
    expandedReplenishItem,
    setExpandedReplenishItem,
    creatingReplenishTask,
    setCreatingReplenishTask,
    sales,
    wmsJobsService,
    addNotification,
    activeSite
}) => {
    return (
        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
            {paginatedReplenishItems.map(p => {
                const isExpanded = expandedReplenishItem === p.id;
                const isChecked = selectedReplenishItems.has(p.id);
                const minStock = p.minStock || 10;
                const maxStock = p.maxStock || 100;
                const restockQty = Math.min(maxStock - p.stock, 50);

                let urgencyLabel = 'Stable';
                let urgencyBadgeClass = 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';

                if (p.stock === 0) {
                    urgencyLabel = 'Critical';
                    urgencyBadgeClass = 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
                } else if (p.stock < minStock / 2) {
                    urgencyLabel = 'High';
                    urgencyBadgeClass = 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
                } else if (p.stock < minStock) {
                    urgencyLabel = 'Low';
                    urgencyBadgeClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
                }

                return (
                    <div
                        key={p.id}
                        className={`bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl transition-colors overflow-hidden shadow-sm ${
                            isExpanded ? 'ring-1 ring-[var(--theme-accent)]/30' : 'hover:border-[var(--theme-accent)]/30'
                        }`}
                    >
                        {/* Header Row */}
                        <div
                            className="p-4 flex items-center justify-between cursor-pointer gap-3"
                            onClick={() => setExpandedReplenishItem(isExpanded ? null : p.id)}
                        >
                            <div className="flex items-center gap-3.5 min-w-0">
                                {/* Checkbox */}
                                <div
                                    className="relative cursor-pointer shrink-0"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const next = new Set(selectedReplenishItems);
                                        if (isChecked) next.delete(p.id); else next.add(p.id);
                                        setSelectedReplenishItems(next);
                                    }}
                                >
                                    <div
                                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors min-w-[24px] ${
                                            isChecked
                                                ? 'bg-[var(--theme-accent)] border-[var(--theme-accent)] text-white'
                                                : 'border-[var(--theme-border)] bg-[var(--theme-bg-subtle)]'
                                        }`}
                                    >
                                        {isChecked && <CheckCircle size={14} className="text-white" />}
                                    </div>
                                </div>

                                {/* Thumbnail */}
                                <div className="w-12 h-12 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] overflow-hidden flex items-center justify-center shrink-0">
                                    {p.image && !p.image.includes('placeholder.com') ? (
                                        <img
                                            src={p.image}
                                            alt=""
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <Package size={22} className="text-[var(--theme-text-secondary)]/50" />
                                    )}
                                </div>

                                {/* Title & Details */}
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-[var(--theme-text-primary)] tracking-tight leading-snug mb-1 uppercase truncate">
                                        {p.name}
                                    </p>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[11px] font-mono tabular-nums text-[var(--theme-text-secondary)] font-medium uppercase">
                                            {p.sku}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-[var(--theme-border)]" />
                                        <span className="text-[11px] font-mono tabular-nums text-[var(--theme-accent)] font-semibold bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] px-2 py-0.5 rounded-md uppercase">
                                            {p.location || 'FLOOR-X'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right side indicators */}
                            <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                                <div className="hidden sm:flex flex-col items-end">
                                    <p className="text-[11px] text-[var(--theme-text-secondary)] font-medium uppercase tracking-wider mb-1">
                                        Status
                                    </p>
                                    <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${urgencyBadgeClass}`}>
                                        {urgencyLabel}
                                    </span>
                                </div>

                                <div className="text-right">
                                    <p className="text-[11px] text-[var(--theme-text-secondary)] font-medium uppercase tracking-wider mb-1">
                                        Stock Level
                                    </p>
                                    <div className="flex items-baseline gap-1 justify-end font-mono tabular-nums">
                                        <span className={`text-lg sm:text-xl font-bold ${p.stock < minStock ? 'text-amber-500' : 'text-[var(--theme-text-primary)]'}`}>
                                            {p.stock}
                                        </span>
                                        <span className="text-xs text-[var(--theme-text-secondary)] font-medium">/ {minStock}</span>
                                    </div>
                                </div>

                                <div className={`w-8 h-8 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-secondary)] transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>
                                    <ChevronDown size={16} />
                                </div>
                            </div>
                        </div>

                        {/* Details Intelligence Dashboard */}
                        {isExpanded && (
                            <div className="px-4 pb-4 pt-2 border-t border-[var(--theme-border)] bg-[var(--theme-bg-subtle)]/30 animate-in slide-in-from-top-2 duration-200">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                                    <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl p-3.5 shadow-sm">
                                        <p className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                            <RefreshCw size={12} className="text-[var(--theme-accent)]" /> Optimization Strategy
                                        </p>
                                        <p className="text-xs text-[var(--theme-text-primary)] font-semibold mb-1">
                                            Target Restock: <span className="text-[var(--theme-accent)] font-mono tabular-nums">+{restockQty} Units</span>
                                        </p>
                                        <p className="text-[11px] text-[var(--theme-text-secondary)]">Auto-calculated ({maxStock} unit ceiling)</p>
                                    </div>

                                    <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl p-3.5 shadow-sm">
                                        <p className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                            <MapPin size={12} className="text-[var(--theme-accent)]" /> Source Location
                                        </p>
                                        <p className="text-xs text-[var(--theme-text-primary)] font-semibold mb-1">
                                            Bulk Storage: <span className="text-[var(--theme-accent)] font-mono tabular-nums">ZONE-B-041</span>
                                        </p>
                                        <p className="text-[11px] text-[var(--theme-text-secondary)]">Standard warehouse pallets</p>
                                    </div>

                                    <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl p-3.5 shadow-sm">
                                        <p className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                            <AlertTriangle size={12} className="text-amber-500" /> Velocity Alerts
                                        </p>
                                        {(() => {
                                            const pendingOrders = sales.filter(s =>
                                                s.status !== 'Completed' &&
                                                s.items?.some((item: any) => item.productId === p.id)
                                            ).length;
                                            return (
                                                <>
                                                    <p className="text-xs text-[var(--theme-text-primary)] font-semibold mb-1">
                                                        Status: <span className={pendingOrders > 0 ? 'text-amber-500' : 'text-green-500'}>{pendingOrders > 0 ? 'BACKLOGGED' : 'STABLE'}</span>
                                                    </p>
                                                    <p className="text-[11px] text-[var(--theme-text-secondary)] font-mono tabular-nums">{pendingOrders} orders awaiting resupply</p>
                                                </>
                                            );
                                        })()}
                                    </div>

                                    <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl p-3.5 shadow-sm flex flex-col justify-center items-center">
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                setCreatingReplenishTask(p.id);
                                                try {
                                                    const job: WMSJob = {
                                                        id: `REP-${Date.now()}`,
                                                        siteId: activeSite?.id || '',
                                                        site_id: activeSite?.id,
                                                        sourceSiteId: activeSite?.id || '',
                                                        source_site_id: activeSite?.id,
                                                        destSiteId: activeSite?.id || '',
                                                        dest_site_id: activeSite?.id,
                                                        type: 'REPLENISH',
                                                        status: 'Pending',
                                                        priority: urgencyLabel as any,
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
                                                    addNotification('success', `Sequence Initialized for ${p.sku}`);
                                                } finally {
                                                    setCreatingReplenishTask(null);
                                                }
                                            }}
                                            className="w-full bg-[var(--theme-accent)] hover:opacity-90 text-white rounded-xl text-xs font-semibold py-2.5 px-3 min-h-[44px] flex items-center justify-center gap-2 shadow-sm transition-opacity"
                                        >
                                            {creatingReplenishTask === p.id ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                            <span>Initialize Optimization</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            {sortedReplenishItems.length > 0 && (
                <div className="pt-2">
                    <Pagination
                        currentPage={replenishCurrentPage}
                        totalPages={replenishTotalPages}
                        totalItems={sortedReplenishItems.length}
                        itemsPerPage={REPLENISH_ITEMS_PER_PAGE}
                        onPageChange={setReplenishCurrentPage}
                        isLoading={false}
                        itemName="items"
                    />
                </div>
            )}

            {sortedReplenishItems.length === 0 && (
                <div className="py-16 px-4 flex flex-col items-center justify-center text-center bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl shadow-sm">
                    <div className="w-14 h-14 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mb-3 text-green-500">
                        <CheckCircle size={28} />
                    </div>
                    <h3 className="text-base font-bold text-[var(--theme-text-primary)] uppercase tracking-tight">System Optimized</h3>
                    <p className="text-xs text-[var(--theme-text-secondary)] font-medium max-w-sm mt-1">No replenishment required for the current inventory cycle.</p>
                </div>
            )}
        </div>
    );
};
