// EmployeeRow.tsx - Clean minimal employee row component
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
            className="px-4 py-3 flex items-center gap-4 hover:bg-[#2C5E3B]/5 dark:hover:bg-white/[0.03] transition-colors cursor-pointer border-b border-[#E2DCCE]/60 dark:border-white/[0.04] last:border-b-0 text-[#1E3F27] dark:text-white"
            onClick={onSelect}
        >
            {/* Avatar */}
            <div className="relative flex-shrink-0 select-none">
                <img
                    src={employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=2C5E3B&color=ffffff&bold=true`}
                    alt={employee.name}
                    className="w-10 h-10 rounded-full object-cover border border-[#E2DCCE] dark:border-white/10"
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
                        <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#131915] ${isOnlineAndActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    );
                })()}
            </div>

            {/* Name & Role */}
            <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-[#1E3F27] dark:text-white truncate">{employee.name}</h3>
                <p className={`text-xs font-semibold ${roleConfig?.styles?.text || 'text-stone-500 dark:text-gray-400'}`}>{roleConfig?.label || formatRole(employee.role)}</p>
            </div>

            {/* Location - Hidden on mobile */}
            <div className="hidden md:flex flex-col gap-0.5 text-xs text-stone-500 dark:text-gray-400 min-w-[140px] max-w-[200px] font-medium">
                <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="flex-shrink-0 text-stone-400 dark:text-gray-500" />
                    {siteInfo.isWarning ? (
                        <span className="truncate text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1" title="Branch personnel requires store/warehouse assignment">
                            <AlertTriangle size={11} className="flex-shrink-0" />
                            {siteInfo.label}
                        </span>
                    ) : (
                        <span className="truncate">{siteInfo.label}</span>
                    )}
                </div>
                {canSeeLocation && geofence ? (
                    geofence.isForeignAnomaly ? (
                        <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 mt-0.5 rounded bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 font-bold border border-rose-200 dark:border-rose-500/20 truncate" title={`Security Alert: ${geofence.anomalyReason}`}>
                            <AlertTriangle size={10} className="text-rose-500 flex-shrink-0" />
                            Foreign / Off-Premise
                        </span>
                    ) : (
                        <span className="text-[10px] text-gray-400 dark:text-stone-500 font-mono truncate pl-3.5" title={employee.lastLoginGps}>
                            {geofence.displayLocation}
                        </span>
                    )
                ) : employee.lastLoginGps ? (
                    <span className="text-[10px] text-stone-300 dark:text-stone-600 italic truncate pl-3.5 select-none" title="Location is hidden due to hierarchy permissions">
                        Protected
                    </span>
                ) : null}
            </div>

            {/* Status Badge */}
            {isPending && (
                <span className="hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold border border-amber-200 dark:border-amber-500/20">
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
                        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Logged In Today
                        </span>
                    ) : null;
                })()
            )}

            {/* Arrow */}
            <ChevronRight size={16} className="text-stone-400 dark:text-gray-550" />
        </div>
    );
}
