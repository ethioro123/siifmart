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
    return (
        <div className="relative z-10 shrink-0">
            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2 mb-6">
                <Package size={16} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                {t('warehouse.docks.stagingArea')}
                <span className="text-[10px] text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-white/5 px-2 py-0.5 rounded-full ml-auto">
                    {stagingJobs.length} READY
                </span>
            </h4>
            <div className="glass-panel-pushed rounded-[2rem] p-6 shadow-inner">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {stagingJobs.length === 0 ? (
                        <div className="col-span-full py-12 text-center">
                            <Box size={40} className="text-gray-800 mx-auto mb-4" />
                            <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">No Shipments in Staging</p>
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
                                    className="bg-[#FAF8F5]/50 dark:bg-[#1C2620]/30 hover:bg-[#FAF8F5]/80 dark:hover:bg-[#1C2620]/50 p-4 rounded-2xl border border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] hover:border-[#2C5E3B]/30 dark:hover:border-[#A9CBA2]/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group transition-all cursor-pointer shadow-sm"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#2C5E3B]/20 rounded-xl flex shrink-0 items-center justify-center text-[#2C5E3B] dark:text-[#A9CBA2]">
                                            <Package size={20} className="sm:w-6 sm:h-6" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-[10px] sm:text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest truncate">{formatJobId(job)}</p>
                                                <span className="px-1.5 py-0.5 bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2] text-[8px] font-black rounded border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20">READY</span>
                                            </div>
                                            <p className="text-[8px] sm:text-[9px] text-gray-500 font-bold uppercase mt-1 break-words leading-tight">
                                                Dest: {destSite ? (
                                                    <>
                                                        {destSite.name} <span className="text-zinc-500 dark:text-zinc-600 font-normal lowercase">({destSite.code || destSite.id})</span>
                                                    </>
                                                ) : 'Unknown'}
                                            </p>
                                            {job.deliveryMethod === 'External' ? (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Truck size={10} className="text-amber-500 dark:text-amber-400" />
                                                    <span className="text-[8px] text-amber-550 dark:text-amber-400 font-black uppercase tracking-tighter truncate">
                                                        {job.externalCarrierName || 'EXT Carrier'}
                                                    </span>
                                                </div>
                                            ) : job.assignedTo && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <UserIcon size={10} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                                    <span className="text-[8px] text-[#2C5E3B] dark:text-[#A9CBA2] font-black uppercase tracking-tighter truncate">
                                                        {employees.find(e => e.id === job.assignedTo)?.name || 'Assigned'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-left sm:text-right shrink-0">
                                        <div className="flex items-center justify-end gap-2 mb-2">
                                            <p className="text-[10px] text-gray-400 font-mono font-bold tracking-tighter">{job.items || job.lineItems?.length || 0} Units</p>
                                            {['super_admin', 'warehouse_manager'].includes(user?.role as string) && (
                                                <button
                                                    onClick={(e) => handleDelete(e, job.id)}
                                                    className="w-5 h-5 rounded border bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-red-500 hover:text-white hover:bg-red-500 hover:border-red-500 transition-all flex items-center justify-center shrink-0"
                                                    title="Delete Job"
                                                >
                                                    <Trash2 size={10} />
                                                </button>
                                            )}
                                        </div>
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (!checkControlAccess('Dock loading')) return;
                                                const availableDock = OUTBOUND_DOCKS.find(d => !findDockJob(jobs, d));
                                                if (availableDock) {
                                                    try {
                                                        await wmsJobsService.update(job.id, {
                                                            status: 'In-Progress',
                                                            location: `Dock ${availableDock}`,
                                                            transferStatus: 'Packed'
                                                        } as any);
                                                        await refreshData();
                                                        addNotification('success', `Assigned ${formatJobId(job)} to ${availableDock}`);
                                                    } catch (err) {
                                                        addNotification('alert', 'Failed to assign dock');
                                                    }
                                                } else {
                                                    addNotification('alert', 'All Outbound Docks Occupied');
                                                }
                                            }}
                                            className="text-[9px] text-[#2C5E3B] dark:text-[#A9CBA2] font-black tracking-widest uppercase mt-2 hover:text-[#1E3B24] dark:hover:text-[#FAF8F5] transition-colors"
                                        >
                                            DOCK LOAD →
                                        </button>
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
