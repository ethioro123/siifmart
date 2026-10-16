import React, { useState, useMemo } from 'react';
import { History as HistoryIcon, Search, Package, Archive, Undo2, UserCheck } from 'lucide-react';
import Pagination from '../../shared/Pagination';
import { WMSJob, Site, Product } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { formatDateTime } from '../../../utils/formatting';
import { formatDisplayEmployeeId } from '../../../utils/employeeIdGenerator';
import { ReturnToWarehouseModal } from '../returns/ReturnToWarehouseModal';
import { resolveFulfillmentWorker } from '../../../utils/fulfillmentUserResolver';

interface DriversHistoryProps {
    t: (key: string) => string;
    historicalJobs: WMSJob[]; sites: Site[]; employees: any[]; resolveOrderRef: (ref: string | undefined) => string;
    setSelectedJob: (job: WMSJob) => void; setIsDetailsOpen: (isOpen: boolean) => void;
    products: Product[]; user: any; addNotification: (type: string, message: string) => void;
    inventoryRequestsService: any; wmsJobsService?: any; jobs?: WMSJob[];
}

const ITEMS_PER_PAGE = 20;

export const DriversHistory: React.FC<DriversHistoryProps> = ({
    t,
    historicalJobs, sites, employees = [], resolveOrderRef, setSelectedJob, setIsDetailsOpen, products, user, addNotification, inventoryRequestsService, wmsJobsService, jobs = []
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [returnJob, setReturnJob] = useState<WMSJob | null>(null);

    const currentEmployee = useMemo(() => employees.find(e => (user?.email && e.email === user.email) || (user?.name && e.name?.toLowerCase() === user.name.toLowerCase()) || ((user as any)?.employeeId && e.id === (user as any).employeeId) || e.id === user?.id), [employees, user]);
    const filteredHistory = useMemo(() => {
        const canSeeGlobalQueue = ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher'].includes((user?.role || '').toLowerCase());
        const employeeId = currentEmployee?.id || user?.id;
        
        const filteredByTypeAndRole = historicalJobs.filter((j: WMSJob) => {
            const isTypeMatch = (j.type === 'DISPATCH' || j.type === 'TRANSFER' || j.type === 'DRIVER');
            if (!isTypeMatch) return false;
            if (j.status === 'Cancelled' || j.transferStatus === 'Cancelled' || j.transferStatus === 'Rejected') return false;
            if (j.type === 'TRANSFER') {
                const hasChildDispatch = historicalJobs.some(d =>
                    d.type === 'DISPATCH' && (d.orderRef === j.id || d.orderRef === j.jobNumber) && d.status !== 'Cancelled'
                );
                if (hasChildDispatch) return false;
            }
            const isRoleMatch = canSeeGlobalQueue ? true : j.assignedTo === employeeId;
            return isRoleMatch;
        });

        const mapped = filteredByTypeAndRole.map(j => {
            const rawUserId = j.completedBy || (j as any).completed_by || j.assignedTo || (j as any).assigned_to;
            const resolvedWorker = resolveFulfillmentWorker({
                userId: rawUserId,
                job: j,
                employees,
                sites,
                currentUser: user,
                siteId: j.siteId || (j as any).site_id
            });

            return {
                ...j,
                resolvedUser: {
                    name: resolvedWorker.name,
                    displayId: resolvedWorker.code || resolvedWorker.displayId
                }
            };
        });

        if (!searchQuery) {
            return mapped;
        }

        const q = searchQuery.toLowerCase();
        return mapped.filter(j => {
            const cleanJobId = formatJobId(j).toLowerCase();
            const orderRefStr = (j.orderRef || '').toLowerCase();
            const orderRefResolvedStr = resolveOrderRef ? resolveOrderRef(j.orderRef).toLowerCase() : '';
            const workerName = (j.resolvedUser?.name || '').toLowerCase();
            const workerId = (j.resolvedUser?.displayId || '').toLowerCase();
            const noteStr = (j.notes || '').toLowerCase();
            const statusStr = (j.status || '').toLowerCase();
            const jobNum = (j.jobNumber || (j as any).job_number || '').toLowerCase();

            // Search product names and SKUs
            const items = j.lineItems || (j as any).line_items || [];
            const matchesItems = items.some((item: any) => 
                (item.name || '').toLowerCase().includes(q) ||
                (item.productName || '').toLowerCase().includes(q) ||
                (item.sku || '').toLowerCase().includes(q)
            );

            return (
                cleanJobId.includes(q) ||
                j.id.toLowerCase().includes(q) ||
                orderRefStr.includes(q) ||
                orderRefResolvedStr.includes(q) ||
                workerName.includes(q) ||
                workerId.includes(q) ||
                noteStr.includes(q) ||
                statusStr.includes(q) ||
                jobNum.includes(q) ||
                matchesItems
            );
        });
    }, [historicalJobs, searchQuery, resolveOrderRef, currentEmployee, employees, user]);

    const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
    const paginatedHistory = useMemo(() => filteredHistory.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE), [filteredHistory, currentPage]);

    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-6 mb-6 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] border border-[var(--theme-primary)]/20 flex items-center justify-center shrink-0">
                        <HistoryIcon size={18} />
                    </div>
                    <div>
                        <h4 className="text-base sm:text-lg font-bold text-[var(--theme-text-primary)] tracking-tight">{t('warehouse.driverHub.jobHistory')}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--theme-primary)]" />
                            <p className="text-xs text-[var(--theme-text-secondary)] font-medium">{t('warehouse.driverHub.pastAssignments')}</p>
                        </div>
                    </div>
                </div>
                <div className="relative w-full sm:w-80">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] pointer-events-none">
                        <Search size={16} />
                    </div>
                    <input
                        type="text"
                        placeholder={t('warehouse.driverHub.searchHistory')}
                        aria-label={t('warehouse.driverHub.searchHistory')}
                        title={t('warehouse.driverHub.searchHistory')}
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-primary)] focus:ring-1 focus:ring-[var(--theme-primary)]/20 transition-colors placeholder:text-[var(--theme-text-muted)] min-h-[44px]"
                    />
                </div>
            </div>

            <div className="space-y-3">
                {paginatedHistory.length > 0 ? (
                    <div className="space-y-3">
                        {paginatedHistory.map((job: any) => {
                            const destSite = sites.find(s => s.id === job.destSiteId);
                            return (
                                <div
                                    key={job.id}
                                    onClick={() => { setSelectedJob(job); setIsDetailsOpen(true); }}
                                    className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-6 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] border border-[var(--theme-border)] hover:border-[var(--theme-primary)]/30 rounded-2xl p-4 transition-colors cursor-pointer shadow-xs w-full min-h-[52px] touch-manipulation"
                                >
                                    <div className="w-full md:w-44 flex flex-col justify-center shrink-0">
                                        <span className="text-xs font-mono font-semibold text-[var(--theme-primary)]">#{formatJobId(job)}</span>
                                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">{formatDateTime(job.updatedAt || job.createdAt)}</p>
                                    </div>

                                    <div className="hidden md:block h-10 w-px bg-[var(--theme-border)]" />

                                    <div className="flex-1 flex items-center gap-3 min-w-0 w-full">
                                        <div className="w-8 h-8 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center justify-center shrink-0">
                                            <Package size={16} className="text-[var(--theme-text-muted)]" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[11px] text-[var(--theme-text-secondary)] font-medium mb-0.5">{t('warehouse.driverHub.destination')}</p>
                                            <h6 className="text-sm font-semibold text-[var(--theme-text-primary)] tracking-tight truncate">{destSite?.name || t('warehouse.driverHub.customer')}</h6>
                                            <div className="flex items-center gap-1.5 mt-1 text-xs text-[var(--theme-text-secondary)]">
                                                <UserCheck size={13} className="text-[var(--theme-primary)] shrink-0" />
                                                <span className="truncate">
                                                    Delivered By: {job.resolvedUser?.name || 'Driver'}{job.resolvedUser?.displayId ? ` (${job.resolvedUser.displayId})` : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-[var(--theme-border)] pt-2.5 md:pt-0 mt-1 md:mt-0">
                                        <div className="text-left md:text-right">
                                            <p className="text-[11px] text-[var(--theme-text-secondary)] font-medium mb-0.5">{t('warehouse.driverHub.totalItems')}</p>
                                            <div className="flex items-center gap-1.5 justify-start md:justify-end">
                                                <span className="text-base font-bold font-mono tabular-nums text-[var(--theme-text-primary)]">{job.items || 0}</span>
                                                <span className="text-xs text-[var(--theme-text-secondary)]">{t('warehouse.driverHub.units')}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{t('warehouse.driverHub.delivered')}</span>
                                        </div>

                                        {job.status === 'Completed' && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setReturnJob(job); }}
                                                className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 px-3.5 py-2 rounded-xl border border-amber-500/20 transition-all text-amber-600 dark:text-amber-400 shadow-xs active:scale-[0.98] min-h-[44px] touch-manipulation font-semibold text-xs"
                                            >
                                                <Undo2 size={14} />
                                                <span>{t('warehouse.driverHub.return')}</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-[var(--theme-bg-subtle)] rounded-2xl border border-dashed border-[var(--theme-border)]">
                        <div className="p-4 bg-[var(--theme-bg-card)] rounded-2xl w-fit mx-auto mb-3 border border-[var(--theme-border)]">
                            <Archive className="text-[var(--theme-text-muted)]" size={32} />
                        </div>
                        <h3 className="text-sm font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider">{t('warehouse.driverHub.logEmpty')}</h3>
                        <p className="text-[11px] text-[var(--theme-text-muted)] uppercase tracking-wider mt-1">{t('warehouse.driverHub.archiveEmpty')}</p>
                    </div>
                )}
                {filteredHistory.length > ITEMS_PER_PAGE && (
                    <div className="pt-4">
                        <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredHistory.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} isLoading={false} itemName="records" />
                    </div>
                )}
            </div>
            {returnJob && <ReturnToWarehouseModal job={returnJob} products={products} user={user} onClose={() => setReturnJob(null)} addNotification={addNotification} inventoryRequestsService={inventoryRequestsService} wmsJobsService={wmsJobsService} jobs={jobs} />}
        </div>
    );
};
