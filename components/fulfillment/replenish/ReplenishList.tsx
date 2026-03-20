import React, { useState } from 'react';
import { RefreshCw, MapIcon, AlertTriangle, Plus, Loader2, CheckCircle, Package, ChevronDown } from 'lucide-react';
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
        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {paginatedReplenishItems.map(p => {
                const isExpanded = expandedReplenishItem === p.id;
                const isChecked = selectedReplenishItems.has(p.id);
                const minStock = p.minStock || 10;
                const maxStock = p.maxStock || 100;
                const restockQty = Math.min(maxStock - p.stock, 50);

                let urgencyColor = 'bg-blue-500';
                let urgencyLabel = 'Stable';
                if (p.stock === 0) {
                    urgencyColor = 'bg-red-500';
                    urgencyLabel = 'Critical';
                } else if (p.stock < minStock / 2) {
                    urgencyColor = 'bg-orange-500';
                    urgencyLabel = 'High';
                } else if (p.stock < minStock) {
                    urgencyColor = 'bg-yellow-500';
                    urgencyLabel = 'Low';
                }

                return (
                    <div
                        key={p.id}
                        className={`group bg-white/[0.02] border border-white/5 rounded-3xl transition-all duration-300 overflow-hidden ${isExpanded ? 'bg-white/[0.07] border-white/10 ring-1 ring-white/10' : 'hover:bg-white/[0.04] hover:border-white/10'
                            }`}
                    >
                        {/* Header Row */}
                        <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedReplenishItem(isExpanded ? null : p.id)}>
                            <div className="flex items-center gap-4">
                                <div className="relative group/check" onClick={(e) => {
                                    e.stopPropagation();
                                    const next = new Set(selectedReplenishItems);
                                    if (isChecked) next.delete(p.id); else next.add(p.id);
                                    setSelectedReplenishItems(next);
                                }}>
                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${isChecked ? 'bg-cyber-primary border-cyber-primary shadow-[0_0_10px_rgba(0,255,157,0.4)]' : 'border-white/10 group-hover:border-white/30'
                                        }`}>
                                        {isChecked && <CheckCircle size={14} className="text-black" />}
                                    </div>
                                </div>

                                <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/5 overflow-hidden ring-1 ring-white/5 group-hover:ring-cyber-primary/30 transition-all flex items-center justify-center">
                                    {p.image && !p.image.includes('placeholder.com') ? (
                                        <img
                                            src={p.image}
                                            alt=""
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                            }}
                                        />
                                    ) : (
                                        <Package size={24} className="text-gray-600" />
                                    )}
                                </div>

                                <div>
                                    <p className="text-sm font-black text-white tracking-tight leading-none mb-1 uppercase">{p.name}</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{p.sku}</span>
                                        <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                                        <span className="text-[9px] text-cyber-primary font-black uppercase tracking-widest">{p.location || 'FLOOR-X'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-8">
                                <div className="hidden sm:flex flex-col items-end">
                                    <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-1">Status Intelligence</p>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${urgencyColor} shadow-[0_0_8px_rgba(255,255,255,0.1)]`} />
                                        <span className={`text-[11px] font-black uppercase tracking-tighter ${urgencyColor.replace('bg-', 'text-')}`}>{urgencyLabel}</span>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-1">Stock Volatility</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-xl font-black ${p.stock < minStock ? 'text-orange-500' : 'text-cyber-primary'}`}>{p.stock}</span>
                                        <span className="text-xs text-gray-600 font-bold">/ {minStock}</span>
                                    </div>
                                </div>

                                <div className={`p-2 rounded-xl bg-white/5 text-gray-600 group-hover:text-white transition-all ${isExpanded ? 'rotate-180 bg-white/10 text-white' : ''}`}>
                                    <ChevronDown size={16} />
                                </div>
                            </div>
                        </div>

                        {/* Details Intelligence Dashboard */}
                        {isExpanded && (
                            <div className="px-5 pb-5 pt-1 border-t border-white/5 animate-in slide-in-from-top-4 duration-500 ease-out">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                                    <div className="bg-black/30 rounded-2xl p-4 border border-white/5 shadow-inner">
                                        <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <RefreshCw size={10} className="text-cyber-primary" /> Optimization Strategy
                                        </p>
                                        <p className="text-xs text-white font-bold mb-1">Target Restock: <span className="text-cyber-primary">+{restockQty} Units</span></p>
                                        <p className="text-[10px] text-gray-500 font-medium">Auto-calculated based on {maxStock} unit ceiling</p>
                                    </div>

                                    <div className="bg-black/30 rounded-2xl p-4 border border-white/5 shadow-inner">
                                        <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <MapIcon size={10} className="text-purple-400" /> Source Intelligence
                                        </p>
                                        <p className="text-xs text-white font-bold mb-1">Bulk Storage: <span className="text-purple-400">ZONE-B-041</span></p>
                                        <p className="text-[10px] text-gray-500 font-medium">Standard pallets only</p>
                                    </div>

                                    <div className="bg-black/30 rounded-2xl p-4 border border-white/5 shadow-inner">
                                        <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <AlertTriangle size={10} className="text-red-400" /> Velocity Alerts
                                        </p>
                                        {(() => {
                                            const pendingOrders = sales.filter(s =>
                                                s.status !== 'Completed' &&
                                                s.items?.some((item: any) => item.productId === p.id)
                                            ).length;
                                            return (
                                                <>
                                                    <p className="text-xs text-white font-bold mb-1">
                                                        Status: <span className={pendingOrders > 0 ? 'text-red-400' : 'text-green-400'}>{pendingOrders > 0 ? 'BACKLOGGED' : 'STABLE'}</span>
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 font-medium">{pendingOrders} orders awaiting resupply</p>
                                                </>
                                            );
                                        })()}
                                    </div>

                                    <div className="bg-black/30 rounded-2xl p-4 border border-white/10 flex flex-col justify-center items-center gap-3">
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
                                            className="w-full bg-cyber-primary/20 hover:bg-cyber-primary/30 text-cyber-primary text-[10px] font-black uppercase py-3 rounded-xl border border-cyber-primary/40 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                                        >
                                            {creatingReplenishTask === p.id ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                                            Initialize Optimization
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            {sortedReplenishItems.length > 0 && (
                <Pagination
                    currentPage={replenishCurrentPage}
                    totalPages={replenishTotalPages}
                    totalItems={sortedReplenishItems.length}
                    itemsPerPage={REPLENISH_ITEMS_PER_PAGE}
                    onPageChange={setReplenishCurrentPage}
                    isLoading={false}
                    itemName="items"
                />
            )}

            {sortedReplenishItems.length === 0 && (
                <div className="h-64 flex flex-col items-center justify-center text-center bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle size={32} className="text-green-500" />
                    </div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">System Optimized</h3>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">No replenishment required for the current cycle</p>
                </div>
            )}
        </div>
    );
};
