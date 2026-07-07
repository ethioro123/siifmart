import React from 'react';
import { RefreshCw, X } from 'lucide-react';
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

export const CriticalNeedsPanel = ({
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
}: CriticalNeedsPanelProps) => {
    return (
        <div className="lg:w-[60%] xl:w-[65%] bg-black/20 border-r border-white/5 flex flex-col h-full overflow-hidden">
            <div className="p-6 border-b border-white/5 flex flex-col gap-4 backdrop-blur-sm bg-black/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse" />
                        <div>
                            <h3 className="text-base font-bold text-white uppercase tracking-wider">Critical Store Needs</h3>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Select target to configure replenishment deployment</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                        <div className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black border border-amber-500/20 shadow-inner">
                            {distHubLowStockItems.length} DETECTED
                        </div>
                        <button
                            onClick={fetchDistHubData}
                            disabled={distHubLoading}
                            className="p-2.5 hover:bg-white/10 rounded-xl text-gray-400 transition-all hover:text-white group active:scale-95 border border-transparent hover:border-white/10"
                            title="Rescan Network Gaps"
                        >
                            <RefreshCw size={14} className={`${distHubLoading ? 'animate-spin text-amber-500' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
                        </button>
                    </div>
                </div>

                {/* Filters and Search bar */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Search needs by product name, SKU, or store..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/40 transition-all font-mono"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                title="Clear search"
                                aria-label="Clear search"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
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
                            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all font-sans"
                        >
                            <option value="ALL">All Stores</option>
                            {Array.from(new Set(distHubLowStockItems.map(item => item.siteId || item.site_id))).map(storeId => {
                                const name = sites.find(s => s.id === storeId)?.name || 'Store';
                                return <option key={storeId} value={storeId}>{name}</option>;
                            })}
                        </select>
                    </div>
                </div>

                {/* Severity Filters */}
                <div className="flex items-center gap-1.5 bg-black/30 border border-white/5 rounded-lg p-0.5 self-start">
                    <button
                        onClick={() => setFilterStatus('ALL')}
                        className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${
                            filterStatus === 'ALL'
                                ? 'bg-white/10 text-white shadow-inner'
                                : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        All ({distHubLowStockItems.length})
                    </button>
                    <button
                        onClick={() => setFilterStatus('CRITICAL')}
                        className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${
                            filterStatus === 'CRITICAL'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/20'
                                : 'text-gray-500 hover:text-red-400'
                        }`}
                    >
                        Critical ({distHubLowStockItems.filter(item => (item.stock / (item.minStock || 1)) <= 0.3).length})
                    </button>
                    <button
                        onClick={() => setFilterStatus('LOW')}
                        className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${
                            filterStatus === 'LOW'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20'
                                : 'text-gray-500 hover:text-amber-400'
                        }`}
                    >
                        Low Stock ({distHubLowStockItems.filter(item => (item.stock / (item.minStock || 1)) > 0.3).length})
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
                {filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                        <p className="text-xs uppercase font-black tracking-widest text-gray-500">No matching needs found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5 border border-white/5 rounded-2xl bg-black/10 overflow-hidden pb-12">
                        {filteredItems.map(item => {
                            const isSelected = distHubSelectedSku === item.sku && distHubSelectedDestSite === (item.siteId || item.site_id);
                            const stockRatio = item.stock / (item.minStock || 1);
                            const isCritical = stockRatio <= 0.3;
                            const siteName = sites.find(s => s.id === (item.siteId || item.site_id))?.name || 'Local Store';

                            return (
                                <button
                                    key={`${item.id}-${item.sku}`}
                                    onClick={() => handleSelectLowStockProduct(item)}
                                    title={`Select ${item.name} for distribution`}
                                    className={`w-full text-left py-3 px-4 flex items-center justify-between transition-all duration-150 relative ${
                                        isSelected
                                            ? 'bg-amber-500/10 border-l-2 border-l-amber-500 shadow-[inset_4px_0_0_0_rgba(245,158,11,1)]'
                                            : 'hover:bg-white/[0.02] border-l-2 border-l-transparent'
                                    }`}
                                >
                                    {/* Column 1: Info */}
                                    <div className="flex-1 min-w-0 pr-4 flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full shrink-0 ${isCritical ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
                                        
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-[9px] font-mono font-bold text-gray-400 bg-white/5 px-1.5 py-0.5 rounded tracking-wider">{item.sku}</span>
                                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider truncate max-w-[150px]">{siteName}</span>
                                            </div>
                                            <div className="text-xs font-bold text-white uppercase tracking-tight truncate leading-tight">{item.name}</div>
                                        </div>
                                    </div>

                                    {/* Column 2: Status Tag */}
                                    <div className="shrink-0 mr-6 hidden sm:block">
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${isCritical ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                            {isCritical ? 'CRITICAL' : 'LOW STOCK'}
                                        </span>
                                    </div>

                                    {/* Column 3: Stock Levels & Progress Bar */}
                                    <div className="flex items-center gap-4 shrink-0">
                                        <div className="text-right shrink-0">
                                            <div className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest leading-none mb-0.5">Stock</div>
                                            <div className="text-xs font-mono font-bold text-white">
                                                <span className={isCritical ? 'text-red-400 font-extrabold' : 'text-amber-400'}>{item.stock}</span>
                                                <span className="text-white/30 mx-0.5">/</span>
                                                <span className="text-white/60">{item.minStock}</span>
                                            </div>
                                        </div>
                                        <div className="w-16 h-1 rounded-full bg-black/50 overflow-hidden border border-white/5 hidden md:block">
                                            <ProgressBar
                                                progress={(item.stock / (item.minStock || 1)) * 100}
                                                containerClassName="h-full w-full bg-transparent"
                                                fillClassName={`h-full ${isCritical ? 'bg-red-500' : 'bg-amber-500'}`}
                                            />
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
