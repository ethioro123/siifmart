import React, { useState, useMemo } from 'react';
import {
    History, Search, Edit, RefreshCw, Trash2, Plus,
    CheckCircle2, XCircle, User, Calendar, Tag, Package
} from 'lucide-react';
import { PendingInventoryChange, Product } from '../../../types';
import { formatDateTime } from '../../../utils/formatting';
import { renderChangeDiff } from './InventoryChangeDiff';

interface InventoryHistoryTableProps {
    historyChanges: PendingInventoryChange[];
    allProducts: Product[];
    currencySymbol?: string;
    onViewDetails: (change: PendingInventoryChange) => void;
}

export const InventoryHistoryTable: React.FC<InventoryHistoryTableProps> = ({
    historyChanges,
    allProducts,
    currencySymbol = 'KSh',
    onViewDetails
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<'All' | 'edit' | 'stock_adjustment' | 'create' | 'delete'>('All');
    const [statusFilter, setStatusFilter] = useState<'All' | 'approved' | 'rejected'>('All');

    const filteredHistory = useMemo(() => {
        return historyChanges.filter(item => {
            const matchesSearch = !searchTerm ||
                (item.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.productSku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.requestedBy || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.approvedBy || '').toLowerCase().includes(searchTerm.toLowerCase());

            const matchesType = typeFilter === 'All' || item.changeType === typeFilter;
            const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

            return matchesSearch && matchesType && matchesStatus;
        });
    }, [historyChanges, searchTerm, typeFilter, statusFilter]);

    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl overflow-hidden shadow-xs">
            {/* Header & Controls */}
            <div className="px-5 py-4 border-b border-[var(--theme-border)] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 flex items-center justify-center text-[var(--theme-accent)]">
                            <History size={16} />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-[var(--theme-text-primary)] tracking-tight">
                                Inventory Edit & Change History Log
                            </h3>
                            <p className="text-[12px] text-[var(--theme-text-secondary)]">
                                Audit trail of reviewed product modifications, field edits, and approvals
                            </p>
                        </div>
                    </div>

                    <span className="text-[11px] font-mono tabular-nums px-2.5 py-1 rounded-full bg-[var(--theme-bg-hover)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)] self-start sm:self-auto">
                        {filteredHistory.length} recorded
                    </span>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                    <div className="relative flex-1 min-w-[200px] max-w-xs">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Filter by product, SKU, user..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--theme-bg-hover)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] placeholder-[var(--theme-text-muted)] focus:outline-hidden focus:border-[var(--theme-accent)] transition-colors"
                        />
                    </div>

                    {/* Change Type Filter */}
                    <div className="flex items-center gap-1 bg-[var(--theme-bg-hover)]/60 p-1 rounded-xl border border-[var(--theme-border)] text-[11px]">
                        {(['All', 'edit', 'stock_adjustment', 'create', 'delete'] as const).map(type => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setTypeFilter(type)}
                                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                                    typeFilter === type
                                        ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-2xs'
                                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                                }`}
                            >
                                {type === 'All' ? 'All Types' : type === 'stock_adjustment' ? 'Stock Adj.' : type === 'edit' ? 'Edits' : type}
                            </button>
                        ))}
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-1 bg-[var(--theme-bg-hover)]/60 p-1 rounded-xl border border-[var(--theme-border)] text-[11px]">
                        {(['All', 'approved', 'rejected'] as const).map(status => (
                            <button
                                key={status}
                                type="button"
                                onClick={() => setStatusFilter(status)}
                                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                                    statusFilter === status
                                        ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-2xs'
                                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                                }`}
                            >
                                {status === 'All' ? 'All Status' : status === 'approved' ? 'Approved' : 'Rejected'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table Content */}
            {filteredHistory.length === 0 ? (
                <div className="p-12 text-center">
                    <div className="w-12 h-12 rounded-xl bg-[var(--theme-bg-hover)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-secondary)] mx-auto mb-3">
                        <History size={22} className="opacity-40" />
                    </div>
                    <p className="text-[13px] font-semibold text-[var(--theme-text-primary)]">No change history records found</p>
                    <p className="text-[12px] text-[var(--theme-text-secondary)] mt-0.5">Approved or rejected inventory edit requests will appear here with complete before-and-after audit logs.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[var(--theme-bg-hover)]/40 border-b border-[var(--theme-border)]">
                            <tr>
                                <th className="px-4 py-3 text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">Type</th>
                                <th className="px-4 py-3 text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">Product</th>
                                <th className="px-4 py-3 text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">SKU</th>
                                <th className="px-4 py-3 text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">What Changed</th>
                                <th className="px-4 py-3 text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">Requested By</th>
                                <th className="px-4 py-3 text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">Decision & Sign-Off</th>
                                <th className="px-4 py-3 text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider text-center">Audit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--theme-border)]">
                            {filteredHistory.map((item) => (
                                <tr key={item.id} className="hover:bg-[var(--theme-bg-hover)]/30 transition-colors">
                                    {/* Change Type */}
                                    <td className="px-4 py-3 align-top">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                                            item.changeType === 'edit'
                                                ? 'text-[var(--theme-accent)] border-[var(--theme-accent)]/20 bg-[var(--theme-accent)]/10'
                                                : item.changeType === 'delete'
                                                ? 'text-[#FF3B30] border-[#FF3B30]/20 bg-[#FF3B30]/10'
                                                : item.changeType === 'stock_adjustment'
                                                ? 'text-[#FF9F0A] border-[#FF9F0A]/20 bg-[#FF9F0A]/10'
                                                : 'text-[#34C759] border-[#34C759]/20 bg-[#34C759]/10'
                                        }`}>
                                            {item.changeType === 'stock_adjustment' ? 'Stock Adj.' : item.changeType}
                                        </span>
                                    </td>

                                    {/* Product */}
                                    <td className="px-4 py-3 font-medium text-[var(--theme-text-primary)] text-[13px] align-top">
                                        <div className="flex items-center gap-2">
                                            <Package size={14} className="text-[var(--theme-text-secondary)] shrink-0" />
                                            <span>{item.productName}</span>
                                        </div>
                                    </td>

                                    {/* SKU */}
                                    <td className="px-4 py-3 font-mono tabular-nums text-[12px] text-[var(--theme-text-secondary)] align-top">
                                        {item.productSku}
                                    </td>

                                    {/* What Changed */}
                                    <td className="px-4 py-3 text-[12px] text-[var(--theme-text-secondary)] align-top max-w-md">
                                        {item.changeType === 'edit' && (
                                            <div className="space-y-1">
                                                <div className="text-[11px] font-semibold text-[var(--theme-accent)] flex items-center gap-1">
                                                    <Edit size={11} />
                                                    <span>Field Modifications:</span>
                                                </div>
                                                {renderChangeDiff(item, allProducts)}
                                            </div>
                                        )}
                                        {item.changeType === 'stock_adjustment' && (
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5 font-mono text-[12px] font-semibold">
                                                    <RefreshCw size={11} className="text-[#FF9F0A]" />
                                                    <span className={item.adjustmentType === 'IN' ? 'text-[#34C759]' : 'text-[#FF3B30]'}>
                                                        {item.adjustmentType === 'IN' ? '+' : '-'}{item.adjustmentQty} units
                                                    </span>
                                                </div>
                                                {item.adjustmentReason && (
                                                    <p className="text-[11px] text-[var(--theme-text-secondary)]">Reason: {item.adjustmentReason}</p>
                                                )}
                                            </div>
                                        )}
                                        {item.changeType === 'create' && (
                                            <div className="text-[12px] text-[#34C759] font-medium flex items-center gap-1">
                                                <Plus size={12} />
                                                <span>New product created in catalog</span>
                                            </div>
                                        )}
                                        {item.changeType === 'delete' && (
                                            <div className="text-[12px] text-[#FF3B30] font-medium flex items-center gap-1">
                                                <Trash2 size={12} />
                                                <span>Product removal record</span>
                                            </div>
                                        )}
                                    </td>

                                    {/* Requested By */}
                                    <td className="px-4 py-3 text-[12px] text-[var(--theme-text-secondary)] font-medium align-top">
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-1.5 text-[var(--theme-text-primary)] font-semibold text-[12px]">
                                                <User size={12} className="text-[var(--theme-text-secondary)]" />
                                                <span>{item.requestedBy}</span>
                                            </div>
                                            <span className="text-[11px] text-[var(--theme-text-muted)] block font-mono">
                                                {item.requestedAt ? formatDateTime(item.requestedAt, { showTime: true }) : '—'}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Decision & Sign-Off */}
                                    <td className="px-4 py-3 text-[12px] align-top">
                                        {item.status === 'approved' ? (
                                            <div className="space-y-0.5">
                                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20">
                                                    <CheckCircle2 size={11} />
                                                    <span>Approved</span>
                                                </div>
                                                <p className="text-[11px] text-[var(--theme-text-primary)] font-semibold mt-1">
                                                    {item.approvedBy || 'Regional Operations Manager'}
                                                </p>
                                                <span className="text-[10px] text-[var(--theme-text-muted)] block font-mono">
                                                    {item.approvedAt ? formatDateTime(item.approvedAt, { showTime: true }) : ''}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="space-y-0.5">
                                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20">
                                                    <XCircle size={11} />
                                                    <span>Rejected</span>
                                                </div>
                                                <p className="text-[11px] text-[var(--theme-text-primary)] font-semibold mt-1">
                                                    {item.rejectedBy || 'Manager'}
                                                </p>
                                                {item.rejectionReason && (
                                                    <p className="text-[11px] text-[#FF3B30]/90 leading-tight">
                                                        {item.rejectionReason}
                                                    </p>
                                                )}
                                                <span className="text-[10px] text-[var(--theme-text-muted)] block font-mono">
                                                    {item.rejectedAt ? formatDateTime(item.rejectedAt, { showTime: true }) : ''}
                                                </span>
                                            </div>
                                        )}
                                    </td>

                                    {/* Audit Details */}
                                    <td className="px-4 py-3 text-center align-top">
                                        <button
                                            type="button"
                                            onClick={() => onViewDetails(item)}
                                            className="h-7 px-2.5 rounded-lg text-[11px] font-semibold bg-[var(--theme-bg-hover)] hover:bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] shadow-2xs transition-all active:scale-[0.98] cursor-pointer inline-flex items-center gap-1"
                                            title="View complete before-and-after audit diff"
                                        >
                                            <Search size={11} />
                                            <span>Diff</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
