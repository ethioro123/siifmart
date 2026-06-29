import React from 'react';
import { Upload, Truck, X, User as UserIcon, Printer, Package, Box, Plus, Clock, Navigation, Trash2 } from 'lucide-react';
import { WMSJob, Site, User, Product } from '../../../types';
import { DocksOutboundHistory } from './DocksOutboundHistory';
import { useFulfillment } from '../FulfillmentContext';

// ────────────────────────────────────────────────────────────────
//  CONSTANTS — single source of truth for dock bay identifiers
// ────────────────────────────────────────────────────────────────
const OUTBOUND_DOCKS = ['D3', 'D4'] as const;

interface DocksOutboundViewProps {
    jobs: WMSJob[];
    sites: Site[];
    activeSite: Site | null;
    employees: User[];
    user: User | null;
    setSelectedJob: (job: WMSJob | null) => void;
    setIsDetailsOpen: (isOpen: boolean) => void;
    formatJobId: (job: WMSJob) => string;
    wmsJobsService: any;
    refreshData: () => Promise<void>;
    addNotification: (type: 'success' | 'alert' | 'info', message: string) => void;
    generatePackLabelHTML: (data: any, options: any) => Promise<string>;
    completeJob: (jobId: string, employeeName: string) => Promise<any>;
    viewMode: 'Process' | 'History';
    t: (key: string) => string;
    products: Product[];
}

// ────────────────────────────────────────────────────────────────
//  HELPERS — derive dock state from the jobs array
// ────────────────────────────────────────────────────────────────

/** A DISPATCH job sitting at a specific dock bay (active, not completed/cancelled) */
const findDockJob = (jobs: WMSJob[], dock: string): WMSJob | undefined =>
    jobs.find(j =>
        j.location === `Dock ${dock}` &&
        j.type === 'DISPATCH' &&
        j.status !== 'Completed' &&
        j.status !== 'Cancelled'
    );

/** All DISPATCH jobs in the staging area (not yet assigned to a dock) */
const getStagingJobs = (jobs: WMSJob[]): WMSJob[] =>
    jobs.filter(j =>
        j.type === 'DISPATCH' &&
        ['Packed', 'Staged'].includes(j.transferStatus || '') &&
        j.status !== 'Completed' &&
        j.status !== 'Cancelled' &&
        !OUTBOUND_DOCKS.some(d => j.location === `Dock ${d}`)
    );

/** All DISPATCH jobs that have departed (shipped / in-transit) */
const getShippedJobs = (jobs: WMSJob[]): WMSJob[] =>
    jobs.filter(j =>
        j.type === 'DISPATCH' &&
        ['Shipped', 'In-Transit'].includes(j.transferStatus || '') &&
        j.status !== 'Completed' &&
        j.status !== 'Cancelled'
    );

// ────────────────────────────────────────────────────────────────
//  COMPONENT
// ────────────────────────────────────────────────────────────────

