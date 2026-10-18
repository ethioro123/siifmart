import React from 'react';
import { Search, X, LayoutGrid, List, ClipboardList, ChevronDown, ShieldCheck, RotateCcw } from 'lucide-react';
import { Employee, Site, Region } from '../../types';
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
   filterRegion?: string;
   setFilterRegion?: (region: string) => void;
   regions?: Region[];
   sites: Site[];
   layoutMode: 'grid' | 'list';
   setLayoutMode: (mode: 'grid' | 'list') => void;
   isTaskQueueOpen: boolean;
   setIsTaskQueueOpen: (open: boolean) => void;
   totalCount: number;
   tasksCount: number;
   canViewAll: boolean;
   restricted: boolean;
   setCurrentPage: (page: number) => void;
   visibleEmployees: Employee[];
   pendingSalaryCount?: number;
   onOpenSalaryQueue?: () => void;
   isOnlyManagers?: boolean;
}

export default function DirectoryHeader({
   searchTerm, setSearchTerm, filterRole, setFilterRole, filterStatus, setFilterStatus,
   filterDepartment, setFilterDepartment, filterSite, setFilterSite,
   filterRegion = 'All', setFilterRegion, regions = [], sites,
   layoutMode, setLayoutMode, isTaskQueueOpen, setIsTaskQueueOpen,
   totalCount, tasksCount, canViewAll, restricted, setCurrentPage, visibleEmployees,
   pendingSalaryCount = 0, onOpenSalaryQueue, isOnlyManagers = false
}: DirectoryHeaderProps) {
   
   const handleRegionChange = (newRegion: string) => {
      if (setFilterRegion) {
         setFilterRegion(newRegion);
         if (newRegion !== 'All' && filterSite !== 'All') {
            const matches = sites.some(s => s.id === filterSite && (s.regionCode === newRegion || (s as any).region_code === newRegion));
            if (!matches) {
               setFilterSite('All');
            }
         }
      }
   };

   const regionOptions = (regions || []).map(r => ({ value: r.code, label: r.name }));
   const siteOptions = sites.map(s => ({ value: s.id, label: s.name }));

   const filterOptions = [
      ...(regions && regions.length > 0 && !restricted && setFilterRegion ? [{
         value: filterRegion || 'All',
         setValue: handleRegionChange,
         options: regionOptions,
         default: 'All Regions'
      }] : []),
      { value: filterRole, setValue: setFilterRole, options: SYSTEM_ROLES.map(r => ({ value: r.id, label: r.label })), default: 'All Roles' },
      { value: filterStatus, setValue: setFilterStatus, options: [{ value: 'Active', label: 'Active' }, { value: 'Pending Approval', label: 'Pending' }, { value: 'Inactive', label: 'Inactive' }], default: 'All Status' },
      { value: filterDepartment, setValue: setFilterDepartment, options: Array.from(new Set(visibleEmployees.map(e => e.department).filter(Boolean))).map(d => ({ value: (d as string), label: (d as string) })), default: 'All Departments' },
      ...(restricted ? [] : [{ value: filterSite, setValue: setFilterSite, options: siteOptions, default: 'All Locations' }])
   ];

   const hasActiveFilters = (Boolean(filterRegion) && filterRegion !== 'All') || filterRole !== 'All' || filterStatus !== 'All' || filterDepartment !== 'All' || filterSite !== 'All';

   const handleClearFilters = () => {
      if (setFilterRegion) setFilterRegion('All');
      setFilterRole('All');
      setFilterStatus('All');
      setFilterDepartment('All');
      setFilterSite('All');
      setSearchTerm('');
      setCurrentPage(1);
   };

   return (
      <div className="space-y-4 text-[var(--theme-text-primary)]">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
               <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold tracking-tight text-[var(--theme-text-primary)]">
                     Team Directory
                  </h3>
                  {isOnlyManagers && (
                     <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        Management Tier
                     </span>
                  )}
               </div>
               <p className="text-xs text-[var(--theme-text-secondary)] font-normal mt-0.5">
                  <span className="font-mono tabular-nums font-medium text-[var(--theme-text-primary)]">{totalCount}</span> {isOnlyManagers ? 'managers & higher-ups enrolled (filter by location or search to view frontline staff)' : 'team members enrolled'}
               </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
               {/* Task Queue Pill Toggle */}
               <button
                  type="button"
                  onClick={() => setIsTaskQueueOpen(!isTaskQueueOpen)}
                  className={`h-9 px-3 rounded-xl flex items-center gap-2 text-xs font-semibold transition-all border cursor-pointer active:scale-[0.98] ${
                     isTaskQueueOpen 
                        ? 'bg-[#0071E3] dark:bg-[#2997FF] text-white border-transparent shadow-[0_2px_8px_rgba(0,113,227,0.25)]' 
                        : 'bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-panel-hover)] text-[var(--theme-text-primary)] border-[var(--theme-border)]'
                  }`}
               >
                  <ClipboardList size={14} />
                  <span>Tasks</span>
                  {tasksCount > 0 && (
                     <span className={`text-[11px] font-mono tabular-nums px-1.5 py-0.2 rounded-full font-semibold ${
                        isTaskQueueOpen ? 'bg-white/20 text-white' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                     }`}>
                        {tasksCount}
                     </span>
                  )}
               </button>

               {/* Salary Queue Pill Button */}
               {onOpenSalaryQueue && (
                  <button
                     type="button"
                     onClick={onOpenSalaryQueue}
                     className="h-9 px-3 rounded-xl flex items-center gap-2 text-xs font-semibold transition-all border cursor-pointer bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-panel-hover)] text-[var(--theme-text-primary)] border-[var(--theme-border)] active:scale-[0.98]"
                  >
                     <ShieldCheck size={14} />
                     <span>Compensation</span>
                     {pendingSalaryCount > 0 && (
                        <span className="text-[11px] font-mono tabular-nums px-1.5 py-0.2 rounded-full font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                           {pendingSalaryCount}
                        </span>
                     )}
                  </button>
               )}

               {/* Apple Segmented Control for Layout Toggle */}
               <div className="p-1 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl flex items-center gap-1 select-none">
                  <button
                     type="button"
                     onClick={() => setLayoutMode('grid')}
                     className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        layoutMode === 'grid'
                           ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-[0_1px_3px_rgba(0,0,0,0.12)]'
                           : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                     }`}
                     title="Grid View"
                     aria-label="Grid View"
                  >
                     <LayoutGrid size={15} />
                  </button>
                  <button
                     type="button"
                     onClick={() => setLayoutMode('list')}
                     className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        layoutMode === 'list'
                           ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-[0_1px_3px_rgba(0,0,0,0.12)]'
                           : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                     }`}
                     title="List View"
                     aria-label="List View"
                  >
                     <List size={15} />
                  </button>
               </div>
            </div>
         </div>

         {/* 3-Level Facility Hierarchy & Operation Site Filter Pills */}
         {canViewAll && !restricted && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
               {[
                  { value: 'All', label: 'All Facilities' },
                  { value: 'TIER:HQ', label: 'HQ' },
                  { value: 'TIER:REGIONAL', label: 'Regional Administration' },
                  { value: 'TIER:OPS', label: 'Operation Sites' },
                  { value: 'TYPE:Store', label: 'Store' },
                  { value: 'TYPE:Warehouse', label: 'Warehouse' },
                  { value: 'TYPE:Distribution Center', label: 'Distribution Center' },
                  { value: 'TYPE:Online Store', label: 'Online Store' },
               ].map((pill) => {
                  const isActive = filterSite === pill.value;
                  return (
                     <button
                        key={pill.value}
                        type="button"
                        onClick={() => { setFilterSite(pill.value); setCurrentPage(1); }}
                        className={`h-8 px-3 rounded-xl text-xs font-semibold transition-all border cursor-pointer active:scale-[0.98] ${
                           isActive
                              ? 'bg-[#0071E3] dark:bg-[#2997FF] text-white border-transparent shadow-xs'
                              : 'bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-panel-hover)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border-[var(--theme-border)]'
                        }`}
                     >
                        {pill.label}
                     </button>
                  );
               })}
            </div>
         )}

         {/* Search & Filter Bar */}
         <div className="flex flex-col lg:flex-row gap-3">
            {/* Apple Search Field */}
            <div className="flex items-center h-11 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 focus-within:border-[var(--theme-border-strong)] focus-within:ring-2 focus-within:ring-[#0071E3]/25 transition-all flex-1">
               <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-[#0071E3] dark:text-[#2997FF] flex items-center justify-center shrink-0">
                  <Search size={14} />
               </div>
               <input
                  type="text"
                  placeholder={canViewAll ? "Search by name, role, email..." : "Search profile..."}
                  className="bg-transparent border-none ml-2.5 flex-1 text-[var(--theme-text-primary)] text-sm outline-none placeholder-[var(--theme-text-muted)] font-normal"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
               />
               {searchTerm && (
                  <button
                     type="button"
                     onClick={() => setSearchTerm('')}
                     className="w-5 h-5 rounded-full bg-[var(--theme-border)] hover:bg-[var(--theme-border-strong)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] flex items-center justify-center transition-colors cursor-pointer"
                     aria-label="Clear search"
                  >
                     <X size={12} />
                  </button>
               )}
            </div>

            {/* Filter Selects */}
            {canViewAll && (
               <div className="flex flex-wrap items-center gap-2 select-none">
                  {filterOptions.map((filter, i) => (
                     <div key={i} className="relative">
                        <select
                           aria-label={filter.default}
                           value={filter.value}
                           onChange={(e) => { filter.setValue(e.target.value); setCurrentPage(1); }}
                           className="appearance-none h-11 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl pl-3 pr-8 text-xs font-medium text-[var(--theme-text-primary)] outline-none cursor-pointer hover:bg-[var(--theme-bg-panel-hover)] focus:ring-2 focus:ring-[#0071E3]/25 transition-all max-w-[150px]"
                        >
                           <option value="All" className="bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]">{filter.default}</option>
                           {filter.options.map((opt: { value: string; label: string }) => (
                              <option key={opt.value} value={opt.value} className="bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]">{opt.label}</option>
                           ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-2.5 top-4 text-[var(--theme-text-secondary)] pointer-events-none" />
                     </div>
                  ))}

                  {/* Reset Filters Pill */}
                  {hasActiveFilters && (
                     <button
                        type="button"
                        onClick={handleClearFilters}
                        className="h-11 px-3 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-panel-hover)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] text-xs font-medium flex items-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
                        title="Clear Filters"
                     >
                        <RotateCcw size={12} />
                        <span>Reset</span>
                     </button>
                  )}
               </div>
            )}
         </div>
      </div>
   );
}
