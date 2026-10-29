import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Building, Store, ChevronDown, Check, MapPin, ExternalLink, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { canSwitchCountry } from '../../utils/permissions';
import { getRoleDashboardRoute } from '../../utils/roleDashboard';
import { formatDisplaySiteId } from '../../utils/siteIdGenerator';
import { useData } from '../../contexts/DataContext';
import { isSharedHqRegionalRole } from '../../utils/roleSegregation';

interface LocationBadgeProps {
   user: any;
   sites: any[];
   employees: any[];
   activeSite: any;
   setActiveSite?: (id: string) => void;
}

export function LocationBadge({ user, sites, employees, activeSite, setActiveSite }: LocationBadgeProps) {
   const [isOpen, setIsOpen] = useState(false);
   const [showOnlyActiveRegion, setShowOnlyActiveRegion] = useState(true);
   const dropdownRef = useRef<HTMLDivElement>(null);
   const navigate = useNavigate();

   const {
      regions = [],
      activeRegionCode,
      setActiveRegionCode,
      canSwitchRegion,
      isRegionalUser
   } = useData();

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
   const siteType = displaySite?.type;

   const isWarehouse = siteType === 'Warehouse' || siteType === 'Distribution Center' || siteType === 'WMS';
   const isCeo = canSwitchCountry(user);

   // Role check for regional authority
   const isRegionalOfficer = Boolean(user && (
      user.role === 'regional_operations_manager' ||
      user.role === 'area_operations_manager' ||
      (typeof user.role === 'string' && user.role.startsWith('regional_')) ||
      (isRegionalUser && isSharedHqRegionalRole(user.role))
   ));
   const isRegionBadgeVisible = canSwitchRegion || isRegionalOfficer;

   // Authoritative region code for the user (locked for regional officers)
   const userRegionCode = activeRegionCode
      || currentEmployee?.region_code
      || (currentEmployee as any)?.regionCode
      || (user as any)?.region_code
      || (user as any)?.regionCode
      || finalSite?.region_code
      || finalSite?.regionCode
      || null;

   // Filter sites in dropdown based on active regional lens (strictly locked to userRegionCode for non-CEO regional officers)
   const availableSites = useMemo(() => {
      if (!isCeo && userRegionCode) {
         return sites.filter(s => (s.region_code === userRegionCode || s.regionCode === userRegionCode));
      }
      if (showOnlyActiveRegion && activeRegionCode) {
         const regionalSites = sites.filter(s => (s.region_code === activeRegionCode || s.regionCode === activeRegionCode));
         if (regionalSites.length > 0) return regionalSites;
      }
      return sites;
   }, [sites, isCeo, userRegionCode, showOnlyActiveRegion, activeRegionCode]);

   const canSwitchRegionalSites = isRegionalOfficer && Boolean(userRegionCode);
   const canSwitchSites = !!setActiveSite && (isCeo || canSwitchRegionalSites) && availableSites.length > 1;

   // Region details for active site
   const siteRegionCode = displaySite?.region_code || displaySite?.regionCode;
   const siteRegion = siteRegionCode ? regions.find(r => r.code === siteRegionCode) : null;
   const cleanSiteRegionName = siteRegion ? siteRegion.name.replace(/\s*(Region|Territory)$/i, '') : '';

   // Deduplicated name logic:
   // If RegionBadge is already visible in the topbar and the site is an Administrative office for that region,
   // label it cleanly as "Regional Hub" to prevent stutter ("Nairobi Region Administration" next to "Nairobi Metro").
   let displayLocationTitle = displaySite?.name || 'Administration';
   const isRegionalAdminSite = (siteType === 'Administration' || siteType === 'Administrative') && Boolean(siteRegionCode);
   if (isRegionBadgeVisible && isRegionalAdminSite) {
      displayLocationTitle = 'Regional Hub';
   }

   // Subtitle logic:
   // When RegionBadge is hidden (frontline staff), append their territory cleanly (e.g. "SITE-0002 • Nairobi Metro").
   // When RegionBadge is visible (executives), display just the concise facility code.
   const displaySubtitle = !isRegionBadgeVisible && cleanSiteRegionName
      ? `${formatDisplaySiteId(displaySite)} • ${cleanSiteRegionName}`
      : formatDisplaySiteId(displaySite);

   // Dynamic bidirectional sync when selecting a site
   const handleSelectSite = (selectedSiteId: string) => {
      if (!setActiveSite || !canSwitchSites) return;
      const selected = sites.find(s => s.id === selectedSiteId);
      if (!selected) return;
      if (!isCeo && userRegionCode) {
         const selectedRegion = selected.region_code || selected.regionCode || null;
         if (selectedRegion !== userRegionCode) return;
      }
      setActiveSite(selectedSiteId);
      setIsOpen(false);
      // Sync active region lens with the selected site's territory for CEO/country switchers
      if (isCeo && setActiveRegionCode) {
         const selectedRegion = selected.region_code || selected.regionCode || null;
         setActiveRegionCode(selectedRegion);
      }
      navigate(getRoleDashboardRoute(user?.role, selected.type));
   };

   const effectiveRegionCode = activeRegionCode || userRegionCode;
   const activeRegionObj = effectiveRegionCode ? regions.find(r => r.code === effectiveRegionCode) : null;
   const activeRegionShortName = activeRegionObj ? activeRegionObj.name.replace(/\s*(Region|Territory)$/i, '') : cleanSiteRegionName;

   return (
      <div className="relative" ref={dropdownRef}>
         <button
            type="button"
            onClick={() => canSwitchSites && setIsOpen(!isOpen)}
            disabled={!canSwitchSites}
            className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border transition-colors text-left min-h-[44px] ${
               canSwitchSites
                  ? 'border-[#E2DCCE] dark:border-white/10 hover:border-[var(--theme-border)]/40 dark:hover:border-[#A9CBA2]/30 bg-white/70 dark:bg-black/20 hover:bg-white dark:hover:bg-white/5 cursor-pointer shadow-xs'
                  : 'border-[#E2DCCE]/50 dark:border-white/5 bg-white/40 dark:bg-black/10 cursor-default select-none'
            }`}
            aria-label={canSwitchSites ? "Current location and site switcher" : "Current location"}
         >
            {/* Accent dot / indicator */}
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
               isWarehouse ? 'bg-[var(--theme-status-info-bg)]' : 'bg-[var(--theme-primary)] dark:bg-[#A9CBA2]'
            }`} />

            <div className="flex flex-col min-w-0 max-w-[110px] sm:max-w-[160px]">
               <span className="text-[11px] sm:text-[13px] font-bold text-[#1E3F27] dark:text-[#EAE5D9] truncate leading-tight">
                  {displayLocationTitle}
               </span>
               {displaySubtitle && (
                  <span className="font-mono text-[9px] text-[#4D6E56] dark:text-[#7A9E83] font-semibold leading-none truncate mt-0.5">
                     {displaySubtitle}
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

         {/* Site Switcher Dropdown - CEO or Region-Scoped Regional Officers */}
         {canSwitchSites && isOpen && (
            <div className="absolute left-0 mt-1.5 w-64 sm:w-72 bg-[#FDFBF7] dark:bg-[#18201B] border border-[#E2DCCE] dark:border-white/10 rounded-2xl shadow-xl z-50 p-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
               <div className="px-3 py-1.5 mb-1 border-b border-[#E2DCCE]/60 dark:border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4D6E56] dark:text-[#7A9E83]">
                     {activeRegionShortName && (showOnlyActiveRegion || !isCeo) ? `${activeRegionShortName} Sites` : 'Switch Location'}
                  </span>
                  {isCeo ? (
                     <div className="flex items-center gap-2">
                        {activeRegionCode && (
                           <button
                              type="button"
                              onClick={() => setShowOnlyActiveRegion(!showOnlyActiveRegion)}
                              className="text-[10px] font-bold text-[#4D6E56] dark:text-[#7A9E83] hover:text-[var(--theme-primary)] dark:hover:text-[#A9CBA2] flex items-center gap-0.5 cursor-pointer"
                              title={showOnlyActiveRegion ? "Show all facilities across all regions" : `Filter facilities to ${activeRegionShortName}`}
                           >
                              <Filter size={10} />
                              <span>{showOnlyActiveRegion ? 'All' : activeRegionShortName}</span>
                           </button>
                        )}
                        <button
                           type="button"
                           onClick={() => { setIsOpen(false); navigate('/location-select'); }}
                           className="text-[10px] font-bold text-[var(--theme-primary)] dark:text-[#A9CBA2] hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                           <span>All</span>
                           <ExternalLink size={10} />
                        </button>
                     </div>
                  ) : (
                     <span className="text-[9px] font-mono font-semibold text-[#4D6E56] dark:text-[#7A9E83]">
                        {userRegionCode}
                     </span>
                  )}
               </div>

               <div className="max-h-64 overflow-y-auto space-y-1 custom-scrollbar">
                  {availableSites.map(site => {
                     const isSelected = displaySite?.id === site.id;
                     const isStore = site.type === 'Store';
                     const isWh = site.type === 'Warehouse' || site.type === 'Distribution Center';
                     const siteRegionName = regions.find(r => r.code === (site.region_code || site.regionCode))?.name?.replace(/\s*(Region|Territory)$/i, '');
                     return (
                        <button
                           key={site.id}
                           type="button"
                           onClick={() => handleSelectSite(site.id)}
                           className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                              isSelected
                                 ? 'bg-[var(--theme-primary)]/10 dark:bg-[var(--theme-primary)]/25 text-[#1E3F27] dark:text-[#EAE5D9] font-bold'
                                 : 'hover:bg-black/5 dark:hover:bg-white/5 text-[#2C4D35] dark:text-[#A9CBA2]'
                           }`}
                        >
                           <div className="flex items-center gap-2 min-w-0">
                              {isStore ? (
                                 <Store size={14} className="text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] flex-shrink-0" />
                              ) : isWh ? (
                                 <Building size={14} className="text-[var(--theme-status-info-text)] flex-shrink-0" />
                              ) : (
                                 <MapPin size={14} className="text-[var(--theme-primary)] dark:text-[#A9CBA2] flex-shrink-0" />
                              )}
                              <div className="min-w-0">
                                 <p className="text-xs font-semibold truncate leading-tight">{site.name}</p>
                                 <p className="text-[9px] font-mono opacity-60 leading-none">
                                    {formatDisplaySiteId(site)} • {site.type}
                                    {siteRegionName && !activeRegionCode && ` • ${siteRegionName}`}
                                 </p>
                              </div>
                           </div>
                           {isSelected && <Check size={14} className="text-[var(--theme-primary)] dark:text-[#A9CBA2] flex-shrink-0" />}
                        </button>
                     );
                  })}
               </div>
            </div>
         )}
      </div>
   );
}

