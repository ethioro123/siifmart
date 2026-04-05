import React from 'react';
import { WMSJob, User } from '../../../types';

interface DriverMetricsProps {
    filteredJobs: WMSJob[];
    historicalJobs: WMSJob[];
    employees: any[];
    user: User | null;
}

export const DriverMetrics: React.FC<DriverMetricsProps> = ({
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

    const shouldInclude = (j: WMSJob) => 
        (j.type === 'DISPATCH' || j.type === 'TRANSFER' || j.type === 'DRIVER') && 
        (canSeeGlobalQueue ? !!j.assignedTo : j.assignedTo === employeeId);

    const stats = {
        completed: historicalJobs.filter(j => shouldInclude(j) && j.status === 'Completed').length,
        active: filteredJobs.filter(j => shouldInclude(j) && j.status !== 'Completed').length,
        items: [...filteredJobs, ...historicalJobs].filter(j => shouldInclude(j)).reduce((sum, j) => sum + (j.items || j.lineItems?.length || 0), 0)
    };

    return (
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm dark:shadow-inner overflow-hidden">
            <div className="grid grid-cols-3 gap-3 md:gap-6 w-full sm:w-auto">
                <div className="text-center px-1">
                    <p className="text-[7px] md:text-[8px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest leading-none mb-1.5 italic">Sum Jobs</p>
                    <p className="text-sm md:text-lg font-black text-gray-900 dark:text-white leading-none">{stats.completed + stats.active}</p>
                </div>
                <div className="text-center px-1 border-x border-gray-100 dark:border-white/10">
                    <p className="text-[7px] md:text-[8px] text-green-600 dark:text-green-500 font-black uppercase tracking-widest leading-none mb-1.5 italic">Done</p>
                    <p className="text-sm md:text-lg font-black text-green-600 dark:text-green-400 leading-none">{stats.completed}</p>
                </div>
                <div className="text-center px-1">
                    <p className="text-[7px] md:text-[8px] text-cyan-600 dark:text-cyan-500 font-black uppercase tracking-widest leading-none mb-1.5 italic">Units</p>
                    <p className="text-sm md:text-lg font-black text-cyan-600 dark:text-cyan-400 leading-none">{stats.items}</p>
                </div>
            </div>
            
            <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-4 pt-3 sm:pt-0 border-t sm:border-none border-gray-50 dark:border-white/5">
                <div className="text-left sm:text-right">
                    <p className="text-[7px] md:text-[8px] text-gray-500 dark:text-gray-500 font-black uppercase tracking-widest leading-none mb-1 italic">Shift Progress</p>
                    <div className="h-1.5 bg-gray-100 dark:bg-white/10 rounded-full w-24 md:w-16 overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full w-3/4 shadow-[0_0_8px_rgba(6,182,212,0.4)] transition-all" />
                    </div>
                </div>
            </div>
        </div>
    );

};
