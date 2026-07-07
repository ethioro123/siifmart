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
      <div className="bg-white/80 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 backdrop-blur-md rounded-2xl p-4 space-y-4 shadow-sm">
         <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex items-center bg-white dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-4 py-2 flex-1 focus-within:border-[#2C5E3B] dark:focus-within:border-[#A9CBA2] focus-within:ring-1 focus-within:ring-[#2C5E3B] dark:focus-within:ring-[#A9CBA2] transition-all">
               <Search className="w-4 h-4 text-stone-400 dark:text-gray-400" />
               <input
                  type="text"
                  placeholder="Search Receipt ID, Cashier Name..."
                  className="bg-transparent border-none ml-3 flex-1 text-[#1E3F27] dark:text-white text-sm outline-none placeholder-stone-400 dark:placeholder-gray-500"
                  value={searchTerm}
                  onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
                  aria-label="Search transactions"
               />
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2 bg-white dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3 py-2 text-[#1E3F27] dark:text-white">
               <Calendar size={16} className="text-stone-400 dark:text-gray-400" />
               <input
                  type="date"
                  className="bg-transparent border-none text-[#1E3F27] dark:text-white text-xs outline-none focus:ring-0 cursor-pointer"
                  value={dateRange.start}
                  onChange={e => handleFilterChange(setDateRange, { ...dateRange, start: e.target.value })}
                  aria-label="Start Date"
               />
               <span className="text-stone-400 dark:text-gray-550 text-xs">to</span>
               <input
                  type="date"
                  className="bg-transparent border-none text-[#1E3F27] dark:text-white text-xs outline-none focus:ring-0 cursor-pointer"
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
                  className="appearance-none bg-white dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-white/10 rounded-xl pl-3 pr-8 py-2 text-xs font-bold text-[#1E3F27] dark:text-white outline-none cursor-pointer hover:bg-stone-50 dark:hover:bg-white/5 transition-all"
                  value={methodFilter}
                  onChange={(e) => handleFilterChange(setMethodFilter, e.target.value)}
                  aria-label="Filter by Payment Method"
               >
                  <option value="All" className="bg-[#FAF8F5] dark:bg-[#18201B] text-[#1E3F27] dark:text-white">All Methods</option>
                  <option value="Cash" className="bg-[#FAF8F5] dark:bg-[#18201B] text-[#1E3F27] dark:text-white">Cash</option>
                  <option value="Card" className="bg-[#FAF8F5] dark:bg-[#18201B] text-[#1E3F27] dark:text-white">Card</option>
                  <option value="Mobile Money" className="bg-[#FAF8F5] dark:bg-[#18201B] text-[#1E3F27] dark:text-white">Mobile Money</option>
               </select>
               <ChevronDown size={12} className="absolute right-2.5 top-3 text-stone-400 dark:text-gray-400 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative">
               <select
                  className="appearance-none bg-white dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-white/10 rounded-xl pl-3 pr-8 py-2 text-xs font-bold text-[#1E3F27] dark:text-white outline-none cursor-pointer hover:bg-stone-50 dark:hover:bg-white/5 transition-all"
                  value={statusFilter}
                  onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
                  aria-label="Filter by Status"
               >
                  <option value="All" className="bg-[#FAF8F5] dark:bg-[#18201B] text-[#1E3F27] dark:text-white">All Statuses</option>
                  <option value="Completed" className="bg-[#FAF8F5] dark:bg-[#18201B] text-[#1E3F27] dark:text-white">Completed</option>
                  <option value="Pending" className="bg-[#FAF8F5] dark:bg-[#18201B] text-[#1E3F27] dark:text-white">Pending</option>
                  <option value="Refunded" className="bg-[#FAF8F5] dark:bg-[#18201B] text-[#1E3F27] dark:text-white">Refunded</option>
               </select>
               <ChevronDown size={12} className="absolute right-2.5 top-3 text-stone-400 dark:text-gray-400 pointer-events-none" />
            </div>

            {/* Store Filter - Only show if not restricted */}
            {!restricted && (
               <div className="relative">
                  <select
                     className="appearance-none bg-white dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-white/10 rounded-xl pl-3 pr-8 py-2 text-xs font-bold text-[#1E3F27] dark:text-white outline-none cursor-pointer hover:bg-stone-50 dark:hover:bg-white/5 transition-all"
                     value={storeFilter}
                     onChange={(e) => handleFilterChange(setStoreFilter, e.target.value)}
                     aria-label="Filter by Store"
                  >
                     <option value="All" className="bg-[#FAF8F5] dark:bg-[#18201B] text-[#1E3F27] dark:text-white">All Stores</option>
                     {sites.map(site => (
                        <option key={site.id} value={site.id} className="bg-[#FAF8F5] dark:bg-[#18201B] text-[#1E3F27] dark:text-white">{site.name}</option>
                     ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2.5 top-3 text-stone-400 dark:text-gray-400 pointer-events-none" />
               </div>
            )}
         </div>
      </div>
   );
};
