import React, { useMemo, useState, useEffect } from 'react';
import { Shield, RefreshCw, Zap } from 'lucide-react';
import { WMSJob, Site, User } from '../../../types';
import Pagination from '../../shared/Pagination';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { useLanguage } from '../../../contexts/LanguageContext';

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
    }, [filteredJobs, globalSearch, sites]);

    const dispatchTotalPages = Math.ceil(filteredDispatchJobs.length / DISPATCH_ITEMS_PER_PAGE);
    const paginatedDispatchJobs = useMemo(() => filteredDispatchJobs.slice((dispatchCurrentPage - 1) * DISPATCH_ITEMS_PER_PAGE, dispatchCurrentPage * DISPATCH_ITEMS_PER_PAGE), [filteredDispatchJobs, dispatchCurrentPage]);
    useEffect(() => { setDispatchCurrentPage(prev => Math.min(prev, Math.max(1, dispatchTotalPages))); }, [dispatchTotalPages]);

    const [isExpanded, setIsExpanded] = useState(false);
    useEffect(() => { if (globalSearch) setIsExpanded(true); }, [globalSearch]);

    return (
        <div className="space-y-4 pt-4">
            <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all shadow-sm active:scale-[0.98]">
                <div className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)] animate-pulse" /><span className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-widest italic">{finalT('warehouse.docks.availableMissions') || 'Available Missions'}</span></div>
                <span className="text-[9px] font-black text-yellow-600 dark:text-yellow-500 bg-yellow-500/10 dark:bg-yellow-500/10 px-3 py-1 rounded-full uppercase border border-yellow-500/20">{filteredDispatchJobs.length} Available</span>
            </button>
            {isExpanded && (
                <div className="space-y-5">
                    {paginatedDispatchJobs.length === 0 ? (
                        <div className="bg-gray-50 dark:bg-black/20 rounded-2xl p-8 border-2 border-dashed border-gray-200 dark:border-white/10 text-center shadow-inner">
                            <Shield size={28} className="text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                            <h3 className="text-[10px] font-black text-gray-400 dark:text-white uppercase tracking-widest italic">All Quiet on the Front</h3>
                        </div>
                    ) : (
                        paginatedDispatchJobs.map(job => {
                            const dest = sites.find(s => s.id === job.destSiteId); const source = sites.find(s => s.id === job.sourceSiteId || s.id === job.siteId); const isCritical = job.priority === 'Critical';
                            const progress = 0;
                            return (
                                <div key={job.id} onClick={() => { setSelectedJob(job); setIsDetailsOpen(true); }} className={`group border-2 ${isCritical ? 'border-red-500/20 shadow-red-500/5' : 'border-gray-100 dark:border-white/10'} rounded-[2rem] p-6 bg-white dark:bg-white/5 cursor-pointer relative overflow-hidden shadow-sm active:scale-[0.98] transition-all`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${isCritical ? 'bg-red-500 animate-ping' : 'bg-yellow-500'}`} /><p className="text-[10px] font-black text-gray-500 dark:text-gray-400 tracking-widest uppercase">{formatJobId(job)}</p></div>
                                        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border ${isCritical ? 'bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20' : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/20'}`}>{job.priority}</div>
                                    </div>
                                    <div className="mb-5">
                                        <p className="text-[9px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest mb-1.5 italic">Payload Route</p>
                                        <div className="flex items-center gap-3 text-xs font-black text-gray-900 dark:text-white uppercase leading-none italic"><span>{source?.name || 'Central'}</span><span className="text-cyan-500">→</span><span>{dest?.name || 'Client'}</span></div>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 pt-4 border-t-2 border-gray-50 dark:border-white/5">
                                        <div className="bg-gray-100 dark:bg-black/40 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/5 shadow-inner"><span className="text-[10px] font-black text-gray-900 dark:text-white">{job.items || 0}</span><span className="text-[8px] text-gray-400 dark:text-gray-500 ml-1.5 uppercase font-bold tracking-widest">Units</span></div>
                                        {job.assignedTo ? (
                                            <button disabled={processingJobIds.has(job.id)} onClick={async (e) => {
                                                e.stopPropagation(); const currentEmployee = employees.find(emp => (user?.email && emp.email === user.email) || (user?.name && emp.name?.toLowerCase() === user.name.toLowerCase()) || ((user as any)?.employeeId && emp.id === (user as any).employeeId) || emp.id === user?.id); const employeeId = currentEmployee?.id || user?.id;
                                                if (job.assignedTo !== employeeId) { addNotification('info', 'Locked mission.'); return; }
                                                setProcessingJobIds(prev => new Set(prev).add(job.id));
                                                try {
                                                    await wmsJobsService.update(job.id, { status: 'In-Progress', transferStatus: 'In-Transit', shippedAt: new Date().toISOString() } as any);
                                                    if (job.orderRef) { const parentTransfer = jobs.find(j => j.id === job.orderRef && j.type === 'TRANSFER'); if (parentTransfer) await wmsJobsService.update(parentTransfer.id, { transferStatus: 'In-Transit' } as any); }
                                                    await refreshData(); addNotification('success', 'Payload secure. Departing.');
                                                } catch (err) { addNotification('alert', 'Comm link error.'); } finally { setProcessingJobIds(prev => { const next = new Set(prev); next.delete(job.id); return next; }); }
                                            }} className="flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-xl bg-purple-600 dark:bg-purple-600 text-white active:scale-95">{processingJobIds.has(job.id) ? <RefreshCw className="animate-spin" size={14} /> : <Zap size={14} />} PICKUP</button>
                                        ) : (
                                            <button onClick={async (e) => {
                                                e.stopPropagation(); const currentEmployee = employees.find(emp => (user?.email && emp.email === user.email) || (user?.name && emp.name?.toLowerCase() === user.name.toLowerCase()) || ((user as any)?.employeeId && emp.id === (user as any).employeeId) || emp.id === user?.id);
                                                if (!currentEmployee) { addNotification('alert', 'Protocol fault. Identify profile.'); return; }
                                                const isInternal = !currentEmployee?.driverType || currentEmployee?.driverType === 'internal'; setProcessingJobIds(prev => new Set(prev).add(job.id));
                                                try { await wmsJobsService.update(job.id, { assignedTo: currentEmployee.id, status: isInternal ? 'In-Progress' : 'Pending' }); await refreshData(); addNotification('success', 'Mission Accepted.'); } catch (err) { addNotification('alert', 'Auth failed.'); } finally { setProcessingJobIds(prev => { const next = new Set(prev); next.delete(job.id); return next; }); }
                                            }} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-xl active:scale-95 ${isCritical ? 'bg-red-600 text-white' : 'bg-yellow-500 hover:bg-yellow-400 text-black'}`}>{processingJobIds.has(job.id) ? <RefreshCw className="animate-spin" size={14} /> : <Zap size={14} />} ACCEPT</button>
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
