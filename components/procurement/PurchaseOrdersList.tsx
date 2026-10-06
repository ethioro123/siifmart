import React, { useState } from 'react';
import { PurchaseOrder, Supplier } from '../../types';
import { Search, MapPin, CheckCircle, Clock, Truck, XCircle, Printer, Edit3, Trash2 } from 'lucide-react';
import { formatCompactNumber } from '../../utils/formatting';
import { formatPONumber } from '../../utils/jobIdFormatter';
import { ViewPOModal } from './ViewPOModal';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { usePurchaseOrderMutations } from '../../hooks/usePurchaseOrderMutations';
import { logger } from '../../utils/logger';
import { PurchaseOrdersMobileList } from './components/PurchaseOrdersMobileList';

interface PurchaseOrdersListProps {
    orders: PurchaseOrder[];
    loading: boolean;
    totalCount: number;
    currentPage: number;
    onPageChange: (page: number) => void;
    // Filters
    searchTerm: string;
    onSearchChange: (term: string) => void;
    supplierFilter: string;
    onSupplierFilterChange: (id: string) => void;
    statusFilter: string;
    onStatusFilterChange: (status: any) => void;
    sort: string;
    onSortChange: (sort: any) => void;

    suppliers: Supplier[];
    sites: any[];
    currencySymbol?: string;

    // Actions
    onEdit: (po: PurchaseOrder) => void;
    onRefresh: () => void;
}

