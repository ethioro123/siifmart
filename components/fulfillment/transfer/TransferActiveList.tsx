import React, { useState, useMemo } from 'react';
import { Truck, Clock, AlertTriangle, MapPin, List, FileText, ChevronRight } from 'lucide-react';
import { WMSJob, Site } from '../../../types';
import Pagination from '../../shared/Pagination';
import { SortDropdown } from '../FulfillmentShared';
import { formatJobId } from '../../../utils/jobIdFormatter';

interface TransferActiveListProps {
    filteredJobs: WMSJob[];
    sites: Site[];
    setSelectedJob: (job: WMSJob | null) => void;
    setIsDetailsOpen: (val: boolean) => void;
    setShowTransferArchive?: (val: boolean) => void;
    t: (key: string) => string;
}

export const TransferActiveList: React.FC<TransferActiveListProps> = ({
    filteredJobs,
    sites,
    setSelectedJob,
    setIsDetailsOpen,
    setShowTransferArchive,
    t
}) => {
    // Local State filters
    const [transferStatusFilter, setTransferStatusFilter] = useState<'ALL' | 'Draft' | 'Requested' | 'Picking' | 'Picked' | 'Packed' | 'Shipped' | 'In-Transit' | 'Delivered' | 'Received'>('ALL');
    const [transferSortBy, setTransferSortBy] = useState<'date' | 'items' | 'site' | 'priority'>('date');
    const [transferCurrentPage, setTransferCurrentPage] = useState(1);
    const TRANSFER_ITEMS_PER_PAGE = 10;
    const [isTransferSortDropdownOpen, setIsTransferSortDropdownOpen] = useState(false);

    // Filter Logic
    const filteredOngoingTransfers = useMemo(() => {
        return filteredJobs
            .filter(j => j.type === 'TRANSFER' && j.status !== 'Cancelled' && (j.status as string) !== 'Rejected' && j.transferStatus !== 'Received' && j.transferStatus !== 'Rejected' && j.transferStatus !== 'Cancelled' && (j.status !== 'Completed' || j.transferStatus === 'Delivered' || j.transferStatus === 'Partially Delivered'))
            .filter(j => {
                let effStatus = j.transferStatus || 'Requested';
                const child = filteredJobs.find(d => d.type === 'DISPATCH' && (d.orderRef === j.id || d.orderRef === j.jobNumber) && d.status !== 'Cancelled');
                if (child) {
                    const RANK: Record<string, number> = { 'Requested': 0, 'Approved': 1, 'Picking': 2, 'Picked': 3, 'Packed': 4, 'Shipped': 5, 'In-Transit': 6, 'Delivered': 7, 'Received': 8 };
                    if ((RANK[child.transferStatus || ''] || 0) > (RANK[effStatus] || 0)) effStatus = child.transferStatus!;
                }

                if (effStatus === 'Received') return false;

                if (typeof transferStatusFilter === 'undefined' || transferStatusFilter === 'ALL') return true;
                if (transferStatusFilter === 'Draft') return effStatus === 'Draft' || (j.status as any) === 'Draft';
                if (transferStatusFilter === 'Picking') return effStatus === 'Picking' || effStatus === 'Picked';
                if (transferStatusFilter === 'In-Transit') return effStatus === 'In-Transit' || effStatus === 'Shipped';
                return effStatus === transferStatusFilter;
            })
            .sort((a, b) => {
                switch (transferSortBy) {
                    case 'priority':
                        const p: Record<string, number> = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Normal': 1, 'Low': 0 };
                        return (p[b.priority] || 1) - (p[a.priority] || 1);
                    case 'date':
                        return new Date(b.createdAt || b.orderRef).getTime() - new Date(a.createdAt || a.orderRef).getTime();
                    case 'items':
                        return (b.lineItems?.length || 0) - (a.lineItems?.length || 0);
                    case 'site':
                        return (sites.find(s => s.id === a.destSiteId)?.name || '').localeCompare(sites.find(s => s.id === b.destSiteId)?.name || '');
                    default:
                        return 0;
                }
            });
    }, [filteredJobs, transferStatusFilter, transferSortBy, sites]);

    const transferTotalPages = Math.ceil(filteredOngoingTransfers.length / TRANSFER_ITEMS_PER_PAGE);
    const paginatedOngoingTransfers = useMemo(() => {
        const start = (transferCurrentPage - 1) * TRANSFER_ITEMS_PER_PAGE;
        return filteredOngoingTransfers.slice(start, start + TRANSFER_ITEMS_PER_PAGE);
    }, [filteredOngoingTransfers, transferCurrentPage]);

    const renderRow = (transfer: any) => {
        const hasDisc = ['Received', 'Delivered', 'Completed'].some(s => s === transfer.transferStatus || s === transfer.status) &&
            (transfer.lineItems || []).some((item: any) =>
                item.receivedQty !== undefined &&
                item.receivedQty !== (item.requestedMeasureQty !== undefined ? item.requestedMeasureQty : item.expectedQty) &&
                !['Resolved', 'Completed'].includes(item.status)
            );

        const childDispatch = filteredJobs.find(j =>
            j.type === 'DISPATCH' &&
            (j.orderRef === transfer.id || j.orderRef === transfer.jobNumber) &&
            j.status !== 'Cancelled'
        );
        const effectiveStatus = (() => {
            const parentStatus = transfer.transferStatus || 'Requested';
            if (!childDispatch) return parentStatus;
            const childStatus = childDispatch.transferStatus || '';
            const STATUS_RANK: Record<string, number> = {
                'Requested': 0, 'Approved': 1, 'Picking': 2, 'Picked': 3,
                'Packed': 4, 'Shipped': 5, 'In-Transit': 6, 'Delivered': 7, 'Received': 8
            };
            return (STATUS_RANK[childStatus] || 0) > (STATUS_RANK[parentStatus] || 0) ? childStatus : parentStatus;
        })();

        const statusBadges: Record<string, string> = {
            'Draft': 'bg-stone-500/10 text-[var(--theme-text-secondary)] border-stone-500/20',
            'Requested': 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
            'Approved': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
            'Picking': 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
            'Picked': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
            'Packed': 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
            'Shipped': 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
            'In-Transit': 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
            'Delivered': 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
            'Received': 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
        };

        const getLocalizedStatus = (status: string) => {
            switch (status) {
                case 'Draft': return t('warehouse.draft');
                case 'Requested': return t('warehouse.requested');
                case 'Approved': return t('warehouse.approved');
                case 'Picking': return t('warehouse.picking');
                case 'Picked': return t('warehouse.picked');
                case 'Packed': return t('warehouse.packed');
                case 'Shipped': return t('warehouse.shipped');
                case 'In-Transit': return t('warehouse.inTransit');
                case 'Delivered': return t('warehouse.delivered');
                case 'Received': return t('warehouse.received');
                default: return status;
            }
        };

        return (
            <div
                key={transfer.id}
                onClick={() => {
                    setSelectedJob(transfer);
                    setIsDetailsOpen(true);
                }}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-colors shadow-sm ${
                    hasDisc
                        ? 'bg-red-500/5 border-red-500/40 hover:border-red-500'
                        : 'bg-[var(--theme-bg-card)] border-[var(--theme-border)] hover:border-[var(--theme-accent)]/50'
                }`}
            >
                {/* Left: ID + Discrepancy indicator */}
                <div className="flex items-center gap-2.5 min-w-0">
                    {hasDisc && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />}
                    <span className="font-mono tabular-nums font-semibold text-[var(--theme-text-primary)] text-sm truncate">
                        {formatJobId(transfer)}
                    </span>
                    {(transfer.isInterRegion || (transfer.sourceRegionCode && transfer.destRegionCode && transfer.sourceRegionCode !== transfer.destRegionCode)) && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20 shrink-0">
                            {t('warehouse.interRegionBadge')}
                        </span>
                    )}
                </div>
                {/* Right: Status badge + Chevron */}
                <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold uppercase border ${statusBadges[effectiveStatus] || statusBadges['Draft']}`}>
                        {getLocalizedStatus(effectiveStatus)}
                    </span>
                    <ChevronRight size={16} className="text-[var(--theme-text-secondary)]" />
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                    <select
                        aria-label={t('warehouse.putaway.search')}
                        value={transferStatusFilter}
                        onChange={(e) => setTransferStatusFilter(e.target.value as any)}
                        className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs font-semibold text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none min-h-[44px] transition-colors shadow-sm"
                    >
                        <option value="ALL">{t('warehouse.allTransfers')}</option>
                        <option value="Draft">{t('warehouse.draft')}</option>
                        <option value="Requested">{t('warehouse.requested')}</option>
                        <option value="Picking">{t('warehouse.picking')}</option>
                        <option value="Packed">{t('warehouse.packed')}</option>
                        <option value="Shipped">{t('warehouse.shipped')}</option>
                        <option value="In-Transit">{t('warehouse.inTransit')}</option>
                        <option value="Delivered">{t('warehouse.delivered')}</option>
                        <option value="Received">{t('warehouse.received')}</option>
                    </select>
                    <SortDropdown
                        label={t('warehouse.sort')}
                        options={[
                            { id: 'date', label: t('warehouse.newest'), icon: <Clock size={12} /> },
                            { id: 'priority', label: t('warehouse.priority'), icon: <AlertTriangle size={12} /> },
                            { id: 'site', label: t('warehouse.store'), icon: <MapPin size={12} /> },
                            { id: 'items', label: t('warehouse.size'), icon: <List size={12} /> }
                        ]}
                        value={transferSortBy}
                        onChange={(val) => setTransferSortBy(val)}
                        isOpen={isTransferSortDropdownOpen}
                        setIsOpen={setIsTransferSortDropdownOpen}
                    />
                </div>
                {setShowTransferArchive && (
                    <button
                        onClick={() => setShowTransferArchive(true)}
                        className="px-3.5 py-2 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] hover:bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors min-h-[44px]"
                    >
                        <FileText size={14} />
                        <span>{t('warehouse.archive')}</span>
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {/* ONGOING Section */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                        <h4 className="text-sm font-bold text-[var(--theme-text-primary)] uppercase tracking-wide">
                            {t('warehouse.ongoing')}
                        </h4>
                        <span className="text-xs font-mono tabular-nums text-[var(--theme-text-secondary)]">
                            ({filteredOngoingTransfers.length})
                        </span>
                    </div>
                    {filteredOngoingTransfers.length > 0 ? (
                        <>
                            <div className="space-y-2">
                                {paginatedOngoingTransfers.map(renderRow)}
                            </div>
                            <div className="pt-2">
                                <Pagination
                                    currentPage={transferCurrentPage}
                                    totalPages={transferTotalPages}
                                    totalItems={filteredOngoingTransfers.length}
                                    itemsPerPage={TRANSFER_ITEMS_PER_PAGE}
                                    onPageChange={setTransferCurrentPage}
                                    isLoading={false}
                                    itemName="transfers"
                                />
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12 px-4 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] shadow-sm">
                            <Truck size={32} className="mx-auto mb-2 text-[var(--theme-text-secondary)]/40" />
                            <p className="text-xs text-[var(--theme-text-secondary)] font-medium">{t('warehouse.noOngoingTransfers')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TransferActiveList;
