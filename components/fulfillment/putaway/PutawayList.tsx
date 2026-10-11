import React, { useState, useEffect } from 'react';
import { Box, Zap, UserIcon, Lock, RefreshCw, Play, Info, Archive, Clock, Package, MapPin, User, ChevronRight, Loader2, Trash2 } from 'lucide-react';

import { WMSJob, Employee } from '../../../types';
import Pagination from '../../shared/Pagination';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { isUUID } from '../FulfillmentShared';
import Protected from '../../Protected';
import { useFulfillment } from '../FulfillmentContext';

interface PutawayListProps {
    sortedPutawayJobs: WMSJob[];
    paginatedPutawayJobs: WMSJob[];
    putawayCurrentPage: number;
    putawayTotalPages: number;
    setPutawayCurrentPage: (page: number) => void;
    putawayItemsPerPage: number;
    resolveOrderRef: (ref?: string) => string;
    selectedJob: WMSJob | null;
    setSelectedJob: (job: WMSJob | null) => void;
    employees: Employee[];
    user: any;
    isSubmitting: boolean;
    setIsSubmitting: (val: boolean) => void;
    handleStartJob: (job: WMSJob) => void;
    onShowDetails: (job: WMSJob) => void;
    t: (key: string) => string;
}

export const PutawayList: React.FC<PutawayListProps> = ({
    sortedPutawayJobs,
    paginatedPutawayJobs,
    putawayCurrentPage,
    putawayTotalPages,
    setPutawayCurrentPage,
    putawayItemsPerPage,
    resolveOrderRef,
    selectedJob,
    setSelectedJob,
    employees,
    user,
    isSubmitting,
    setIsSubmitting,
    handleStartJob,
    onShowDetails,
    t
}) => {
    const { deleteJob } = useFulfillment();

    const handleDelete = async (e: React.MouseEvent, jobId: string) => {
        e.stopPropagation();
        if (window.confirm(t('warehouse.putaway.deleteJobConfirm'))) {
            await deleteJob(jobId);
        }
    };

    if (sortedPutawayJobs.length === 0) {
        return (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center space-y-4 rounded-2xl border border-dashed border-[var(--theme-border)] bg-[var(--theme-bg-card)]">
                <div className="w-14 h-14 rounded-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-secondary)]">
                    <Box size={28} />
                </div>
                <div>
                    <p className="text-[var(--theme-text-primary)] font-semibold uppercase tracking-wider text-sm">{t('warehouse.putaway.noJobsFound')}</p>
                    <p className="text-[var(--theme-text-secondary)] font-medium text-xs mt-1">{t('warehouse.putaway.noJobsMatchingFilters')}</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedPutawayJobs.map(job => {
                    const completedItems = job.lineItems?.filter(item => item.status === 'Completed').length || 0;
                    const progress = job.lineItems ? (completedItems / job.lineItems.length) * 100 : 0;
                    const isCritical = job.priority === 'Critical';
                    const isJobDone = job.status === 'Completed';
                    const workerId = isJobDone ? (job.completedBy || (job as any).completed_by || job.assignedTo) : job.assignedTo;
                    const workerLabel = isJobDone ? (t('warehouse.completedBy') || 'Completed By') : (t('warehouse.assignedTo') || 'Assigned To');

                    return (
                        <div key={job.id} className={`group p-4 sm:p-5 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] relative overflow-hidden transition-all shadow-[var(--shadow-sm)] ${isCritical ? 'border-red-500/40' : ''}`}>
                            <div className="flex justify-between items-start mb-4 sm:mb-6 relative z-10">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <span className="text-base font-bold text-[var(--theme-text-primary)] tracking-wide uppercase font-mono">{formatJobId(job)}</span>
                                        {job.orderRef && (
                                            <span className="text-[11px] text-[var(--theme-text-secondary)] font-medium border-l border-[var(--theme-border)] pl-2.5 font-mono">
                                                Ref: {resolveOrderRef(job.orderRef)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 font-mono">
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--theme-bg-subtle)] rounded-lg border border-[var(--theme-border)]">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <span className="text-[11px] text-[var(--theme-text-primary)] font-semibold uppercase tracking-wider">
                                                {job.items} {t('warehouse.items')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--theme-bg-subtle)] rounded-lg border border-[var(--theme-border)]">
                                            <MapPin size={12} className="text-[var(--theme-text-secondary)]" />
                                            <span className="text-[11px] text-[var(--theme-text-primary)] font-semibold uppercase tracking-wider truncate max-w-[100px] sm:max-w-[120px]">
                                                {(() => {
                                                    const loc = (job as any).zone || job.location;
                                                    if (!loc) return t('warehouse.putaway.unassigned');
                                                    if (loc.toLowerCase().startsWith('zone')) return loc.toUpperCase();
                                                    return `ZONE ${loc}`.toUpperCase();
                                                })()}
                                            </span>
                                        </div>
                                        {isCritical && (
                                            <div className="flex items-center gap-1 px-2.5 py-1 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-[11px] font-semibold rounded-lg uppercase tracking-wider">
                                                <Zap size={11} className="fill-current" />
                                                {t('warehouse.priority')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 ml-3">
                                    <Protected permission="ASSIGN_TASKS">
                                        <button
                                            onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                                            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors min-h-[40px] min-w-[40px] ${selectedJob?.id === job.id
                                                ? 'bg-[var(--theme-text-primary)] border-[var(--theme-text-primary)] text-[var(--theme-bg-card)]'
                                                : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)]'
                                                }`}
                                            aria-label={t('warehouse.putaway.assignUser')}
                                        >
                                            <UserIcon size={16} />
                                        </button>
                                    </Protected>
                                    {['super_admin', 'warehouse_manager'].includes(user?.role) && (
                                        <button
                                            onClick={(e) => handleDelete(e, job.id)}
                                            className="w-10 h-10 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-red-500 hover:bg-red-500/10 transition-colors flex items-center justify-center min-h-[40px] min-w-[40px]"
                                            title="Delete Job"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4 relative z-10">
                                <div>
                                    <div className="flex justify-between text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] mb-2">
                                        <span>{t('warehouse.putaway.putawayProgress')}</span>
                                        <span className={`font-mono ${progress === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--theme-text-primary)]'}`}>{Math.round(progress)}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-[var(--theme-bg-subtle)] rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-[width] duration-500 rounded-full ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                            ref={(el) => { if (el) el.style.width = `${Math.round(progress)}%`; }}
                                        />
                                    </div>
                                </div>
                                    
                                <div className="flex items-center justify-between border-t border-[var(--theme-border)] pt-4">
                                    <div>
                                        {workerId ? (
                                            (() => {
                                                const employee = employees.find(e => e.id === workerId || e.name === workerId || e.email === workerId);
                                                const displayId = employee?.code || (isUUID(workerId) ? workerId.slice(-4).toUpperCase() : '');
                                                const displayName = employee?.name ? `${employee.name} (${displayId})` : (isUUID(workerId) ? `User (${displayId})` : `${workerId} (${displayId})`);
                                                const displayInitial = (employee?.name || workerId).charAt(0).toUpperCase();

                                                return (
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-9 h-9 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] flex items-center justify-center shrink-0">
                                                            <span className="text-xs font-bold">{displayInitial}</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-[11px] font-medium text-[var(--theme-text-secondary)] uppercase tracking-wider mb-0.5">{workerLabel}</p>
                                                            <p className="text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-tight">{displayName}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })()
                                        ) : (
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                                    <User size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-medium text-[var(--theme-text-secondary)] uppercase tracking-wider mb-0.5">{workerLabel}</p>
                                                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-tight">{t('warehouse.putaway.unassigned')}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <p className="text-[11px] font-medium text-[var(--theme-text-secondary)] uppercase tracking-wider mb-0.5">{t('warehouse.putaway.registered')}</p>
                                        <div className="flex items-center gap-1.5 text-[var(--theme-text-primary)]">
                                            <Clock size={12} className="text-[var(--theme-text-secondary)]" />
                                            <span className="text-xs font-semibold font-mono">
                                                {(() => {
                                                    const date = new Date(job.createdAt || '');
                                                    const now = new Date();
                                                    const diffInMins = Math.floor((now.getTime() - date.getTime()) / 60000);
                                                    if (diffInMins < 1) return 'JUST NOW';
                                                    if (diffInMins < 60) return `${diffInMins}M AGO`;
                                                    const diffInHours = Math.floor(diffInMins / 60);
                                                    if (diffInHours < 24) return `${diffInHours}H AGO`;
                                                    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }).toUpperCase();
                                                })()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => onShowDetails(job)}
                                    disabled={isSubmitting}
                                    className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm min-h-[48px]"
                                >
                                    {isSubmitting ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <>
                                            {t('warehouse.putaway.storeReceivedGoods')}
                                            <ChevronRight size={16} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="col-span-full pt-6 border-t border-[var(--theme-border)]">
                <Pagination
                    currentPage={putawayCurrentPage}
                    totalPages={putawayTotalPages}
                    totalItems={sortedPutawayJobs.length}
                    itemsPerPage={putawayItemsPerPage}
                    onPageChange={setPutawayCurrentPage}
                    itemName="putaway jobs"
                    className="col-span-full"
                />
            </div>
        </>
    );
};
