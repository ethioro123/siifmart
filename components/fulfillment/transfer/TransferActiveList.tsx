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
}

export const TransferActiveList: React.FC<TransferActiveListProps> = ({
    filteredJobs,
    sites,
    setSelectedJob,
    setIsDetailsOpen,
    setShowTransferArchive
}) => {
    // Local State filters
    const [transferStatusFilter, setTransferStatusFilter] = useState<'ALL' | 'Requested' | 'Picking' | 'Picked' | 'Packed' | 'Shipped' | 'In-Transit' | 'Delivered' | 'Received'>('ALL');
    const [transferSortBy, setTransferSortBy] = useState<'date' | 'items' | 'site' | 'priority'>('date');
    const [transferCurrentPage, setTransferCurrentPage] = useState(1);
    const TRANSFER_ITEMS_PER_PAGE = 10;
    const [isTransferSortDropdownOpen, setIsTransferSortDropdownOpen] = useState(false);

    // Filter Logic
    const filteredOngoingTransfers = useMemo(() => {
        return filteredJobs
            .filter(j => j.type === 'TRANSFER' && j.transferStatus !== 'Received' && j.status !== 'Cancelled')
            .filter(j => {
                if (typeof transferStatusFilter === 'undefined' || transferStatusFilter === 'ALL') return true;
                // Derive effective status from child DISPATCH if it has progressed further
                let effStatus = j.transferStatus || 'Requested';
                const child = filteredJobs.find(d => d.type === 'DISPATCH' && (d.orderRef === j.id || d.orderRef === j.jobNumber) && d.status !== 'Cancelled');
                if (child) {
                    const RANK: Record<string, number> = { 'Requested': 0, 'Approved': 1, 'Picking': 2, 'Picked': 3, 'Packed': 4, 'Shipped': 5, 'In-Transit': 6, 'Delivered': 7, 'Received': 8 };
                    if ((RANK[child.transferStatus || ''] || 0) > (RANK[effStatus] || 0)) effStatus = child.transferStatus!;
                }
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
        const hasDisc = (transfer.lineItems || []).some((item: any) =>
            item.receivedQty !== undefined &&
            item.receivedQty !== (item.requestedMeasureQty !== undefined ? item.requestedMeasureQty : item.expectedQty) &&
            !['Resolved', 'Completed'].includes(item.status)
        );

        // Derive effective status: if a child DISPATCH job has progressed further, use that
        const childDispatch = filteredJobs.find(j =>
            j.type === 'DISPATCH' &&
            (j.orderRef === transfer.id || j.orderRef === transfer.jobNumber) &&
            j.status !== 'Cancelled'
        );
        const effectiveStatus = (() => {
            const parentStatus = transfer.transferStatus || 'Requested';
            if (!childDispatch) return parentStatus;
            const childStatus = childDispatch.transferStatus || '';
            // If child has progressed beyond parent, use child's status
            const STATUS_RANK: Record<string, number> = {
                'Requested': 0, 'Approved': 1, 'Picking': 2, 'Picked': 3,
                'Packed': 4, 'Shipped': 5, 'In-Transit': 6, 'Delivered': 7, 'Received': 8
            };
            return (STATUS_RANK[childStatus] || 0) > (STATUS_RANK[parentStatus] || 0) ? childStatus : parentStatus;
        })();

        const statusColors: Record<string, string> = {
            'Requested': 'bg-yellow-500/20 text-yellow-400',
            'Approved': 'bg-blue-500/20 text-blue-400',
            'Picking': 'bg-orange-500/20 text-orange-400',
            'Picked': 'bg-amber-500/20 text-amber-400',
            'Packed': 'bg-indigo-500/20 text-indigo-400',
            'Shipped': 'bg-purple-500/20 text-purple-400',
            'In-Transit': 'bg-purple-500/20 text-purple-400',
            'Delivered': 'bg-cyan-500/20 text-cyan-400',
            'Received': 'bg-green-500/20 text-green-400',
        };
        return (
            <div
                key={transfer.id}
                onClick={() => {
                    setSelectedJob(transfer);
                    setIsDetailsOpen(true);
                }}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:bg-white/5 ${hasDisc ? 'border-red-500/40 bg-red-500/5' : 'border-white/5 hover:border-white/10'
                    }`}
            >
                {/* Left: ID only */}
                <div className="flex items-center gap-2">
                    {hasDisc && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                    <span className="font-mono font-bold text-white text-sm">{formatJobId(transfer)}</span>
                </div>
                {/* Right: Status + Chevron */}
                <div className="flex items-center gap-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${statusColors[effectiveStatus]}`}>
                        {effectiveStatus}
                    </span>
                    <ChevronRight size={16} className="text-gray-500" />
                </div>
            </div>
        );
    };

    return (
        <div className="bg-cyber-gray border border-white/5 rounded-2xl p-4 md:p-6">
            <div className="flex items-center justify-between mb-4 gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <select
                        aria-label="Filter transfers by status"
                        value={transferStatusFilter}
                        onChange={(e) => setTransferStatusFilter(e.target.value as any)}
                        className="bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white focus:border-cyber-primary focus:outline-none"
                    >
                        <option value="ALL">All Transfers</option>
                        <option value="Requested">📋 Requested</option>
                        <option value="Picking">📦 Picking</option>
                        <option value="Packed">📤 Packed</option>
                        <option value="Shipped">⚓ Shipped</option>
                        <option value="In-Transit">🚚 In Transit</option>
                        <option value="Delivered">📍 Delivered</option>
                        <option value="Received">✅ Received</option>
                    </select>
                    <SortDropdown
                        label="Sort"
                        options={[
                            { id: 'date', label: 'Newest', icon: <Clock size={12} /> },
                            { id: 'priority', label: 'Priority', icon: <AlertTriangle size={12} /> },
                            { id: 'site', label: 'Store', icon: <MapPin size={12} /> },
                            { id: 'items', label: 'Size', icon: <List size={12} /> }
                        ]}
                        value={transferSortBy}
                        onChange={(val) => setTransferSortBy(val)}
                        isOpen={isTransferSortDropdownOpen}
                        setIsOpen={setIsTransferSortDropdownOpen}
                    />
                </div>
                <button
                    onClick={() => setShowTransferArchive && setShowTransferArchive(true)}
                    className="px-3 py-2 bg-white/5 text-gray-400 rounded-lg text-xs font-bold hover:bg-white/10 border border-white/10 flex items-center gap-1.5"
                >
                    <FileText size={14} /> Archive
                </button>
            </div>

            <div className="space-y-6">
                {/* ONGOING Section */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                        <h4 className="text-sm font-bold text-white uppercase tracking-wide">Ongoing</h4>
                        <span className="text-xs text-gray-500">({filteredOngoingTransfers.length})</span>
                    </div>
                    {filteredOngoingTransfers.length > 0 ? (
                        <>
                            <div className="space-y-2">
                                {paginatedOngoingTransfers.map(renderRow)}
                            </div>
                            <div className="mt-4">
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
                        <div className="text-center py-8 text-gray-500 bg-white/[0.02] rounded-lg border border-white/5">
                            <Truck size={32} className="mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No ongoing transfers</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
