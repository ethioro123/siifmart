import React, { useState } from 'react';
import { Upload, Truck, X, User as UserIcon, Package, Navigation, Trash2 } from 'lucide-react';
import { WMSJob, Site, User, Product } from '../../../types';
import { DocksOutboundHistory } from './DocksOutboundHistory';
import { useFulfillment } from '../FulfillmentContext';
import { DocksOutboundDepartures } from './components/DocksOutboundDepartures';
import { DocksOutboundStaging } from './components/DocksOutboundStaging';
import { DockAssignModal } from './components/DockAssignModal';

// CONSTANTS — single source of truth for dock bay identifiers
const OUTBOUND_DOCKS = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6'] as const;

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
    generatePackLabelHTML?: (data: any, options: any) => Promise<string>;
    completeJob?: (jobId: string, employeeName: string) => Promise<any>;
    viewMode: 'Process' | 'History';
    t: (key: string) => string;
    products?: Product[];
}

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
    viewMode,
    t,
}) => {
    const stagingJobs = getStagingJobs(jobs);
    const shippedJobs = getShippedJobs(jobs);
    const { deleteJob } = useFulfillment();
    const isMgr = ['super_admin', 'admin', 'regional_manager', 'operations_manager', 'warehouse_manager'].includes((user?.role || '').toLowerCase());
    const isOpStaff = isMgr || (user?.role || '').toLowerCase() === 'dispatcher';

    const [selectedEmptyDock, setSelectedEmptyDock] = useState<string | null>(null);
    const [isAssigning, setIsAssigning] = useState(false);

    const checkControlAccess = (actionName = 'Control actions') => {
        if (!isOpStaff) { addNotification('alert', `${actionName} requires Dispatcher or Warehouse Manager role.`); return false; }
        return true;
    };

    const handleAssignJobToDock = async (jobId: string, dockName: string) => {
        if (!checkControlAccess('Dock loading')) return;
        setIsAssigning(true);
        try {
            await wmsJobsService.update(jobId, {
                status: 'In-Progress',
                location: `Dock ${dockName}`,
                transferStatus: 'Packed'
            } as any);
            await refreshData();
            addNotification('success', `Assigned shipment to Dock ${dockName}`);
        } catch (err) {
            addNotification('alert', 'Failed to assign dock');
        } finally {
            setIsAssigning(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, jobId: string) => {
        e.stopPropagation();
        if (!isMgr) { addNotification('alert', 'Job deletion requires Warehouse Manager role.'); return; }
        if (window.confirm('Are you sure you want to permanently delete this job?')) await deleteJob(jobId);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden custom-scrollbar pr-1">
            {viewMode === 'Process' ? (
                <>
                    <div className="flex-1 flex flex-col gap-4 sm:gap-6 lg:overflow-y-auto pr-1">
                        {/* DOCK BAYS */}
                        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-6 shrink-0 shadow-sm">
                            <h3 className="text-base sm:text-lg font-bold text-[var(--theme-text-primary)] tracking-tight uppercase flex items-center gap-2.5 mb-6">
                                <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
                                    <Upload className="text-primary" size={18} />
                                </div>
                                {t('warehouse.docks.outboundTitle')}
                            </h3>

                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-8">
                                {OUTBOUND_DOCKS.map(dock => {
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
                                                } else {
                                                    if (!checkControlAccess('Dock loading')) return;
                                                    setSelectedEmptyDock(dock);
                                                }
                                            }}
                                            className={`relative flex flex-col rounded-2xl border transition-colors overflow-hidden shadow-sm cursor-pointer touch-manipulation ${
                                                !isOccupied
                                                    ? 'border-dashed border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)]'
                                                    : 'border-primary/30 bg-primary/5 hover:bg-primary/10'
                                            }`}
                                        >
                                            <span className="absolute top-3 left-3.5 font-bold font-mono text-[var(--theme-text-muted)] text-sm tracking-tight z-0">{dock}</span>

                                            {!isOccupied ? (
                                                <div className="flex-1 flex flex-col items-center justify-center p-6 gap-3 opacity-60 hover:opacity-100 transition-opacity">
                                                    <div className="w-14 h-14 rounded-2xl border border-dashed border-[var(--theme-border)] flex items-center justify-center bg-[var(--theme-bg-card)]">
                                                        <Upload size={22} className="text-[var(--theme-text-muted)]" />
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-muted)] block">{t('warehouse.docks.empty')}</span>
                                                        <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block mt-1">+ Load</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex flex-col p-4 z-10">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
                                                            <Truck size={20} className="text-primary" />
                                                        </div>
                                                        <button
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                if (!assignedJob) return;
                                                                if (!checkControlAccess('Dock release')) return;
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
                                                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] transition-colors touch-manipulation"
                                                            title="Return to Staging"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>

                                                    <div className="mb-3 flex justify-between items-start gap-1">
                                                        <div className="min-w-0">
                                                            <p className="text-[11px] text-primary font-mono font-medium tracking-wider uppercase mb-0.5 truncate">{formatJobId(assignedJob)}</p>
                                                            <p className="text-xs font-semibold text-[var(--theme-text-primary)] uppercase truncate">
                                                                {destSite ? destSite.name : 'In-Transport'}
                                                            </p>
                                                        </div>
                                                        {['super_admin', 'warehouse_manager'].includes(user?.role as string) && (
                                                            <button
                                                                onClick={(e) => handleDelete(e, assignedJob.id)}
                                                                className="w-7 h-7 rounded-lg bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-red-500 hover:text-white hover:bg-red-500 hover:border-red-500 transition-colors flex items-center justify-center shrink-0 touch-manipulation"
                                                                title="Delete Job"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                                        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl p-2 text-center">
                                                            <p className="text-[11px] text-[var(--theme-text-muted)] uppercase tracking-wider mb-0.5">Payload</p>
                                                            <p className="text-xs font-mono font-bold tabular-nums text-[var(--theme-text-primary)]">
                                                                {(assignedJob.lineItems?.length || 0) > 0
                                                                    ? assignedJob.lineItems.length
                                                                    : (assignedJob.items || 0)} Units
                                                            </p>
                                                        </div>
                                                        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl p-2 text-center">
                                                            <p className="text-[11px] text-[var(--theme-text-muted)] uppercase tracking-wider mb-0.5">Status</p>
                                                            <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">LOADED</p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-auto space-y-2.5" onClick={e => e.stopPropagation()}>
                                                        {/* Driver Assignment Type Toggle */}
                                                        <div className="flex bg-[var(--theme-bg-card)] border border-[var(--theme-border)] p-1 rounded-xl gap-1">
                                                            <button
                                                                onClick={async () => {
                                                                    if (!checkControlAccess('Delivery mode toggle')) return;
                                                                    try {
                                                                        await wmsJobsService.update(assignedJob.id, { 
                                                                            deliveryMethod: 'Internal', 
                                                                            externalCarrierName: null,
                                                                            assignedBy: user?.name || 'Unknown'
                                                                        } as any);
                                                                        if (assignedJob.orderRef) {
                                                                            const parentJob = jobs.find(j => (j.id === assignedJob.orderRef || j.jobNumber === assignedJob.orderRef) && j.type === 'TRANSFER');
                                                                            if (parentJob) {
                                                                                await wmsJobsService.update(parentJob.id, { deliveryMethod: 'Internal' } as any);
                                                                            }
                                                                        }
                                                                        await refreshData();
                                                                    } catch (err) {
                                                                        addNotification('alert', 'Toggle Failed');
                                                                    }
                                                                }}
                                                                className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-colors min-h-[32px] touch-manipulation ${assignedJob.deliveryMethod !== 'External' ? 'bg-primary text-white shadow-xs' : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]'}`}
                                                            >
                                                                INTERNAL
                                                            </button>
                                                            <button
                                                                onClick={async () => {
                                                                    if (!checkControlAccess('Delivery mode toggle')) return;
                                                                    try {
                                                                        await wmsJobsService.update(assignedJob.id, { 
                                                                            deliveryMethod: 'External', 
                                                                            assignedTo: null,
                                                                            assignedBy: user?.name || 'Unknown'
                                                                        } as any);
                                                                        if (assignedJob.orderRef) {
                                                                            const parentJob = jobs.find(j => (j.id === assignedJob.orderRef || j.jobNumber === assignedJob.orderRef) && j.type === 'TRANSFER');
                                                                            if (parentJob) {
                                                                                await wmsJobsService.update(parentJob.id, { deliveryMethod: 'External' } as any);
                                                                            }
                                                                        }
                                                                        await refreshData();
                                                                    } catch (err) {
                                                                        addNotification('alert', 'Toggle Failed');
                                                                    }
                                                                }}
                                                                className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-colors min-h-[32px] touch-manipulation ${assignedJob.deliveryMethod === 'External' ? 'bg-primary text-white shadow-xs' : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]'}`}
                                                            >
                                                                EXTERNAL
                                                            </button>
                                                        </div>

                                                        {/* Driver Assignment Input/Select */}
                                                        <div>
                                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                                <UserIcon size={12} className="text-[var(--theme-text-muted)]" />
                                                                <span className="text-[11px] text-[var(--theme-text-muted)] font-medium uppercase tracking-wider">
                                                                    {assignedJob.deliveryMethod === 'External' ? 'Courier / 3PL' : 'Driver'}
                                                                </span>
                                                            </div>
                                                            
                                                            {assignedJob.deliveryMethod === 'External' ? (
                                                                <div>
                                                                    <input
                                                                        type="text"
                                                                        list={`couriers-${assignedJob.id}`}
                                                                        placeholder="Courier name..."
                                                                        aria-label="External Courier Name"
                                                                        title="External Courier Name"
                                                                        defaultValue={assignedJob.externalCarrierName || ''}
                                                                        key={`carrier-${assignedJob.id}-${assignedJob.deliveryMethod}`}
                                                                        onBlur={async (e) => {
                                                                            if (!checkControlAccess('External carrier update')) return;
                                                                            const carrierName = e.target.value.trim();
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
                                                                        className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-2.5 py-1.5 text-xs text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-muted)] focus:outline-none focus:border-primary transition-colors min-h-[38px]"
                                                                    />
                                                                    <datalist id={`couriers-${assignedJob.id}`}>
                                                                        <option value="DHL Express" />
                                                                        <option value="FedEx / TNT" />
                                                                        <option value="EMS Ethiopia" />
                                                                        <option value="Aramex" />
                                                                        <option value="Local 3PL Freight" />
                                                                        <option value="External Private Driver" />
                                                                    </datalist>
                                                                </div>
                                                            ) : (
                                                                (() => {
                                                                    const targetSiteId = assignedJob.siteId || activeSite?.id;
                                                                    const siteDrivers = employees.filter(e => {
                                                                        const isDriverRole = ['driver', 'dispatcher'].includes(e.role?.toLowerCase() || '');
                                                                        const isActive = (e as any).status !== 'Inactive' && (e as any).status !== 'Terminated';
                                                                        const isSiteMatch = !e.siteId || e.siteId === targetSiteId;
                                                                        return isDriverRole && isActive && isSiteMatch;
                                                                    });

                                                                    return (
                                                                        <select
                                                                            title="Assign Warehouse Driver"
                                                                            aria-label="Assign Warehouse Driver"
                                                                            value={assignedJob.assignedTo || ''}
                                                                            onChange={async (e) => {
                                                                                if (!checkControlAccess('Driver assignment')) return;
                                                                                const driverId = e.target.value || null;
                                                                                try {
                                                                                    await wmsJobsService.update(assignedJob.id, { 
                                                                                        assignedTo: driverId,
                                                                                        assignedBy: user?.name || 'Unknown'
                                                                                    } as any);
                                                                                    await refreshData();
                                                                                    addNotification('success', `Assigned to Warehouse Driver`);
                                                                                } catch (err) {
                                                                                    addNotification('alert', 'Assignment Failed');
                                                                                }
                                                                            }}
                                                                            className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-2.5 py-1.5 text-xs text-[var(--theme-text-primary)] focus:outline-none focus:border-primary transition-colors min-h-[38px] cursor-pointer touch-manipulation"
                                                                        >
                                                                            <option value="" className="bg-[var(--theme-bg-card)]">Select Driver...</option>
                                                                            {siteDrivers.length === 0 ? (
                                                                                <option value="" disabled className="bg-[var(--theme-bg-card)]">No drivers found</option>
                                                                            ) : (
                                                                                siteDrivers.map(e => (
                                                                                    <option key={e.id} value={e.id} className="bg-[var(--theme-bg-card)]">{e.name} ({e.role.toUpperCase()})</option>
                                                                                ))
                                                                            )}
                                                                        </select>
                                                                    );
                                                                })()
                                                            )}
                                                        </div>

                                                        {['Packed', 'Staged'].includes(assignedJob.transferStatus || '') && (
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    if (!checkControlAccess('Departure controls')) return;
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
                                                                            await wmsJobsService.update(parentJob ? parentJob.id : assignedJob.orderRef, { 
                                                                                transferStatus: 'Shipped',
                                                                                assignedBy: user?.name || 'System'
                                                                            } as any);
                                                                        }
                                                                        await refreshData();
                                                                        addNotification('success', 'Shipment Departed');
                                                                    } catch (err) {
                                                                        addNotification('alert', 'Status Update Failed');
                                                                    }
                                                                }}
                                                                className="w-full min-h-[44px] bg-primary hover:bg-primary/90 text-white text-xs font-semibold uppercase tracking-wider py-2 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-[0.98] shadow-sm touch-manipulation"
                                                            >
                                                                <Navigation size={14} /> Mark Departure
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* STAGING AREA */}
                            <DocksOutboundStaging
                                stagingJobs={stagingJobs}
                                sites={sites}
                                employees={employees}
                                user={user}
                                jobs={jobs}
                                OUTBOUND_DOCKS={OUTBOUND_DOCKS}
                                findDockJob={findDockJob}
                                setSelectedJob={setSelectedJob}
                                setIsDetailsOpen={setIsDetailsOpen}
                                formatJobId={formatJobId}
                                handleDelete={handleDelete}
                                checkControlAccess={checkControlAccess}
                                wmsJobsService={wmsJobsService}
                                refreshData={refreshData}
                                addNotification={addNotification}
                                t={t}
                            />
                        </div>

                        {/* OUTBOUND SCHEDULE (Shipped / In-Transit) */}
                        <DocksOutboundDepartures
                            shippedJobs={shippedJobs}
                            sites={sites}
                            employees={employees}
                            user={user}
                            formatJobId={formatJobId}
                            handleDelete={handleDelete}
                            t={t}
                        />

                    </div>
                </>
            ) : (
                <div className="w-full mt-4">
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

            {/* Quick Dock Bay Assignment Modal */}
            <DockAssignModal
                isOpen={!!selectedEmptyDock}
                onClose={() => setSelectedEmptyDock(null)}
                targetDock={selectedEmptyDock}
                stagingJobs={stagingJobs}
                sites={sites}
                employees={employees}
                formatJobId={formatJobId}
                onAssignJobToDock={handleAssignJobToDock}
                isSubmitting={isAssigning}
            />
        </div>
    );
};