export const PurchaseOrdersList: React.FC<PurchaseOrdersListProps> = ({
    orders, loading, totalCount, currentPage, onPageChange,
    searchTerm, onSearchChange, supplierFilter, onSupplierFilterChange,
    statusFilter, onStatusFilterChange, sort, onSortChange,
    suppliers, sites, currencySymbol = 'ETB', onEdit, onRefresh
}) => {
    const { user, showToast } = useStore();
    const { approvePOMutation, bulkApproveMutation, cancelPOMutation } = usePurchaseOrderMutations();
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [selectedPOIds, setSelectedPOIds] = useState<string[]>([]);
    const isBulkApproving = bulkApproveMutation.isPending;

    const ITEMS_PER_PAGE = 20;
    const isCEO = user?.role === 'super_admin';
    const isProcurementManager = user?.role === 'procurement_manager';
    const isOperationalDirector = user?.role === 'regional_manager' || user?.role === 'operations_manager';
    const canApprove = isProcurementManager || user?.role === 'finance_manager' || user?.role === 'admin' || isCEO || isOperationalDirector;

    const handleBulkApprove = async () => {
        const ordersToApprove = orders.filter(p => selectedPOIds.includes(p.id));
        if (ordersToApprove.length === 0) return;
        try {
            await bulkApproveMutation.mutateAsync(ordersToApprove);
            setSelectedPOIds([]);
            onRefresh();
        } catch (e) {
            logger.error('PurchaseOrdersList', "Bulk approve failed", e);
        }
    };

    const handleDeletePO = async (e: React.MouseEvent, po: PurchaseOrder) => {
        e.stopPropagation();
        try {
            await cancelPOMutation.mutateAsync({ po, reason: 'Cancelled by authorized user' });
            onRefresh();
        } catch (e) {
            logger.error('PurchaseOrdersList', "Failed to cancel PO", e);
        }
    };

    const handleSingleApprove = async (e: React.MouseEvent, po: PurchaseOrder) => {
        e.stopPropagation();
        try {
            await approvePOMutation.mutateAsync(po);
            onRefresh();
        } catch (e) {
            logger.error('PurchaseOrdersList', "Approve failed", e);
        }
    };

    const renderPriorityBadge = (priority?: string) => {
        const p = (priority || 'Normal').toLowerCase();
        if (p === 'urgent' || p === 'high') {
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-red-500/10 text-red-500 border border-red-500/20">
                    {priority || 'Normal'}
                </span>
            );
        }
        if (p === 'low') {
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]">
                    {priority || 'Normal'}
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]">
                {priority || 'Normal'}
            </span>
        );
    };

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'Received':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        Received
                    </span>
                );
            case 'Partially Received':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        Partially Received
                    </span>
                );
            case 'Approved':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/20">
                        Approved
                    </span>
                );
            case 'Ordered':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                        Ordered
                    </span>
                );
            case 'Draft':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]">
                        Draft
                    </span>
                );
            case 'Pending':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        Pending
                    </span>
                );
            case 'Cancelled':
            case 'Rejected':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20">
                        {status}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]">
                        {status}
                    </span>
                );
        }
    };

    return (
        <div className="rounded-3xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] shadow-sm overflow-hidden transition-all duration-200">
            {/* Modern Filter Toolbar */}
            <div className="p-5 border-b border-[var(--theme-border)] space-y-4">
                {/* Row 1: Search & Dropdowns */}
                <div className="flex flex-col md:flex-row gap-3">
                    {/* Search */}
                    <div className="flex items-center rounded-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] px-4 h-11 flex-1 focus-within:border-[var(--theme-accent)] transition-all">
                        <Search className="w-4 h-4 text-[var(--theme-text-secondary)] shrink-0" />
                        <input
                            type="text"
                            placeholder="Search PO # or Supplier..."
                            className="bg-transparent border-none ml-2.5 flex-1 text-[var(--theme-text-primary)] text-sm outline-none placeholder:text-[var(--theme-text-secondary)]/70"
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>

                    {/* Supplier Filter */}
                    <select
                        aria-label="Filter by Supplier"
                        value={supplierFilter}
                        onChange={(e) => onSupplierFilterChange(e.target.value)}
                        className="rounded-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] px-4 h-11 text-xs sm:text-sm font-medium text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)] min-w-[160px] transition-all cursor-pointer"
                    >
                        <option value="All" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">All Suppliers</option>
                        {suppliers.map(s => (
                            <option key={s.id} value={s.id} className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">{s.name}</option>
                        ))}
                    </select>

                    {/* Sort */}
                    <select
                        aria-label="Sort POs"
                        value={sort}
                        onChange={(e) => onSortChange(e.target.value as any)}
                        className="rounded-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] px-4 h-11 text-xs sm:text-sm font-medium text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)] min-w-[160px] transition-all cursor-pointer"
                    >
                        <option value="dateDesc" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">Date: Newest</option>
                        <option value="dateAsc" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">Date: Oldest</option>
                        <option value="amountDesc" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">Amount: High-Low</option>
                        <option value="amountAsc" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">Amount: Low-High</option>
                        <option value="priority" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">Priority</option>
                    </select>
                </div>

                {/* Row 2: Status Chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                    {['All', 'Draft', 'Pending', 'Approved', 'Partially Received', 'Received', 'Cancelled', 'Rejected'].map(status => {
                        const isChipActive = statusFilter === status;
                        return (
                            <button
                                key={status}
                                onClick={() => onStatusFilterChange(status as any)}
                                className={`h-8 px-3.5 rounded-full text-xs transition-all active:scale-[0.98] ${
                                    isChipActive
                                        ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] font-semibold shadow-sm'
                                        : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] font-medium border border-[var(--theme-border-subtle)]'
                                }`}
                            >
                                {status}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Bulk Actions Bar (CEO Only) */}
            {user?.role === 'super_admin' && selectedPOIds.length > 0 && (
                <div className="mx-5 my-3 p-3.5 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <span className="text-xs sm:text-sm font-semibold text-[var(--theme-text-primary)]">
                            {selectedPOIds.length} PO{selectedPOIds.length !== 1 ? 's' : ''} selected
                        </span>
                        <button
                            onClick={() => setSelectedPOIds([])}
                            className="text-xs font-semibold text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors cursor-pointer"
                        >
                            Clear Selection
                        </button>
                    </div>
                    <button
                        onClick={handleBulkApprove}
                        disabled={isBulkApproving}
                        className="h-9 px-4 rounded-full bg-[var(--theme-primary)] hover:opacity-90 active:scale-[0.98] text-[var(--theme-primary-text)] disabled:opacity-40 disabled:pointer-events-none font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm"
                    >
                        <CheckCircle size={15} /> Approve Selected
                    </button>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left hidden md:table border-collapse">
                    <thead>
                        <tr className="border-b border-[var(--theme-border)] bg-[var(--theme-bg-subtle)]/30">
                            {user?.role === 'super_admin' && (
                                <th className="px-5 py-3.5 w-12">
                                    <input
                                        type="checkbox"
                                        aria-label="Select all drafts"
                                        className="w-4 h-4 rounded border-[var(--theme-border)] text-[var(--theme-accent)] bg-transparent focus:ring-0 cursor-pointer"
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedPOIds(orders.filter(o => o.status === 'Draft').map(o => o.id));
                                            else setSelectedPOIds([]);
                                        }}
                                        checked={selectedPOIds.length > 0 && selectedPOIds.length === orders.filter(o => o.status === 'Draft').length}
                                    />
                                </th>
                            )}
                            <th className="px-5 py-3.5 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider whitespace-nowrap">PO Number</th>
                            <th className="px-5 py-3.5 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-center whitespace-nowrap">Priority</th>
                            <th className="px-5 py-3.5 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider whitespace-nowrap">Supplier</th>
                            <th className="px-5 py-3.5 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider whitespace-nowrap">Destination</th>
                            <th className="px-5 py-3.5 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider whitespace-nowrap">Date</th>
                            <th className="px-5 py-3.5 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider whitespace-nowrap">Expected</th>
                            <th className="px-5 py-3.5 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-right whitespace-nowrap">Items</th>
                            <th className="px-5 py-3.5 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-right whitespace-nowrap">Amount</th>
                            <th className="px-5 py-3.5 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-center whitespace-nowrap">Status</th>
                            <th className="px-5 py-3.5 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider whitespace-nowrap">Requested By</th>
                            <th className="px-5 py-3.5 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--theme-border-subtle)]">
                        {orders.map((po) => {
                            const isDraft = po.status === 'Draft';
                            const isSelected = selectedPOIds.includes(po.id);
                            return (
                                <tr
                                    key={po.id}
                                    className={`hover:bg-[var(--theme-bg-subtle)]/40 group transition-colors ${
                                        isSelected ? 'bg-[var(--theme-accent-muted)]/30 border-l-2 border-[var(--theme-accent)]' : ''
                                    }`}
                                >
                                    {user?.role === 'super_admin' && (
                                        <td className="px-5 py-4 align-middle">
                                            {isDraft ? (
                                                <input
                                                    type="checkbox"
                                                    aria-label={`Select PO ${po.id}`}
                                                    checked={isSelected}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedPOIds(prev => [...prev, po.id]);
                                                        else setSelectedPOIds(prev => prev.filter(id => id !== po.id));
                                                    }}
                                                    className="w-4 h-4 rounded border-[var(--theme-border)] text-[var(--theme-accent)] bg-transparent focus:ring-0 cursor-pointer"
                                                />
                                            ) : <span className="w-4 h-4 block"></span>}
                                        </td>
                                    )}
                                    <td className="px-5 py-4 align-middle font-mono font-semibold text-sm text-[var(--theme-text-primary)] tabular-nums whitespace-nowrap">
                                        {formatPONumber(po)}
                                    </td>
                                    <td className="px-5 py-4 align-middle text-center whitespace-nowrap">
                                        {renderPriorityBadge(po.priority)}
                                    </td>
                                    <td className="px-5 py-4 align-middle text-sm font-medium text-[var(--theme-text-primary)] whitespace-nowrap">
                                        {po.supplierName}
                                    </td>
                                    <td className="px-5 py-4 align-middle text-xs text-[var(--theme-text-secondary)]">
                                        <div className="flex items-center gap-1.5 max-w-[180px]">
                                            <MapPin size={12} className="text-[var(--theme-text-secondary)] shrink-0" />
                                            <span className="truncate">{po.destination || sites.find(s => s.id === po.siteId)?.name || 'Central Operations'}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 align-middle text-xs font-mono tabular-nums text-[var(--theme-text-secondary)] whitespace-nowrap">
                                        {po.date}
                                    </td>
                                    <td className="px-5 py-4 align-middle text-xs font-mono tabular-nums text-[var(--theme-text-secondary)] whitespace-nowrap">
                                        {po.expectedDelivery || 'N/A'}
                                    </td>
                                    <td className="px-5 py-4 align-middle text-sm font-mono tabular-nums text-right text-[var(--theme-text-secondary)] whitespace-nowrap">
                                        {po.itemsCount}
                                    </td>
                                    <td className="px-5 py-4 align-middle text-sm font-mono font-semibold tabular-nums text-right text-[var(--theme-text-primary)] whitespace-nowrap">
                                        {po.currency || currencySymbol} {po.totalAmount.toLocaleString()}
                                    </td>
                                    <td className="px-5 py-4 align-middle text-center whitespace-nowrap">
                                        {renderStatusBadge(po.status)}
                                    </td>
                                    <td className="px-5 py-4 align-middle text-xs text-[var(--theme-text-secondary)] max-w-[120px] truncate whitespace-nowrap">
                                        {po.requestedBy || po.createdBy || 'Unknown'}
                                    </td>
                                    <td className="px-5 py-4 align-middle text-right whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedPO(po); }}
                                                className="h-8 px-3.5 rounded-full border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-primary)] text-xs font-medium transition-all active:scale-[0.98]"
                                            >
                                                Details
                                            </button>
                                            {isDraft && canApprove && (
                                                <button
                                                    onClick={(e) => handleSingleApprove(e, po)}
                                                    className="h-8 px-3.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-medium transition-all active:scale-[0.98] flex items-center gap-1.5"
                                                    title="Approve"
                                                >
                                                    <CheckCircle size={13} /> Approve
                                                </button>
                                            )}
                                            {((isCEO && po.status !== 'Received') || 
                                              (isOperationalDirector && po.status !== 'Received') ||
                                              (user?.role === 'warehouse_manager' && po.status !== 'Received') ||
                                              (po.status === 'Draft' && (po.createdBy === user?.name || po.requestedBy === user?.name))) && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onEdit(po); }}
                                                    className="w-8 h-8 rounded-full flex items-center justify-center border border-transparent hover:border-[var(--theme-border)] hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-all active:scale-[0.95]"
                                                    title="Edit"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                            )}
                                            {((isCEO && po.status !== 'Received' && po.status !== 'Cancelled') || 
                                              (isOperationalDirector && po.status !== 'Received' && po.status !== 'Cancelled') ||
                                              (isProcurementManager && po.status !== 'Received' && po.status !== 'Cancelled') ||
                                              (po.status === 'Draft' && (po.createdBy === user?.name || po.requestedBy === user?.name))) && (
                                                <button
                                                    onClick={(e) => handleDeletePO(e, po)}
                                                    className="w-8 h-8 rounded-full flex items-center justify-center border border-transparent hover:border-red-500/30 hover:bg-red-500/10 text-[var(--theme-text-secondary)] hover:text-red-400 transition-all active:scale-[0.95]"
                                                    title="Cancel PO"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {orders.length === 0 && (
                            <tr>
                                <td colSpan={user?.role === 'super_admin' ? 12 : 11} className="py-16 text-center">
                                    <div className="flex flex-col items-center justify-center gap-1.5">
                                        <p className="text-sm font-semibold text-[var(--theme-text-primary)]">No purchase orders found</p>
                                        <p className="text-xs text-[var(--theme-text-secondary)]">Try adjusting your filters or create a new purchase order</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <PurchaseOrdersMobileList
                    orders={orders}
                    sites={sites}
                    user={user}
                    canApprove={canApprove}
                    isCEO={isCEO}
                    selectedPOIds={selectedPOIds}
                    setSelectedPOIds={setSelectedPOIds}
                    setSelectedPO={setSelectedPO}
                    handleSingleApprove={handleSingleApprove}
                    onEdit={onEdit}
                    handleDeletePO={handleDeletePO}
                    formatPONumber={formatPONumber}
                    currencySymbol={currencySymbol}
                />
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-[var(--theme-border)] bg-[var(--theme-bg-subtle)]/20">
                <p className="text-xs text-[var(--theme-text-secondary)] font-mono">
                    Showing <span className="font-semibold text-[var(--theme-text-primary)] tabular-nums">{orders.length}</span> of <span className="font-semibold text-[var(--theme-text-primary)] tabular-nums">{totalCount}</span> Results
                </p>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1 || loading}
                        className="h-9 px-4 rounded-full border border-[var(--theme-border)] bg-[var(--theme-bg-panel)] hover:bg-[var(--theme-bg-card-hover)] text-xs font-semibold text-[var(--theme-text-primary)] disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-[0.98] shadow-sm"
                    >
                        Previous
                    </button>
                    <div className="h-9 px-4 rounded-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border-subtle)] flex items-center gap-2 text-xs font-mono text-[var(--theme-text-secondary)]">
                        <span className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider font-semibold">Page</span>
                        <span className="font-bold text-[var(--theme-text-primary)] tabular-nums">{currentPage}</span>
                        <span className="text-[10px] text-[var(--theme-text-secondary)]">of</span>
                        <span className="font-semibold text-[var(--theme-text-secondary)] tabular-nums">{Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE))}</span>
                    </div>
                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage * ITEMS_PER_PAGE >= totalCount || loading}
                        className="h-9 px-4 rounded-full border border-[var(--theme-border)] bg-[var(--theme-bg-panel)] hover:bg-[var(--theme-bg-card-hover)] text-xs font-semibold text-[var(--theme-text-primary)] disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-[0.98] shadow-sm"
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* View Modal */}
            <ViewPOModal
                isOpen={!!selectedPO}
                onClose={() => setSelectedPO(null)}
                po={selectedPO}
                onEdit={(po) => {
                    setSelectedPO(null);
                    onEdit(po);
                }}
                onSuccess={onRefresh}
            />
        </div>
    );

};
