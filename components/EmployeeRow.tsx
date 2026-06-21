// EmployeeRow.tsx - Clean minimal employee row component
import React from 'react';
import { MapPin, ChevronRight } from 'lucide-react';
import { Employee, Site, WorkerPoints } from '../types';
import { formatRole } from '../utils/formatting';

interface EmployeeRowProps {
    employee: Employee;
    sites: Site[];
    roleConfig: any;
    pendingTasks: number;
    onSelect: () => void;
    onMessage: () => void;
    onResetPassword?: () => void;
    onDelete?: () => void;
    onApprove?: () => void;
    canResetPassword: boolean;
    canDelete: boolean;
    canApprove: boolean;
    isSuperAdmin: boolean;
    workerPoints?: WorkerPoints;
    estimatedBonus?: number;
    bonusTierName?: string;
    key?: React.Key;
}

export default function EmployeeRow({
    employee,
    sites,
    roleConfig,
    onSelect,
}: EmployeeRowProps) {
    const employeeSite = sites.find(s => s.id === employee.siteId || s.id === employee.site_id);
    const isPending = employee.status === 'Pending Approval';

    return (
        <div
            className="px-4 py-3 flex items-center gap-4 hover:bg-[#2C5E3B]/5 dark:hover:bg-white/[0.03] transition-colors cursor-pointer border-b border-[#E2DCCE]/60 dark:border-white/[0.04] last:border-b-0 text-[#1E3F27] dark:text-white"
            onClick={onSelect}
        >
            {/* Avatar */}
            <div className="relative flex-shrink-0 select-none">
                <img
                    src={employee.avatar || `https://ui-avatars.com/api/?name=${employee.name}&background=2C5E3B&color=ffffff&bold=true`}
                    alt={employee.name}
                    className="w-10 h-10 rounded-full object-cover border border-[#E2DCCE] dark:border-white/10"
                />
                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#131915] ${employee.status === 'Active' ? 'bg-emerald-500' :
                    isPending ? 'bg-amber-500' : 'bg-gray-400'
                    }`} />
            </div>

            {/* Name & Role */}
            <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-[#1E3F27] dark:text-white truncate">{employee.name}</h3>
                <p className={`text-xs font-semibold ${roleConfig?.styles?.text || 'text-stone-500 dark:text-gray-400'}`}>{roleConfig?.label || formatRole(employee.role)}</p>
            </div>

            {/* Location - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-stone-500 dark:text-gray-400 min-w-0 max-w-[160px] font-medium">
                <MapPin size={12} className="flex-shrink-0 text-stone-400 dark:text-gray-500" />
                <span className="truncate">{employeeSite?.name || 'Unassigned'}</span>
            </div>

            {/* Status Badge */}
            {isPending && (
                <span className="hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold border border-amber-200 dark:border-amber-500/20">
                    Pending
                </span>
            )}

            {/* Arrow */}
            <ChevronRight size={16} className="text-stone-400 dark:text-gray-550" />
        </div>
    );
}
