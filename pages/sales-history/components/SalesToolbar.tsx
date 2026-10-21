import React from 'react';
import { Search, Calendar, ChevronDown, X, RotateCcw, Building2, CreditCard } from 'lucide-react';
import { Site } from '../../../types';

interface SalesToolbarProps {
   searchTerm: string;
   setSearchTerm: (val: string) => void;
   dateRange: { start: string; end: string };
   setDateRange: (val: any) => void;
   methodFilter: string;
   setMethodFilter: (val: string) => void;
   statusFilter: string;
   setStatusFilter: (val: string) => void;
   storeFilter: string;
   setStoreFilter: (val: string) => void;
   restricted: boolean;
   sites: Site[];
   handleFilterChange: (setter: any, value: any) => void;
}

export const SalesToolbar: React.FC<SalesToolbarProps> = ({
   searchTerm,
   setSearchTerm,
   dateRange,
   setDateRange,
   methodFilter,
   setMethodFilter,
   statusFilter,
   setStatusFilter,
   storeFilter,
   setStoreFilter,
   restricted,
   sites,
   handleFilterChange
}) => {
   const today = new Date().toISOString().split('T')[0];
   const defaultStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
   const hasActiveFilters = Boolean(
      searchTerm ||
      statusFilter !== 'All' ||
      methodFilter !== 'All' ||
      (!restricted && storeFilter !== 'All') ||
      dateRange.start !== defaultStart || dateRange.end !== today
   );

   const handleResetFilters = () => {
      handleFilterChange(setSearchTerm, '');
      handleFilterChange(setStatusFilter, 'All');
      handleFilterChange(setMethodFilter, 'All');
      if (!restricted) {
         handleFilterChange(setStoreFilter, 'All');
      }
      handleFilterChange(setDateRange, { start: defaultStart, end: today });
   };

   return (
      <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-5 space-y-4 shadow-[var(--shadow-sm)]">
         {/* Top Row: Search & Date Range */}
         <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
            {/* Apple Search Field */}
            <div className="flex-1 relative flex items-center min-h-11 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 focus-within:border-[var(--theme-border-strong)] focus-within:ring-2 focus-within:ring-[var(--theme-accent)]/25 transition-colors">
               <div className="w-7 h-7 rounded-lg bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                  <Search size={14} aria-hidden="true" />
               </div>
               <input
                  type="text"
                  placeholder="Search receipt ID, cashier name..."
                  className="bg-transparent border-none ml-2.5 flex-1 text-[var(--theme-text-primary)] text-sm outline-none placeholder-[var(--theme-text-muted)] font-normal"
                  value={searchTerm}
                  onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
                  aria-label="Search transactions"
               />
               {searchTerm && (
                  <button
                     type="button"
                     onClick={() => handleFilterChange(setSearchTerm, '')}
                     className="min-h-11 min-w-11 rounded-full hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                     aria-label="Clear search"
                  >
                     <X size={12} />
                  </button>
               )}
            </div>

            {/* Date Range Picker */}
            <div className="flex items-center min-h-11 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 gap-2 text-[var(--theme-text-primary)] shrink-0">
               <div className="w-7 h-7 rounded-lg bg-neutral-500/10 text-[var(--theme-text-secondary)] flex items-center justify-center shrink-0">
                  <Calendar size={14} />
               </div>
               <input
                  type="date"
                  className="bg-transparent border-none text-[var(--theme-text-primary)] text-xs font-medium outline-none focus:ring-0 cursor-pointer"
                  value={dateRange.start}
                  onChange={e => handleFilterChange(setDateRange, { ...dateRange, start: e.target.value })}
                  aria-label="Start Date"
               />
               <span className="text-[var(--theme-text-muted)] text-xs font-medium">to</span>
               <input
                  type="date"
                  className="bg-transparent border-none text-[var(--theme-text-primary)] text-xs font-medium outline-none focus:ring-0 cursor-pointer"
                  value={dateRange.end}
                  onChange={e => handleFilterChange(setDateRange, { ...dateRange, end: e.target.value })}
                  aria-label="End Date"
               />
            </div>
         </div>

         {/* Bottom Row: Segmented Status Controls + Method & Store Dropdowns */}
         <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[var(--theme-border-subtle)]">
            {/* Apple Segmented Control: Status */}
            <div role="group" aria-label="Filter by transaction status" className="p-1 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl inline-flex items-center gap-1 select-none overflow-x-auto max-w-full">
               {(['All', 'Completed', 'Pending', 'Refunded'] as const).map((status) => {
                  const isActive = statusFilter === status;
                  return (
                     <button
                        key={status}
                        type="button"
                        onClick={() => handleFilterChange(setStatusFilter, status)}
                        aria-pressed={isActive}
                        className={`min-h-11 px-3 rounded-lg text-xs font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
                           isActive
                              ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-[0_1px_3px_rgba(0,0,0,0.12)] font-semibold'
                              : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                        }`}
                     >
                        {status === 'All' ? 'All Status' : status}
                     </button>
                  );
               })}
            </div>

            {/* Select Controls & Reset Action */}
            <div className="flex items-center gap-2.5 flex-wrap">
               {/* Payment Method Select */}
               <div className="relative">
                  <select
                     className="appearance-none min-h-11 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl pl-8 pr-8 text-xs font-medium text-[var(--theme-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] hover:bg-[var(--theme-bg-panel-hover)] transition-colors"
                     value={methodFilter}
                     onChange={(e) => handleFilterChange(setMethodFilter, e.target.value)}
                     aria-label="Filter by Payment Method"
                  >
                     <option value="All" className="bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]">All Methods</option>
                     <option value="Cash" className="bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]">Cash</option>
                     <option value="Card" className="bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]">Card</option>
                     <option value="Mobile Money" className="bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]">Mobile Money</option>
                  </select>
                  <CreditCard size={13} className="absolute left-2.5 top-2.5 text-[var(--theme-text-secondary)] pointer-events-none" />
                  <ChevronDown size={12} className="absolute right-2.5 top-2.5 text-[var(--theme-text-secondary)] pointer-events-none" />
               </div>

               {/* Store Filter - Only show if not restricted */}
               {!restricted && (
                  <div className="relative">
                     <select
                        className="appearance-none min-h-11 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl pl-8 pr-8 text-xs font-medium text-[var(--theme-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] hover:bg-[var(--theme-bg-panel-hover)] transition-colors"
                        value={storeFilter}
                        onChange={(e) => handleFilterChange(setStoreFilter, e.target.value)}
                        aria-label="Filter by Store"
                     >
                        <option value="All" className="bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]">All Stores</option>
                        {sites.map(site => (
                           <option key={site.id} value={site.id} className="bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]">
                              {site.name}
                           </option>
                        ))}
                     </select>
                     <Building2 size={13} className="absolute left-2.5 top-2.5 text-[var(--theme-text-secondary)] pointer-events-none" />
                     <ChevronDown size={12} className="absolute right-2.5 top-2.5 text-[var(--theme-text-secondary)] pointer-events-none" />
                  </div>
               )}

               {/* Reset Filters Pill */}
               {hasActiveFilters && (
                  <button
                     type="button"
                     onClick={handleResetFilters}
                     className="min-h-11 px-3 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-panel-hover)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] text-xs font-medium flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                     title="Reset all filters"
                  >
                     <RotateCcw size={12} />
                     <span>Reset</span>
                  </button>
               )}
            </div>
         </div>
      </div>
   );
};
