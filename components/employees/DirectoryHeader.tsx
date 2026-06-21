import React from 'react';
import { Search, XCircle, LayoutGrid, List, ClipboardList, MapPin, Filter, ChevronDown } from 'lucide-react';
import { SYSTEM_ROLES } from '../../utils/roles';

interface DirectoryHeaderProps {
   searchTerm: string;
   setSearchTerm: (term: string) => void;
   filterRole: string;
   setFilterRole: (role: string) => void;
   filterStatus: string;
   setFilterStatus: (status: string) => void;
   filterDepartment: string;
   setFilterDepartment: (dept: string) => void;
   filterSite: string;
   setFilterSite: (site: string) => void;
   sites: any[];
   layoutMode: 'grid' | 'list';
   setLayoutMode: (mode: 'grid' | 'list') => void;
   isTaskQueueOpen: boolean;
   setIsTaskQueueOpen: (open: boolean) => void;
   totalCount: number;
   tasksCount: number;
   canViewAll: boolean;
   restricted: boolean;
   setCurrentPage: (page: number) => void;
   visibleEmployees: any[];
}

export default function DirectoryHeader({
   searchTerm, setSearchTerm, filterRole, setFilterRole, filterStatus, setFilterStatus,
   filterDepartment, setFilterDepartment, filterSite, setFilterSite, sites,
   layoutMode, setLayoutMode, isTaskQueueOpen, setIsTaskQueueOpen,
   totalCount, tasksCount, canViewAll, restricted, setCurrentPage, visibleEmployees
}: DirectoryHeaderProps) {
   
   const filterOptions = [
      { value: filterRole, setValue: setFilterRole, options: SYSTEM_ROLES.map(r => ({ value: r.id, label: r.label })), default: 'All Roles' },
      { value: filterStatus, setValue: setFilterStatus, options: [{ value: 'Active', label: 'Active' }, { value: 'Pending Approval', label: 'Pending' }, { value: 'Inactive', label: 'Inactive' }], default: 'All Status' },
      { value: filterDepartment, setValue: setFilterDepartment, options: Array.from(new Set(visibleEmployees.map(e => e.department).filter(Boolean))).map(d => ({ value: (d as string), label: (d as string) })), default: 'All Departments' },
      ...(restricted ? [] : [{ value: filterSite, setValue: setFilterSite, options: sites.map(s => ({ value: s.id, label: s.name })), default: 'All Locations' }])
   ];

   return (
      <div className="space-y-6 text-[#1E3F27] dark:text-white">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in slide-in-from-top-4">
            <div>
               <h2 className="text-xl font-bold text-[#1E3F27] dark:text-[#EAE5D9]">Team Directory</h2>
               <p className="text-sm text-stone-500 dark:text-gray-450 mt-0.5 font-medium">{totalCount} employees</p>
            </div>

            <div className="flex items-center gap-3">
               <button
                  onClick={() => setIsTaskQueueOpen(!isTaskQueueOpen)}
                  className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all border cursor-pointer ${
                     isTaskQueueOpen 
                        ? 'bg-gradient-to-br from-[#224429] to-[#2C5E3B] text-white border-transparent shadow-[0_4px_16px_rgba(44,94,59,0.25)]' 
                        : 'bg-white dark:bg-black/45 text-stone-600 dark:text-gray-400 border-[#E2DCCE] dark:border-white/10 hover:text-[#2C5E3B] dark:hover:text-white hover:border-[#2C5E3B]/40 dark:hover:border-white/30'
                  }`}
               >
                  <ClipboardList size={18} />
                  <span>Task Queue</span>
                  {tasksCount > 0 && (
                     <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${isTaskQueueOpen ? 'bg-white/20 text-white' : 'bg-amber-600 text-white'}`}>
                        {tasksCount}
                     </span>
                  )}
               </button>

               <div className="bg-white/80 dark:bg-black/40 p-1 rounded-xl border border-[#E2DCCE] dark:border-white/10 flex shadow-sm">
                  <button onClick={() => setLayoutMode('grid')} className={`p-2 rounded-lg transition-all cursor-pointer ${layoutMode === 'grid' ? 'bg-[#2C5E3B]/10 text-[#2C5E3B] dark:bg-[#A9CBA2]/20 dark:text-[#A9CBA2] font-bold' : 'text-stone-400 dark:text-gray-500 hover:text-[#2C5E3B] dark:hover:text-white'}`} title="Grid View"><LayoutGrid size={18} /></button>
                  <button onClick={() => setLayoutMode('list')} className={`p-2 rounded-lg transition-all cursor-pointer ${layoutMode === 'list' ? 'bg-[#2C5E3B]/10 text-[#2C5E3B] dark:bg-[#A9CBA2]/20 dark:text-[#A9CBA2] font-bold' : 'text-stone-400 dark:text-gray-500 hover:text-[#2C5E3B] dark:hover:text-white'}`} title="List View"><List size={18} /></button>
               </div>
            </div>
         </div>

         <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex items-center bg-white dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-4 py-2.5 focus-within:border-[#2C5E3B] dark:focus-within:border-[#A9CBA2] focus-within:ring-1 focus-within:ring-[#2C5E3B] dark:focus-within:ring-[#A9CBA2] transition-all flex-1">
               <Search className="w-4 h-4 text-stone-400 dark:text-gray-500" />
               <input
                  type="text"
                  placeholder={canViewAll ? "Search members..." : "Search profile..."}
                  className="bg-transparent border-none ml-3 flex-1 text-[#1E3F27] dark:text-white text-sm outline-none placeholder-stone-400 dark:placeholder-gray-600"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
               />
               {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="ml-2 text-stone-400 hover:text-[#2C5E3B] dark:text-gray-500 dark:hover:text-white transition-colors" aria-label="Clear search"><XCircle size={14} /></button>
               )}
            </div>

            {canViewAll && (
               <div className="flex flex-wrap gap-2 select-none">
                  {filterOptions.map((filter, i) => (
                     <div key={i} className="relative">
                        <select
                           aria-label={filter.default}
                           value={filter.value}
                           onChange={(e) => { filter.setValue(e.target.value); setCurrentPage(1); }}
                           className="appearance-none bg-white dark:bg-[#18201B]/60 hover:bg-stone-50 dark:hover:bg-white/5 border border-[#E2DCCE] dark:border-white/10 rounded-xl pl-3 pr-8 py-2.5 text-sm text-[#1E3F27] dark:text-gray-300 focus:outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] cursor-pointer transition-colors max-w-[150px]"
                        >
                           <option value="All" className="bg-[#FAF8F5] dark:bg-[#18201B] text-[#1E3F27] dark:text-white">{filter.default}</option>
                           {filter.options.map((opt: any) => (
                              <option key={opt.value} value={opt.value} className="bg-[#FAF8F5] dark:bg-[#18201B] text-[#1E3F27] dark:text-white">{opt.label}</option>
                           ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-2.5 top-3.5 text-stone-400 dark:text-gray-500 pointer-events-none" />
                     </div>
                  ))}

                  {(filterRole !== 'All' || filterStatus !== 'All' || filterDepartment !== 'All' || filterSite !== 'All') && (
                     <button
                        onClick={() => { setFilterRole('All'); setFilterStatus('All'); setFilterDepartment('All'); setFilterSite('All'); setSearchTerm(''); }}
                        className="px-3 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-[#E2DCCE] dark:border-white/10 text-stone-450 hover:text-rose-600 dark:text-gray-400 dark:hover:text-white text-sm transition-colors cursor-pointer"
                        title="Clear Filters"
                     >
                        <XCircle size={16} />
                     </button>
                  )}
               </div>
            )}
         </div>
      </div>
   );
}