export const DocksOutboundView: React.FC<DocksOutboundViewProps> = ({
    jobs,
    sites,
    activeSite,
    employees,
    setSelectedJob,
    setIsDetailsOpen,
    formatJobId,
    wmsJobsService,
    user,
    refreshData,
    addNotification,
    generatePackLabelHTML,
    completeJob,
    viewMode,
    t,
    products
}) => {
    const stagingJobs = getStagingJobs(jobs);
    const shippedJobs = getShippedJobs(jobs);
    const { deleteJob } = useFulfillment();

    const handleDelete = async (e: React.MouseEvent, jobId: string) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to permanently delete this job?')) {
            await deleteJob(jobId);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden custom-scrollbar pr-2">
            {viewMode === 'Process' ? (
                <>
                    <div className="flex-1 flex flex-col gap-6 lg:overflow-y-auto custom-scrollbar pr-2">
                        {/* ─── DOCK BAYS ─── */}
                        <div className="glass-panel p-6 lg:p-8 relative overflow-hidden group shrink-0">
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#2C5E3B]/10 blur-[100px] rounded-full pointer-events-none" />

                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase flex items-center gap-3 mb-8">
                                <div className="p-2 bg-[#2C5E3B]/20 rounded-xl">
                                    <Upload className="text-[#2C5E3B] dark:text-[#A9CBA2]" size={20} />
                                </div>
                                {t('warehouse.docks.outboundTitle')}
                            </h3>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12 relative z-10">
                                {OUTBOUND_DOCKS.map(dock => {
                                    // ✅ Single source of truth: derived from the jobs array
                                    const assignedJob = findDockJob(jobs, dock);
                                    const isOccupied = !!assignedJob;
                                    const destSite = sites.find(s => s.id === assignedJob?.destSiteId);

                                    return (
                                        <div
                                            key={dock}
                                            onClick={() => {
                                                if (assignedJob) {
                                                    setSelectedJob(assignedJob);
                                                    setIsDetailsOpen(true);
                                                }
                                            }}
                                            className={`relative flex flex-col rounded-[2.5rem] border-2 transition-all duration-500 overflow-hidden shadow-sm dark:shadow-2xl group cursor-pointer ${!isOccupied ? 'border-dashed border-[#E2DCCE]/60 dark:border-[#A9CBA2]/10 bg-[#FAF8F5]/30 dark:bg-[#18201B]/20' : 'border-[#2C5E3B]/30 bg-[#2C5E3B]/5 dark:bg-[#A9CBA2]/5 hover:bg-[#2C5E3B]/10 dark:hover:bg-[#A9CBA2]/10'}`}
                                        >
                                            <span className="absolute top-4 left-5 font-black text-slate-200 dark:text-white/10 text-xl tracking-tighter z-0">{dock}</span>

                                            {!isOccupied ? (
                                                <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4 opacity-40 group-hover:opacity-60 transition-opacity">
                                                    <div className="w-16 h-16 rounded-3xl border-2 border-dashed border-[#E2DCCE]/60 dark:border-[#A9CBA2]/10 flex items-center justify-center">
                                                        <Upload size={24} className="text-gray-600" />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{t('warehouse.docks.empty')}</span>
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex flex-col p-6 z-10">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="p-2 bg-[#2C5E3B]/20 rounded-xl">
                                                            <Truck size={24} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                                        </div>
                                                        {/* 🔧 FIX: Release Dock now persists the job back to staging in DB */}
                                                        <button
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                if (!assignedJob) return;
                                                                try {
                                                                    await wmsJobsService.update(assignedJob.id, {
                                                                        location: 'Dispatch Bay',
                                                                        status: 'Pending',
                                                                        assignedBy: user?.name || 'System'
                                                                    } as any);
                                                                    await refreshData();
                                                                    addNotification('info', `${formatJobId(assignedJob)} returned to Staging`);
                                                                } catch (err) {
                                                                    addNotification('alert', 'Failed to release dock');
                                                                }
                                                            }}
                                                            className="p-1.5 hover:bg-stone-100 dark:hover:bg-[#18201B]/50 rounded-lg text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white transition-colors"
                                                            title="Return to Staging"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>

                                                    <div className="mb-4 flex justify-between items-start">
                                                        <div>
                                                            <p className="text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-black tracking-widest uppercase mb-1">{formatJobId(assignedJob)}</p>
                                                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase break-words leading-tight">
                                                                {destSite ? (
                                                                    <>
                                                                        {destSite.name} <span className="text-zinc-500 dark:text-zinc-600 font-normal lowercase">({destSite.code || destSite.id})</span>
                                                                    </>
                                                                ) : 'In-Transport'}
                                                            </p>
                                                        </div>
                                                        {['super_admin', 'warehouse_manager'].includes(user?.role as string) && (
                                                            <button
                                                                onClick={(e) => handleDelete(e, assignedJob.id)}
                                                                className="w-6 h-6 rounded border bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-red-500 hover:text-white hover:bg-red-500 hover:border-red-500 transition-all flex items-center justify-center shrink-0"
                                                                title="Delete Job"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                                        <div className="glass-panel-pushed p-2.5">
                                                            <p className="text-[8px] text-gray-500 font-black uppercase tracking-wider mb-1">Payload</p>
                                                            <p className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                                                                {(assignedJob.lineItems?.length || 0) > 0
                                                                    ? assignedJob.lineItems.length
                                                                    : (assignedJob.items || 0)} Units
                                                            </p>
                                                        </div>
                                                        <div className="glass-panel-pushed p-2.5">
                                                            <p className="text-[8px] text-gray-500 font-black uppercase tracking-wider mb-1">Status</p>
                                                            <p className="text-[10px] font-black text-[#2C5E3B] dark:text-[#A9CBA2] uppercase tracking-widest">DOCK LOADED</p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-auto space-y-3" onClick={e => e.stopPropagation()}>
                                                        {/* Driver Assignment Type Toggle */}
                                                        <div className="flex glass-panel-pushed p-1">
                                                            <button
                                                                onClick={async () => {
                                                                    try {
                                                                        await wmsJobsService.update(assignedJob.id, { 
                                                                            deliveryMethod: 'Internal', 
                                                                            externalCarrierName: null,
                                                                            assignedBy: user?.name || 'Unknown'
                                                                        } as any);
                                                                        await refreshData();
                                                                    } catch (err) {
                                                                        addNotification('alert', 'Toggle Failed');
                                                                    }
                                                                }}
                                                                className={`flex-1 py-1 text-[8px] font-bold rounded-md transition-all ${assignedJob.deliveryMethod !== 'External' ? 'bg-[#2C5E3B] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] shadow-sm' : 'text-stone-500 hover:text-[#2C5E3B] dark:text-gray-500 dark:hover:text-white'}`}
                                                            >
                                                                INTERNAL
                                                            </button>
                                                            <button
                                                                onClick={async () => {
                                                                    try {
                                                                        await wmsJobsService.update(assignedJob.id, { 
                                                                            deliveryMethod: 'External', 
                                                                            assignedTo: null,
                                                                            assignedBy: user?.name || 'Unknown'
                                                                        } as any);
                                                                        await refreshData();
                                                                    } catch (err) {
                                                                        addNotification('alert', 'Toggle Failed');
                                                                    }
                                                                }}
                                                                className={`flex-1 py-1 text-[8px] font-bold rounded-md transition-all ${assignedJob.deliveryMethod === 'External' ? 'bg-[#2C5E3B] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] shadow-sm' : 'text-stone-500 hover:text-[#2C5E3B] dark:text-gray-500 dark:hover:text-white'}`}
                                                            >
                                                                EXTERNAL
                                                            </button>
                                                        </div>

                                                        {/* Driver Assignment Input/Select */}
                                                        <div className="relative">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <UserIcon size={12} className="text-gray-500" />
                                                                <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">
                                                                    {assignedJob.deliveryMethod === 'External' ? 'External Driver' : 'Assign Driver'}
                                                                </span>
                                                            </div>
                                                            
                                                            {assignedJob.deliveryMethod === 'External' ? (
                                                                <input
                                                                    type="text"
                                                                    placeholder="Enter Driver Name..."
                                                                    aria-label="External Driver Name"
                                                                    title="External Driver Name"
                                                                    defaultValue={assignedJob.externalCarrierName || ''}
                                                                    key={`carrier-${assignedJob.id}-${assignedJob.deliveryMethod}`}
                                                                    onBlur={async (e) => {
                                                                        const carrierName = e.target.value;
                                                                        try {
                                                                            await wmsJobsService.update(assignedJob.id, { 
                                                                                externalCarrierName: carrierName,
                                                                                assignedBy: user?.name || 'Unknown'
                                                                            } as any);
                                                                            await refreshData();
                                                                        } catch (err) {
                                                                            addNotification('alert', 'Save Failed');
                                                                        }
                                                                    }}
                                                                    className="woody-input w-full px-3 py-2 text-[10px]"
                                                                />
                                                            ) : (
                                                                <select
                                                                    title="Assign Driver"
                                                                    aria-label="Assign Driver"
                                                                    value={assignedJob.assignedTo || ''}
                                                                    onChange={async (e) => {
                                                                        const driverId = e.target.value || null;
                                                                        try {
                                                                            await wmsJobsService.update(assignedJob.id, { 
                                                                                assignedTo: driverId,
                                                                                assignedBy: user?.name || 'Unknown'
                                                                            } as any);
                                                                            await refreshData();
                                                                            addNotification('success', `Assigned to Driver`);
                                                                        } catch (err) {
                                                                            addNotification('alert', 'Assignment Failed');
                                                                        }
                                                                    }}
                                                                    className="woody-input w-full px-3 py-2 text-[10px] appearance-none cursor-pointer"
                                                                >
                                                                    <option value="">Select Driver...</option>
                                                                    {employees
                                                                        .filter(e => (e.role === 'driver' || e.role === 'dispatcher') && (e as any).status === 'Active')
                                                                        .map(e => (
                                                                            <option key={e.id} value={e.id}>{e.name} ({e.role.toUpperCase()})</option>
                                                                        ))}
                                                                </select>
                                                            )}
                                                        </div>

                                                        <div className="flex flex-col gap-2">
                                                            {/* 🏁 Mark Departure — moves job out of dock bay into shipped state */}
                                                            {['Packed', 'Staged'].includes(assignedJob.transferStatus || '') && (
                                                                <button
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation();
                                                                        try {
                                                                            await wmsJobsService.update(assignedJob.id, {
                                                                                status: 'In-Progress',
                                                                                transferStatus: 'Shipped',
                                                                                location: 'In-Transit',
                                                                                shippedAt: new Date().toISOString(),
                                                                                assignedBy: user?.name || 'System'
                                                                            } as any);
                                                                            if (assignedJob.orderRef) {
                                                                                const parentJob = jobs.find(j => (j.id === assignedJob.orderRef || j.jobNumber === assignedJob.orderRef) && j.type === 'TRANSFER');
                                                                                if (parentJob) {
                                                                                    await wmsJobsService.update(parentJob.id, { 
                                                                                        transferStatus: 'Shipped',
                                                                                        assignedBy: user?.name || 'System'
                                                                                    } as any);
                                                                                } else {
                                                                                    // Fallback to original orderRef if not found in local state
                                                                                    await wmsJobsService.update(assignedJob.orderRef, { 
                                                                                        transferStatus: 'Shipped',
                                                                                        assignedBy: user?.name || 'System'
                                                                                    } as any);
                                                                                }
                                                                            }
                                                                            await refreshData();
                                                                            addNotification('success', 'Shipment Departed');
                                                                        } catch (err) {
                                                                            addNotification('alert', 'Status Update Failed');
                                                                        }
                                                                    }}
                                                                    className="woody-btn-primary w-full text-[9px] font-black uppercase tracking-[0.2em] py-2.5 rounded-xl flex items-center justify-center gap-2 active:scale-95"
                                                                >
                                                                    <Navigation size={14} /> Mark Departure
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* ─── STAGING AREA ─── */}
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
                                                                    // Find the first empty dock bay from jobs array
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
                        </div>

                        {/* ─── OUTBOUND SCHEDULE (Shipped / In-Transit) ─── */}
                        <div className="glass-panel p-6 flex flex-col shrink-0 mt-2">
                            <div className="absolute -top-32 -left-32 w-64 h-64 bg-[#2C5E3B]/5 blur-[100px] rounded-full pointer-events-none" />
                            
                            <div className="flex justify-between items-center mb-6 shrink-0 relative z-10">
                                <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-widest uppercase flex items-center gap-3">
                                    <div className="p-1.5 bg-[#2C5E3B]/20 rounded-lg">
                                        <Navigation className="text-[#2C5E3B] dark:text-[#A9CBA2]" size={16} />
                                    </div>
                                    {t('warehouse.docks.outboundSchedule')}
                                    <span className="text-[10px] text-[#A9CBA2] bg-[#2C5E3B]/10 px-2 py-0.5 rounded-full ml-3 border border-[#2C5E3B]/20">
                                        {shippedJobs.length} ACTIVE
                                    </span>
                                </h3>
                            </div>
                            
                            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar relative z-10 snap-x">
                                {shippedJobs.length === 0 ? (
                                    <div className="w-full py-12 text-center bg-slate-50 dark:bg-black/20 rounded-3xl border border-dashed border-slate-200 dark:border-white/5 opacity-60">
                                        <Truck size={32} className="text-slate-300 dark:text-gray-700 mx-auto mb-3" />
                                        <p className="text-xs text-slate-400 dark:text-gray-500 font-bold uppercase tracking-widest">No Active Shipments</p>
                                    </div>
                                ) : (
                                    shippedJobs.map(job => {
                                        const destSite = sites.find(s => s.id === job.destSiteId);
                                        const driver = employees.find(e => e.id === job.assignedTo);
                                        const isExternal = job.deliveryMethod === 'External';
                                        
                                        return (
                                            <div key={job.id} className="min-w-[320px] max-w-[360px] p-5 bg-[#FAF8F5]/80 dark:bg-[#1C2620]/60 rounded-3xl border border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] relative overflow-hidden group hover:border-[#2C5E3B]/40 dark:hover:border-[#A9CBA2]/40 transition-all duration-300 flex flex-col justify-between shadow-sm snap-start hover:-translate-y-1">
                                                {/* Card Glow Effect */}
                                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#2C5E3B]/5 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                
                                                <div className="relative z-10">
                                                    {/* Header: Status & Time */}
                                                    <div className="flex justify-between items-start mb-4 gap-2">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                                                {job.transferStatus?.toUpperCase()}
                                                            </span>
                                                            <span className="text-[9px] text-amber-500 dark:text-amber-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                                                <Clock size={10} />
                                                                {job.shippedAt ? new Date(job.shippedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'PENDING'}
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-2 items-center">
                                                            <span className="text-[9px] glass-panel-pushed text-stone-500 dark:text-stone-400 px-2 py-0.5 rounded border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] font-mono tracking-wider">
                                                                #{formatJobId(job)}
                                                            </span>
                                                            {['super_admin', 'warehouse_manager'].includes(user?.role as string) && (
                                                                <button
                                                                    onClick={(e) => handleDelete(e, job.id)}
                                                                    className="w-6 h-6 rounded border bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-red-500 hover:text-white hover:bg-red-500 hover:border-red-500 transition-all flex items-center justify-center shrink-0"
                                                                    title="Delete Job"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Body: Destination & Driver */}
                                                    <div className="mb-5 glass-panel-pushed p-3">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className="w-8 h-8 rounded-lg bg-[#2C5E3B]/20 dark:bg-[#A9CBA2]/20 flex items-center justify-center border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 shrink-0">
                                                                <Box size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-0.5">Destination</p>
                                                                <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider break-words leading-tight">
                                                                    {destSite ? (
                                                                        <>
                                                                            {destSite.name} <span className="text-zinc-500 dark:text-zinc-600 font-normal lowercase">({destSite.code || destSite.id})</span>
                                                                        </>
                                                                    ) : 'External Hub'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#E2DCCE]/60 dark:via-[#A9CBA2]/10 to-transparent my-2" />
                                                        
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-lg ${isExternal ? 'bg-amber-500/20 border-amber-500/20' : 'bg-[#2C5E3B]/20 border-[#2C5E3B]/20'} flex items-center justify-center border shrink-0`}>
                                                                <UserIcon size={14} className={isExternal ? 'text-amber-555 dark:text-amber-400' : 'text-[#2C5E3B] dark:text-[#A9CBA2]'} />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex justify-between items-center mb-0.5">
                                                                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Driver</p>
                                                                    <span className={`text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded ${isExternal ? 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20' : 'bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20'}`}>
                                                                        {isExternal ? 'EXTERNAL' : 'INTERNAL'}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs font-bold text-slate-500 dark:text-gray-300 truncate">
                                                                    {isExternal ? (job.externalCarrierName || 'Unlabeled Carrier') : (driver?.name || 'Unassigned')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Footer: ETA/Status Banner */}
                                                <div className="mt-auto relative z-10">
                                                    <div className="w-full bg-gradient-to-r from-[#2C5E3B]/10 to-[#2C5E3B]/5 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 text-[9px] font-black uppercase tracking-widest py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#2C5E3B]/20 dark:hover:bg-[#A9CBA2]/20 transition-colors">
                                                        <Truck size={14} className="animate-pulse" /> In Transit to Destination
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                    </div>
                </>
            ) : (
                <div className="w-full mt-6">
                    <DocksOutboundHistory
                        jobs={jobs}
                        sites={sites}
                        employees={employees}
                        setSelectedJob={setSelectedJob}
                        setIsDetailsOpen={setIsDetailsOpen}
                        formatJobId={formatJobId}
                    />
                </div>
            )}
        </div>
    );
};
