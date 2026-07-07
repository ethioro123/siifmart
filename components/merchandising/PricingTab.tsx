import React from 'react';
import {
   Search, SlidersHorizontal, Zap, Percent, Loader2, Tags, Map, Calculator,
   CheckCircle, XCircle, ChevronUp, ChevronDown, Edit2, Save, Trash2, RefreshCw, Package
} from 'lucide-react';
import { useMerchandising } from './MerchandisingContext';
import { CURRENCY_SYMBOL, ALL_CATEGORY_OPTIONS } from '../../constants';
import { formatCompactNumber } from '../../utils/formatting';

export const PricingTab: React.FC = () => {
   const {
      searchTerm,
      setSearchTerm,
      isFilterPanelOpen,
      setIsFilterPanelOpen,
      filters,
      setFilters,
      isSubmitting,
      applyPsychologicalPricing,
      selectedIds,
      applyBulkSale,
      sites,
      products,
      editingId,
      setEditingId,
      editForm,
      setEditForm,
      handleSavePrice,
      setSelectedLocationProduct,
      setIsLocationModalOpen,
      handleEditClick,
      handleSort,
      sortConfig,
      filteredProducts,
      currentPage,
      setCurrentPage,
      itemsPerPage,
      setItemsPerPage,
      toggleSelectAll,
      toggleSelection,
      getMargin
   } = useMerchandising();

   const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
   const startIndex = (currentPage - 1) * itemsPerPage;
   const endIndex = startIndex + itemsPerPage;
   const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

   const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

   const getPageNumbers = () => {
      const pages: (number | string)[] = [];
      const maxVisiblePages = 5;

      if (totalPages <= maxVisiblePages) {
         for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
         pages.push(1);
         if (currentPage > 3) pages.push('...');

         const start = Math.max(2, currentPage - 1);
         const end = Math.min(totalPages - 1, currentPage + 1);

         for (let i = start; i <= end; i++) pages.push(i);

         if (currentPage < totalPages - 2) pages.push('...');
         pages.push(totalPages);
      }
      return pages;
   };

   return (
      <div className="glass-panel overflow-hidden animate-in fade-in">
         <div className="p-6 border-b border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] bg-stone-50/50 dark:bg-[#1E2822]/30">
            <div className="flex flex-wrap gap-4 items-center">
               {/* Refined Search Bar */}
               <div className="relative flex-1 min-w-[300px] max-w-md">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" />
                  <input
                     className="woody-input pl-11"
                     placeholder="Search inventory system..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     aria-label="Search product"
                  />
               </div>

               {/* Advanced Filter Toggle */}
               <button
                  onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                  className={`px-5 py-2.5 rounded-2xl border flex items-center gap-3 text-sm font-semibold transition-all duration-300 ${
                     isFilterPanelOpen || Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : v !== null && v !== '')
                        ? 'bg-[#2C5E3B] text-white dark:bg-[#A9CBA2] dark:text-[#1E3B24] border-transparent shadow-sm'
                        : 'bg-white/80 dark:bg-[#18201B]/70 border border-[#E2DCCE] dark:border-emerald-950/20 text-[#2C4D35] dark:text-[#A9CBA2] hover:text-[#1E3F27] dark:hover:text-white'
                  }`}
               >
                  <SlidersHorizontal size={18} />
                  <span className="tracking-wide">Filter Studio</span>
                  {Object.values(filters).filter(v => Array.isArray(v) ? v.length > 0 : v !== null && v !== '').length > 0 && (
                     <span
                        className={`text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold ${
                           isFilterPanelOpen
                              ? 'bg-white text-[#2C5E3B] dark:bg-[#1E3B24] dark:text-[#A9CBA2]'
                              : 'bg-[#2C5E3B] text-white dark:bg-[#A9CBA2] dark:text-[#1E3B24]'
                        }`}
                     >
                        {Object.values(filters).filter(v => Array.isArray(v) ? v.length > 0 : v !== null && v !== '').length}
                     </span>
                  )}
               </button>

               {/* Quick Action Tools */}
               <div className="flex gap-3 ml-auto">
                  <button
                     onClick={() => applyPsychologicalPricing('5')}
                     disabled={isSubmitting}
                     className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-white/5 dark:hover:bg-white/10 text-stone-700 dark:text-[#A9CBA2] border border-[#E2DCCE] dark:border-emerald-950/20 rounded-2xl text-xs font-semibold flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95"
                     title="Shave prices to end in 5 (e.g., 700 -> 695)"
                  >
                     {isSubmitting ? (
                        <Loader2 size={14} className="animate-spin" />
                     ) : (
                        <Zap size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                     )}
                     {isSubmitting ? 'Optimizing...' : 'Ending in 5'}
                  </button>
                  <button
                     onClick={() => applyPsychologicalPricing('0')}
                     disabled={isSubmitting}
                     className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-white/5 dark:hover:bg-white/10 text-stone-700 dark:text-[#A9CBA2] border border-[#E2DCCE] dark:border-emerald-950/20 rounded-2xl text-xs font-semibold flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95"
                     title="Shave prices to end in 0 (e.g., 700 -> 690)"
                  >
                     {isSubmitting ? (
                        <Loader2 size={14} className="animate-spin" />
                     ) : (
                        <Zap size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                     )}
                     {isSubmitting ? 'Optimizing...' : 'Ending in 0'}
                  </button>
                  {selectedIds.size > 0 && (
                     <button
                        onClick={applyBulkSale}
                        className="px-4 py-2.5 bg-[#2C5E3B] text-white dark:bg-[#A9CBA2] dark:text-[#1E3B24] rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in zoom-in duration-300 shadow-sm"
                     >
                        <Percent size={14} /> Global Batch ({selectedIds.size})
                     </button>
                  )}
               </div>
            </div>

            {/* Collapsible Filter Panel */}
            {isFilterPanelOpen && (
               <div className="mt-4 p-8 glass-panel grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 shadow-2xl animate-in slide-in-from-top-4 duration-500">
                  {/* Categories Section */}
                  <div className="space-y-4">
                     <div className="flex items-center gap-2 pb-2 border-b border-[#E2DCCE]/50 dark:border-emerald-950/20">
                        <Tags size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                        <label className="text-[11px] uppercase text-[#1E3F27] dark:text-[#EAE5D9] font-black tracking-[0.1em]">Categories</label>
                     </div>
                     <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-3 custom-scrollbar">
                        {ALL_CATEGORY_OPTIONS.map(cat => (
                           <label
                              key={cat}
                              className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 hover:text-[#1E3F27] dark:hover:text-white cursor-pointer group transition-colors"
                           >
                              <div className="relative flex items-center justify-center">
                                 <input
                                    type="checkbox"
                                    checked={filters.categories.includes(cat)}
                                    onChange={(e) => {
                                       const next = e.target.checked
                                          ? [...filters.categories, cat]
                                          : filters.categories.filter(c => c !== cat);
                                       setFilters({ ...filters, categories: next });
                                    }}
                                    className="peer appearance-none w-4 h-4 border border-[#E2DCCE] dark:border-emerald-950/40 rounded-lg bg-white dark:bg-black/25 checked:bg-[#2C5E3B] dark:checked:bg-[#A9CBA2] checked:border-transparent transition-all cursor-pointer"
                                 />
                                 <CheckCircle
                                    size={10}
                                    className="absolute text-white dark:text-[#1E3B24] opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
                                 />
                              </div>
                              <span className="font-medium group-hover:translate-x-0.5 transition-transform">{cat}</span>
                           </label>
                        ))}
                     </div>
                  </div>

                  {/* Sites Section */}
                  <div className="space-y-4">
                     <div className="flex items-center gap-2 pb-2 border-b border-[#E2DCCE]/50 dark:border-emerald-950/20">
                        <Map size={14} className="text-blue-500 dark:text-blue-400" />
                        <label className="text-[11px] uppercase text-[#1E3F27] dark:text-[#EAE5D9] font-black tracking-[0.1em]">Store Locations</label>
                     </div>
                     <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-3 custom-scrollbar">
                        {sites.map(site => (
                           <label
                              key={site.id}
                              className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 hover:text-[#1E3F27] dark:hover:text-white cursor-pointer group transition-colors"
                           >
                              <div className="relative flex items-center justify-center">
                                 <input
                                    type="checkbox"
                                    checked={filters.sites.includes(site.id)}
                                    onChange={(e) => {
                                       const next = e.target.checked ? [...filters.sites, site.id] : filters.sites.filter(s => s !== site.id);
                                       setFilters({ ...filters, sites: next });
                                    }}
                                    className="peer appearance-none w-4 h-4 border border-[#E2DCCE] dark:border-emerald-950/40 rounded-lg bg-white dark:bg-black/25 checked:bg-[#2C5E3B] dark:checked:bg-[#A9CBA2] checked:border-transparent transition-all cursor-pointer"
                                 />
                                 <CheckCircle
                                    size={10}
                                    className="absolute text-white dark:text-[#1E3B24] opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
                                 />
                              </div>
                              <span className="font-medium group-hover:translate-x-0.5 transition-transform">{site.name}</span>
                           </label>
                        ))}
                     </div>
                  </div>

                  {/* Price & Margin Range Section */}
                  <div className="space-y-6">
                     <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-[#E2DCCE]/50 dark:border-emerald-950/20">
                           <Calculator size={14} className="text-green-600 dark:text-green-400" />
                           <label className="text-[11px] uppercase text-[#1E3F27] dark:text-[#EAE5D9] font-black tracking-[0.1em]">Market Position</label>
                        </div>
                        <div className="space-y-3">
                           <div className="flex flex-col gap-1.5">
                              <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase">Price Range ({CURRENCY_SYMBOL})</span>
                              <div className="flex gap-2">
                                 <div className="relative flex-1">
                                    <input
                                       type="number"
                                       placeholder="Min"
                                       className="w-full bg-white/95 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 hover:border-[#CFC6B4] dark:hover:border-emerald-900/15 rounded-xl px-3 py-2 text-xs text-[#1E3F27] dark:text-[#EAE5D9] placeholder-stone-400 dark:placeholder-stone-500 outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-2 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 transition-all"
                                       value={filters.minPrice}
                                       onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                                    />
                                 </div>
                                 <div className="relative flex-1">
                                    <input
                                       type="number"
                                       placeholder="Max"
                                       className="w-full bg-white/95 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 hover:border-[#CFC6B4] dark:hover:border-emerald-900/15 rounded-xl px-3 py-2 text-xs text-[#1E3F27] dark:text-[#EAE5D9] placeholder-stone-400 dark:placeholder-stone-500 outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-2 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 transition-all"
                                       value={filters.maxPrice}
                                       onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                                    />
                                 </div>
                              </div>
                           </div>
                           <div className="flex flex-col gap-1.5">
                              <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase">Target Margin (%)</span>
                              <div className="flex gap-2">
                                 <input
                                    type="number"
                                    placeholder="Min %"
                                    className="w-full bg-white/95 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 hover:border-[#CFC6B4] dark:hover:border-emerald-900/15 rounded-xl px-3 py-2 text-xs text-[#1E3F27] dark:text-[#EAE5D9] placeholder-stone-400 dark:placeholder-stone-500 outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-2 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 transition-all"
                                    value={filters.minMargin}
                                    onChange={(e) => setFilters({ ...filters, minMargin: e.target.value })}
                                 />
                                 <input
                                    type="number"
                                    placeholder="Max %"
                                    className="w-full bg-white/95 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 hover:border-[#CFC6B4] dark:hover:border-emerald-900/15 rounded-xl px-3 py-2 text-xs text-[#1E3F27] dark:text-[#EAE5D9] placeholder-stone-400 dark:placeholder-stone-500 outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-2 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 transition-all"
                                    value={filters.maxMargin}
                                    onChange={(e) => setFilters({ ...filters, maxMargin: e.target.value })}
                                 />
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Velocity & Automation Section */}
                  <div className="space-y-6">
                     <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-[#E2DCCE]/50 dark:border-emerald-950/20">
                           <Zap size={14} className="text-yellow-600 dark:text-yellow-400" />
                           <label className="text-[11px] uppercase text-[#1E3F27] dark:text-[#EAE5D9] font-black tracking-[0.1em]">Performance</label>
                        </div>
                        <div className="space-y-4">
                           <div className="flex flex-col gap-1.5">
                              <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase">Sales Velocity</span>
                              <div className="flex flex-wrap gap-2">
                                 {['High', 'Medium', 'Low'].map(v => (
                                    <button
                                       key={v}
                                       onClick={() => {
                                          const next = filters.velocities.includes(v)
                                             ? filters.velocities.filter(item => item !== v)
                                             : [...filters.velocities, v];
                                          setFilters({ ...filters, velocities: next });
                                       }}
                                       className={`px-4 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                                          filters.velocities.includes(v)
                                             ? 'bg-[#2C5E3B] text-white dark:bg-[#A9CBA2] dark:text-[#1E3B24] border-transparent shadow-sm'
                                             : 'bg-white/80 dark:bg-[#18201B]/70 border border-[#E2DCCE] dark:border-emerald-950/20 text-[#2C4D35] dark:text-[#A9CBA2] hover:text-[#1E3F27] dark:hover:text-white'
                                       }`}
                                    >
                                       {v}
                                    </button>
                                 ))}
                              </div>
                           </div>
                           <div className="flex flex-col gap-1.5">
                              <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase">Campaign Status</span>
                              <button
                                 onClick={() => setFilters({ ...filters, onSale: filters.onSale === true ? null : true })}
                                 className={`group flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold border transition-all ${
                                    filters.onSale === true
                                       ? 'bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 text-[#2C5E3B] dark:text-[#A9CBA2] border-[#2C5E3B]/30 dark:border-[#A9CBA2]/30 shadow-sm'
                                       : 'bg-white/80 dark:bg-[#18201B]/70 border border-[#E2DCCE] dark:border-emerald-950/20 text-[#2C4D35] dark:text-[#A9CBA2] hover:border-[#CFC6B4] dark:hover:border-emerald-900/15'
                                 }`}
                              >
                                 <div className="flex items-center gap-2">
                                    <Percent
                                       size={14}
                                       className={filters.onSale === true ? 'text-[#2C5E3B] dark:text-[#A9CBA2]' : 'text-stone-400 dark:text-stone-500'}
                                    />
                                    <span>On Sale / Active Promo</span>
                                 </div>
                                 <div
                                    className={`w-8 h-4 rounded-full relative transition-colors ${
                                       filters.onSale === true ? 'bg-[#2C5E3B] dark:bg-[#A9CBA2]' : 'bg-stone-300 dark:bg-stone-700'
                                    }`}
                                 >
                                    <div
                                       className={`absolute top-1 w-2 h-2 rounded-full bg-white dark:bg-[#1E3B24] transition-all ${
                                          filters.onSale === true ? 'left-5' : 'left-1'
                                       }`}
                                    />
                                 </div>
                              </button>
                           </div>
                        </div>
                     </div>
                     <button
                        onClick={() => {
                           setFilters({
                              categories: [],
                              sites: [],
                              velocities: [],
                              onSale: null,
                              minPrice: '',
                              maxPrice: '',
                              minMargin: '',
                              maxMargin: ''
                           });
                           setSearchTerm('');
                        }}
                        className="w-full py-2.5 text-[10px] uppercase font-bold text-stone-500 hover:text-[#1E3F27] dark:hover:text-white transition-all flex items-center justify-center gap-2 hover:bg-[#2C5E3B]/5 dark:hover:bg-[#A9CBA2]/5 rounded-xl border border-transparent"
                     >
                        <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-500" /> Reset All Studio Filters
                     </button>
                  </div>
               </div>
            )}

            {/* Filter Chips */}
            {(searchTerm || Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : v !== null && v !== '')) && (
               <div className="flex flex-wrap gap-2 mt-6 animate-in fade-in duration-700">
                  {searchTerm && (
                     <div className="flex items-center gap-2 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 px-3 py-1.5 rounded-full text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-bold">
                        <Search size={10} />
                        <span>"{searchTerm}"</span>
                        <button
                           onClick={() => setSearchTerm('')}
                           aria-label="Clear search"
                           className="hover:text-[#1E3F27] dark:hover:text-white transition-colors"
                        >
                           <XCircle size={12} />
                        </button>
                     </div>
                  )}
                  {filters.categories.map(cat => (
                     <div
                        key={cat}
                        className="flex items-center gap-2 bg-white/80 dark:bg-[#18201B]/70 border border-[#E2DCCE] dark:border-emerald-950/20 px-3 py-1.5 rounded-full text-[10px] text-stone-600 dark:text-stone-300 font-medium"
                     >
                        <Tags size={10} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                        <span>{cat}</span>
                        <button
                           onClick={() => setFilters({ ...filters, categories: filters.categories.filter(c => c !== cat) })}
                           aria-label={`Remove category filter ${cat}`}
                           className="hover:text-red-500 transition-colors"
                        >
                           <XCircle size={12} className="opacity-60 hover:opacity-100" />
                        </button>
                     </div>
                  ))}
                  {filters.sites.map(sid => (
                     <div
                        key={sid}
                        className="flex items-center gap-2 bg-white/80 dark:bg-[#18201B]/70 border border-[#E2DCCE] dark:border-emerald-950/20 px-3 py-1.5 rounded-full text-[10px] text-stone-600 dark:text-stone-300 font-medium"
                     >
                        <Map size={10} className="text-blue-500 dark:text-blue-400" />
                        <span>{sites.find(s => s.id === sid)?.name}</span>
                        <button
                           onClick={() => setFilters({ ...filters, sites: filters.sites.filter(s => s !== sid) })}
                           aria-label="Remove site filter"
                           className="hover:text-red-500 transition-colors"
                        >
                           <XCircle size={12} className="opacity-60 hover:opacity-100" />
                        </button>
                     </div>
                  ))}
                  {(filters.minPrice || filters.maxPrice) && (
                     <div
                        className="flex items-center gap-2 bg-white/80 dark:bg-[#18201B]/70 border border-[#E2DCCE] dark:border-emerald-950/20 px-3 py-1.5 rounded-full text-[10px] text-stone-600 dark:text-stone-300 font-medium"
                     >
                        <Calculator size={10} className="text-green-600 dark:text-green-400" />
                        <span>
                           {CURRENCY_SYMBOL}
                           {filters.minPrice || '0'} - {CURRENCY_SYMBOL}
                           {filters.maxPrice || '∞'}
                        </span>
                        <button
                           onClick={() => setFilters({ ...filters, minPrice: '', maxPrice: '' })}
                           aria-label="Clear price range filter"
                           className="hover:text-red-500 transition-colors"
                        >
                           <XCircle size={12} className="opacity-60 hover:opacity-100" />
                        </button>
                     </div>
                  )}
                  {filters.onSale && (
                     <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full text-[10px] text-orange-600 dark:text-orange-400 font-bold">
                        <Percent size={10} />
                        <span>On Sale</span>
                        <button
                           onClick={() => setFilters({ ...filters, onSale: null })}
                           aria-label="Remove sale filter"
                           className="hover:text-red-500 transition-colors"
                        >
                           <XCircle size={12} className="opacity-60 hover:opacity-100" />
                        </button>
                     </div>
                  )}
               </div>
            )}
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-[#2C5E3B]/5 dark:bg-[#A9CBA2]/5 border-b border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] text-stone-600 dark:text-stone-400">
                     <th className="p-4 text-center w-12">
                        <input
                           type="checkbox"
                           className="accent-[#2C5E3B] dark:accent-[#A9CBA2] w-4 h-4 cursor-pointer"
                           aria-label="Select all products"
                           checked={selectedIds.size === filteredProducts.length && filteredProducts.length > 0}
                           onChange={toggleSelectAll}
                        />
                     </th>
                     {/* Product Name */}
                     <th
                        className="p-4 text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-[#1E3F27] dark:hover:text-white transition-colors"
                        onClick={() => handleSort('name')}
                     >
                        <div className="flex items-center gap-2">
                           <span className={sortConfig.key === 'name' ? 'text-[#2C5E3B] dark:text-[#A9CBA2] font-bold' : 'text-stone-500'}>Product</span>
                           {sortConfig.key === 'name' && (
                              sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> : <ChevronDown size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                           )}
                        </div>
                     </th>
                     {/* Site/Location */}
                     <th
                        className="p-4 text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-[#1E3F27] dark:hover:text-white transition-colors"
                        onClick={() => handleSort('siteId')}
                     >
                        <div className="flex items-center gap-2">
                           <span className={sortConfig.key === 'siteId' ? 'text-[#2C5E3B] dark:text-[#A9CBA2] font-bold' : 'text-stone-500'}>Location</span>
                           {sortConfig.key === 'siteId' && (
                              sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> : <ChevronDown size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                           )}
                        </div>
                     </th>
                     {/* Price */}
                     <th
                        className="p-4 text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-[#1E3F27] dark:hover:text-white transition-colors text-right"
                        onClick={() => handleSort('price')}
                     >
                        <div className="flex items-center justify-end gap-2">
                           <span className={sortConfig.key === 'price' ? 'text-[#2C5E3B] dark:text-[#A9CBA2] font-bold' : 'text-stone-500'}>Retail Price</span>
                           {sortConfig.key === 'price' && (
                              sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> : <ChevronDown size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                           )}
                        </div>
                     </th>
                     {/* Competitor Price */}
                     <th
                        className="p-4 text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-[#1E3F27] dark:hover:text-white transition-colors text-right"
                        onClick={() => handleSort('competitorPrice')}
                     >
                        <div className="flex items-center justify-end gap-2">
                           <span className={sortConfig.key === 'competitorPrice' ? 'text-[#2C5E3B] dark:text-[#A9CBA2] font-bold' : 'text-stone-500'}>Competitor</span>
                           {sortConfig.key === 'competitorPrice' && (
                              sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> : <ChevronDown size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                           )}
                        </div>
                     </th>
                     {/* Margin */}
                     <th
                        className="p-4 text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-[#1E3F27] dark:hover:text-white transition-colors text-right"
                        onClick={() => handleSort('margin')}
                     >
                        <div className="flex items-center justify-end gap-2">
                           <span className={sortConfig.key === 'margin' ? 'text-[#2C5E3B] dark:text-[#A9CBA2] font-bold' : 'text-stone-500'}>Margin</span>
                           {sortConfig.key === 'margin' && (
                              sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> : <ChevronDown size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                           )}
                        </div>
                     </th>
                     {/* Velocity */}
                     <th className="p-4 text-xs text-stone-500 uppercase text-center font-bold">Velocity</th>
                     {/* Sale Active */}
                     <th className="p-4 text-xs text-stone-500 uppercase text-center font-bold">Sale Active</th>
                     <th className="p-4 text-xs text-stone-500 uppercase text-right border-r-0 font-bold">Action</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-[#E2DCCE]/40 dark:divide-[#A9CBA2]/[0.04]">
                  {paginatedProducts.map(p => {
                     const isEditing = editingId === p.id;
                     const cost = isEditing ? editForm.cost : (p.costPrice || p.price * 0.7);
                     const retail = isEditing ? editForm.price : p.price;
                     const margin = getMargin(retail, cost);
                     const compVariance = p.competitorPrice ? ((retail - p.competitorPrice) / p.competitorPrice) * 100 : 0;

                     return (
                        <tr
                           key={p.id}
                           className={`hover:bg-stone-50/50 dark:hover:bg-white/[0.02] transition-colors border-b border-[#E2DCCE]/40 dark:border-[#A9CBA2]/[0.04] ${
                              selectedIds.has(p.id) ? 'bg-[#2C5E3B]/5 dark:bg-[#A9CBA2]/5' : ''
                           }`}
                        >
                           <td className="p-4 text-center">
                              <input
                                 type="checkbox"
                                 checked={selectedIds.has(p.id)}
                                 onChange={() => toggleSelection(p.id)}
                                 className="accent-[#2C5E3B] dark:accent-[#A9CBA2] w-4 h-4 cursor-pointer"
                                 aria-label={`Select ${p.name}`}
                              />
                           </td>
                           <td className="p-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-black/30 border border-[#E2DCCE] dark:border-emerald-950/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                    {p.image && !p.image.includes('placeholder.com') ? (
                                       <img
                                          src={p.image}
                                          className="w-full h-full object-cover"
                                          alt=""
                                          onError={(e) => {
                                             e.currentTarget.style.display = 'none';
                                             (e.currentTarget.parentElement as HTMLElement).innerHTML =
                                                '<div class="text-stone-400"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                          }}
                                       />
                                    ) : (
                                       <Package size={18} className="text-stone-400" />
                                    )}
                                 </div>
                                 <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                       <p className="text-sm font-bold text-[#1E3F27] dark:text-white leading-none">{p.name}</p>
                                       {p.sku && (
                                          <span className="text-[10px] bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 px-1.5 py-0.5 rounded text-[#2C5E3B] dark:text-[#A9CBA2] font-mono uppercase tracking-wider">
                                             {p.sku}
                                          </span>
                                       )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                       <p className="text-xs text-stone-500 dark:text-stone-400">{p.category}</p>
                                       {p.sku && products.filter(pi => pi.sku === p.sku).length > 1 && (
                                          <span className="text-[10px] text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-black/40 px-1.5 py-0.5 rounded flex items-center gap-1">
                                             <Map size={10} /> {products.filter(pi => pi.sku === p.sku).length} Locations
                                          </span>
                                       )}
                                    </div>
                                 </div>
                              </div>
                           </td>

                           {/* Location */}
                           <td className="p-4 text-sm text-stone-600 dark:text-stone-400">{sites.find(s => s.id === p.siteId)?.name || 'Unknown Site'}</td>

                           {/* Retail Price */}
                           <td className="p-4 text-right">
                              {isEditing ? (
                                 <div className="flex flex-col items-end gap-1.5">
                                    <div className="flex items-center gap-1.5">
                                       <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase">Price:</span>
                                       <input
                                          type="number"
                                          className="w-24 bg-white dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-xl px-2 py-1 text-right text-[#1E3F27] dark:text-[#EAE5D9] outline-none font-mono focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2]"
                                          value={editForm.price}
                                          onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                                          aria-label="Retail Price"
                                       />
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                       <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase">Cost:</span>
                                       <input
                                          type="number"
                                          className="w-24 bg-white dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-xl px-2 py-1 text-right text-[#1E3F27] dark:text-[#EAE5D9] outline-none font-mono focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2]"
                                          value={editForm.cost}
                                          onChange={(e) => setEditForm({ ...editForm, cost: parseFloat(e.target.value) || 0 })}
                                          aria-label="Cost Price"
                                       />
                                    </div>
                                 </div>
                              ) : (
                                 <div className="flex flex-col items-end">
                                    <span className="text-[#1E3F27] dark:text-white font-mono font-bold">
                                       {CURRENCY_SYMBOL} {retail.toLocaleString()}
                                    </span>
                                    <span className="text-[10px] text-stone-500 font-mono">Cost: {cost.toLocaleString()}</span>
                                 </div>
                              )}
                           </td>

                           {/* Competitor Analysis */}
                           <td className="p-4 text-right">
                              {p.competitorPrice ? (
                                 <div className="flex flex-col items-end">
                                    <span className="text-stone-500 dark:text-stone-400 font-mono text-xs">
                                       {CURRENCY_SYMBOL} {p.competitorPrice.toLocaleString()}
                                    </span>
                                    <span
                                       className={`text-[10px] font-bold ${
                                          compVariance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                                       }`}
                                    >
                                       {compVariance > 0 ? '+' : ''}
                                       {compVariance.toFixed(1)}% vs Mkt
                                    </span>
                                 </div>
                              ) : (
                                 <span className="text-stone-400 dark:text-stone-600 text-xs">-</span>
                              )}
                           </td>

                           {/* Margin */}
                           <td className="p-4 text-right">
                              <span
                                 className={`text-xs font-bold px-2 py-1 rounded-lg ${
                                    margin < 15
                                       ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                                       : margin > 40
                                       ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                       : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                                 }`}
                              >
                                 {margin.toFixed(1)}%
                              </span>
                           </td>

                           {/* Sales Velocity */}
                           <td className="p-4 text-center">
                              {p.salesVelocity === 'High' && (
                                 <span className="text-green-600 dark:text-green-400 text-xs font-bold flex justify-center items-center">
                                    <ChevronUp size={12} className="mr-1" /> High
                                 </span>
                              )}
                              {p.salesVelocity === 'Medium' && <span className="text-yellow-600 dark:text-yellow-400 text-xs font-bold">Medium</span>}
                              {p.salesVelocity === 'Low' && <span className="text-red-600 dark:text-red-400 text-xs font-bold">Low</span>}
                           </td>

                           {/* Is On Sale Toggle */}
                           <td className="p-4 text-center">
                              {isEditing ? (
                                 <div className="flex flex-col items-center gap-1">
                                    <input
                                       type="checkbox"
                                       checked={editForm.isOnSale}
                                       onChange={(e) => setEditForm({ ...editForm, isOnSale: e.target.checked })}
                                       className="w-4 h-4 accent-[#2C5E3B] dark:accent-[#A9CBA2] cursor-pointer"
                                       aria-label="Toggle Sale Status"
                                    />
                                    {editForm.isOnSale && (
                                       <input
                                          type="number"
                                          className="w-16 text-[10px] bg-white dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 rounded text-center text-[#1E3F27] dark:text-[#EAE5D9] outline-none font-mono"
                                          value={editForm.salePrice}
                                          onChange={(e) => setEditForm({ ...editForm, salePrice: parseFloat(e.target.value) })}
                                          aria-label="Sale Price"
                                       />
                                    )}
                                 </div>
                              ) : p.isOnSale ? (
                                 <div className="flex flex-col items-center">
                                    <CheckCircle size={16} className="text-green-600 dark:text-green-400 mb-1" />
                                    <span className="text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-mono">
                                       {formatCompactNumber(p.salePrice, { currency: CURRENCY_SYMBOL })}
                                    </span>
                                 </div>
                              ) : (
                                 <div className="w-4 h-4 mx-auto border rounded-full border-stone-300 dark:border-stone-700"></div>
                              )}
                           </td>

                           {/* Actions */}
                           <td className="p-4 text-right">
                              {isEditing ? (
                                 <div className="flex flex-col gap-2 items-end">
                                    <div className="flex gap-2">
                                       <button
                                          onClick={() => setEditingId(null)}
                                          className="p-2 bg-stone-100 dark:bg-white/5 text-stone-500 dark:text-stone-400 rounded-xl hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
                                          aria-label="Cancel Edit"
                                          title="Cancel"
                                       >
                                          <XCircle size={16} />
                                       </button>
                                       <button
                                          onClick={() => handleSavePrice(p.id)}
                                          disabled={isSubmitting}
                                          className="p-2 bg-[#2C5E3B] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] rounded-xl hover:bg-[#1B3520] dark:hover:bg-[#DFD9CA] disabled:opacity-50 transition-all duration-300 shadow-sm"
                                          aria-label="Save Price"
                                          title="Save"
                                       >
                                          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                       </button>
                                    </div>
                                    <label className="flex items-center gap-1 text-[10px] text-stone-500 dark:text-stone-400 cursor-pointer">
                                       <input
                                          type="checkbox"
                                          className="accent-[#2C5E3B] dark:accent-[#A9CBA2] cursor-pointer"
                                          checked={editForm.applyToAll}
                                          onChange={(e) => setEditForm(prev => ({ ...prev, applyToAll: e.target.checked }))}
                                       />
                                       Sync All
                                    </label>
                                 </div>
                              ) : (
                                 <div className="flex gap-2 justify-end">
                                    <button
                                       onClick={() => {
                                          setSelectedLocationProduct(p);
                                          setIsLocationModalOpen(true);
                                       }}
                                       className="p-2 bg-stone-100 dark:bg-white/5 text-blue-600 dark:text-blue-400 rounded-xl hover:text-[#1E3F27] dark:hover:text-white hover:bg-blue-500/20 transition-all duration-300"
                                       title="View Network Stock"
                                    >
                                       <Map size={16} />
                                    </button>
                                    <button
                                       onClick={() => handleEditClick(p)}
                                       className="p-2 bg-stone-100 dark:bg-white/5 text-stone-500 dark:text-stone-400 rounded-xl hover:text-[#1E3F27] dark:hover:text-white hover:bg-[#2C5E3B]/10 dark:hover:bg-[#A9CBA2]/10 transition-all duration-300"
                                       aria-label="Edit Product"
                                    >
                                       <Edit2 size={16} />
                                    </button>
                                 </div>
                              )}
                           </td>
                        </tr>
                     );
                  })}
                  {filteredProducts.length === 0 && (
                     <tr>
                        <td colSpan={9} className="p-12 text-center">
                           <div className="flex flex-col items-center justify-center text-stone-500 dark:text-stone-400">
                              <Search size={48} className="mb-4 opacity-30" />
                              <p className="font-bold text-lg">No products found</p>
                              <p className="text-sm">Try adjusting your search term or filters</p>
                           </div>
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>

         {/* Modern Pagination Controls */}
         {filteredProducts.length > 0 && (
            <div className="p-4 border-t border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] bg-stone-50/50 dark:bg-[#1E2822]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
               {/* Info and Items Per Page */}
               <div className="flex items-center gap-4">
                  <span className="text-sm text-stone-500 dark:text-stone-400">
                     Showing <span className="text-[#1E3F27] dark:text-white font-bold">{startIndex + 1}</span> to{' '}
                     <span className="text-[#1E3F27] dark:text-white font-bold">{Math.min(endIndex, filteredProducts.length)}</span> of{' '}
                     <span className="text-[#2C5E3B] dark:text-[#A9CBA2] font-bold">{filteredProducts.length}</span> products
                  </span>
                  <div className="flex items-center gap-2">
                     <span className="text-xs text-stone-400 dark:text-stone-500">Show:</span>
                     <select
                        value={itemsPerPage}
                        onChange={(e) => {
                           setItemsPerPage(Number(e.target.value));
                           setCurrentPage(1);
                        }}
                        className="bg-white/80 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-lg px-2 py-1 text-sm text-[#1E3F27] dark:text-[#EAE5D9] outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] cursor-pointer transition-all duration-300"
                        aria-label="Items per page"
                     >
                        {ITEMS_PER_PAGE_OPTIONS.map(n => (
                           <option key={n} value={n} className="bg-white dark:bg-[#1E2822]">
                              {n}
                           </option>
                        ))}
                     </select>
                  </div>
               </div>

               {/* Page Navigation */}
               <div className="flex items-center gap-1">
                  {/* First Page */}
                  <button
                     onClick={() => setCurrentPage(1)}
                     disabled={currentPage === 1}
                     className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                        currentPage === 1 ? 'text-stone-400 dark:text-stone-600 cursor-not-allowed' : 'text-[#2C4D35] dark:text-[#A9CBA2] hover:bg-[#2C5E3B]/10 dark:hover:bg-[#A9CBA2]/10'
                     }`}
                     title="First page"
                  >
                     ««
                  </button>

                  {/* Previous */}
                  <button
                     onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                     disabled={currentPage === 1}
                     className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                        currentPage === 1 ? 'text-stone-400 dark:text-stone-600 cursor-not-allowed' : 'text-[#2C4D35] dark:text-[#A9CBA2] hover:bg-[#2C5E3B]/10 dark:hover:bg-[#A9CBA2]/10'
                     }`}
                  >
                     Prev
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1 mx-2">
                     {getPageNumbers().map((page, idx) =>
                        typeof page === 'number' ? (
                           <button
                              key={idx}
                              onClick={() => setCurrentPage(page)}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all duration-300 ${
                                 currentPage === page
                                    ? 'bg-[#224429] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] scale-105 shadow-sm'
                                    : 'text-stone-500 dark:text-[#7A9E83] hover:bg-[#2C5E3B]/10 dark:hover:bg-[#A9CBA2]/10'
                              }`}
                           >
                              {page}
                           </button>
                        ) : (
                           <span key={idx} className="text-stone-400 dark:text-stone-600 px-1">
                              ...
                           </span>
                        )
                     )}
                  </div>

                  {/* Next */}
                  <button
                     onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                     disabled={currentPage === totalPages}
                     className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                        currentPage === totalPages
                           ? 'text-stone-400 dark:text-stone-600 cursor-not-allowed'
                           : 'text-[#2C4D35] dark:text-[#A9CBA2] hover:bg-[#2C5E3B]/10 dark:hover:bg-[#A9CBA2]/10'
                     }`}
                  >
                     Next
                  </button>

                  {/* Last Page */}
                  <button
                     onClick={() => setCurrentPage(totalPages)}
                     disabled={currentPage === totalPages}
                     className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                        currentPage === totalPages
                           ? 'text-stone-400 dark:text-stone-600 cursor-not-allowed'
                           : 'text-[#2C4D35] dark:text-[#A9CBA2] hover:bg-[#2C5E3B]/10 dark:hover:bg-[#A9CBA2]/10'
                     }`}
                     title="Last page"
                  >
                     »»
                  </button>
               </div>
            </div>
         )}
      </div>
   );
};
export default PricingTab;
