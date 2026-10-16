import React, { useMemo, useState, useEffect } from 'react';
import { MapPin, Navigation, Truck, CheckCircle, Shield } from 'lucide-react';
import { WMSJob, Site, User, Product } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import Pagination from '../../shared/Pagination';
import { PartialDeliveryModal } from './PartialDeliveryModal';

interface DriverActiveMissionProps {
    t: (key: string) => string; filteredJobs: WMSJob[]; employees: any[];
    user: User | null; sites: Site[]; jobs: WMSJob[]; products: Product[];
    setSelectedJob: (job: WMSJob | null) => void; setIsDetailsOpen: (val: boolean) => void;
    processingJobIds: Set<string>; setProcessingJobIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    wmsJobsService: any; refreshData: () => Promise<void>; refreshJobs?: () => void; addNotification: (type: string, message: string) => void;
    adjustStockMutation: any; addProduct: any; globalSearch: string;
}

export const DriverActiveMission: React.FC<DriverActiveMissionProps> = ({
    t, filteredJobs, employees, user, sites, jobs, products, setSelectedJob, setIsDetailsOpen, processingJobIds, setProcessingJobIds, wmsJobsService, refreshData, refreshJobs, addNotification, adjustStockMutation, addProduct, globalSearch
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;
    const [partialDeliveryJob, setPartialDeliveryJob] = useState<WMSJob | null>(null);

    useEffect(() => {
        setCurrentPage(1);
    }, [globalSearch]);

    const myJobs = useMemo(() => {
        const canSeeGlobalQueue = ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher'].includes((user?.role || '').toLowerCase());
        const currentEmployee = employees.find(e => (user?.email && e.email === user.email) || (user?.name && e.name?.toLowerCase() === user.name.toLowerCase()) || ((user as any)?.employeeId && e.id === (user as any).employeeId) || e.id === user?.id);
        const employeeId = currentEmployee?.id || user?.id;
        const result = filteredJobs.filter(j => {
            if (j.type !== 'DISPATCH' && j.type !== 'TRANSFER' && j.type !== 'DRIVER') return false;
            if (j.status === 'Cancelled' || j.transferStatus === 'Cancelled' || j.transferStatus === 'Rejected') return false;

            // Suppress parent TRANSFER if a child DISPATCH exists
            if (j.type === 'TRANSFER') {
                const hasChildDispatch = filteredJobs.some(d =>
                    d.type === 'DISPATCH' &&
                    (d.orderRef === j.id || d.orderRef === j.jobNumber) &&
                    d.status !== 'Cancelled'
                );
                if (hasChildDispatch) return false;
            }

            if (canSeeGlobalQueue ? !j.assignedTo : j.assignedTo !== employeeId) return false;
            if (j.status === 'Completed' || j.transferStatus === 'Delivered' || j.transferStatus === 'Received') return false;
            return (j.transferStatus === 'In-Transit' || j.transferStatus === 'Shipped');
        });
        const query = globalSearch.toLowerCase().trim();
        if (!query) return result;
        return result.filter(j => formatJobId(j).toLowerCase().includes(query) || sites.find(s => s.id === j.destSiteId)?.name?.toLowerCase().includes(query) || j.trackingNumber?.toLowerCase().includes(query));
    }, [filteredJobs, employees, user, globalSearch, sites]);

    const totalPages = Math.ceil(myJobs.length / ITEMS_PER_PAGE);
    const paginatedJobs = useMemo(() => myJobs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE), [myJobs, currentPage]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-semibold text-[var(--theme-text-secondary)] flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[var(--theme-primary)]" />
                    {t('warehouse.docks.currentMission') || 'Active Mission'}
                </h4>
            </div>

            {myJobs.length === 0 ? (
                <div className="bg-[var(--theme-bg-subtle)] border border-dashed border-[var(--theme-border)] rounded-2xl p-8 text-center">
                    <div className="w-12 h-12 bg-[var(--theme-bg-card)] rounded-2xl flex items-center justify-center mx-auto mb-3 border border-[var(--theme-border)]"><Shield className="text-[var(--theme-text-muted)]" size={24} /></div>
                    <p className="text-xs text-[var(--theme-text-muted)] font-medium">{globalSearch ? t('warehouse.archiveEmpty') : t('warehouse.driverHub.noActiveJob')}</p>
                </div>
            ) : (
                <div className="space-y-2 sm:space-y-4">
                    {paginatedJobs.map((job, idx) => {
                        const destSite = sites.find(s => s.id === job.destSiteId); const isPending = job.status === 'Pending'; const isFirst = idx === 0 && !isPending;
                        return (
                            <div key={job.id} className={`group rounded-xl sm:rounded-2xl transition-colors border shadow-xs ${isPending ? 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] opacity-60' : isFirst ? 'bg-[var(--theme-bg-card)] border-[var(--theme-primary)]/40 ring-1 ring-[var(--theme-primary)]/20' : 'bg-[var(--theme-bg-card)] border-[var(--theme-border)]'}`}>
                                <div className="p-2.5 sm:p-4 flex flex-col gap-2 sm:gap-3">
                                    {/* Stop Header */}
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-1.5 sm:gap-2">
                                            <span className="px-2 py-0.2 sm:px-2.5 sm:py-0.5 rounded-full bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] text-[10px] sm:text-xs font-semibold border border-[var(--theme-primary)]/20">
                                                {t('warehouse.driverHub.stop')} {idx + 1}
                                            </span>
                                            <span className="text-[10px] sm:text-xs font-mono font-medium text-[var(--theme-text-secondary)]">#{formatJobId(job)}</span>
                                        </div>
                                        <span className="px-2 py-0.2 sm:px-2.5 sm:py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] border-[var(--theme-primary)]/20">
                                            {job.transferStatus === 'In-Transit' || job.transferStatus === 'Shipped' ? t('warehouse.driverHub.inTransit') : t('warehouse.active')}
                                        </span>
                                    </div>

                                    {/* Destination & Address */}
                                    <div onClick={() => { setSelectedJob(job); setIsDetailsOpen(true); }} className="cursor-pointer hover:opacity-80 transition-opacity min-w-0">
                                        <h3 className="text-xs sm:text-base font-semibold text-[var(--theme-text-primary)] leading-tight tracking-tight truncate">{destSite?.name || t('warehouse.driverHub.customer')}</h3>
                                        <div className="flex items-start gap-1 text-[var(--theme-text-secondary)] mt-0.5 sm:mt-1">
                                            <MapPin size={12} className="mt-0.5 shrink-0 text-[var(--theme-primary)] sm:w-3.5 sm:h-3.5" />
                                            <p className="text-[10px] sm:text-xs leading-relaxed truncate">
                                                {destSite?.address || t('warehouse.driverHub.addressPending')}{job.location ? ` • ${job.location}` : ''}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Simplified Mobile-Friendly Manifest */}
                                    {(() => {
                                        const lineItems = job.lineItems || (job as any).line_items || [];
                                        if (lineItems.length === 0) return null;
                                        return (
                                            <div className="p-2 sm:p-3 bg-[var(--theme-bg-subtle)] rounded-lg sm:rounded-xl border border-[var(--theme-border)]">
                                                <div className="flex flex-wrap gap-1 sm:gap-1.5">
                                                    {lineItems.slice(0, 3).map((item: any, idxItem: number) => {
                                                        const qty = item.expectedQty || item.packedQty || item.pickedQty || item.quantity || 1;
                                                        return (
                                                            <span key={idxItem} className="inline-flex items-center gap-1 bg-[var(--theme-bg-card)] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs text-[var(--theme-text-secondary)] font-medium border border-[var(--theme-border)] max-w-[140px] sm:max-w-[170px] truncate">
                                                                <span className="truncate">{item.name || item.sku}</span>
                                                                <span className="font-bold font-mono tabular-nums text-[var(--theme-text-primary)] shrink-0">x{qty}</span>
                                                            </span>
                                                        );
                                                    })}
                                                    {lineItems.length > 3 && (
                                                        <span className="inline-flex items-center bg-[var(--theme-bg-card)] px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs text-[var(--theme-primary)] font-semibold border border-[var(--theme-primary)]/20">
                                                            + {lineItems.length - 3} {t('warehouse.driverHub.more')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Actions & Driver Info */}
                                    <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 pt-1.5 sm:pt-2 border-t border-[var(--theme-border)]">
                                        {(() => {
                                            const canSeeGlobalQueue = ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher'].includes((user?.role || '').toLowerCase());
                                            if (canSeeGlobalQueue && job.assignedTo) {
                                                const assignedEmployee = employees.find(e => e.id === job.assignedTo);
                                                return (
                                                    <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-medium text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-[var(--theme-border)] shrink-0">
                                                        <Truck size={12} className="text-[var(--theme-primary)] sm:w-3.5 sm:h-3.5" />
                                                        <span>{t('warehouse.driverFallback')}: {assignedEmployee?.name || 'Self'}</span>
                                                    </div>
                                                );
                                            }
                                            return <div />;
                                        })()}

                                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                            {(job.transferStatus === 'In-Transit' || job.transferStatus === 'Shipped') && (
                                                <button onClick={(e) => { e.stopPropagation(); if (destSite?.address) window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destSite.address)}`, '_blank'); else addNotification('info', t('warehouse.driverHub.addressPending')); }} className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 min-h-[34px] sm:min-h-[44px] bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-lg sm:rounded-xl text-xs font-semibold text-[var(--theme-text-primary)] flex items-center justify-center gap-1 sm:gap-1.5 transition-all shadow-xs active:scale-[0.98] touch-manipulation">
                                                    <Navigation size={12} className="text-[var(--theme-primary)] sm:w-3.5 sm:h-3.5" />
                                                    {t('warehouse.driverHub.nav')}
                                                </button>
                                            )}
                                            {(job.transferStatus === 'In-Transit' || job.transferStatus === 'Shipped') ? (
                                                (() => {
                                                    const currentEmp = employees.find(e => (user?.email && e.email === user.email) || (user?.name && e.name?.toLowerCase() === user.name.toLowerCase()) || ((user as any)?.employeeId && e.id === (user as any).employeeId) || e.id === user?.id);
                                                    const empId = currentEmp?.id || user?.id;
                                                    const isAssigned = !job.assignedTo || job.assignedTo === empId || job.assignedTo === user?.id;
                                                    const isManagerRole = ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager'].includes((user?.role || '').toLowerCase());
                                                    const canComplete = isAssigned || isManagerRole;

                                                    if (!canComplete) {
                                                        return (
                                                            <button
                                                                disabled
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="px-3 sm:px-4 py-1.5 sm:py-2 min-h-[34px] sm:min-h-[44px] bg-[var(--theme-bg-subtle)] text-[var(--theme-text-muted)] border border-[var(--theme-border)] rounded-lg sm:rounded-xl text-xs font-semibold flex items-center justify-center gap-1 sm:gap-1.5 cursor-not-allowed opacity-60"
                                                                title="Only the assigned driver can complete this mission"
                                                            >
                                                                <CheckCircle size={12} className="sm:w-3.5 sm:h-3.5" /> Assigned Driver Only
                                                            </button>
                                                        );
                                                    }

                                                    return (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setPartialDeliveryJob(job); }}
                                                            className="px-3 sm:px-5 py-1.5 sm:py-2 min-h-[34px] sm:min-h-[44px] bg-[var(--theme-primary)] hover:opacity-90 text-[var(--theme-primary-text)] rounded-lg sm:rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.98] transition-all touch-manipulation cursor-pointer"
                                                        >
                                                            <CheckCircle size={14} className="sm:w-[15px] sm:h-[15px]" /> {t('warehouse.driverHub.completeDeliveryBtn') || 'Complete Delivery'}
                                                        </button>
                                                    );
                                                })()
                                            ) : (
                                                <div className="py-1.5 sm:py-2 px-2.5 sm:px-3.5 min-h-[34px] sm:min-h-[44px] bg-emerald-500/10 border border-emerald-500/20 rounded-lg sm:rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                                                    <CheckCircle size={14} className="sm:w-[15px] sm:h-[15px]" /> {t('warehouse.driverHub.completedCaps') || 'Success'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {myJobs.length > ITEMS_PER_PAGE && <div className="mt-4"><Pagination currentPage={currentPage} totalPages={totalPages} totalItems={myJobs.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} isLoading={false} itemName="Missions" /></div>}
                </div>
            )}

            {/* Partial Delivery Modal */}
            {partialDeliveryJob && (
                <PartialDeliveryModal
                    t={t}
                    isOpen={!!partialDeliveryJob}
                    onClose={() => setPartialDeliveryJob(null)}
                    job={partialDeliveryJob}
                    user={user}
                    products={products}
                    sites={sites}
                    wmsJobsService={wmsJobsService}
                    adjustStockMutation={adjustStockMutation}
                    addProduct={addProduct}
                    addNotification={addNotification as any}
                    refreshData={refreshData}
                    refreshJobs={refreshJobs}
                    jobs={jobs}
                />
            )}
        </div>
    );
};
