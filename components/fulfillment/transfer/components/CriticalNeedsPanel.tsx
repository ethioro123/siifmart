import React from 'react';
import { RefreshCw, X, Search, Store, AlertTriangle, AlertCircle, ArrowUpRight } from 'lucide-react';
import { ProgressBar } from '../../../shared/ProgressBar';
import { Site } from '../../../../types';

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
        <div className="lg:w-[55%] xl:w-[58%] bg-white/70 dark:bg-[#161F1A]/80 border-r border-[#E2DCCE] dark:border-white/10 flex flex-col h-full overflow-hidden">
            {/* Header & Controls */}
            <div className="p-4 md:p-6 border-b border-[#E2DCCE] dark:border-white/10 flex flex-col gap-4 bg-[#FAF8F5]/60 dark:bg-[#1A231E]/60 backdrop-blur-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-7 bg-[#2C5E3B] dark:bg-[#A9CBA2] rounded-full shadow-sm" />
                        <div>
                            <h3 className="text-sm md:text-base font-black text-stone-900 dark:text-white uppercase tracking-tight">Store Stock Gaps</h3>
                            <p className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-widest font-bold">Select a store gap to stage replenishment</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        <div className="px-3 py-1 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/15 text-[#2C5E3B] dark:text-[#A9CBA2] rounded-xl text-[10px] font-black border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/30 shadow-xs">
                            {distHubLowStockItems.length} Needs Found
                        </div>
                        <button
                            onClick={fetchDistHubData}
                            disabled={distHubLoading}
                            className="p-2 bg-white dark:bg-white/5 hover:bg-stone-100 dark:hover:bg-white/10 rounded-xl text-stone-600 dark:text-stone-300 transition-all active:scale-95 border border-[#E2DCCE] dark:border-white/10 shadow-xs"
                            title="Rescan Network Gaps"
                            aria-label="Rescan Network Gaps"
                        >
                            <RefreshCw size={14} className={`${distHubLoading ? 'animate-spin text-[#2C5E3B] dark:text-[#A9CBA2]' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Search & Store Filters */}
                <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="flex-1 relative">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" />
                        <input
                            type="text"
                            placeholder="Search by product, SKU, or store..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            aria-label="Search needs"
                            className="w-full bg-white dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] transition-all font-sans shadow-xs"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                title="Clear search"
                                aria-label="Clear search"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-white"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <select
                            value={filterStoreId}
                            onChange={(e) => setFilterStoreId(e.target.value)}
                            title="Filter by destination store"
                            aria-label="Filter by destination store"
                            className="bg-white dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3 py-2 text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] transition-all font-bold shadow-xs cursor-pointer"
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
                <div className="flex items-center gap-1 bg-stone-200/60 dark:bg-black/40 border border-[#E2DCCE] dark:border-white/5 rounded-xl p-1 self-start">
                    <button
                        onClick={() => setFilterStatus('ALL')}
                        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                            filterStatus === 'ALL'
                                ? 'bg-white dark:bg-[#2C5E3B] text-stone-900 dark:text-white shadow-xs'
                                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
                        }`}
                    >
                        All ({distHubLowStockItems.length})
                    </button>
                    <button
                        onClick={() => setFilterStatus('CRITICAL')}
                        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                            filterStatus === 'CRITICAL'
                                ? 'bg-red-500 text-white shadow-xs'
                                : 'text-stone-500 hover:text-red-500'
                        }`}
                    >
                        <AlertCircle size={10} />
                        Critical ({distHubLowStockItems.filter(item => (item.stock / (item.minStock || 1)) <= 0.3).length})
                    </button>
                    <button
                        onClick={() => setFilterStatus('LOW')}
                        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                            filterStatus === 'LOW'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'text-stone-500 hover:text-amber-600'
                        }`}
                    >
                        <AlertTriangle size={10} />
                        Low Stock ({distHubLowStockItems.filter(item => (item.stock / (item.minStock || 1)) > 0.3).length})
                    </button>
                </div>
            </div>

            {/* List of Store Needs */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar relative">
                {filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <Store size={36} className="text-stone-300 dark:text-stone-600 mb-3" />
                        <p className="text-xs uppercase font-black tracking-widest text-stone-400 dark:text-stone-500">No matching store gaps</p>
                        <p className="text-[10px] text-stone-400 dark:text-stone-600 mt-1">All stores are within healthy safety stock levels.</p>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {filteredItems.map(item => {
                            const isSelected = distHubSelectedSku === item.sku && distHubSelectedDestSite === (item.siteId || item.site_id);
                            const stockRatio = item.stock / (item.minStock || 1);
                            const isCritical = stockRatio <= 0.3;
                            const siteName = sites.find(s => s.id === (item.siteId || item.site_id))?.name || 'Local Store';
                            const deficit = Math.max(0, (item.minStock * 2) - item.stock);

                            return (
                                <button
                                    key={`${item.id}-${item.sku}`}
                                    onClick={() => handleSelectLowStockProduct(item)}
                                    title={`Select ${item.name} for distribution`}
                                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 relative group active:scale-[0.99] ${
                                        isSelected
                                            ? 'bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 border-[#2C5E3B] dark:border-[#A9CBA2] shadow-md ring-2 ring-[#2C5E3B]/20 dark:ring-[#A9CBA2]/20'
                                            : 'bg-white dark:bg-[#1C2620] border-[#E2DCCE] dark:border-white/5 hover:border-[#2C5E3B]/40 dark:hover:border-[#A9CBA2]/30 shadow-xs'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        {/* Product Details */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className="text-[10px] font-mono font-black text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-white/10 px-2 py-0.5 rounded-md">
                                                    {item.sku}
                                                </span>
                                                <span className="text-[10px] font-black text-[#2C5E3B] dark:text-[#A9CBA2] uppercase tracking-wide flex items-center gap-1">
                                                    <Store size={10} />
                                                    {siteName}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border ${
                                                    isCritical
                                                        ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20'
                                                        : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                                                }`}>
                                                    {isCritical ? 'CRITICAL (≤30%)' : 'LOW STOCK'}
                                                </span>
                                            </div>
                                            <p className="text-xs md:text-sm font-black text-stone-900 dark:text-white uppercase tracking-tight truncate leading-snug">
                                                {item.name}
                                            </p>
                                        </div>

                                        {/* Deficit Badge & Action Arrow */}
                                        <div className="flex flex-col items-end shrink-0">
                                            <span className="text-[9px] font-mono font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest leading-none mb-1">
                                                Deficit Gap
                                            </span>
                                            <div className="px-2 py-1 bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 rounded-lg text-xs font-mono font-black tabular-nums">
                                                +{deficit} units
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stock Progress Bar */}
                                    <div className="mt-3 pt-3 border-t border-[#E2DCCE]/60 dark:border-white/5 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-stone-600 dark:text-stone-300">
                                            <span className="text-[10px] text-stone-400 dark:text-stone-500 uppercase tracking-wider">Current:</span>
                                            <span className={isCritical ? 'text-red-600 dark:text-red-400 font-black' : 'text-amber-600 dark:text-amber-400 font-black'}>
                                                {item.stock}
                                            </span>
                                            <span className="text-stone-300 dark:text-stone-600">/</span>
                                            <span className="text-stone-500 dark:text-stone-400 text-[11px]">
                                                {item.minStock} min
                                            </span>
                                        </div>

                                        <div className="flex-1 max-w-[140px] h-2 rounded-full bg-stone-100 dark:bg-black/40 overflow-hidden border border-[#E2DCCE] dark:border-white/5">
                                            <ProgressBar
                                                progress={Math.min(100, (item.stock / (item.minStock || 1)) * 100)}
                                                containerClassName="h-full w-full bg-transparent"
                                                fillClassName={`h-full ${isCritical ? 'bg-red-500' : 'bg-amber-500'}`}
                                            />
                                        </div>

                                        <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider ${
                                            isSelected ? 'text-[#2C5E3B] dark:text-[#A9CBA2]' : 'text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200'
                                        }`}>
                                            <span>{isSelected ? 'Configuring' : 'Allocate'}</span>
                                            <ArrowUpRight size={12} className={isSelected ? 'rotate-45 transition-transform' : ''} />
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

