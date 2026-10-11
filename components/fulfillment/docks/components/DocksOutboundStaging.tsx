import React from 'react';
import { Package, Box, Truck, User as UserIcon, Trash2 } from 'lucide-react';
import { WMSJob, Site, User } from '../../../../types';

interface DocksOutboundStagingProps {
    stagingJobs: WMSJob[];
    sites: Site[];
    employees: User[];
    user: User | null;
    jobs: WMSJob[];
    OUTBOUND_DOCKS: readonly string[];
    findDockJob: (jobs: WMSJob[], dockName: string) => WMSJob | undefined;
    setSelectedJob: (job: WMSJob | null) => void;
    setIsDetailsOpen: (val: boolean) => void;
    formatJobId: (job: WMSJob) => string;
    handleDelete: (e: React.MouseEvent, jobId: string) => Promise<void>;
    checkControlAccess: (actionName: string) => boolean;
    wmsJobsService: any;
    refreshData: () => Promise<void>;
    addNotification: (type: 'info' | 'success' | 'alert', message: string) => void;
    t: (key: string) => string;
}

export const DocksOutboundStaging: React.FC<DocksOutboundStagingProps> = ({
    stagingJobs,
    sites,
    employees,
    user,
    jobs,
    OUTBOUND_DOCKS,
    findDockJob,
    setSelectedJob,
    setIsDetailsOpen,
    formatJobId,
    handleDelete,
    checkControlAccess,
    wmsJobsService,
    refreshData,
    addNotification,
    t,
}) => {
    const handleAssignToSpecificDock = async (job: WMSJob, dockName: string) => {
        if (!checkControlAccess('Dock loading')) return;
        const occupyingJob = findDockJob(jobs, dockName);
        if (occupyingJob) {
            addNotification('alert', `${dockName} is already occupied by ${formatJobId(occupyingJob)}`);
            return;
        }

        try {
            await wmsJobsService.update(job.id, {
                status: 'In-Progress',
                location: `Dock ${dockName}`,
                transferStatus: 'Packed'
            } as any);
            await refreshData();
            addNotification('success', `Assigned ${formatJobId(job)} to ${dockName}`);
        } catch (err) {
            addNotification('alert', 'Failed to assign dock');
        }
    };

    return (
        <div className="relative z-10 shrink-0">
            <h4 className="text-xs sm:text-sm font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider flex items-center gap-2 mb-4">
                <Package size={16} className="text-primary" />
                {t('warehouse.docks.stagingArea')}
                <span className="text-[11px] text-[var(--theme-text-muted)] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] px-2.5 py-0.5 rounded-full ml-auto font-mono font-medium">
                    {stagingJobs.length} READY
                </span>
            </h4>
            <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-5 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 max-h-[340px] overflow-y-auto pr-1">
                    {stagingJobs.length === 0 ? (
                        <div className="col-span-full py-10 text-center">
                            <Box size={36} className="text-[var(--theme-text-muted)] mx-auto mb-3" />
                            <p className="text-xs text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">No Shipments in Staging</p>
                        </div>
                    ) : (
                        stagingJobs.map(job => {
                            const destSite = sites.find(s => s.id === job.destSiteId);

                            return (
                                <div
                                    key={job.id}
                                    onClick={() => {
                                        setSelectedJob(job);
                                        setIsDetailsOpen(true);
                                    }}
                                    className="bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] p-3.5 sm:p-4 rounded-xl border border-[var(--theme-border)] hover:border-primary/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 group transition-colors cursor-pointer shadow-sm touch-manipulation"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex shrink-0 items-center justify-center text-primary border border-primary/20">
                                            <Package size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-xs font-mono font-medium text-[var(--theme-text-primary)] uppercase tracking-wider truncate">{formatJobId(job)}</p>
                                                <span className="px-2 py-0.5 bg-primary/10 text-primary text-[11px] font-semibold rounded-full border border-primary/20">READY</span>
                                            </div>
                                            <p className="text-[11px] text-[var(--theme-text-muted)] font-medium uppercase mt-0.5 truncate">
                                                Dest: {destSite ? destSite.name : 'Unknown Destination'}
                                            </p>
                                            {job.deliveryMethod === 'External' ? (
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <Truck size={12} className="text-amber-500" />
                                                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-tight truncate">
                                                        {job.externalCarrierName || 'EXT Carrier'}
                                                    </span>
                                                </div>
                                            ) : job.assignedTo && (
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <UserIcon size={12} className="text-primary" />
                                                    <span className="text-[11px] text-primary font-semibold uppercase tracking-tight truncate">
                                                        {employees.find(e => e.id === job.assignedTo)?.name || 'Assigned'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Side: Units + Delete + Space-Saving Dock Select Dropdown */}
                                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] text-[var(--theme-text-muted)] font-mono font-medium tabular-nums">{job.items || job.lineItems?.length || 0} Units</span>
                                            {['super_admin', 'warehouse_manager', 'operations_manager', 'regional_manager'].includes(user?.role as string) && (
                                                <button
                                                    onClick={(e) => handleDelete(e, job.id)}
                                                    className="w-8 h-8 rounded-lg bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-red-500 hover:text-white hover:bg-red-500 hover:border-red-500 transition-colors flex items-center justify-center shrink-0 touch-manipulation"
                                                    title="Delete Job"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Space-Saving Dock Select Dropdown */}
                                        <select
                                            defaultValue=""
                                            onChange={(e) => {
                                                const dock = e.target.value;
                                                if (dock) {
                                                    handleAssignToSpecificDock(job, dock);
                                                    e.target.value = "";
                                                }
                                            }}
                                            aria-label="Select Outbound Dock"
                                            className="min-h-[44px] px-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-[11px] font-semibold uppercase tracking-wider cursor-pointer outline-none transition-colors shadow-xs touch-manipulation"
                                        >
                                            <option value="" disabled className="bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)]">
                                                LOAD DOCK ▾
                                            </option>
                                            {OUTBOUND_DOCKS.map((dock) => {
                                                const occupying = findDockJob(jobs, dock);
                                                const isAvailable = !occupying;
                                                return (
                                                    <option
                                                        key={dock}
                                                        value={dock}
                                                        disabled={!isAvailable}
                                                        className="bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]"
                                                    >
                                                        {dock} {isAvailable ? '(Open)' : `(Occupied)`}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
