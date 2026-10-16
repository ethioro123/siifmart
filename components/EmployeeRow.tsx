// EmployeeRow.tsx - Apple Design Standard Minimal Employee Row Component
import React from 'react';
import { MapPin, ChevronRight, AlertTriangle } from 'lucide-react';
import { Employee, Site, WorkerPoints, UserRole } from '../types';
import { formatRole } from '../utils/formatting';
import { canViewLocation } from '../utils/roles';
import { evaluateGeofence, formatSiteAssignment } from '../utils/geofence';

interface RoleConfigLike {
    label: string;
    styles?: {
        text?: string;
        bg?: string;
        border?: string;
    };
}

interface EmployeeRowProps {
    employee: Employee;
    sites: Site[];
    roleConfig?: RoleConfigLike;
    pendingTasks?: number;
    onSelect: () => void;
    onMessage?: () => void;
    onResetPassword?: () => void;
    onDelete?: () => void;
    onApprove?: () => void;
    canResetPassword?: boolean;
    canDelete?: boolean;
    canApprove?: boolean;
    isSuperAdmin?: boolean;
    workerPoints?: WorkerPoints;
    estimatedBonus?: number;
    bonusTierName?: string;
    currentUser?: { id?: string; role?: UserRole; siteId?: string } | null;
    key?: React.Key;
}

export default function EmployeeRow({
    employee,
    sites,
    roleConfig,
    onSelect,
    currentUser,
}: EmployeeRowProps) {
    const isPending = employee.status === 'Pending Approval';
    const isOwn = currentUser?.id === employee.id;
    const canSeeLocation = canViewLocation(currentUser?.role, employee.role, isOwn);
    const siteInfo = formatSiteAssignment(employee.siteId, employee.role, sites);
    const geofence = employee.lastLoginGps ? evaluateGeofence(employee.lastLoginGps) : null;

    return (
        <div
            className="px-4 py-3.5 flex items-center gap-4 hover:bg-[var(--theme-table-row-hover)] transition-colors cursor-pointer border-b border-[var(--theme-border-subtle)] last:border-b-0 text-[var(--theme-text-primary)] group"
            onClick={onSelect}
        >
            {/* Avatar with Presence Ring */}
            <div className="relative flex-shrink-0 select-none">
                <img
                    src={employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=0071E3&color=ffffff&bold=true`}
                    alt={employee.name}
                    className="w-10 h-10 rounded-full object-cover border border-[var(--theme-border)]"
                />
                {(() => {
                    const loggedInToday = employee.lastLoginAt && (() => {
                        const date = new Date(employee.lastLoginAt);
                        const today = new Date();
                        return date.getDate() === today.getDate() &&
                            date.getMonth() === today.getMonth() &&
                            date.getFullYear() === today.getFullYear();
                    })();
                    const isOnlineAndActive = employee.status === 'Active' && loggedInToday;
                    return (
                        <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[var(--theme-bg-card)] ${isOnlineAndActive ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                    );
                })()}
            </div>

            {/* Name & Role */}
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-[var(--theme-text-primary)] truncate group-hover:text-[#0071E3] dark:group-hover:text-[#2997FF] transition-colors">
                    {employee.name}
                </h4>
                <p className="text-xs font-medium text-[var(--theme-text-secondary)] mt-0.5 truncate">
                    {roleConfig?.label || formatRole(employee.role)}
                </p>
            </div>

            {/* Location */}
            <div className="hidden md:flex flex-col gap-0.5 text-xs text-[var(--theme-text-secondary)] min-w-[140px] max-w-[200px] font-normal">
                <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="flex-shrink-0 text-[var(--theme-text-muted)]" />
                    {siteInfo.isWarning ? (
                        <span className="truncate text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1" title="Workplace facility assignment is mandatory">
                            <AlertTriangle size={11} className="flex-shrink-0" />
                            {siteInfo.label}
                        </span>
                    ) : (
                        <span className="truncate font-medium flex items-center gap-1.5">
                            <span>{siteInfo.label}</span>
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
                        </span>
                    )}
                </div>
                {canSeeLocation && geofence ? (
                    geofence.isForeignAnomaly ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 mt-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold border border-rose-500/20 truncate" title={`Security Alert: ${geofence.anomalyReason}`}>
                            <AlertTriangle size={10} className="text-rose-500 flex-shrink-0" />
                            Foreign / Off-Premise
                        </span>
                    ) : (
                        <span className="text-[11px] text-[var(--theme-text-muted)] font-mono tabular-nums truncate pl-4" title={employee.lastLoginGps}>
                            {geofence.displayLocation}
                        </span>
                    )
                ) : employee.lastLoginGps ? (
                    <span className="text-[11px] text-[var(--theme-text-muted)] italic truncate pl-4 select-none" title="Location is hidden due to hierarchy permissions">
                        Protected
                    </span>
                ) : null}
            </div>

            {/* Status Badges */}
            <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                {isPending && (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20">
                        Pending
                    </span>
                )}

                {employee.lastLoginAt && (
                    (() => {
                        const date = new Date(employee.lastLoginAt);
                        const today = new Date();
                        const loggedInToday = date.getDate() === today.getDate() &&
                            date.getMonth() === today.getMonth() &&
                            date.getFullYear() === today.getFullYear();
                        
                        return loggedInToday ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Active Today
                            </span>
                        ) : null;
                    })()
                )}
            </div>

            {/* Chevron Navigation Indicator */}
            <ChevronRight size={15} className="text-[var(--theme-text-muted)] group-hover:text-[var(--theme-text-primary)] group-hover:translate-x-0.5 transition-all shrink-0" />
        </div>
    );
}
