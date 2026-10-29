import React, { useState, useEffect } from 'react';
import { Box, Zap, UserIcon, Lock, RefreshCw, Play, Info, Archive, Clock, Package, MapPin, User, ChevronRight, Loader2 } from 'lucide-react';

import { WMSJob, Employee } from '../../../types';
import Pagination from '../../shared/Pagination';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { isUUID } from '../FulfillmentShared';
import Protected from '../../Protected';
import { useIsMobile } from '../../../hooks/useIsMobile';

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
    t: (key: string, params?: Record<string, string | number>) => string;
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
    const isMobile = useIsMobile();

    if (sortedPutawayJobs.length === 0) {
        return (
            <div className="col-span-full flex flex-col items-center justify-center py-6 sm:py-16 text-center space-y-2 sm:space-y-4 rounded-xl sm:rounded-2xl border border-dashed border-[var(--theme-border)] bg-[var(--theme-bg-card)]">
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-secondary)]">
                    <Box size={20} className="sm:w-7 sm:h-7" />
                </div>
                <div>
                    <p className="text-[var(--theme-text-primary)] font-semibold uppercase tracking-wider text-xs sm:text-sm">{t('warehouse.putaway.noJobsFound')}</p>
                    <p className="text-[var(--theme-text-secondary)] font-medium text-[11px] sm:text-xs mt-0.5 sm:mt-1">{t('warehouse.putaway.noJobsMatchingFilters')}</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                {paginatedPutawayJobs.map(job => {
                    const completedItems = job.lineItems?.filter(item => item.status === 'Completed').length || 0;
                    const progress = job.lineItems ? (completedItems / job.lineItems.length) * 100 : 0;
                    const isCritical = job.priority === 'Critical';
                    const isJobDone = job.status === 'Completed';
                    const workerId = isJobDone ? (job.completedBy || (job as any).completed_by || job.assignedTo) : job.assignedTo;
                    const workerLabel = isJobDone ? (t('warehouse.completedBy') || 'Completed By') : (t('warehouse.assignedTo') || 'Assigned To');

                    if (isMobile) {
                        return (
                            <button
                                type="button"
                                aria-label={`Open putaway job ${formatJobId(job)}`}
                                key={job.id}
                                className={`w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] flex items-center gap-2.5 bg-[var(--theme-bg-card)] border rounded-xl p-2.5 min-h-[48px] active:scale-[0.98] transition-transform cursor-pointer shadow-xs ${
                                    isCritical
                                        ? 'border-[var(--theme-status-danger-border)]'
                                        : job.status === 'In-Progress'
                                            ? 'border-[var(--theme-accent)]/60 bg-[var(--theme-accent)]/5 ring-1 ring-[var(--theme-accent)]/20'
                                            : 'border-[var(--theme-border)]'
                                }`}
                                onClick={() => onShowDetails(job)}
                            >
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold font-mono shrink-0 border ${
                                    progress >= 100
                                        ? 'bg-[var(--theme-status-success-bg)] border-[var(--theme-status-success-border)] text-[var(--theme-status-success-text)]'
                                        : 'bg-[var(--theme-accent)]/10 border-[var(--theme-accent)]/20 text-[var(--theme-accent)]'
                                }`}>
                                    {Math.round(progress)}%
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-[var(--theme-text-primary)] font-mono tracking-wide uppercase truncate">
                                            {formatJobId(job)}
                                        </span>
                                        {isCritical && (
                                            <span className="bg-[var(--theme-status-danger-bg)] text-white text-[10px] font-semibold px-1 rounded-full uppercase shrink-0">
                                                !
                                            </span>
                                        )}
                                        {job.status === 'In-Progress' && (
                                            <span className="inline-flex items-center gap-1 bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] text-[10px] font-semibold px-1.5 py-0.2 rounded-full uppercase border border-[var(--theme-accent)]/20 shrink-0">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-accent)]" />
                                                {t('warehouse.putaway.active') || 'Active'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-[var(--theme-text-secondary)] font-medium uppercase tracking-wider truncate mt-0.5 font-mono">
                                        <span>{job.items || job.lineItems?.length || 0} {t('warehouse.items') || 'items'}</span>
                                        <span className="opacity-40">•</span>
                                        <span className="truncate">{((job as any).zone || job.location || 'ZONE A').toUpperCase()}</span>
                                    </div>
                                </div>
                                <ChevronRight size={15} className="text-[var(--theme-text-secondary)] shrink-0" />
                            </button>
                        );
                    }

                    return (
                        <div key={job.id} className={`group p-4 sm:p-5 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] relative overflow-hidden transition-all shadow-[var(--shadow-sm)] ${isCritical ? 'border-[var(--theme-status-danger-border)]' : ''}`}>
                            <div className="flex justify-between items-start mb-4 sm:mb-6 relative z-10">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <span className="text-base font-bold text-[var(--theme-text-primary)] tracking-wide uppercase font-mono">{formatJobId(job)}</span>
                                        {job.orderRef && (
                                            <span className="text-[11px] text-[var(--theme-text-secondary)] font-medium border-l border-[var(--theme-border)] pl-2.5 font-mono">
                                                {t('warehouse.ref') || 'Ref'}: {resolveOrderRef(job.orderRef)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 font-mono">
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--theme-bg-subtle)] rounded-lg border border-[var(--theme-border)]">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--theme-status-success-bg)]" />
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
                                            <div className="flex items-center gap-1 px-2.5 py-1 bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)] text-[11px] font-semibold rounded-lg uppercase tracking-wider">
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
                                </div>
                            </div>

                            <div className="space-y-4 relative z-10">
                                <div>
                                    <div className="flex justify-between text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] mb-2">
                                        <span>{t('warehouse.putaway.putawayProgress')}</span>
                                        <span className={`font-mono ${progress === 100 ? 'text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]' : 'text-[var(--theme-text-primary)]'}`}>{Math.round(progress)}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-[var(--theme-bg-subtle)] rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-[width] duration-500 rounded-full ${progress === 100 ? 'bg-[var(--theme-status-success-bg)]' : 'bg-[var(--theme-status-info-bg)]'}`}
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
                                                <div className="w-9 h-9 rounded-xl bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] flex items-center justify-center">
                                                    <User size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-medium text-[var(--theme-text-secondary)] uppercase tracking-wider mb-0.5">{workerLabel}</p>
                                                    <p className="text-xs font-semibold text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] uppercase tracking-tight">{t('warehouse.putaway.unassigned')}</p>
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
                                                    if (diffInMins < 1) return t('warehouse.justNow') || 'JUST NOW';
                                                    if (diffInMins < 60) return t('warehouse.minutesAgo', { count: diffInMins }) || `${diffInMins}M AGO`;
                                                    const diffInHours = Math.floor(diffInMins / 60);
                                                    if (diffInHours < 24) return t('warehouse.hoursAgo', { count: diffInHours }) || `${diffInHours}H AGO`;
                                                    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }).toUpperCase();
                                                })()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => onShowDetails(job)}
                                    disabled={isSubmitting}
                                    className="w-full h-12 rounded-xl bg-[var(--theme-status-info-bg)] bg-[var(--theme-status-info-bg)] text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm min-h-[48px]"
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
                    itemName={t('warehouse.putawayJobs') || 'putaway jobs'}
                    className="col-span-full"
                />
            </div>
        </>
    );
};
