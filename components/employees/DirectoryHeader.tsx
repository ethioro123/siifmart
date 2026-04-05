import React from 'react';
import { Search, XCircle, LayoutGrid, List, ClipboardList, MapPin, Filter } from 'lucide-react';
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
      <div className="space-y-6">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in slide-in-from-top-4">
            <div>
               <h2 className="text-xl font-semibold text-white">Team Directory</h2>
               <p className="text-sm text-gray-500 mt-0.5">{totalCount} employees</p>
            </div>

            <div className="flex items-center gap-3">
               <button
                  onClick={() => setIsTaskQueueOpen(!isTaskQueueOpen)}
                  className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all border ${isTaskQueueOpen ? 'bg-cyber-primary text-black border-cyber-primary shadow-[0_0_15px_rgba(0,255,157,0.4)]' : 'bg-black/40 text-gray-400 border-white/10 hover:text-white hover:border-white/30'}`}
               >
                  <ClipboardList size={18} />
                  <span>Task Queue</span>
                  {tasksCount > 0 && (
                     <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isTaskQueueOpen ? 'bg-black/20 text-black' : 'bg-cyber-primary text-black'}`}>
                        {tasksCount}
                     </span>
                  )}
               </button>

               <div className="bg-black/40 p-1 rounded-xl border border-white/10 flex">
                  <button onClick={() => setLayoutMode('grid')} className={`p-2 rounded-lg transition-all ${layoutMode === 'grid' ? 'bg-cyber-primary/20 text-cyber-primary' : 'text-gray-500 hover:text-white'}`} title="Grid View"><LayoutGrid size={18} /></button>
                  <button onClick={() => setLayoutMode('list')} className={`p-2 rounded-lg transition-all ${layoutMode === 'list' ? 'bg-cyber-primary/20 text-cyber-primary' : 'text-gray-500 hover:text-white'}`} title="List View"><List size={18} /></button>
               </div>
            </div>
         </div>

         <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex items-center bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 focus-within:border-white/20 transition-colors flex-1">
               <Search className="w-4 h-4 text-gray-500" />
               <input
                  type="text"
                  placeholder={canViewAll ? "Search members..." : "Search profile..."}
                  className="bg-transparent border-none ml-3 flex-1 text-white text-sm outline-none placeholder-gray-600"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
               />
               {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="ml-2 text-gray-500 hover:text-white transition-colors" aria-label="Clear search"><XCircle size={14} /></button>
               )}
            </div>

            {canViewAll && (
               <div className="flex flex-wrap gap-2">
                  {filterOptions.map((filter, i) => (
                     <select
                        key={i}
                        aria-label={filter.default}
                        value={filter.value}
                        onChange={(e) => { filter.setValue(e.target.value); setCurrentPage(1); }}
                        className="bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-white/20 cursor-pointer transition-colors max-w-[150px]"
                     >
                        <option value="All">{filter.default}</option>
                        {filter.options.map((opt: any) => (
                           <option key={opt.value} value={opt.value} className="bg-[#1a1a1a] text-gray-300">{opt.label}</option>
                        ))}
                     </select>
                  ))}

                  {(filterRole !== 'All' || filterStatus !== 'All' || filterDepartment !== 'All' || filterSite !== 'All') && (
                     <button
                        onClick={() => { setFilterRole('All'); setFilterStatus('All'); setFilterDepartment('All'); setFilterSite('All'); setSearchTerm(''); }}
                        className="px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm transition-colors"
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
