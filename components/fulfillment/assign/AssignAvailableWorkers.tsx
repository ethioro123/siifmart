import React from 'react';
import { Users as UsersIcon, Search, User as UserIcon, ChevronDown, Plus } from 'lucide-react';
import { Employee, WMSJob } from '../../../types';
import { Protected } from '../../Protected';
import { useFulfillment } from '../FulfillmentContext';

interface AssignAvailableWorkersProps {
    filteredEmployees: Employee[];
    dispatchEmployeeFilter: string;
    setDispatchEmployeeFilter: (val: string) => void;
    dispatchEmployeeSearch: string;
    setDispatchEmployeeSearch: (val: string) => void;
    isEmployeeRoleDropdownOpen: boolean;
    setIsEmployeeRoleDropdownOpen: (val: boolean) => void;
    jobAssignments: any[];
    selectedJob: WMSJob | null;
    setSelectedJob: (job: WMSJob | null) => void;
    setIsSubmitting: (val: boolean) => void;
    refreshData: () => Promise<void>;
    addNotification: (type: string, message: string) => void;
    wmsJobsService: any;
    assignCurrentPage: number;
    setAssignCurrentPage: (val: number | ((prev: number) => number)) => void;
    ASSIGN_ITEMS_PER_PAGE: number;
    t: (key: string) => string;
}

