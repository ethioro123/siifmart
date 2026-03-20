import React from 'react';
import { RefreshCw, Search, Filter, ChevronDown, CheckCircle, Box, AlertTriangle, Hash, Zap, Loader2 } from 'lucide-react';
import { SortDropdown } from '../FulfillmentShared';
import { WMSJob, Product, Site } from '../../../types';

interface ReplenishHeaderProps {
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
    return (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyber-primary/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-cyber-primary/20 rounded-2xl shadow-[0_0_15px_rgba(0,255,157,0.2)]">
                        <RefreshCw className="text-cyber-primary animate-spin [animation-duration:3s]" size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight uppercase">Replenishment Matrix</h3>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                            Forward Pick Optimization Hub
                            <span className="w-1 h-1 rounded-full bg-cyber-primary"></span>
                            {filteredProducts.filter(p => p.stock < (p.minStock || 10)).length} Alerts
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Status Filter Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsReplenishFilterDropdownOpen(!isReplenishFilterDropdownOpen)}
                            className="flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 text-[10px] font-black text-gray-400 hover:text-white transition-all whitespace-nowrap uppercase tracking-widest"
                        >
                            <Filter size={14} className={replenishFilter !== 'all' ? 'text-cyber-primary' : ''} />
                            <span>STATUS: {replenishFilter === 'all' ? 'ALL STOCK LEVELS' : replenishFilter.toUpperCase()}</span>
                            <ChevronDown size={14} className={`transition-transform duration-300 ${isReplenishFilterDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isReplenishFilterDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-[50]" onClick={() => setIsReplenishFilterDropdownOpen(false)} />
                                <div className="absolute top-full left-0 mt-2 w-56 bg-[#0a0a0b]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl z-[51] animate-in fade-in slide-in-from-top-2 duration-200">
                                    {['all', 'critical', 'low', 'optimal'].map(filter => (
                                        <button
                                            key={filter}
                                            onClick={() => {
                                                setReplenishFilter(filter as any);
                                                setIsReplenishFilterDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-black transition-all flex items-center justify-between group uppercase tracking-widest ${replenishFilter === filter
                                                ? 'bg-cyber-primary text-black'
                                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                                }`}
                                        >
                                            {filter === 'all' ? 'ALL ARCHIVES' : filter.toUpperCase()}
                                            {replenishFilter === filter && <CheckCircle size={12} />}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Sort Dropdown */}
                    <SortDropdown
                        label="Sort"
                        options={[
                            { id: 'urgency' as const, label: 'Urgency', icon: <AlertTriangle size={12} /> },
                            { id: 'stock' as const, label: 'Stock', icon: <Box size={12} /> },
                            { id: 'name' as const, label: 'Name', icon: <Hash size={12} /> }
                        ]}
                        value={replenishSortBy}
                        onChange={(val) => setReplenishSortBy(val)}
                        isOpen={isReplenishSortDropdownOpen}
                        setIsOpen={setIsReplenishSortDropdownOpen}
                    />

                    {/* Bulk Actions */}
                    <div className="flex gap-2 h-full">
                        <button
                            onClick={() => {
                                const lowStock = filteredProducts.filter(p => p.stock < (p.minStock || 10));
                                setSelectedReplenishItems(new Set(lowStock.map(p => p.id)));
                                addNotification('info', `Selected ${lowStock.length} items for optimization`);
                            }}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10 transition-all active:scale-95"
                        >
                            Select Low Stock
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
                                            type: 'PUTAWAY', // Note: Original code used PUTAWAY for bulk action but REPLENISH for single action? Need to verify intent. Keeping as per original logic.
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
                                    addNotification('success', `Initialized ${createdCount} Optimization Sequences`);
                                    setSelectedReplenishItems(new Set());
                                } finally {
                                    setIsSubmitting(false);
                                }
                            }}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 ${selectedReplenishItems.size > 0
                                ? 'bg-cyber-primary text-black shadow-[0_0_20px_rgba(0,255,157,0.3)]'
                                : 'bg-white/5 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                            {isSubmitting ? 'Processing...' : `Execute ${selectedReplenishItems.size} Tasks`}
                        </button>
                    </div>
                </div>
            </div>

            {/* Search Hub */}
            <div className="mt-6 flex-1 relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search size={14} className="text-gray-500 group-focus-within:text-cyber-primary transition-colors" />
                </div>
                <input
                    type="text"
                    placeholder="Scan Product Barcode or Search Inventory Matrix..."
                    value={replenishSearch}
                    onChange={(e) => setReplenishSearch(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-white text-[11px] font-black tracking-widest uppercase focus:border-cyber-primary/50 focus:bg-black/60 outline-none transition-all placeholder:text-gray-700"
                />
            </div>
        </div>
    );
};
