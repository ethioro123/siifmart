import React from 'react';
import { Search, Calendar, ChevronDown } from 'lucide-react';
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
   return (
      <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 space-y-4 shadow-xs">
         <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex items-center bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-xl px-4 py-2 flex-1 focus-within:border-[var(--theme-border-strong)] transition-all">
               <Search className="w-4 h-4 text-[var(--theme-text-secondary)]" />
               <input
                  type="text"
                  placeholder="Search Receipt ID, Cashier Name..."
                  className="bg-transparent border-none ml-3 flex-1 text-[var(--theme-text-primary)] text-sm outline-none placeholder-[var(--theme-text-muted)]"
                  value={searchTerm}
                  onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
                  aria-label="Search transactions"
               />
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2 bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-[var(--theme-text-primary)]">
               <Calendar size={16} className="text-[var(--theme-text-secondary)]" />
               <input
                  type="date"
                  className="bg-transparent border-none text-[var(--theme-text-primary)] text-xs outline-none focus:ring-0 cursor-pointer"
                  value={dateRange.start}
                  onChange={e => handleFilterChange(setDateRange, { ...dateRange, start: e.target.value })}
                  aria-label="Start Date"
               />
               <span className="text-[var(--theme-text-muted)] text-xs">to</span>
               <input
                  type="date"
                  className="bg-transparent border-none text-[var(--theme-text-primary)] text-xs outline-none focus:ring-0 cursor-pointer"
                  value={dateRange.end}
                  onChange={e => handleFilterChange(setDateRange, { ...dateRange, end: e.target.value })}
                  aria-label="End Date"
               />
            </div>
         </div>

         <div className="flex gap-3 overflow-x-auto pb-1 select-none">
            {/* Method Filter */}
            <div className="relative">
               <select
                  className="appearance-none bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-xl pl-3 pr-8 py-2 text-xs font-bold text-[var(--theme-text-primary)] outline-none cursor-pointer hover:bg-[var(--theme-bg-panel-hover)] transition-all"
                  value={methodFilter}
                  onChange={(e) => handleFilterChange(setMethodFilter, e.target.value)}
                  aria-label="Filter by Payment Method"
               >
                  <option value="All" className="bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]">All Methods</option>
                  <option value="Cash" className="bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]">Cash</option>
                  <option value="Card" className="bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]">Card</option>
                  <option value="Mobile Money" className="bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]">Mobile Money</option>
               </select>
               <ChevronDown size={12} className="absolute right-2.5 top-3 text-[var(--theme-text-secondary)] pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative">
               <select
                  className="appearance-none bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-xl pl-3 pr-8 py-2 text-xs font-bold text-[var(--theme-text-primary)] outline-none cursor-pointer hover:bg-[var(--theme-bg-panel-hover)] transition-all"
                  value={statusFilter}
                  onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
                  aria-label="Filter by Status"
               >
                  <option value="All" className="bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]">All Statuses</option>
                  <option value="Completed" className="bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]">Completed</option>
                  <option value="Pending" className="bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]">Pending</option>
                  <option value="Refunded" className="bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]">Refunded</option>
               </select>
               <ChevronDown size={12} className="absolute right-2.5 top-3 text-[var(--theme-text-secondary)] pointer-events-none" />
            </div>

            {/* Store Filter - Only show if not restricted */}
            {!restricted && (
               <div className="relative">
                  <select
                     className="appearance-none bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-xl pl-3 pr-8 py-2 text-xs font-bold text-[var(--theme-text-primary)] outline-none cursor-pointer hover:bg-[var(--theme-bg-panel-hover)] transition-all"
                     value={storeFilter}
                     onChange={(e) => handleFilterChange(setStoreFilter, e.target.value)}
                     aria-label="Filter by Store"
                  >
                     <option value="All" className="bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]">All Stores</option>
                     {sites.map(site => (
                        <option key={site.id} value={site.id} className="bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]">{site.name}</option>
                     ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2.5 top-3 text-[var(--theme-text-secondary)] pointer-events-none" />
               </div>
            )}
         </div>
      </div>
   );
};