export const AssignAvailableWorkers: React.FC<AssignAvailableWorkersProps> = ({
    filteredEmployees,
    dispatchEmployeeFilter,
    setDispatchEmployeeFilter,
    dispatchEmployeeSearch,
    setDispatchEmployeeSearch,
    isEmployeeRoleDropdownOpen,
    setIsEmployeeRoleDropdownOpen,
    jobAssignments,
    selectedJob,
    setSelectedJob,
    setIsSubmitting,
    refreshData,
    addNotification,
    wmsJobsService,
    assignCurrentPage,
    setAssignCurrentPage,
    ASSIGN_ITEMS_PER_PAGE,
    t
}) => {
    const { assignJob } = useFulfillment();

    return (
        <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-lg rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col overflow-hidden shadow-xl transition-colors duration-300">
            <div className="p-4 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 font-black text-[10px] text-slate-500 dark:text-gray-400 uppercase tracking-widest flex justify-between items-center relative z-10 transition-colors">
                <div className="flex items-center gap-2">
                    <UsersIcon size={12} className="text-blue-600 dark:text-blue-400" />
                    <span>{t('warehouse.availableStaff')}</span>
                    <span className="bg-blue-100 dark:bg-blue-400/10 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-400/20 ml-1">
                        {(() => {
                            let filtered = filteredEmployees.filter(e =>
                                ['picker', 'packer', 'dispatcher', 'warehouse_manager', 'driver', 'receiver', 'inventory_specialist', 'forklift_operator', 'auditor'].includes(e.role?.toLowerCase()) &&
                                e.status?.toLowerCase() === 'active'
                            );
                            if (dispatchEmployeeFilter !== 'ALL') filtered = filtered.filter(e => e.role?.toLowerCase() === dispatchEmployeeFilter.toLowerCase());
                            if (dispatchEmployeeSearch) filtered = filtered.filter(e => e.name?.toLowerCase().includes(dispatchEmployeeSearch.toLowerCase()));
                            return filtered.length;
                        })()}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Staff Search */}
                    <div className="relative group">
                        <Search size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-600 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search staff..."
                            value={dispatchEmployeeSearch}
                            onChange={(e) => setDispatchEmployeeSearch(e.target.value)}
                            className="w-32 bg-slate-100/50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl pl-7 pr-3 py-1.5 text-slate-900 dark:text-white text-[10px] focus:border-blue-500/50 dark:focus:border-blue-400/50 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-gray-600"
                        />
                    </div>

                    {/* Role Filter Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsEmployeeRoleDropdownOpen(!isEmployeeRoleDropdownOpen)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100/50 dark:bg-black/40 backdrop-blur-md rounded-xl border border-slate-200 dark:border-white/10 text-[10px] font-black text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-all whitespace-nowrap"
                        >
                            <UserIcon size={12} className={dispatchEmployeeFilter !== 'ALL' ? 'text-blue-600 dark:text-blue-400' : ''} />
                            <span>ROLE: {dispatchEmployeeFilter.toUpperCase()}</span>
                            <ChevronDown size={12} className={`transition-transform duration-300 ${isEmployeeRoleDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isEmployeeRoleDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-[50]" onClick={() => setIsEmployeeRoleDropdownOpen(false)} />
                                <div className="absolute top-full right-0 mt-2 w-32 bg-white dark:bg-[#0a0a0b]/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-2 shadow-2xl z-[51] animate-in fade-in slide-in-from-top-2 duration-200 ring-1 ring-slate-200 dark:ring-white/5">
                                    {['ALL', 'picker', 'packer', 'dispatcher', 'driver', 'receiver', 'inventory_specialist'].map(role => (
                                        <button
                                            key={role}
                                            onClick={() => {
                                                setDispatchEmployeeFilter(role as any);
                                                setIsEmployeeRoleDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${dispatchEmployeeFilter === role
                                                ? 'bg-blue-600 dark:bg-blue-400 text-white dark:text-black shadow-lg dark:shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                                                : 'text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                                                }`}
                                        >
                                            {role.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {(() => {
                    let filtered = filteredEmployees.filter(e =>
                        ['picker', 'packer', 'dispatcher', 'warehouse_manager', 'driver', 'receiver', 'inventory_specialist', 'forklift_operator', 'auditor', 'admin', 'manager', 'regional_manager', 'operations_manager'].includes(e.role?.toLowerCase()) &&
                        e.status?.toLowerCase() === 'active'
                    );
                    if (dispatchEmployeeFilter !== 'ALL') filtered = filtered.filter(e => e.role?.toLowerCase() === dispatchEmployeeFilter.toLowerCase());
                    if (dispatchEmployeeSearch) filtered = filtered.filter(e => e.name?.toLowerCase().includes(dispatchEmployeeSearch.toLowerCase()));

                    // Check if selected job matches employee role
                    const getRoleMatch = (employee: any, job: WMSJob | null) => {
                        if (!job) return false;
                        const role = employee.role?.toLowerCase();

                        // Executive / Admin roles can do ANY job
                        if (['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager'].includes(role)) return true;

                        if (job.type === 'PICK' && (role === 'picker' || role === 'dispatcher' || role === 'warehouse_manager')) return true;
                        if (job.type === 'PACK' && (role === 'packer' || role === 'picker' || role === 'dispatcher' || role === 'warehouse_manager')) return true;
                        if (job.type === 'PUTAWAY' && (role === 'dispatcher' || role === 'warehouse_manager' || role === 'inventory_specialist' || role === 'picker')) return true;
                        if (job.type === 'RECEIVE' && (role === 'receiver' || role === 'dispatcher' || role === 'warehouse_manager' || role === 'inventory_specialist' || role === 'picker')) return true;
                        if ((job.type === 'DRIVER' || job.type === 'DISPATCH') && (role === 'driver' || role === 'dispatcher' || role === 'warehouse_manager')) return true;
                        return false;
                    };

                    // Sort by:role match first, then by workload
                    filtered.sort((a, b) => {
                        const aMatch = getRoleMatch(a, selectedJob);
                        const bMatch = getRoleMatch(b, selectedJob);
                        if (aMatch !== bMatch) return aMatch ? -1 : 1;

                        const aWorkload = jobAssignments.filter(
                            ass => ass.employeeId === a.id && ['Assigned', 'Accepted', 'In-Progress'].includes(ass.status)
                        ).length;
                        const bWorkload = jobAssignments.filter(
                            ass => ass.employeeId === b.id && ['Assigned', 'Accepted', 'In-Progress'].includes(ass.status)
                        ).length;
                        return aWorkload - bWorkload;
                    });

                    const assignTotalPages = Math.ceil(filtered.length / ASSIGN_ITEMS_PER_PAGE);
                    const safeAssignPage = Math.min(Math.max(1, assignCurrentPage), Math.max(1, assignTotalPages));
                    const paginatedEmployees = filtered.slice((safeAssignPage - 1) * ASSIGN_ITEMS_PER_PAGE, safeAssignPage * ASSIGN_ITEMS_PER_PAGE);

                    return (
                        <>
                            {paginatedEmployees.map((employee) => {
                                // Count active assignments for this employee
                                const activeAssignments = jobAssignments.filter(
                                    a => a.employeeId === employee.id &&
                                        ['Assigned', 'Accepted', 'In-Progress'].includes(a.status)
                                );
                                const workloadCount = activeAssignments.length;
                                const roleMatch = getRoleMatch(employee, selectedJob);

                                return (
                                    <div key={employee.id} className={`p-4 rounded-2xl border transition-all duration-300 ${roleMatch && selectedJob
                                        ? 'bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/20'
                                        : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 hover:bg-white dark:hover:bg-white/[0.08]'
                                        } `}>
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-gray-700 dark:to-gray-900 border border-slate-300 dark:border-white/10 flex items-center justify-center text-sm font-black text-slate-700 dark:text-white shadow-md">
                                                    {employee.name?.charAt(0) || '?'}
                                                </div>
                                                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-black ${employee.status?.toLowerCase() === 'active' ? 'bg-green-500' : 'bg-slate-400 dark:bg-gray-500'}`} />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="text-sm text-slate-900 dark:text-gray-200 font-black truncate">{employee.name}</div>
                                                    {roleMatch && selectedJob && (
                                                        <span className="text-[8px] bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-500/30 font-black uppercase tracking-tighter shadow-sm dark:shadow-[0_0_8px_rgba(59,130,246,0.3)]">
                                                            Match
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Workload Progress Bar */}
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between items-center text-[9px] uppercase font-black tracking-widest">
                                                        <span className="text-slate-400 dark:text-gray-500">{employee.role}</span>
                                                        <span className="text-slate-500 dark:text-gray-400">
                                                            {workloadCount} {t('warehouse.active')}
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-1 bg-slate-100 dark:bg-black/40 rounded-full overflow-hidden border border-slate-200 dark:border-white/5">
                                                        <div
                                                            className={`h-full transition-all duration-500 bg-blue-500 w-[${Math.min(100, (workloadCount / 5) * 100)}%]`}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <Protected permission="ASSIGN_TASKS">
                                                <button
                                                    disabled={!selectedJob}
                                                    onClick={async () => {
                                                        if (selectedJob) {
                                                            try {
                                                                setIsSubmitting(true);
                                                                await assignJob(selectedJob.id, employee.id);
                                                                addNotification('success', `Job assigned to ${employee.name}`);
                                                                setSelectedJob(null);
                                                                await refreshData();
                                                            } catch (error) {
                                                                console.error('Failed to assign job:', error);
                                                                addNotification('alert', 'Failed to assign job');
                                                            } finally {
                                                                setIsSubmitting(false);
                                                            }
                                                        }
                                                    }}
                                                    className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-center ${!selectedJob
                                                        ? 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-300 dark:text-gray-700 cursor-not-allowed'
                                                        : roleMatch
                                                            ? 'bg-blue-600 dark:bg-blue-500 text-white dark:text-black border-blue-500 dark:border-blue-400 shadow-lg dark:shadow-[0_4px_12px_rgba(59,130,246,0.3)] hover:scale-105 active:scale-95'
                                                            : 'bg-slate-900 dark:bg-white/10 border-slate-800 dark:border-white/10 text-white hover:bg-slate-800 dark:hover:bg-white/20 hover:scale-105 active:scale-95 shadow-md'
                                                        }`}
                                                    title={
                                                        !selectedJob
                                                            ? t('warehouse.selectJobFirst')
                                                            : 'Assign Task'
                                                    }
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </Protected>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Assign Pagination Controls */}
                            {assignTotalPages > 1 && (
                                <div className="flex items-center justify-center gap-4 py-4 border-t border-slate-200 dark:border-white/5">
                                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-black/20 p-1.5 rounded-full border border-slate-200 dark:border-white/5">
                                        <button
                                            onClick={() => setAssignCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={safeAssignPage === 1}
                                            title="Previous Page"
                                            aria-label="Previous Page"
                                            className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-white/10 transition-all text-slate-500 dark:text-gray-400"
                                        >
                                            <ChevronDown className="rotate-90" size={14} />
                                        </button>
                                        <span className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest px-2">
                                            Page <span className="text-slate-900 dark:text-white">{safeAssignPage}</span> of {assignTotalPages}
                                        </span>
                                        <button
                                            onClick={() => setAssignCurrentPage(prev => Math.min(assignTotalPages, prev + 1))}
                                            disabled={safeAssignPage === assignTotalPages}
                                            title="Next Page"
                                            aria-label="Next Page"
                                            className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-white/10 transition-all text-slate-500 dark:text-gray-400"
                                        >
                                            <ChevronDown className="-rotate-90" size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    );
                })()}
                {filteredEmployees.filter(e =>
                    ['picker', 'packer', 'dispatcher', 'warehouse_manager', 'driver', 'receiver', 'inventory_specialist', 'forklift_operator', 'auditor'].includes(e.role?.toLowerCase()) &&
                    e.status?.toLowerCase() === 'active'
                ).length === 0 && (
                        <div className="text-center py-8 text-slate-400 dark:text-gray-500 text-sm">
                            No warehouse staff available
                        </div>
                    )}
            </div>
        </div>
    );
};
