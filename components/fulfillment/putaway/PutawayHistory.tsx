import React, { useState, useMemo, useEffect } from 'react';
import { History as HistoryIcon, Search, Box, MapPin, PackageCheck } from 'lucide-react';
import Pagination from '../../shared/Pagination';
import { WMSJob } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { formatDisplayEmployeeId } from '../../../utils/employeeIdGenerator';
import { getSellUnit } from '../../../utils/units';
import { useStore } from '../../../contexts/CentralStore';
import { resolveFulfillmentWorker } from '../../../utils/fulfillmentUserResolver';

interface PutawayHistoryProps {
    historicalJobs: WMSJob[];
    resolveOrderRef: (ref?: string) => string;
    setSelectedJob: (job: any) => void;
    setIsDetailsOpen: (open: boolean) => void;
    employees: any[];
    sites?: any[];
    t: (key: string, params?: Record<string, string | number>) => string;
}

const ITEMS_PER_PAGE = 12;
const ITEMS_PER_PAGE_MOBILE = 2;

export const PutawayHistory: React.FC<PutawayHistoryProps> = ({
    historicalJobs,
    resolveOrderRef,
    setSelectedJob,
    setIsDetailsOpen,
    employees,
    sites = [],
    t
}) => {
    const { user } = useStore();
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        setIsMobile(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    const perPage = isMobile ? ITEMS_PER_PAGE_MOBILE : ITEMS_PER_PAGE;

    const filteredHistory = useMemo(() => {
        const mapped = historicalJobs
            .filter((j: WMSJob) => j.type === 'PUTAWAY' || j.type === 'REPLENISH')
            .map(j => {
                const item = j.lineItems?.[0];
                const rawUserId = j.completedBy || (j as any).completed_by || j.assignedTo || (j as any).assigned_to;
                const resolvedWorker = resolveFulfillmentWorker({
                    userId: rawUserId,
                    job: j,
                    employees,
                    sites,
                    currentUser: user,
                    siteId: j.siteId || (j as any).site_id
                });

                const resolvedUser = {
                    name: resolvedWorker.name,
                    displayId: resolvedWorker.code || resolvedWorker.displayId
                };

                const isRealBay = (loc?: string) => loc && loc !== 'Receiving Dock' && loc !== 'Unknown' && loc !== 'Unassigned';
                const itemBay = j.lineItems?.find(li => isRealBay(li.location))?.location;
                const jobBay = isRealBay((j as any).location) ? (j as any).location : undefined;
                const resolvedLocation = itemBay || jobBay || 'Archive';

                let displayQty = '';
                if (item) {
                    const baseQty = item.expectedQty || item.quantity || 0;
                    const unitDef = getSellUnit(item.unit);
                    const sizeNum = parseFloat((item as any).size || '') || 0;
                    if ((unitDef.category === 'weight' || unitDef.category === 'volume') && sizeNum > 0) {
                        displayQty = `${baseQty} × ${sizeNum}${unitDef.shortLabel.toLowerCase()}`;
                    } else {
                        displayQty = `${baseQty}${unitDef.code !== 'UNIT' ? ' ' + unitDef.shortLabel.toUpperCase() : ' ' + t('warehouse.itemPlural')}`;
                    }
                } else {
                    displayQty = `${j.items || 1} ${t('warehouse.itemPlural')}`;
                }

                return {
                    id: j.id,
                    reference: formatJobId(j),
                    type: j.type === 'REPLENISH' ? 'REPLENISH' : 'PUTAWAY',
                    actionType: j.type === 'REPLENISH' ? t('warehouse.tabs.replenish') : t('warehouse.putaway.putaway'),
                    status: j.status,
                    subtitle: item?.name || 'Unknown Product',
                    date: j.completedAt || j.updatedAt || j.createdAt || new Date().toISOString(),
                    resolvedUser,
                    items: j.items || 1,
                    sku: item?.sku,
                    quantity: item?.expectedQty || 0,
                    location: resolvedLocation,
                    rawData: j,
                    displayQty
                };
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return mapped.filter(item => {
            if (!search) return true;
            const q = search.toLowerCase();
            const raw = item.rawData;

            const matchesItems = (raw.lineItems || raw.line_items || []).some((li: any) =>
                (li.name || '').toLowerCase().includes(q) ||
                (li.productName || '').toLowerCase().includes(q) ||
                (li.sku || '').toLowerCase().includes(q)
            );

            return (
                item.reference.toLowerCase().includes(q) ||
                item.subtitle.toLowerCase().includes(q) ||
                (item.sku && item.sku.toLowerCase().includes(q)) ||
                item.resolvedUser?.name.toLowerCase().includes(q) ||
                (item.resolvedUser?.displayId && item.resolvedUser.displayId.toLowerCase().includes(q)) ||
                item.location.toLowerCase().includes(q) ||
                raw.id.toLowerCase().includes(q) ||
                (raw.orderRef && raw.orderRef.toLowerCase().includes(q)) ||
                (raw.notes && raw.notes.toLowerCase().includes(q)) ||
                (raw.status && raw.status.toLowerCase().includes(q)) ||
                (raw.jobNumber && raw.jobNumber.toLowerCase().includes(q)) ||
                ((raw as any).job_number && (raw as any).job_number.toLowerCase().includes(q)) ||
                matchesItems
            );
        });
    }, [historicalJobs, search, employees, t, user]);

    const totalPages = Math.ceil(filteredHistory.length / perPage);
    const paginatedHistory = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return filteredHistory.slice(start, start + perPage);
    }, [filteredHistory, currentPage, perPage]);

    const getRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        const isToday = date.getDate() === now.getDate() &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear();

        if (isToday) {
            if (diffInSeconds < 60) return t('warehouse.justNow') || 'Just now';
            if (diffInSeconds < 3600) return t('warehouse.minutesAgo', { count: Math.floor(diffInSeconds / 60) }) || `${Math.floor(diffInSeconds / 60)}m ago`;
            return t('warehouse.hoursAgo', { count: Math.floor(diffInSeconds / 3600) }) || `${Math.floor(diffInSeconds / 3600)}h ago`;
        }

        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <div className="border-t border-[var(--theme-border)] mt-8 pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h4 className="text-lg font-bold text-[var(--theme-text-primary)] flex items-center gap-2.5 uppercase tracking-wide">
                    <div className="w-8 h-8 rounded-xl bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 flex items-center justify-center text-[var(--theme-accent)]">
                        <HistoryIcon size={16} />
                    </div>
                    {t('warehouse.putaway.history')}
                </h4>
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" size={16} />
                    <input
                        type="text"
                        placeholder={`${t('warehouse.searchHistoryPlaceholder')}`}
                        aria-label={t('warehouse.searchHistoryPlaceholder')}
                        title={t('warehouse.searchHistoryPlaceholder')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)] text-xs font-medium focus:outline-none focus:border-[var(--theme-accent)] transition-colors min-h-[44px]"
                    />
                </div>
            </div>

            {paginatedHistory.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {paginatedHistory.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => {
                                    setSelectedJob(item.rawData);
                                    setIsDetailsOpen(true);
                                }}
                                className="bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-5 transition-colors cursor-pointer flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg ${item.type === 'REPLENISH' ? 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)]' : 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20'}`}>
                                                <PackageCheck size={14} />
                                            </div>
                                            <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--theme-text-secondary)]">
                                                {item.actionType}
                                            </span>
                                        </div>
                                        <span className="text-[11px] font-mono text-[var(--theme-text-secondary)] tabular-nums">
                                            {getRelativeTime(item.date)}
                                        </span>
                                    </div>

                                    <div className="mb-4">
                                        <h5 className="text-[var(--theme-text-primary)] font-semibold text-sm break-words mb-1">
                                            {item.subtitle}
                                        </h5>
                                        <div className="flex items-center gap-2 font-mono">
                                            <span className="bg-[var(--theme-bg-subtle)] px-2 py-0.5 rounded text-[11px] font-semibold text-[var(--theme-text-secondary)] border border-[var(--theme-border)]">
                                                #{item.reference}
                                            </span>
                                            {item.sku && (
                                                <span className="text-[11px] text-[var(--theme-text-secondary)]">
                                                    / {item.sku}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[var(--theme-border)]">
                                            <MapPin size={12} className="text-[var(--theme-accent)]" />
                                            <span className="text-[11px] font-mono font-semibold text-[var(--theme-accent)] bg-[var(--theme-accent)]/10 px-2 py-0.5 rounded-md border border-[var(--theme-accent)]/20 uppercase">
                                                {item.location}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between border-t border-[var(--theme-border)] pt-3 mt-auto">
                                    <div className="flex items-center gap-2 min-w-0 pr-2">
                                        <div className="w-7 h-7 rounded-lg bg-[var(--theme-bg-subtle)] flex items-center justify-center border border-[var(--theme-border)] shrink-0">
                                            <span className="text-[11px] font-semibold text-[var(--theme-text-primary)] font-mono">
                                                {(item.resolvedUser?.name || 'S').charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider leading-none mb-0.5">
                                                {t('warehouse.completedBy') || 'Completed By'}
                                            </span>
                                            <span className="text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-tight leading-tight break-words">
                                                {item.resolvedUser?.name} {item.resolvedUser?.displayId && <span className="text-[var(--theme-text-secondary)] font-normal font-mono">({item.resolvedUser.displayId})</span>}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 bg-[var(--theme-bg-subtle)] px-2.5 py-1 rounded-lg border border-[var(--theme-border)] shrink-0">
                                        <Box size={12} className="text-[var(--theme-accent)]" />
                                        <span className="text-[11px] font-mono font-semibold text-[var(--theme-text-primary)] tabular-nums">{item.displayQty}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6">
                        <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredHistory.length} itemsPerPage={perPage} onPageChange={setCurrentPage} itemName={t('warehouse.records') || 'records'} />
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 bg-[var(--theme-bg-card)] rounded-2xl border border-dashed border-[var(--theme-border)] text-center">
                    <div className="w-12 h-12 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center mb-3 text-[var(--theme-text-secondary)]">
                        <HistoryIcon size={24} />
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider">{t('warehouse.noHistoryFound')}</h3>
                </div>
            )}
        </div>
    );
};
