import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, MapPin, Clock, List, ArrowRight, ChevronRight, Trash2 } from 'lucide-react';
import Pagination from '../../shared/Pagination';
import { SortDropdown, isUUID } from '../FulfillmentShared';
import { WMSJob, Employee, Site } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { useFulfillment } from '../FulfillmentContext';
import { useStore } from '../../../contexts/CentralStore';

/** Returns true when viewport < 768 px (md breakpoint). SSR-safe. */
function useIsMobile(): boolean {
    const [isMobile, setIsMobile] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth < 768 : false
    );
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        setIsMobile(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);
    return isMobile;
}

interface PickListProps {
    filteredPickJobs: WMSJob[];
    paginatedPickJobs: WMSJob[];
    pickSortBy: 'priority' | 'date' | 'items' | 'site';
    setPickSortBy: (val: 'priority' | 'date' | 'items' | 'site') => void;
    isPickSortDropdownOpen: boolean;
    setIsPickSortDropdownOpen: (val: boolean) => void;
    pickCurrentPage: number;
    setPickCurrentPage: (val: number) => void;
    pickJobsTotalPages: number;
    PICK_ITEMS_PER_PAGE: number;
    handleStartJob: (job: WMSJob) => void;
    sites: Site[];
    employees: Employee[];
    t: (key: string) => string;
}

