import React, { useState, useRef, useEffect } from 'react';
import { Building, Store, ChevronDown, Check, MapPin, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LocationBadgeProps {
   user: any;
   sites: any[];
   employees: any[];
   activeSite: any;
   setActiveSite?: (id: string) => void;
}

export function LocationBadge({ user, sites, employees, activeSite, setActiveSite }: LocationBadgeProps) {
   const [isOpen, setIsOpen] = useState(false);
   const dropdownRef = useRef<HTMLDivElement>(null);
   const navigate = useNavigate();

   // Close dropdown on click outside
   useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
         if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
            setIsOpen(false);
         }
      };
      if (isOpen) {
         document.addEventListener('mousedown', handleClickOutside);
      }
      return () => document.removeEventListener('mousedown', handleClickOutside);
   }, [isOpen]);

   // Find current user's employee record
   let currentEmployee = null;
   if (user && employees.length > 0) {
      if (user.employeeId) currentEmployee = employees.find(emp => emp.id === user.employeeId);
      if (!currentEmployee && user.id) currentEmployee = employees.find(emp => emp.id === user.id);
      if (!currentEmployee && user.name) {
         currentEmployee = employees.find(emp => emp.name.toLowerCase() === user.name.toLowerCase());
      }
   }

   const employeeSite = currentEmployee
      ? sites.find(s => s.id === currentEmployee.siteId || s.id === currentEmployee.site_id)
      : null;

   const siteId = currentEmployee
      ? (currentEmployee.siteId || currentEmployee.site_id)
      : user?.siteId;

   const finalSite = employeeSite || (siteId ? sites.find(s => s.id === siteId) : null);
   const displaySite = activeSite || finalSite;
   const locationName = displaySite?.name || 'Administration';
   const siteType = displaySite?.type;

   const isWarehouse = siteType === 'Warehouse' || siteType === 'Distribution Center';
   const isCeo = user?.role === 'super_admin' || (user?.role as string) === 'CEO';
   const canSwitchSites = !!setActiveSite && isCeo && sites.length > 1;

   const handleSelectSite = (siteId: string) => {
      if (!setActiveSite || !canSwitchSites) return;
      setActiveSite(siteId);
      setIsOpen(false);
      const selected = sites.find(s => s.id === siteId);
      if (selected) {
         const isWh = ['Warehouse', 'Distribution Center', 'WMS', 'Fulfillment Center'].includes(selected.type || '');
         const isSt = ['Store', 'Dark Store', 'Retail', 'POS'].includes(selected.type || '');
         if (isWh) navigate('/wms-ops');
         else if (isSt) navigate('/pos');
      }
   };

   return (
      <div className="relative" ref={dropdownRef}>
         <button
            type="button"
            onClick={() => canSwitchSites && setIsOpen(!isOpen)}
            disabled={!canSwitchSites}
            className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border transition-colors text-left min-h-[44px] ${
               canSwitchSites
                  ? 'border-[#E2DCCE] dark:border-white/10 hover:border-[#2C5E3B]/40 dark:hover:border-[#A9CBA2]/30 bg-white/70 dark:bg-black/20 hover:bg-white dark:hover:bg-white/5 cursor-pointer shadow-xs'
                  : 'border-[#E2DCCE]/50 dark:border-white/5 bg-white/40 dark:bg-black/10 cursor-default select-none'
            }`}
            aria-label={canSwitchSites ? "Current location and site switcher" : "Current location"}
         >
            {/* Accent dot / indicator */}
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
               isWarehouse ? 'bg-blue-500' : 'bg-[#2C5E3B] dark:bg-[#A9CBA2]'
            }`} />

            <div className="flex flex-col min-w-0 max-w-[110px] sm:max-w-[160px]">
               <span className="text-[11px] sm:text-[13px] font-bold text-[#1E3F27] dark:text-[#EAE5D9] truncate leading-tight">
                  {locationName}
               </span>
               {displaySite?.code && (
                  <span className="font-mono text-[9px] text-[#4D6E56] dark:text-[#7A9E83] font-semibold leading-none truncate">
                     {displaySite.code}
                  </span>
               )}
            </div>

            {canSwitchSites && (
               <ChevronDown
                  size={14}
                  className={`text-[#4D6E56] dark:text-[#7A9E83] transition-transform duration-200 flex-shrink-0 ${
                     isOpen ? 'rotate-180' : ''
                  }`}
               />
            )}
         </button>

         {/* Site Switcher Dropdown - CEO Only */}
         {canSwitchSites && isOpen && (
            <div className="absolute left-0 mt-1.5 w-64 sm:w-72 bg-[#FDFBF7] dark:bg-[#18201B] border border-[#E2DCCE] dark:border-white/10 rounded-2xl shadow-xl z-50 p-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
               <div className="px-3 py-1.5 mb-1 border-b border-[#E2DCCE]/60 dark:border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4D6E56] dark:text-[#7A9E83]">
                     Switch Location
                  </span>
                  <button
                     onClick={() => { setIsOpen(false); navigate('/location-select'); }}
                     className="text-[10px] font-bold text-[#2C5E3B] dark:text-[#A9CBA2] hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                     <span>All</span>
                     <ExternalLink size={10} />
                  </button>
               </div>

               <div className="max-h-64 overflow-y-auto space-y-1 custom-scrollbar">
                  {sites.map(site => {
                     const isSelected = displaySite?.id === site.id;
                     const isStore = site.type === 'Store' || site.type === 'Dark Store';
                     const isWh = site.type === 'Warehouse' || site.type === 'Distribution Center';
                     return (
                        <button
                           key={site.id}
                           type="button"
                           onClick={() => handleSelectSite(site.id)}
                           className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                              isSelected
                                 ? 'bg-[#2C5E3B]/10 dark:bg-[#2C5E3B]/25 text-[#1E3F27] dark:text-[#EAE5D9] font-bold'
                                 : 'hover:bg-black/5 dark:hover:bg-white/5 text-[#2C4D35] dark:text-[#A9CBA2]'
                           }`}
                        >
                           <div className="flex items-center gap-2 min-w-0">
                              {isStore ? (
                                 <Store size={14} className="text-amber-600 dark:text-amber-500 flex-shrink-0" />
                              ) : isWh ? (
                                 <Building size={14} className="text-blue-500 flex-shrink-0" />
                              ) : (
                                 <MapPin size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2] flex-shrink-0" />
                              )}
                              <div className="min-w-0">
                                 <p className="text-xs font-semibold truncate leading-tight">{site.name}</p>
                                 <p className="text-[9px] font-mono opacity-60 leading-none">{site.code || site.type}</p>
                              </div>
                           </div>
                           {isSelected && <Check size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2] flex-shrink-0" />}
                        </button>
                     );
                  })}
               </div>
            </div>
         )}
      </div>
   );
}

