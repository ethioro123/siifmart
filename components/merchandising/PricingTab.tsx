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
