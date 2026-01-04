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
            className="px-4 py-3 flex items-center gap-4 hover:bg-white/[0.03] transition-colors cursor-pointer border-b border-white/[0.04] last:border-b-0"
            onClick={onSelect}
        >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
                <img
                    src={employee.avatar || `https://ui-avatars.com/api/?name=${employee.name}&background=1a1a1a&color=ffffff&bold=true`}
                    alt={employee.name}
                    className="w-10 h-10 rounded-full object-cover"
                />
                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0a0a0a] ${employee.status === 'Active' ? 'bg-emerald-400' :
                    isPending ? 'bg-amber-400' : 'bg-gray-500'
                    }`} />
            </div>

            {/* Name & Role */}
            <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-white truncate">{employee.name}</h3>
                <p className={`text-xs ${roleConfig?.styles?.text || 'text-gray-400'}`}>{roleConfig?.label || formatRole(employee.role)}</p>
            </div>

            {/* Location - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-500 min-w-0 max-w-[160px]">
                <MapPin size={12} className="flex-shrink-0" />
                <span className="truncate">{employeeSite?.name || 'Unassigned'}</span>
            </div>

            {/* Status Badge */}
            {isPending && (
                <span className="hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">
                    Pending
                </span>
            )}

            {/* Arrow */}
            <ChevronRight size={16} className="text-gray-600" />
        </div>
    );
}
