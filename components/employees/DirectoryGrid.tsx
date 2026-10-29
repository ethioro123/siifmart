import React from 'react';
import { Loader2, User, AlertTriangle, MapPin } from 'lucide-react';
import { Employee, Site, UserRole } from '../../types';
import { SYSTEM_ROLES, canViewLocation, getEmployeeJobTitle } from '../../utils/roles';
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
               styles: { text: 'text-[var(--theme-text-muted)]', bg: 'bg-[color-mix(in_srgb,var(--theme-bg-card-hover)_10%,transparent)]', border: 'border-[color-mix(in_srgb,var(--theme-border)_20%,transparent)]', badge: 'bg-[color-mix(in_srgb,var(--theme-bg-card-hover)_20%,transparent)] text-[var(--theme-text-muted)]' }
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
                                 ? 'bg-[var(--theme-status-success-bg)] shadow-[0_0_6px_rgba(52,211,153,0.6)] animate-pulse'
                                 : 'bg-[var(--theme-bg-card-hover)]'
                           }`}
                        />
                     </div>

                     <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                           <h4 className="text-sm font-semibold text-[var(--theme-text-primary)] truncate group-hover:text-[var(--theme-accent)] dark:group-hover:text-[var(--theme-accent)] transition-colors">
                              {employee.name}
                           </h4>
                           {employee.status === 'Pending Approval' && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] font-semibold border border-[var(--theme-status-warning-border)] shrink-0">
                                 Pending
                              </span>
                           )}
                        </div>
                        <p className="text-xs font-medium text-[var(--theme-text-secondary)] mt-0.5 truncate">
                           {getEmployeeJobTitle(employee) || roleConfig.label}
                        </p>
                        <div className="mt-1"><WorkforceScopeBadge employee={employee} /></div>

                        {/* Site Scoping / Unassigned Warning */}
                        {siteInfo.isWarning ? (
                           <p className="text-[11px] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] mt-1.5 truncate font-medium flex items-center gap-1" title="Workplace facility assignment is mandatory">
                              <AlertTriangle size={11} className="shrink-0" />
                              <span>{siteInfo.label}</span>
                           </p>
                        ) : (
                           <div className="flex items-center gap-1.5 mt-1.5 truncate">
                              <p className="text-[11px] text-[var(--theme-text-secondary)] truncate font-normal">
                                 {siteInfo.label}
                              </p>
                              {siteInfo.isCEO ? (
                                 <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] text-[var(--theme-accent)] border border-[var(--theme-border-accent)] shrink-0 font-semibold" title="CEO sovereign authority across all facilities">
                                    GLOBAL
                                 </span>
                              ) : siteInfo.facilityId ? (
                                 <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded shrink-0 font-semibold ${
                                    siteInfo.isHQ
                                       ? 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] border border-[var(--theme-border-focus)]/20'
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
                                 <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] font-semibold border border-[var(--theme-status-danger-border)] truncate">
                                    <AlertTriangle size={10} className="text-[var(--theme-status-danger-text)] shrink-0" />
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
                                 <div className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 mt-2 rounded-full bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] font-semibold border border-[var(--theme-status-success-border)] w-fit">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-status-success-bg)] animate-pulse" />
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
