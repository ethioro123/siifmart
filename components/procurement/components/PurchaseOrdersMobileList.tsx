import React from 'react';
import { Edit3, Trash2 } from 'lucide-react';
import { PurchaseOrder } from '../../../types';

interface PurchaseOrdersMobileListProps {
    orders: PurchaseOrder[];
    sites: any[];
    user: any;
    canApprove: boolean;
    isCEO: boolean;
    selectedPOIds: string[];
    setSelectedPOIds: React.Dispatch<React.SetStateAction<string[]>>;
    setSelectedPO: (po: PurchaseOrder) => void;
    handleSingleApprove: (e: React.MouseEvent, po: PurchaseOrder) => void;
    onEdit: (po: PurchaseOrder) => void;
    handleDeletePO: (e: React.MouseEvent, po: PurchaseOrder) => void;
    formatPONumber: (po: PurchaseOrder) => string;
    currencySymbol?: string;
}

export const PurchaseOrdersMobileList: React.FC<PurchaseOrdersMobileListProps> = ({
    orders,
    sites,
    user,
    canApprove,
    isCEO,
    selectedPOIds,
    setSelectedPOIds,
    setSelectedPO,
    handleSingleApprove,
    onEdit,
    handleDeletePO,
    formatPONumber,
    currencySymbol = 'ETB'
}) => {
    const renderPriorityBadge = (priority?: string) => {
        const p = (priority || 'Normal').toLowerCase();
        if (p === 'urgent' || p === 'high') {
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold tracking-wide uppercase bg-red-500/10 text-red-500 border border-red-500/20">
                    {priority || 'Normal'}
                </span>
            );
        }
        if (p === 'low') {
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold tracking-wide uppercase bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]">
                    {priority || 'Normal'}
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold tracking-wide uppercase bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]">
                {priority || 'Normal'}
            </span>
        );
    };

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'Received':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        Received
                    </span>
                );
            case 'Partially Received':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        Partially Received
                    </span>
                );
            case 'Approved':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/20">
                        Approved
                    </span>
                );
            case 'Ordered':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                        Ordered
                    </span>
                );
            case 'Draft':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]">
                        Draft
                    </span>
                );
            case 'Pending':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        Pending
                    </span>
                );
            case 'Cancelled':
            case 'Rejected':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20">
                        {status}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]">
                        {status}
                    </span>
                );
        }
    };

    return (
        <div className="md:hidden space-y-3 p-4">
            {orders.map((po) => {
                const isDraft = po.status === 'Draft';
                const isSelected = selectedPOIds.includes(po.id);
                return (
                    <div
                        key={po.id}
                        onClick={() => setSelectedPO(po)}
                        className={`p-4 rounded-2xl space-y-3 cursor-pointer border transition-all duration-150 bg-[var(--theme-bg-panel)] shadow-sm active:scale-[0.99] ${
                            isSelected
                                ? 'border-[var(--theme-accent)] ring-1 ring-[var(--theme-accent)]/30'
                                : 'border-[var(--theme-border)] hover:border-[var(--theme-border-focus)]'
                        }`}
                    >
                        {/* Header: PO Num & status */}
                        <div className="flex justify-between items-center gap-2">
                            <div className="flex items-center gap-2">
                                {user?.role === 'super_admin' && (
                                    <div onClick={(e) => e.stopPropagation()}>
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
                                        ) : <div className="w-4 h-4" />}
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-mono font-semibold text-[var(--theme-text-primary)] tabular-nums">{formatPONumber(po)}</span>
                                    {renderPriorityBadge(po.priority)}
                                </div>
                            </div>
                            {renderStatusBadge(po.status)}
                        </div>

                        {/* Middle detail: Supplier & Destination */}
                        <div className="grid grid-cols-2 gap-2 text-left bg-[var(--theme-bg-subtle)] p-3 rounded-xl border border-[var(--theme-border-subtle)]">
                            <div>
                                <span className="text-[9px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider block">Supplier</span>
                                <p className="text-xs text-[var(--theme-text-primary)] font-medium mt-0.5 truncate">{po.supplierName}</p>
                            </div>
                            <div>
                                <span className="text-[9px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider block">Destination</span>
                                <p className="text-xs text-[var(--theme-text-secondary)] font-medium mt-0.5 truncate">
                                    {po.destination || sites.find((s: any) => s.id === po.siteId)?.name || 'Central Operations'}
                                </p>
                            </div>
                        </div>

                        {/* Expected and items/amount */}
                        <div className="flex items-center justify-between text-xs font-mono">
                            <div className="flex flex-col text-left">
                                <span className="text-[9px] text-[var(--theme-text-secondary)] font-sans font-semibold uppercase tracking-wider">Expected</span>
                                <span className="text-xs text-[var(--theme-text-secondary)] tabular-nums mt-0.5">{po.expectedDelivery || 'N/A'}</span>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] text-[var(--theme-text-secondary)] font-sans font-semibold uppercase tracking-wider">Items</span>
                                    <span className="text-xs text-[var(--theme-text-secondary)] tabular-nums mt-0.5">{po.itemsCount}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] text-[var(--theme-text-secondary)] font-sans font-semibold uppercase tracking-wider">Amount</span>
                                    <span className="text-xs text-[var(--theme-text-primary)] font-semibold tabular-nums mt-0.5">{po.currency || currencySymbol} {po.totalAmount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions & request info */}
                        <div className="flex items-center justify-between pt-1 border-t border-[var(--theme-border-subtle)]">
                            <span className="text-[10px] text-[var(--theme-text-secondary)]">By: {po.requestedBy || po.createdBy || 'Unknown'}</span>
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <button
                                    onClick={() => setSelectedPO(po)}
                                    className="h-7 px-3 text-[11px] font-medium rounded-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] transition-all active:scale-[0.98]"
                                >
                                    Details
                                </button>
                                {isDraft && canApprove && (
                                    <button
                                        onClick={(e) => handleSingleApprove(e, po)}
                                        className="h-7 px-3 text-[11px] font-medium rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20 transition-all active:scale-[0.98]"
                                    >
                                        Approve
                                    </button>
                                )}
                                {((isCEO && po.status !== 'Received') ||
                                    (user?.role === 'warehouse_manager' && po.status !== 'Received') ||
                                    (po.status === 'Draft' && (po.createdBy === user?.name || po.requestedBy === user?.name))) && (
                                    <button
                                        onClick={() => onEdit(po)}
                                        className="w-7 h-7 rounded-full flex items-center justify-center border border-transparent hover:border-[var(--theme-border)] hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-all active:scale-[0.95]"
                                        title="Edit PO"
                                        aria-label="Edit Purchase Order"
                                    >
                                        <Edit3 size={13} />
                                    </button>
                                )}
                                {((isCEO && po.status !== 'Received' && po.status !== 'Cancelled') ||
                                    (['head_of_procurement', 'country_managing_director', 'admin', 'super_admin', 'CEO', 'ceo'].includes(user?.role || '') && po.status !== 'Received' && po.status !== 'Cancelled') ||
                                    (po.status === 'Draft' && (po.createdBy === user?.name || po.requestedBy === user?.name))) && (
                                    <button
                                        onClick={(e) => handleDeletePO(e, po)}
                                        className="w-7 h-7 rounded-full flex items-center justify-center border border-transparent hover:border-red-500/30 hover:bg-red-500/10 text-[var(--theme-text-secondary)] hover:text-red-400 transition-all active:scale-[0.95]"
                                        title="Cancel PO"
                                        aria-label="Cancel Purchase Order"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
            {orders.length === 0 && (
                <div className="p-8 text-center text-xs text-[var(--theme-text-secondary)]">No active purchase orders found.</div>
            )}
        </div>
    );
};
