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
      <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl shadow-sm isolate overflow-hidden transition-all duration-300">
         <div className="p-5 sm:p-6 border-b border-[var(--theme-border)] bg-[var(--theme-bg-panel)]">
            <div className="flex flex-wrap gap-3 items-center justify-between">
               {/* Search Bar */}
               <div className="relative flex-1 min-w-[260px] max-w-md">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" />
                  <input
                     className="w-full h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl pl-10 pr-4 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)]/20 outline-none placeholder:text-[var(--theme-text-muted)] font-medium transition-all"
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
                  className={`h-10 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer active:scale-[0.98] ${
                     isFilterPanelOpen || activeFilterCount > 0
                        ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-xs'
                        : 'bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] border border-[var(--theme-border)] text-[var(--theme-text-primary)]'
                  }`}
               >
                  <SlidersHorizontal size={14} />
                  <span>Filter Studio</span>
                  {activeFilterCount > 0 && (
                     <span
                        className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                           isFilterPanelOpen || activeFilterCount > 0
                              ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]'
                              : 'bg-[var(--theme-accent)] text-white'
                        }`}
                     >
                        {activeFilterCount}
                     </span>
                  )}
               </button>

               {/* Quick Action Tools */}
               <div className="flex items-center gap-2">
                  <button
                     type="button"
                     onClick={() => applyPsychologicalPricing('5')}
                     disabled={isSubmitting}
                     className="h-10 px-3.5 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 transition-all active:scale-[0.98] cursor-pointer"
                     title="Round prices to end in 5 (e.g., 700 -> 695)"
                  >
                     {isSubmitting ? (
                        <Loader2 size={13} className="animate-spin" />
                     ) : (
                        <Zap size={14} className="text-[var(--theme-accent)]" />
                     )}
                     <span>Ending in 5</span>
                  </button>
                  <button
                     type="button"
                     onClick={() => applyPsychologicalPricing('0')}
                     disabled={isSubmitting}
                     className="h-10 px-3.5 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 transition-all active:scale-[0.98] cursor-pointer"
                     title="Round prices to end in 0 (e.g., 700 -> 690)"
                  >
                     {isSubmitting ? (
                        <Loader2 size={13} className="animate-spin" />
                     ) : (
                        <Zap size={14} className="text-[var(--theme-accent)]" />
                     )}
                     <span>Ending in 0</span>
                  </button>
                  {selectedIds.size > 0 && (
                     <button
                        type="button"
                        onClick={applyBulkSale}
                        className="h-10 px-4 rounded-xl text-xs font-semibold bg-[var(--theme-accent)] text-white hover:opacity-90 flex items-center gap-2 cursor-pointer shadow-xs active:scale-[0.98] transition-all"
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
