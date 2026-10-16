import React, { useMemo, useState, useEffect } from 'react';
import { Shield, RefreshCw, Zap, ArrowRight, ChevronDown, ChevronUp, Truck, ChevronRight } from 'lucide-react';
import { WMSJob, Site, User } from '../../../types';
import Pagination from '../../shared/Pagination';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { useLanguage } from '../../../contexts/LanguageContext';
import { canWorkerPerformJob } from '../../../utils/fulfillmentRoles';
import { useIsMobile } from '../../../hooks/useIsMobile';

interface DriverJobBoardProps {
    t?: (key: string) => string;
    filteredJobs: WMSJob[]; sites: Site[]; employees: any[]; user: User | null;
    setSelectedJob: (job: WMSJob | null) => void; setIsDetailsOpen: (val: boolean) => void;
    processingJobIds: Set<string>; setProcessingJobIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    wmsJobsService: any; refreshData: () => Promise<void>; addNotification: (type: string, message: string) => void;
    globalSearch: string; jobs: WMSJob[];
}

export const DriverJobBoard: React.FC<DriverJobBoardProps> = ({
    t, filteredJobs, sites, employees, user, setSelectedJob, setIsDetailsOpen, processingJobIds, setProcessingJobIds, wmsJobsService, refreshData, addNotification, globalSearch, jobs
}) => {
    const isMobile = useIsMobile();
    const { t: contextT } = useLanguage();
    const finalT = t || contextT;
    const [dispatchCurrentPage, setDispatchCurrentPage] = useState(1); const DISPATCH_ITEMS_PER_PAGE = 6;
    const filteredDispatchJobs = useMemo(() => {
        const canSeeGlobalQueue = ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher'].includes((user?.role || '').toLowerCase());
        const currentEmployee = employees.find(e => (user?.email && e.email === user.email) || (user?.name && e.name?.toLowerCase() === user.name.toLowerCase()) || ((user as any)?.employeeId && e.id === (user as any).employeeId) || e.id === user?.id);
        const employeeId = currentEmployee?.id || user?.id;
        let baseJobs = filteredJobs.filter(j => {
            if (j.type !== 'DISPATCH' && j.type !== 'TRANSFER' && j.type !== 'DRIVER') return false;
            if (j.status === 'Cancelled' || j.transferStatus === 'Cancelled' || j.transferStatus === 'Rejected') return false;

            // If it's a TRANSFER, suppress it if a child DISPATCH job exists, and only allow if packed/ready
            if (j.type === 'TRANSFER') {
                const hasChildDispatch = filteredJobs.some(d =>
                    d.type === 'DISPATCH' &&
                    (d.orderRef === j.id || d.orderRef === j.jobNumber) &&
                    d.status !== 'Cancelled'
                );
                if (hasChildDispatch) return false;

                const isReadyToShip = ['Packed', 'Approved', 'Ready', 'In-Transit', 'Shipped'].includes(j.transferStatus || '');
                if (!isReadyToShip) return false;
            }

            const isUnassigned = !j.assignedTo && j.status === 'Pending';
            const isNotPickedUp = j.transferStatus !== 'In-Transit' && j.transferStatus !== 'Shipped' && j.transferStatus !== 'Delivered' && j.transferStatus !== 'Received' && j.status !== 'Completed';
            return isUnassigned || (j.assignedTo === employeeId && isNotPickedUp) || (canSeeGlobalQueue && j.assignedTo && isNotPickedUp);
        });
        if (globalSearch) { const query = globalSearch.toLowerCase().trim(); baseJobs = baseJobs.filter(j => formatJobId(j).toLowerCase().includes(query) || sites.find(s => s.id === j.destSiteId)?.name?.toLowerCase().includes(query) || sites.find(s => s.id === j.sourceSiteId || s.id === j.siteId)?.name?.toLowerCase().includes(query) || j.trackingNumber?.toLowerCase().includes(query)); }
        return baseJobs;
    }, [filteredJobs, globalSearch, sites, employees, user]);

    const dispatchTotalPages = Math.ceil(filteredDispatchJobs.length / DISPATCH_ITEMS_PER_PAGE);
    const paginatedDispatchJobs = useMemo(() => filteredDispatchJobs.slice((dispatchCurrentPage - 1) * DISPATCH_ITEMS_PER_PAGE, dispatchCurrentPage * DISPATCH_ITEMS_PER_PAGE), [filteredDispatchJobs, dispatchCurrentPage]);
    useEffect(() => { setDispatchCurrentPage(prev => Math.min(prev, Math.max(1, dispatchTotalPages))); }, [dispatchTotalPages]);

    const [isExpanded, setIsExpanded] = useState(true);
    useEffect(() => { if (globalSearch) setIsExpanded(true); }, [globalSearch]);

    return (
        <div className="space-y-2 sm:space-y-4 pt-2 sm:pt-4">
            <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex items-center justify-between p-2 sm:p-4 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl sm:rounded-2xl hover:bg-[var(--theme-bg-card)] transition-colors shadow-xs active:scale-[0.99] touch-manipulation min-h-[38px] sm:min-h-[52px] gap-2 cursor-pointer">
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[var(--theme-primary)]" />
                    <span className="text-xs font-semibold text-[var(--theme-text-primary)]">{finalT('warehouse.docks.availableMissions') || 'Available Missions'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--theme-primary)] bg-[var(--theme-primary)]/10 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border border-[var(--theme-primary)]/20 shrink-0 whitespace-nowrap">
                        {finalT('warehouse.driverHub.availableCount').replace('{count}', String(filteredDispatchJobs.length))}
                    </span>
                    {isExpanded ? <ChevronUp size={15} className="text-[var(--theme-text-muted)] shrink-0" /> : <ChevronDown size={15} className="text-[var(--theme-text-muted)] shrink-0" />}
                </div>
            </button>
            {isExpanded && (
                <div className="space-y-2 sm:space-y-4">
                    {paginatedDispatchJobs.length === 0 ? (
                        <div className="bg-[var(--theme-bg-subtle)] rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-dashed border-[var(--theme-border)] text-center">
                            <Shield size={24} className="text-[var(--theme-text-muted)] mx-auto mb-2 sm:mb-3" />
                            <h3 className="text-xs font-medium text-[var(--theme-text-muted)]">{finalT('warehouse.driverHub.noJobsAvailable')}</h3>
                        </div>
                    ) : (
                        paginatedDispatchJobs.map(job => {
                            const dest = sites.find(s => s.id === job.destSiteId); 
                            const source = sites.find(s => s.id === job.sourceSiteId || s.id === job.siteId); 
                            const isCritical = job.priority === 'Critical';
                            const totalUnits = (job.lineItems && Array.isArray(job.lineItems) && job.lineItems.length > 0)
                                ? job.lineItems.reduce((sum: number, it: any) => sum + (it.packedQty || it.expectedQty || it.quantity || it.pickedQty || 1), 0)
                                : (job.items || (job as any).items_count || 0);

                            if (isMobile) {
                                return (
                                    <div
                                        key={job.id}
                                        onClick={() => { setSelectedJob(job); setIsDetailsOpen(true); }}
                                        className={`flex items-center gap-2 p-2.5 rounded-xl bg-[var(--theme-bg-card)] border transition-all cursor-pointer touch-manipulation active:scale-[0.99] min-h-[48px] shadow-xs ${
                                            isCritical 
                                                ? 'border-red-500/40' 
                                                : 'border-[var(--theme-border)]'
                                        }`}
                                    >
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold font-mono shrink-0 border ${
                                            isCritical 
                                                ? 'bg-red-500/10 border-red-500/30 text-red-500' 
                                                : 'bg-[var(--theme-primary)]/10 border-[var(--theme-primary)]/20 text-[var(--theme-primary)]'
                                        }`}>
                                            <Truck size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-bold text-[var(--theme-text-primary)] font-mono tracking-wide uppercase truncate">
                                                    #{formatJobId(job)}
                                                </span>
                                                {isCritical && (
                                                    <span className="bg-red-500 text-white text-[10px] font-semibold px-1 rounded-full uppercase shrink-0">
                                                        !
                                                    </span>
                                                )}
                                                <span className="text-[10px] font-medium text-[var(--theme-text-secondary)] font-mono ml-auto mr-1 shrink-0">
                                                    {totalUnits} {finalT('warehouse.driverHub.units')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] text-[var(--theme-text-secondary)] font-medium uppercase tracking-wider truncate mt-0.5">
                                                <span className="truncate">{source?.name || finalT('warehouse.centralOpsArea')}</span>
                                                <ArrowRight size={10} className="shrink-0 text-[var(--theme-text-secondary)]" />
                                                <span className="truncate">{dest?.name || finalT('warehouse.driverHub.customer')}</span>
                                            </div>
                                        </div>
                                        <ChevronRight size={15} className="text-[var(--theme-text-secondary)] shrink-0" />
                                    </div>
                                );
                            }

                            return (
                                <div key={job.id} onClick={() => { setSelectedJob(job); setIsDetailsOpen(true); }} className={`group border ${isCritical ? 'border-red-500/30 ring-1 ring-red-500/20' : 'border-[var(--theme-border)]'} rounded-2xl p-4 sm:p-5 bg-[var(--theme-bg-card)] cursor-pointer relative overflow-hidden shadow-xs active:scale-[0.99] transition-all touch-manipulation`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${isCritical ? 'bg-red-500 animate-ping' : 'bg-[var(--theme-primary)]'}`} />
                                            <p className="text-xs font-mono font-medium text-[var(--theme-text-secondary)]">#{formatJobId(job)}</p>
                                        </div>
                                        <div className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${isCritical ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] border-[var(--theme-primary)]/20'}`}>{job.priority}</div>
                                    </div>
                                    <div className="mb-4">
                                        <p className="text-xs text-[var(--theme-text-secondary)] font-medium mb-1">{finalT('warehouse.driverHub.route')}</p>
                                        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--theme-text-primary)] leading-none min-w-0">
                                            <span className="truncate">{source?.name || finalT('warehouse.centralOpsArea')}</span>
                                            <ArrowRight size={13} className="text-[var(--theme-primary)] shrink-0" />
                                            <span className="truncate">{dest?.name || finalT('warehouse.driverHub.customer')}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 pt-3 sm:pt-4 border-t border-[var(--theme-border)]">
                                        <div className="bg-[var(--theme-bg-subtle)] px-3 py-1.5 rounded-xl border border-[var(--theme-border)]">
                                            <span className="text-xs font-bold font-mono tabular-nums text-[var(--theme-text-primary)]">{totalUnits}</span>
                                            <span className="text-xs text-[var(--theme-text-secondary)] ml-1.5 font-medium">{finalT('warehouse.driverHub.units')}</span>
                                        </div>
                                        {job.assignedTo ? (
                                            <button disabled={processingJobIds.has(job.id)} onClick={async (e) => {
                                                e.stopPropagation(); const currentEmployee = employees.find(emp => (user?.email && emp.email === user.email) || (user?.name && emp.name?.toLowerCase() === user.name.toLowerCase()) || ((user as any)?.employeeId && emp.id === (user as any).employeeId) || emp.id === user?.id); const employeeId = currentEmployee?.id || user?.id;
                                                if (job.assignedTo !== employeeId) { addNotification('info', finalT('warehouse.driverHub.lockedMission')); return; }
                                                setProcessingJobIds(prev => new Set(prev).add(job.id));
                                                try {
                                                    await wmsJobsService.update(job.id, { status: 'In-Progress', transferStatus: 'In-Transit', shippedAt: new Date().toISOString() } as any);
                                                    if (job.orderRef) { const parentTransfer = jobs.find(j => (j.id === job.orderRef || j.jobNumber === job.orderRef) && j.type === 'TRANSFER'); if (parentTransfer) await wmsJobsService.update(parentTransfer.id, { transferStatus: 'In-Transit', shippedAt: new Date().toISOString() } as any); }
                                                    await refreshData(); addNotification('success', finalT('warehouse.driverHub.payloadSecure'));
                                                } catch (err) { addNotification('alert', finalT('warehouse.driverHub.cloudSyncFailed')); } finally { setProcessingJobIds(prev => { const next = new Set(prev); next.delete(job.id); return next; }); }
                                            }} className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all bg-[var(--theme-primary)] text-[var(--theme-primary-text)] hover:opacity-90 shadow-sm active:scale-[0.98] touch-manipulation cursor-pointer">{processingJobIds.has(job.id) ? <RefreshCw className="animate-spin" size={14} /> : <Zap size={14} />} {finalT('warehouse.driverHub.pickup')}</button>
                                        ) : (
                                            <button onClick={async (e) => {
                                                e.stopPropagation(); const currentEmployee = employees.find(emp => (user?.email && emp.email === user.email) || (user?.name && emp.name?.toLowerCase() === user.name.toLowerCase()) || ((user as any)?.employeeId && emp.id === (user as any).employeeId) || emp.id === user?.id);
                                                if (!currentEmployee) { addNotification('alert', finalT('warehouse.driverHub.protocolFault')); return; }
                                                if (!canWorkerPerformJob(currentEmployee.role, job.type)) { addNotification('alert', 'Floor workers cannot accept delivery missions. Only verified drivers can perform deliveries.'); return; }
                                                const isInternal = !currentEmployee?.driverType || currentEmployee?.driverType === 'internal'; setProcessingJobIds(prev => new Set(prev).add(job.id));
                                                try { 
                                                    await wmsJobsService.update(job.id, { assignedTo: currentEmployee.id, status: isInternal ? 'In-Progress' : 'Pending' }); 
                                                    if (job.orderRef) {
                                                        const parentTransfer = jobs.find(j => (j.id === job.orderRef || j.jobNumber === job.orderRef) && j.type === 'TRANSFER');
                                                        if (parentTransfer) {
                                                            await wmsJobsService.update(parentTransfer.id, { assignedTo: currentEmployee.id });
                                                        }
                                                    }
                                                    await refreshData(); 
                                                    addNotification('success', finalT('warehouse.driverHub.jobAccepted')); 
                                                } catch (err) { 
                                                    addNotification('alert', finalT('warehouse.driverHub.jobAcceptFailed')); 
                                                } finally { 
                                                    setProcessingJobIds(prev => { const next = new Set(prev); next.delete(job.id); return next; }); 
                                                }
                                            }} className={`flex-1 min-h-[44px] py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98] touch-manipulation cursor-pointer ${isCritical ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] hover:opacity-90 shadow-sm'}`}>{processingJobIds.has(job.id) ? <RefreshCw className="animate-spin" size={14} /> : <Zap size={14} />} {finalT('warehouse.driverHub.acceptJob')}</button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    {filteredDispatchJobs.length > 0 && <Pagination currentPage={dispatchCurrentPage} totalPages={dispatchTotalPages} totalItems={filteredDispatchJobs.length} itemsPerPage={DISPATCH_ITEMS_PER_PAGE} onPageChange={setDispatchCurrentPage} isLoading={false} itemName="missions" />}
                </div>
            )}
        </div>
    );
};
