import React from 'react';
import { summarizeDriverDeliveries } from '../../../utils/driverDeliverySummary';
import { WMSJob, User } from '../../../types';
import { canManageDispatch, getShipmentUnits, isShipment } from '../../../utils/shipmentWorkflow';

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
    const canSeeGlobalQueue = canManageDispatch(user?.role);

    const currentEmployee = employees.find(e =>
        (user?.email && e.email === user.email) ||
        ((user as any)?.employeeId && e.id === (user as any).employeeId) ||
        e.id === user?.id
    );
    const employeeId = currentEmployee?.id || user?.id;

    const shouldInclude = (j: WMSJob) => {
        if (!isShipment(j) || j.deliveryMethod === 'External') return false;
        if (j.status === 'Cancelled' || j.transferStatus === 'Cancelled' || j.transferStatus === 'Rejected') return false;
        return canSeeGlobalQueue ? !!j.assignedTo : j.assignedTo === employeeId;
    };

    const stats = summarizeDriverDeliveries(filteredJobs.filter(shouldInclude), historicalJobs.filter(shouldInclude));

    const totalJobs = stats.completed + stats.active;
    const progressPct = totalJobs > 0 ? Math.round((stats.completed / totalJobs) * 100) : 0;

    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs overflow-hidden">
            <div className="grid grid-cols-3 gap-3 md:gap-6 w-full sm:w-auto">
                <div className="text-center px-2">
                    <p className="text-xs text-[var(--theme-text-secondary)] font-medium mb-1">{t('warehouse.driverHub.loadedMissions')}</p>
                    <p className="text-base sm:text-xl font-bold font-mono text-[var(--theme-text-primary)] tabular-nums leading-none">{totalJobs}</p>
                </div>
                <div className="text-center px-2 border-x border-[var(--theme-border)]">
                    <p className="text-xs text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] font-medium mb-1">{t('warehouse.driverHub.done')}</p>
                    <p className="text-base sm:text-xl font-bold font-mono text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] tabular-nums leading-none">{stats.completed}</p>
                </div>
                <div className="text-center px-2">
                    <p className="text-xs text-[var(--theme-primary)] font-medium mb-1">{t('warehouse.driverHub.units')}</p>
                    <p className="text-base sm:text-xl font-bold font-mono text-[var(--theme-primary)] tabular-nums leading-none">{stats.items}</p>
                </div>
            </div>

            <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-4 pt-3 sm:pt-0 border-t sm:border-none border-[var(--theme-border)]">
                <div className="text-left sm:text-right">
                    <div className="flex items-center gap-2 mb-1.5 justify-start sm:justify-end">
                        <span className="text-xs text-[var(--theme-text-secondary)] font-medium">{t('warehouse.driverHub.deliveryProgress')}</span>
                        <span className="text-xs font-mono font-bold text-[var(--theme-text-primary)] tabular-nums">{progressPct}%</span>
                    </div>
                    <div className="h-2 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-full w-24 sm:w-32 overflow-hidden">
                        <div
                            className="h-full bg-[var(--theme-primary)] rounded-full transition-all"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
