// EmployeeRow.tsx - Apple Design Standard Minimal Employee Row Component
import React from 'react';
import { MapPin, ChevronRight, AlertTriangle } from 'lucide-react';
import { Employee, Site, WorkerPoints, UserRole } from '../types';
import { formatRole } from '../utils/formatting';
import { getEmployeeJobTitle } from '../utils/roles';
import { canViewLocation } from '../utils/roles';
import { evaluateGeofence, formatSiteAssignment } from '../utils/geofence';
import WorkforceScopeBadge from './employees/WorkforceScopeBadge';

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
                        <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[var(--theme-bg-card)] ${isOnlineAndActive ? 'bg-[var(--theme-status-success-bg)]' : 'bg-neutral-400'}`} />
                    );
                })()}
            </div>

            {/* Name & Role */}
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-[var(--theme-text-primary)] truncate group-hover:text-[var(--theme-accent)] dark:group-hover:text-[var(--theme-accent)] transition-colors">
                    {employee.name}
                </h4>
                <p className="text-xs font-medium text-[var(--theme-text-secondary)] mt-0.5 truncate">
                    {getEmployeeJobTitle(employee) || roleConfig?.label || formatRole(employee.role)}
                </p>
                <div className="mt-1"><WorkforceScopeBadge employee={employee} /></div>
            </div>

            {/* Location */}
            <div className="hidden md:flex flex-col gap-0.5 text-xs text-[var(--theme-text-secondary)] min-w-[140px] max-w-[200px] font-normal">
                <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="flex-shrink-0 text-[var(--theme-text-muted)]" />
                    {siteInfo.isWarning ? (
                        <span className="truncate text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] font-medium flex items-center gap-1" title="Workplace facility assignment is mandatory">
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
                                        ? 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] border border-[var(--theme-border-focus)]/20'
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
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 mt-0.5 rounded-full bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] font-semibold border border-[var(--theme-status-danger-border)] truncate" title={`Security Alert: ${geofence.anomalyReason}`}>
                            <AlertTriangle size={10} className="text-[var(--theme-status-danger-text)] flex-shrink-0" />
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
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] font-semibold border border-[var(--theme-status-warning-border)]">
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
                            <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] font-semibold border border-[var(--theme-status-success-border)]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-status-success-bg)] animate-pulse" />
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
