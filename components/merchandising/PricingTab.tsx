import React from 'react';
import {
   Search, SlidersHorizontal, Zap, Percent, Loader2
} from 'lucide-react';
import { useMerchandising } from './MerchandisingContext';

// --- Sub-Components ---
import { PricingFiltersPanel } from './components/PricingFiltersPanel';
import { PricingProductsTable } from './components/PricingProductsTable';
import { PricingPagination } from './components/PricingPagination';

export const PricingTab: React.FC = () => {
   const {
      searchTerm,
      setSearchTerm,
      isFilterPanelOpen,
      setIsFilterPanelOpen,
      filters,
      isSubmitting,
      applyPsychologicalPricing,
      selectedIds,
      applyBulkSale
   } = useMerchandising();

   const activeFilterCount = Object.values(filters).filter(v => Array.isArray(v) ? v.length > 0 : v !== null && v !== '').length;

   return (
      <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl shadow-sm overflow-hidden transition-all duration-300">
         <div className="p-5 sm:p-6 border-b border-[#E2DCCE]/60 dark:border-white/5 bg-[#FAF8F5]/80 dark:bg-black/20">
            <div className="flex flex-wrap gap-3.5 items-center justify-between">
               {/* Search Bar */}
               <div className="relative flex-1 min-w-[260px] max-w-md">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                     className="w-full bg-white dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#1E3F27] dark:text-white focus:border-[#2C5E3B] outline-none placeholder:text-stone-400 font-bold transition-all"
                     placeholder="Search inventory system by product or SKU..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     aria-label="Search product"
                  />
               </div>

               {/* Advanced Filter Toggle */}
               <button
                  type="button"
                  onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                  className={`px-4 py-2.5 rounded-2xl border flex items-center gap-2.5 text-xs font-bold transition-all cursor-pointer ${
                     isFilterPanelOpen || activeFilterCount > 0
                        ? 'bg-[#2C5E3B] text-white border-[#2C5E3B] shadow-sm'
                        : 'bg-white dark:bg-black/30 border-[#E2DCCE] dark:border-white/10 text-stone-700 dark:text-stone-300 hover:border-[#2C5E3B]'
                  }`}
               >
                  <SlidersHorizontal size={14} />
                  <span>Filter Studio</span>
                  {activeFilterCount > 0 && (
                     <span
                        className={`text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-black ${
                           isFilterPanelOpen
                              ? 'bg-white text-[#2C5E3B]'
                              : 'bg-[#2C5E3B] text-white'
                        }`}
                     >
                        {activeFilterCount}
                     </span>
                  )}
               </button>

               {/* Quick Action Tools */}
               <div className="flex items-center gap-2.5">
                  <button
                     type="button"
                     onClick={() => applyPsychologicalPricing('5')}
                     disabled={isSubmitting}
                     className="px-3.5 py-2.5 bg-white dark:bg-black/30 hover:bg-[#FAF8F5] dark:hover:bg-white/5 text-stone-700 dark:text-stone-300 border border-[#E2DCCE] dark:border-white/10 rounded-2xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer"
                     title="Round prices to end in 5 (e.g., 700 -> 695)"
                  >
                     {isSubmitting ? (
                        <Loader2 size={13} className="animate-spin" />
                     ) : (
                        <Zap size={13} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                     )}
                     <span>Ending in 5</span>
                  </button>
                  <button
                     type="button"
                     onClick={() => applyPsychologicalPricing('0')}
                     disabled={isSubmitting}
                     className="px-3.5 py-2.5 bg-white dark:bg-black/30 hover:bg-[#FAF8F5] dark:hover:bg-white/5 text-stone-700 dark:text-stone-300 border border-[#E2DCCE] dark:border-white/10 rounded-2xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer"
                     title="Round prices to end in 0 (e.g., 700 -> 690)"
                  >
                     {isSubmitting ? (
                        <Loader2 size={13} className="animate-spin" />
                     ) : (
                        <Zap size={13} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                     )}
                     <span>Ending in 0</span>
                  </button>
                  {selectedIds.size > 0 && (
                     <button
                        type="button"
                        onClick={applyBulkSale}
                        className="woody-btn-primary px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-sm"
                     >
                        <Percent size={13} /> Bulk Promo ({selectedIds.size})
                     </button>
                  )}
               </div>
            </div>

            {/* Filter Studio Collapsible and Chips */}
            <PricingFiltersPanel />
         </div>

         {/* Products Table grid list */}
         <PricingProductsTable />

         {/* Footer pagination */}
         <PricingPagination />
      </div>
   );
};

export default PricingTab;
