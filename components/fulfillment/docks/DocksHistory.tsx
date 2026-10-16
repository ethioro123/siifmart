import React, { useState, useMemo } from 'react';
import { History as HistoryIcon, Search, Clock, User as UserIcon } from 'lucide-react';
import Pagination from '../../shared/Pagination';
import { PurchaseOrder } from '../../../types';
import { resolveFulfillmentWorker } from '../../../utils/fulfillmentUserResolver';

interface DocksHistoryProps {
    orders: PurchaseOrder[];
    t: (key: string) => string;
}

const DOCK_HISTORY_PER_PAGE = 12;

export const DocksHistory: React.FC<DocksHistoryProps> = ({ orders, t }) => {
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // DOCK HISTORY Logic (Unloaded POs)
    const filteredHistory = useMemo(() => {
        return orders.filter((po: any) => {
            // Keep POs that have been approved (unloaded)
            const isUnloaded = (po.status === 'Approved' || po.status === 'Partially Received' || po.status === 'Received') && po.approvedAt;
            if (!isUnloaded) return false;

            if (!search) return true;
            const q = search.toLowerCase();

            // Search product names and SKUs inside order items
            const items = po.lineItems || po.line_items || [];
            const matchesItems = items.some((item: any) => 
                (item.name || item.productName || '').toLowerCase().includes(q) ||
                (item.sku || '').toLowerCase().includes(q)
            );

            const matchesSearch =
                po.poNumber?.toLowerCase().includes(q) ||
                po.id?.toLowerCase().includes(q) ||
                po.supplierName?.toLowerCase().includes(q) ||
                po.status?.toLowerCase().includes(q) ||
                (po.approvedBy && po.approvedBy.toLowerCase().includes(q)) ||
                matchesItems;

            return matchesSearch;
        }).sort((a: any, b: any) => new Date(b.approvedAt).getTime() - new Date(a.approvedAt).getTime());
    }, [orders, search]);

    const totalPages = Math.ceil(filteredHistory.length / DOCK_HISTORY_PER_PAGE);
    const paginatedHistory = useMemo(() => {
        const start = (currentPage - 1) * DOCK_HISTORY_PER_PAGE;
        return filteredHistory.slice(start, start + DOCK_HISTORY_PER_PAGE);
    }, [filteredHistory, currentPage]);

    return (
        <div className="lg:col-span-3 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-6 mt-4 shadow-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h3 className="text-base sm:text-lg font-bold text-[var(--theme-text-primary)] tracking-tight uppercase flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
                        <HistoryIcon className="text-primary" size={18} />
                    </div>
                    {t('warehouse.docks.history') || 'Dock History'}
                </h3>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] pointer-events-none" size={16} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        placeholder="Search PO, Supplier..."
                        aria-label="Search PO or Supplier"
                        title="Search PO or Supplier"
                        className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl pl-10 pr-3.5 py-2 text-xs text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-muted)] focus:outline-none focus:border-primary transition-colors min-h-[44px]"
                    />
                </div>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full min-w-[640px]">
                    <thead>
                        <tr className="border-b border-[var(--theme-border)]">
                            <th className="px-4 py-3 text-left text-[11px] font-semibold text-[var(--theme-text-muted)] uppercase tracking-wider">Unloaded At</th>
                            <th className="px-4 py-3 text-left text-[11px] font-semibold text-[var(--theme-text-muted)] uppercase tracking-wider">PO Number</th>
                            <th className="px-4 py-3 text-left text-[11px] font-semibold text-[var(--theme-text-muted)] uppercase tracking-wider">Supplier</th>
                            <th className="px-4 py-3 text-left text-[11px] font-semibold text-[var(--theme-text-muted)] uppercase tracking-wider">Approved By</th>
                            <th className="px-4 py-3 text-left text-[11px] font-semibold text-[var(--theme-text-muted)] uppercase tracking-wider">Items</th>
                            <th className="px-4 py-3 text-right text-[11px] font-semibold text-[var(--theme-text-muted)] uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--theme-border)]">
                        {paginatedHistory.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-10 text-center text-[var(--theme-text-muted)] text-xs font-semibold">
                                    No unloaded POs found.
                                </td>
                            </tr>
                        ) : (
                            paginatedHistory.map((po: any) => (
                                <tr key={po.id} className="hover:bg-[var(--theme-bg-subtle)] transition-colors group">
                                    <td className="px-4 py-3.5">
                                        <div className="flex items-center gap-1.5 text-[var(--theme-text-muted)]">
                                            <Clock size={12} />
                                            <span className="text-[11px] font-mono tabular-nums">
                                                {po.approvedAt ? new Date(po.approvedAt).toLocaleString() : '-'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <span className="text-xs font-mono font-semibold text-[var(--theme-text-primary)]">{po.poNumber || po.id.slice(0, 8)}</span>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <span className="text-xs font-medium text-[var(--theme-text-secondary)]">{po.supplierName}</span>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        {(() => {
                                            const approver = resolveFulfillmentWorker({
                                                userId: po.approvedBy || po.receivedBy || po.createdBy,
                                                job: null,
                                                employees: [],
                                                sites: [],
                                                siteId: po.siteId
                                            });
                                            return (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                                                        <UserIcon size={11} className="text-primary" />
                                                    </div>
                                                    <span className="text-xs font-medium text-[var(--theme-text-secondary)] break-words leading-tight">
                                                        {po.approvedBy ? `${approver.name} (${approver.code || approver.displayId})` : '-'}
                                                    </span>
                                                </div>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <span className="text-xs font-mono tabular-nums text-[var(--theme-text-muted)]">{po.lineItems?.length || 0} items</span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                                            po.status === 'Approved' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' :
                                            po.status === 'Received' ? 'bg-primary/10 text-primary border border-primary/20' :
                                            'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-muted)] border border-[var(--theme-border)]'
                                        }`}>
                                            {po.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-4 flex justify-center">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredHistory.length}
                        itemsPerPage={DOCK_HISTORY_PER_PAGE}
                        onPageChange={setCurrentPage}
                        itemName="history"
                    />
                </div>
            )}
        </div>
    );
};
