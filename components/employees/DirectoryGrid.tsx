import React from 'react';
import { Loader2, User, AlertTriangle, MapPin } from 'lucide-react';
import { Employee, Site, UserRole } from '../../types';
import { SYSTEM_ROLES, canViewLocation } from '../../utils/roles';
import { evaluateGeofence, formatSiteAssignment } from '../../utils/geofence';
import WorkforceScopeBadge from './WorkforceScopeBadge';

interface DirectoryGridProps {
   displayedEmployees: Employee[];
   isLoadingEmployees: boolean;
   sites: Site[];
   setSelectedEmployee: (emp: Employee) => void;
   currentUser?: { id?: string; role?: UserRole; siteId?: string } | null;
   onlineIds?: Set<string>;
}

export default function DirectoryGrid({
   displayedEmployees,
   isLoadingEmployees,
   sites,
   setSelectedEmployee,
   currentUser,
   onlineIds = new Set()
}: DirectoryGridProps) {
   if (isLoadingEmployees && displayedEmployees.length === 0) {
      return (
         <div className="col-span-full flex justify-center py-16">
            <Loader2 className="animate-spin text-[var(--theme-text-muted)]" size={24} />
         </div>
      );
   }

   return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
         {displayedEmployees.map((employee) => {
            const roleConfig = SYSTEM_ROLES.find(r => r.id === employee.role) || {
               id: employee.role,
               label: employee.role?.replace(/_/g, ' ') || 'Staff',
               desc: 'Team Member',
               level: 4,
               styles: { text: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', badge: 'bg-slate-500/20 text-slate-300' }
            };
            const isOwn = currentUser?.id === employee.id;
            const canSeeLocation = canViewLocation(currentUser?.role, employee.role, isOwn);
            const siteInfo = formatSiteAssignment(employee.siteId, employee.role, sites);
            const geofence = employee.lastLoginGps ? evaluateGeofence(employee.lastLoginGps) : null;
            const isOnline = onlineIds.has(employee.id);

            return (
               <div
                  key={employee.id}
                  onClick={() => setSelectedEmployee(employee)}
                  className="bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-card-hover)] border border-[var(--theme-border)] hover:border-[var(--theme-border-strong)] rounded-2xl p-4 sm:p-5 cursor-pointer transition-all duration-200 shadow-[var(--shadow-sm)] active:scale-[0.98] group flex flex-col justify-between"
               >
                  <div className="flex items-start gap-3.5">
                     <div className="relative shrink-0 select-none">
                        <img
                           src={employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=0071E3&color=ffffff&bold=true`}
                           className="w-12 h-12 rounded-full object-cover border border-[var(--theme-border)]"
                           alt={employee.name}
                        />
                        {/* Real-time presence indicator dot */}
                        <div
                           title={isOnline ? 'Online now' : 'Offline'}
                           className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--theme-bg-card)] transition-colors duration-300 ${
                              isOnline
                                 ? 'bg-emerald-500 shadow-[0_0_6px_rgba(52,211,153,0.6)] animate-pulse'
                                 : 'bg-neutral-400'
                           }`}
                        />
                     </div>

                     <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                           <h4 className="text-sm font-semibold text-[var(--theme-text-primary)] truncate group-hover:text-[#0071E3] dark:group-hover:text-[#2997FF] transition-colors">
                              {employee.name}
                           </h4>
                           {employee.status === 'Pending Approval' && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20 shrink-0">
                                 Pending
                              </span>
                           )}
                        </div>
                        <p className="text-xs font-medium text-[var(--theme-text-secondary)] mt-0.5 truncate">
                           {roleConfig.label}
                        </p>
                        <div className="mt-1"><WorkforceScopeBadge employee={employee} /></div>
                        
                        {/* Site Scoping / Unassigned Warning */}
                        {siteInfo.isWarning ? (
                           <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 truncate font-medium flex items-center gap-1" title="Workplace facility assignment is mandatory">
                              <AlertTriangle size={11} className="shrink-0" />
                              <span>{siteInfo.label}</span>
                           </p>
                        ) : (
                           <div className="flex items-center gap-1.5 mt-1.5 truncate">
                              <p className="text-[11px] text-[var(--theme-text-secondary)] truncate font-normal">
                                 {siteInfo.label}
                              </p>
                              {siteInfo.isCEO ? (
                                 <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0 font-semibold" title="CEO sovereign authority across all facilities">
                                    GLOBAL
                                 </span>
                              ) : siteInfo.facilityId ? (
                                 <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded shrink-0 font-semibold ${
                                    siteInfo.isHQ 
                                       ? 'bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF] border border-[#0071E3]/20' 
                                       : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]'
                                 }`} title={`Assigned Facility ID: ${siteInfo.facilityId}`}>
                                    {siteInfo.facilityId}
                                 </span>
                              ) : null}
                           </div>
                        )}

                        {/* Location & Geofence (Zero Emojis - Lucide MapPin) */}
                        {canSeeLocation && geofence ? (
                           geofence.isForeignAnomaly ? (
                              <div className="flex items-center gap-1 mt-1" title={`Security Alert: ${geofence.anomalyReason || 'Off-Premise anomaly detected'}`}>
                                 <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold border border-rose-500/20 truncate">
                                    <AlertTriangle size={10} className="text-rose-500 shrink-0" />
                                    Foreign Premise
                                 </span>
                              </div>
                           ) : (
                              <p className="text-[11px] text-[var(--theme-text-muted)] font-mono tabular-nums mt-1 truncate flex items-center gap-1" title={employee.lastLoginGps}>
                                 <MapPin size={11} className="shrink-0 text-[var(--theme-text-muted)]" />
                                 <span>{geofence.displayLocation}</span>
                              </p>
                           )
                        ) : employee.lastLoginGps ? (
                           <p className="text-[11px] text-[var(--theme-text-muted)] italic mt-1 truncate flex items-center gap-1 select-none" title="Location is hidden due to hierarchy permissions">
                              <MapPin size={11} className="shrink-0 text-[var(--theme-text-muted)]" />
                              <span>Protected</span>
                           </p>
                        ) : null}

                        {/* Active Today Badge */}
                        {employee.lastLoginAt && (
                           (() => {
                              const date = new Date(employee.lastLoginAt);
                              const today = new Date();
                              const loggedInToday = date.getDate() === today.getDate() &&
                                 date.getMonth() === today.getMonth() &&
                                 date.getFullYear() === today.getFullYear();
                              
                              return loggedInToday ? (
                                 <div className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 mt-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20 w-fit">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Active Today
                                 </div>
                              ) : null;
                           })()
                        )}
                     </div>
                  </div>
               </div>
            );
         })}

         {displayedEmployees.length === 0 && !isLoadingEmployees && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
               <div className="w-12 h-12 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-secondary)] mb-3">
                  <User size={22} />
               </div>
               <p className="text-sm font-semibold text-[var(--theme-text-primary)]">No Employees Found</p>
               <p className="text-xs text-[var(--theme-text-secondary)] mt-1">Try adjusting your filters or search terms.</p>
            </div>
         )}
      </div>
   );
}
