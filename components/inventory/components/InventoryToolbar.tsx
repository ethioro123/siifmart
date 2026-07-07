import React from 'react';
import { Search, Map, Package, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Product, Site } from '../../../types';
import Button from '../../shared/Button';

interface InventoryToolbarProps {
    products: Product[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filters: any;
    setFilters: (filters: any) => void;
    activeSite: Site | null;
    isReadOnly: boolean;
    sites: Site[];
    selectedIds: Set<string>;
    setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    handleBulkAction: (action: string) => void;
}

export const InventoryToolbar: React.FC<InventoryToolbarProps> = ({
    products,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    activeSite,
    isReadOnly,
    sites,
    selectedIds,
    setSelectedIds,
    handleBulkAction
}) => {
    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="p-6 border-b border-gray-100 dark:border-white/5 space-y-4 bg-gray-50/50 dark:bg-white/2">
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-2.5 flex-1 focus-within:border-[#2C5E3B]/50 dark:focus-within:border-[#A9CBA2]/50 focus-within:ring-4 focus-within:ring-[#2C5E3B]/10 dark:focus-within:ring-[#A9CBA2]/10 transition-all shadow-inner group">
                        <Search className="w-5 h-5 text-gray-400 dark:text-gray-550 group-focus-within:text-[#2C5E3B] dark:group-focus-within:text-[#A9CBA2] transition-colors" />
                        <input
                            type="text"
                            aria-label="Search"
                            placeholder="Search SKU, Name, or Warehouse Location..."
                            className="bg-transparent border-none ml-3 flex-1 text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 font-medium text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="text-[11px] text-gray-500 font-black uppercase tracking-widest bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/5">
                        {products.length} Records
                    </div>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 pr-4 border-r border-white/5">
                        <SlidersHorizontal size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                        <span className="text-[11px] text-white font-black uppercase tracking-[0.15em]">Filters</span>
                    </div>

                    {(!activeSite || isReadOnly) && (
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <Map size={12} className="text-blue-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <select
                                value={filters.siteId}
                                aria-label="Filter by Site"
                                onChange={(e) => setFilters({ ...filters, siteId: e.target.value })}
                                className="appearance-none bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-8 pr-10 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10 hover:border-blue-500/30 hover:text-gray-900 dark:hover:text-white transition-all min-w-[160px]"
                            >
                                <option value="All">All Locations</option>
                                {sites.filter(s => s.type !== 'Store' && s.type !== 'Administration').map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.type})</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-blue-400 transition-colors pointer-events-none" />
                        </div>
                    )}

                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Package size={12} className="text-[#2C5E3B] dark:text-[#A9CBA2] opacity-60 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <select
                            value={filters.category}
                            aria-label="Filter by Category"
                            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                            className="appearance-none bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-8 pr-10 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10 hover:border-[#2C5E3B]/30 dark:hover:border-[#A9CBA2]/30 hover:text-gray-900 dark:hover:text-white transition-all min-w-[160px]"
                        >
                            <option value="All">All Categories</option>
                            {Array.from(new Set(products.map(p => p.category))).map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors pointer-events-none" />
                    </div>

                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <div className="w-2 h-2 rounded-full border border-green-500/50 group-hover:bg-green-500 transition-all" />
                        </div>
                        <select
                            value={filters.status}
                            aria-label="Filter by Status"
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="appearance-none bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-8 pr-10 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10 hover:border-green-500/30 hover:text-gray-900 dark:hover:text-white transition-all min-w-[140px]"
                        >
                            <option value="All">All Inventory</option>
                            <option value="Active">In Stock</option>
                            <option value="Low Stock">Low Stock</option>
                            <option value="Out of Stock">Out of Stock</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-green-400 transition-colors pointer-events-none" />
                    </div>

                    {(filters.category !== 'All' || filters.status !== 'All' || (filters.abc && filters.abc !== 'All') || filters.siteId !== 'All') && (
                        <button
                            onClick={() => setFilters({ category: 'All', status: 'All', abc: 'All', priceRange: 'All', siteId: 'All' })}
                            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase text-red-400 hover:text-white hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all ml-auto"
                        >
                            Reset Filters
                        </button>
                    )}
                </div>
            </div>

            {selectedIds.size > 0 && (
                <div className="bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 border-b border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 p-2 flex items-center justify-between px-4 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-bold uppercase tracking-wider">{selectedIds.size} Selected</span>
                        <Button onClick={() => handleBulkAction('Print Labels')} size="sm" variant="secondary" className="px-3 py-1.5 bg-black/20 hover:bg-black/40 rounded text-[10px] font-bold text-white">Print Labels</Button>
                        <Button onClick={() => setSelectedIds(new Set())} size="sm" variant="ghost" className="px-3 py-1.5 text-[10px] text-gray-400 hover:text-white">Clear</Button>
                    </div>
                </div>
            )}
        </div>
    );
};