export const PickList: React.FC<PickListProps> = ({
    filteredPickJobs,
    paginatedPickJobs,
    pickSortBy,
    setPickSortBy,
    isPickSortDropdownOpen,
    setIsPickSortDropdownOpen,
    pickCurrentPage,
    setPickCurrentPage,
    pickJobsTotalPages,
    PICK_ITEMS_PER_PAGE,
    handleStartJob,
    sites,
    employees,
    t
}) => {
    const { deleteJob } = useFulfillment();
    const { user } = useStore();
    const isMobile = useIsMobile();

    const handleDelete = async (e: React.MouseEvent, jobId: string) => {
        e.stopPropagation();
        if (window.confirm(t('warehouse.picking.jobDeleteConfirmPrompt'))) {
            await deleteJob(jobId);
        }
    };

    return (
        <>
            {/* Sort Controls */}
            <div className="flex justify-end px-1">
                <SortDropdown
                    label={t('warehouse.sortByLabel')}
                    options={[
                        { id: 'priority' as const, label: t('warehouse.prioritySort'), icon: <AlertTriangle size={12} /> },
                        { id: 'site' as const, label: t('warehouse.storeSort'), icon: <MapPin size={12} /> },
                        { id: 'date' as const, label: t('warehouse.timeSort'), icon: <Clock size={12} /> },
                        { id: 'items' as const, label: t('warehouse.sizeSort'), icon: <List size={12} /> }
                    ]}
                    value={pickSortBy}
                    onChange={(val) => setPickSortBy(val)}
                    isOpen={isPickSortDropdownOpen}
                    setIsOpen={setIsPickSortDropdownOpen}
                />
            </div>

            {/* Job Cards Grid */}
            <div className="flex-1 overflow-y-auto">
                {filteredPickJobs.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20 md:pb-0">
                            {paginatedPickJobs.sort((a, b) => {
                                switch (pickSortBy) {
                                    case 'priority': {
                                        const p: Record<string, number> = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Normal': 1, 'Low': 0 };
                                        return (p[b.priority] || 1) - (p[a.priority] || 1);
                                    }
                                    case 'date':
                                        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
                                    case 'items':
                                        return (b.lineItems?.length || 0) - (a.lineItems?.length || 0);
                                    case 'site': {
                                        const siteA = sites.find(s => s.id === a.destSiteId)?.name || '';
                                        const siteB = sites.find(s => s.id === b.destSiteId)?.name || '';
                                        return siteA.localeCompare(siteB);
                                    }
                                    default:
                                        return 0;
                                }
                            }).map(job => {
                                const lineItems = job.lineItems || (job as any).line_items || [];
                                const totalItems = lineItems.length;
                                const pickedItems = lineItems.filter((i: any) => i.status === 'Picked').length;
                                const progress = totalItems > 0 ? (pickedItems / totalItems) * 100 : 0;
                                const isCompleted = job.status === 'Completed';

                                // Conditional render for mobile
                                if (isMobile) {
                                    return (
                                        <div
                                            key={job.id}
                                            className={`flex items-center gap-3 bg-[var(--theme-bg-card)] border rounded-2xl p-3.5 min-h-[52px] active:scale-[0.98] transition-transform cursor-pointer shadow-sm ${
                                                job.priority === 'Critical' 
                                                    ? 'border-red-500/40' 
                                                    : job.status === 'In-Progress' 
                                                        ? 'border-[var(--theme-accent)]/50' 
                                                        : 'border-[var(--theme-border)]'
                                            }`}
                                            onClick={() => handleStartJob(job)}
                                        >
                                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xs font-bold font-mono shrink-0 border ${
                                                progress >= 100 
                                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
                                                    : 'bg-[var(--theme-accent)]/10 border-[var(--theme-accent)]/20 text-[var(--theme-accent)]'
                                            }`}>
                                                {Math.round(progress)}%
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-[var(--theme-text-primary)] font-mono tracking-wide uppercase truncate">
                                                        {formatJobId(job)}
                                                    </span>
                                                    {job.priority === 'Critical' && (
                                                        <span className="bg-red-500 text-white text-[11px] font-semibold px-1.5 py-0.5 rounded-full uppercase shrink-0">
                                                            !
                                                        </span>
                                                    )}
                                                    {job.status === 'In-Progress' && (
                                                        <span className="bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase border border-[var(--theme-accent)]/20 shrink-0">
                                                            Active
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-[11px] text-[var(--theme-text-secondary)] font-medium uppercase tracking-wider truncate mt-0.5 font-mono">
                                                    <span>{totalItems} {t('warehouse.itemPlural')}</span>
                                                    {lineItems[0]?.sku && (
                                                        <>
                                                            <span className="opacity-40">/</span>
                                                            <span className="truncate">{lineItems[0].sku}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <ChevronRight size={18} className="text-[var(--theme-text-secondary)] shrink-0" />
                                        </div>
                                    );
                                }

                                return (
                                    <div
                                        key={job.id}
                                        onClick={() => handleStartJob(job)}
                                        className={`bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] border rounded-2xl p-5 sm:p-6 transition-colors cursor-pointer flex flex-col justify-between ${
                                            job.priority === 'Critical' 
                                                ? 'border-red-500/30' 
                                                : job.status === 'In-Progress' 
                                                    ? 'border-[var(--theme-accent)]/50' 
                                                    : 'border-[var(--theme-border)]'
                                        }`}
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-4 w-full">
                                                <div className="flex-1 pr-3">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-sm font-bold text-[var(--theme-text-primary)] font-mono tracking-wide uppercase">
                                                            {formatJobId(job)}
                                                        </span>
                                                        {job.priority === 'Critical' && (
                                                            <div className="flex items-center gap-1 bg-red-500/10 text-red-500 text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider border border-red-500/20">
                                                                <AlertTriangle size={10} className="fill-current" />
                                                                {t('warehouse.urgentLabel')}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2 mt-2 font-mono">
                                                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[var(--theme-bg-subtle)] rounded-lg border border-[var(--theme-border)]">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-accent)]" />
                                                            <span className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">
                                                                {totalItems} {t('warehouse.itemPlural')}
                                                            </span>
                                                        </div>
                                                        <span className="text-[11px] text-[var(--theme-text-secondary)] opacity-40">/</span>
                                                        <span className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider truncate max-w-[90px]">
                                                            {lineItems[0]?.sku || t('warehouse.picking.noSKU')}
                                                        </span>
                                                        <span className="text-[11px] text-[var(--theme-text-secondary)] opacity-40">/</span>
                                                        <span className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">
                                                            {(() => {
                                                                const loc = (job as any).zone || job.location;
                                                                if (!loc) return t('warehouse.unassigned');
                                                                if (loc.toLowerCase().startsWith('zone')) return loc;
                                                                return `${t('warehouse.zonePrefix')} ${loc}`;
                                                            })()}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold whitespace-nowrap border uppercase tracking-wider ${
                                                        job.status === 'In-Progress'
                                                            ? 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border-[var(--theme-accent)]/20'
                                                            : job.priority === 'High'
                                                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                                : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)]'
                                                    }`}>
                                                        {job.status === 'In-Progress' ? t('warehouse.activeLabel') : job.priority}
                                                    </span>

                                                    {['super_admin', 'warehouse_manager', 'operations_manager', 'regional_manager'].includes(user?.role as string) && (
                                                        <button
                                                            onClick={(e) => handleDelete(e, job.id)}
                                                            className="w-8 h-8 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center shrink-0 min-h-[32px] min-w-[32px]"
                                                            title="Delete Job"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-3 mt-4">
                                                <div className="flex justify-between text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                                                    <span>{t('warehouse.putaway.progress')}</span>
                                                    <span className={`font-mono ${progress >= 100 ? 'text-emerald-500' : 'text-[var(--theme-accent)]'}`}>
                                                        {Math.round(progress)}%
                                                    </span>
                                                </div>

                                                <div className="w-full h-1.5 bg-[var(--theme-bg-subtle)] rounded-full overflow-hidden border border-[var(--theme-border)]">
                                                    <div
                                                        className={`h-full transition-all duration-500 ${progress >= 100 ? 'bg-emerald-500' : 'bg-[var(--theme-accent)]'}`}
                                                        style={{ width: `${Math.round(progress)}%` }}
                                                    />
                                                </div>

                                                <div className="flex items-center justify-between pt-1">
                                                    <div className="flex items-center gap-2">
                                                        {(() => {
                                                            const targetUserId = (isCompleted && (job.completedBy || (job as any).completed_by))
                                                                ? (job.completedBy || (job as any).completed_by)
                                                                : job.assignedTo;
                                                            const workerRoleLabel = (isCompleted || (job.completedBy || (job as any).completed_by))
                                                                ? (t('warehouse.completedBy') || 'Completed By')
                                                                : (t('warehouse.assignedTo') || 'Assigned To');

                                                            if (targetUserId) {
                                                                const employee = employees.find(e => e.id === targetUserId || e.name === targetUserId || e.email === targetUserId || e.code === targetUserId);
                                                                const displayId = employee?.code || (isUUID(targetUserId) ? targetUserId.slice(-4).toUpperCase() : '');
                                                                const displayName = employee?.name ? `${employee.name} (${displayId})` : (isUUID(targetUserId) ? `User (${displayId})` : `${targetUserId} (${displayId})`);
                                                                const displayInitial = (employee?.name || targetUserId).charAt(0).toUpperCase();

                                                                return (
                                                                    <>
                                                                        <div className="w-6 h-6 rounded-full bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 flex items-center justify-center shrink-0">
                                                                            <span className="text-[11px] font-bold text-[var(--theme-accent)] font-mono">{displayInitial}</span>
                                                                        </div>
                                                                        <div className="flex flex-col min-w-0">
                                                                            <span className="text-[10px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider leading-none">{workerRoleLabel}</span>
                                                                            <span className="text-xs text-[var(--theme-text-primary)] font-semibold truncate leading-tight">{displayName}</span>
                                                                        </div>
                                                                    </>
                                                                );
                                                            }

                                                            return (
                                                                <span className="text-xs text-[var(--theme-text-secondary)] italic">{t('warehouse.unassigned')}</span>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-[var(--theme-border)]">
                                            <button className="w-full py-2.5 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all min-h-[44px]">
                                                <span>{job.status === 'In-Progress' ? t('warehouse.continueArrow') : t('warehouse.startArrow')}</span>
                                                <ArrowRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {/* PICK Pagination Controls */}
                        <Pagination
                            currentPage={pickCurrentPage}
                            totalPages={pickJobsTotalPages}
                            totalItems={filteredPickJobs.length}
                            itemsPerPage={PICK_ITEMS_PER_PAGE}
                            onPageChange={setPickCurrentPage}
                            itemName="jobs"
                        />
                    </>
                ) : (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-16 bg-[var(--theme-bg-card)] rounded-2xl border border-dashed border-[var(--theme-border)] text-center m-4">
                        <div className="w-12 h-12 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center mb-3 text-[var(--theme-text-secondary)]">
                            <Package size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider">{t('warehouse.noPendingJobs')}</p>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] font-medium uppercase tracking-wider mt-1">
                                {t('warehouse.jobsAppearAfterReceive')}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};
