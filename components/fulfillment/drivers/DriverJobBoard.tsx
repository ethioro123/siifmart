import React, { useMemo, useState, useEffect } from 'react';
import { Shield, RefreshCw, Zap, ArrowRight } from 'lucide-react';
import { WMSJob, Site, User } from '../../../types';
import Pagination from '../../shared/Pagination';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { useLanguage } from '../../../contexts/LanguageContext';
import { canWorkerPerformJob } from '../../../utils/fulfillmentRoles';

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
    const { t: contextT } = useLanguage();
    const finalT = t || contextT;
    const [dispatchCurrentPage, setDispatchCurrentPage] = useState(1); const DISPATCH_ITEMS_PER_PAGE = 6;
    const filteredDispatchJobs = useMemo(() => {
        const canSeeGlobalQueue = ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher'].includes((user?.role || '').toLowerCase());
        const currentEmployee = employees.find(e => (user?.email && e.email === user.email) || (user?.name && e.name?.toLowerCase() === user.name.toLowerCase()) || ((user as any)?.employeeId && e.id === (user as any).employeeId) || e.id === user?.id);
        const employeeId = currentEmployee?.id || user?.id;
        let baseJobs = filteredJobs.filter(j => {
            if (j.type !== 'DISPATCH' && j.type !== 'TRANSFER' && j.type !== 'DRIVER') return false;
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

    const [isExpanded, setIsExpanded] = useState(false);
    useEffect(() => { if (globalSearch) setIsExpanded(true); }, [globalSearch]);

    return (
        <div className="space-y-4 pt-4">
            <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex items-center justify-between p-3 sm:p-4 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl hover:bg-[var(--theme-bg-card)] transition-colors shadow-sm active:scale-[0.99] touch-manipulation min-h-[52px] gap-2">
                <div className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full bg-primary" /><span className="text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider">{finalT('warehouse.docks.availableMissions') || 'Available Missions'}</span></div>
                <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2.5 sm:px-3 py-1 rounded-full uppercase border border-primary/20 shrink-0 whitespace-nowrap">{finalT('warehouse.driverHub.availableCount').replace('{count}', String(filteredDispatchJobs.length))}</span>
            </button>
            {isExpanded && (
                <div className="space-y-4">
                    {paginatedDispatchJobs.length === 0 ? (
                        <div className="bg-[var(--theme-bg-subtle)] rounded-2xl p-8 border border-dashed border-[var(--theme-border)] text-center">
                            <Shield size={28} className="text-[var(--theme-text-muted)] mx-auto mb-3" />
                            <h3 className="text-xs font-semibold text-[var(--theme-text-muted)] uppercase tracking-wider">{finalT('warehouse.driverHub.noJobsAvailable')}</h3>
                        </div>
                    ) : (
                        paginatedDispatchJobs.map(job => {
                            const dest = sites.find(s => s.id === job.destSiteId); const source = sites.find(s => s.id === job.sourceSiteId || s.id === job.siteId); const isCritical = job.priority === 'Critical';
                            return (
                                <div key={job.id} onClick={() => { setSelectedJob(job); setIsDetailsOpen(true); }} className={`group border ${isCritical ? 'border-red-500/30' : 'border-[var(--theme-border)]'} rounded-2xl p-3.5 sm:p-5 bg-[var(--theme-bg-card)] cursor-pointer relative overflow-hidden shadow-sm active:scale-[0.99] transition-colors touch-manipulation`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${isCritical ? 'bg-red-500 animate-ping' : 'bg-primary'}`} /><p className="text-[11px] font-mono font-medium text-[var(--theme-text-secondary)] tracking-wider uppercase">{formatJobId(job)}</p></div>
                                        <div className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${isCritical ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-primary/10 text-primary border-primary/20'}`}>{job.priority}</div>
                                    </div>
                                    <div className="mb-4">
                                        <p className="text-[11px] text-[var(--theme-text-muted)] font-medium uppercase tracking-wider mb-1">{finalT('warehouse.driverHub.route')}</p>
                                        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--theme-text-primary)] uppercase leading-none min-w-0"><span className="truncate">{source?.name || finalT('warehouse.centralOpsArea')}</span><ArrowRight size={12} className="text-primary shrink-0" /><span className="truncate">{dest?.name || finalT('warehouse.driverHub.customer')}</span></div>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 pt-3 sm:pt-4 border-t border-[var(--theme-border)]">
                                        <div className="bg-[var(--theme-bg-subtle)] px-3 py-1.5 rounded-xl border border-[var(--theme-border)]"><span className="text-xs font-bold font-mono tabular-nums text-[var(--theme-text-primary)]">{job.items || 0}</span><span className="text-[11px] text-[var(--theme-text-muted)] ml-1.5 uppercase font-medium tracking-wider">{finalT('warehouse.driverHub.units')}</span></div>
                                        {job.assignedTo ? (
                                            <button disabled={processingJobIds.has(job.id)} onClick={async (e) => {
                                                e.stopPropagation(); const currentEmployee = employees.find(emp => (user?.email && emp.email === user.email) || (user?.name && emp.name?.toLowerCase() === user.name.toLowerCase()) || ((user as any)?.employeeId && emp.id === (user as any).employeeId) || emp.id === user?.id); const employeeId = currentEmployee?.id || user?.id;
                                                if (job.assignedTo !== employeeId) { addNotification('info', finalT('warehouse.driverHub.lockedMission')); return; }
                                                setProcessingJobIds(prev => new Set(prev).add(job.id));
                                                try {
                                                    await wmsJobsService.update(job.id, { status: 'In-Progress', transferStatus: 'In-Transit', shippedAt: new Date().toISOString() } as any);
                                                    if (job.orderRef) { const parentTransfer = jobs.find(j => j.id === job.orderRef && j.type === 'TRANSFER'); if (parentTransfer) await wmsJobsService.update(parentTransfer.id, { transferStatus: 'In-Transit' } as any); }
                                                    await refreshData(); addNotification('success', finalT('warehouse.driverHub.payloadSecure'));
                                                } catch (err) { addNotification('alert', finalT('warehouse.driverHub.cloudSyncFailed')); } finally { setProcessingJobIds(prev => { const next = new Set(prev); next.delete(job.id); return next; }); }
                                            }} className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 transition-colors bg-primary text-white hover:bg-primary/90 active:scale-[0.98] touch-manipulation">{processingJobIds.has(job.id) ? <RefreshCw className="animate-spin" size={14} /> : <Zap size={14} />} {finalT('warehouse.driverHub.pickup')}</button>
                                        ) : (
                                            <button onClick={async (e) => {
                                                e.stopPropagation(); const currentEmployee = employees.find(emp => (user?.email && emp.email === user.email) || (user?.name && emp.name?.toLowerCase() === user.name.toLowerCase()) || ((user as any)?.employeeId && emp.id === (user as any).employeeId) || emp.id === user?.id);
                                                if (!currentEmployee) { addNotification('alert', finalT('warehouse.driverHub.protocolFault')); return; }
                                                if (!canWorkerPerformJob(currentEmployee.role, job.type)) { addNotification('alert', 'Floor workers cannot accept delivery missions. Only verified drivers can perform deliveries.'); return; }
                                                const isInternal = !currentEmployee?.driverType || currentEmployee?.driverType === 'internal'; setProcessingJobIds(prev => new Set(prev).add(job.id));
                                                try { await wmsJobsService.update(job.id, { assignedTo: currentEmployee.id, status: isInternal ? 'In-Progress' : 'Pending' }); await refreshData(); addNotification('success', finalT('warehouse.driverHub.jobAccepted')); } catch (err) { addNotification('alert', finalT('warehouse.driverHub.jobAcceptFailed')); } finally { setProcessingJobIds(prev => { const next = new Set(prev); next.delete(job.id); return next; }); }
                                            }} className={`flex-1 min-h-[44px] py-2.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 transition-colors active:scale-[0.98] touch-manipulation ${isCritical ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-primary text-white hover:bg-primary/90'}`}>{processingJobIds.has(job.id) ? <RefreshCw className="animate-spin" size={14} /> : <Zap size={14} />} {finalT('warehouse.driverHub.acceptJob')}</button>
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
