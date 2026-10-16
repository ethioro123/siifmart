import React from 'react';
import { WMSJob, User } from '../../../types';

interface DriverMetricsProps {
    t: (key: string) => string;
    filteredJobs: WMSJob[];
    historicalJobs: WMSJob[];
    employees: any[];
    user: User | null;
}

export const DriverMetrics: React.FC<DriverMetricsProps> = ({
    t,
    filteredJobs,
    historicalJobs,
    employees,
    user
}) => {
    const canSeeGlobalQueue = [
        'super_admin', 'admin', 'manager', 'regional_manager',
        'operations_manager', 'warehouse_manager', 'dispatcher'
    ].includes((user?.role || '').toLowerCase());

    const currentEmployee = employees.find(e => 
        (user?.email && e.email === user.email) ||
        (user?.name && e.name?.toLowerCase() === user.name.toLowerCase()) ||
        ((user as any)?.employeeId && e.id === (user as any).employeeId) ||
        e.id === user?.id
    );
    const employeeId = currentEmployee?.id || user?.id;

    const shouldInclude = (j: WMSJob) => {
        if (j.type !== 'DISPATCH' && j.type !== 'TRANSFER' && j.type !== 'DRIVER') return false;
        if (j.status === 'Cancelled' || j.transferStatus === 'Cancelled' || j.transferStatus === 'Rejected') return false;
        if (j.type === 'TRANSFER') {
            const allCurrentJobs = [...filteredJobs, ...historicalJobs];
            const hasChildDispatch = allCurrentJobs.some(d =>
                d.type === 'DISPATCH' && (d.orderRef === j.id || d.orderRef === j.jobNumber) && d.status !== 'Cancelled'
            );
            if (hasChildDispatch) return false;
        }
        return canSeeGlobalQueue ? !!j.assignedTo : j.assignedTo === employeeId;
    };

    const stats = {
        completed: historicalJobs.filter(j => shouldInclude(j) && j.status === 'Completed').length,
        active: filteredJobs.filter(j => shouldInclude(j) && j.status !== 'Completed').length,
        items: [...filteredJobs, ...historicalJobs].filter(j => shouldInclude(j)).reduce((sum, j) => {
            const units = (j.lineItems && Array.isArray(j.lineItems) && j.lineItems.length > 0)
                ? j.lineItems.reduce((acc: number, it: any) => acc + (it.packedQty || it.expectedQty || it.quantity || it.pickedQty || 1), 0)
                : (j.items || (j as any).items_count || 0);
            return sum + units;
        }, 0)
    };

    const totalJobs = stats.completed + stats.active;
    const progressPct = totalJobs > 0 ? Math.round((stats.completed / totalJobs) * 100) : 0;

    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs overflow-hidden">
            <div className="grid grid-cols-3 gap-3 md:gap-6 w-full sm:w-auto">
                <div className="text-center px-2">
                    <p className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider mb-1">{t('warehouse.driverHub.totalJobs')}</p>
                    <p className="text-base sm:text-xl font-bold font-mono text-[var(--theme-text-primary)] tabular-nums leading-none">{totalJobs}</p>
                </div>
                <div className="text-center px-2 border-x border-[var(--theme-border)]">
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider mb-1">{t('warehouse.driverHub.done')}</p>
                    <p className="text-base sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums leading-none">{stats.completed}</p>
                </div>
                <div className="text-center px-2">
                    <p className="text-[11px] text-primary font-semibold uppercase tracking-wider mb-1">{t('warehouse.driverHub.units')}</p>
                    <p className="text-base sm:text-xl font-bold font-mono text-primary tabular-nums leading-none">{stats.items}</p>
                </div>
            </div>
            
            <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-4 pt-3 sm:pt-0 border-t sm:border-none border-[var(--theme-border)]">
                <div className="text-left sm:text-right">
                    <div className="flex items-center gap-2 mb-1 justify-start sm:justify-end">
                        <span className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">{t('warehouse.driverHub.shiftProgress')}</span>
                        <span className="text-[11px] font-mono font-bold text-[var(--theme-text-primary)] tabular-nums">{progressPct}%</span>
                    </div>
                    <div className="h-2 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-full w-24 sm:w-32 overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
