
import React, { useState } from 'react';
import {
    Package, CheckCircle, Clock, User, Edit, Trash2, RefreshCw, Plus, Search, XCircle, ArrowRight
} from 'lucide-react';
import Button from '../shared/Button';
import Modal from '../Modal';
import { formatDateTime } from '../../utils/formatting';
import { Product, PendingInventoryChange } from '../../types';
import { CURRENCY_SYMBOL } from '../../constants';
import { InventoryRequestDetailsModal } from './components/InventoryRequestDetailsModal';
import { InventoryRejectionModal } from './components/InventoryRejectionModal';
import { renderChangeDiff, DetailedComparison } from './components/InventoryChangeDiff';
import {
    isPriceChangeRequest,
    requiresFinanceCoApproval,
    canApproveBelowFloor
} from '../../utils/pricingGovernance';

interface InventoryPendingProps {
    pendingProducts: Product[];
    pendingChanges: PendingInventoryChange[];
    allProducts: Product[];
    canApprove: boolean;
    isSubmitting: boolean;
    userRole?: string;
    currencySymbol?: string;
    onApproveProduct: (product: Product) => void;
    onApproveChange: (change: PendingInventoryChange) => void;
    onRejectProduct: (product: Product, reason: string) => void;
    onRejectChange: (change: PendingInventoryChange, reason: string) => void;
    onBulkCleanup: () => void;
}

export const InventoryPending: React.FC<InventoryPendingProps> = ({
    pendingProducts,
    pendingChanges,
    allProducts,
    canApprove,
    isSubmitting,
    userRole,
    currencySymbol = CURRENCY_SYMBOL,
    onApproveProduct,
    onApproveChange,
    onRejectProduct,
    onRejectChange,
    onBulkCleanup
}) => {
    // --- LOCAL STATE FOR MODALS ---
    const [isRequestDetailsModalOpen, setIsRequestDetailsModalOpen] = useState(false);
    const [requestForDetails, setRequestForDetails] = useState<PendingInventoryChange | null>(null);

    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
    const [selectedPendingProduct, setSelectedPendingProduct] = useState<Product | null>(null);
    const [selectedPendingChange, setSelectedPendingChange] = useState<PendingInventoryChange | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    // --- ROLE-BASED APPROVAL CHECK ---
    const canApproveThisChange = (change: PendingInventoryChange): boolean => {
        if (!canApprove) return false;
        const role = userRole?.toLowerCase() || '';
        if (requiresFinanceCoApproval(change)) {
            return canApproveBelowFloor(role);
        }
        // Super admin, admin, warehouse_manager, procurement_manager, store_manager can approve changes
        if (['super_admin', 'admin', 'warehouse_manager', 'procurement_manager', 'store_manager', 'operations_manager', 'regional_manager'].includes(role)) return true;
        const requiredRole = change.approvalRole || (change as any).approval_role;
        // No specific role required → use the existing canApprove
        if (!requiredRole) return true;
        // Check if user's role matches the required approval role
        if (requiredRole === 'procurement_manager' && (role === 'procurement_manager' || role === 'procurement')) return true;
        if (requiredRole === 'warehouse_manager' && (role === 'warehouse_manager' || role === 'manager' || role === 'warehouse')) return true;
        if (requiredRole === 'store_manager' && (role === 'store_manager' || role === 'manager')) return true;
        return false;
    };

    const getAwaitingLabel = (change: PendingInventoryChange): string => {
        if (requiresFinanceCoApproval(change)) return 'Awaiting Finance Co-Approval (< 15% Margin)';
        const requiredRole = change.approvalRole || (change as any).approval_role;
        if (requiredRole === 'procurement_manager') return 'Awaiting Procurement Manager';
        if (requiredRole === 'warehouse_manager') return 'Awaiting Warehouse Manager';
        if (requiredRole === 'store_manager') return 'Awaiting Store Manager';
        return 'Awaiting Manager Approval';
    };


    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Pending Products Section */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl overflow-hidden shadow-xs">
                <div className="px-5 py-4 border-b border-[var(--theme-border)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#FF9F0A]/10 border border-[#FF9F0A]/20 flex items-center justify-center text-[#FF9F0A]">
                            <Package size={16} />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-[var(--theme-text-primary)] tracking-tight">New Products Awaiting Approval</h3>
                            <p className="text-[12px] text-[var(--theme-text-secondary)]">Catalogue additions pending manager review</p>
                        </div>
                    </div>
                    <span className="text-[11px] font-mono tabular-nums px-2.5 py-1 rounded-full bg-[var(--theme-bg-hover)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]">
                        {pendingProducts.length} pending
                    </span>
                </div>

                {pendingProducts.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-12 h-12 rounded-xl bg-[#34C759]/10 border border-[#34C759]/20 flex items-center justify-center text-[#34C759] mx-auto mb-3">
                            <CheckCircle size={22} />
                        </div>
                        <p className="text-[13px] font-semibold text-[var(--theme-text-primary)]">No products awaiting approval</p>
                        <p className="text-[12px] text-[var(--theme-text-secondary)] mt-0.5">All new catalog submissions have been reviewed.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[var(--theme-bg-hover)]/40 border-b border-[var(--theme-border)]">
                                <tr>
                                    <th className="px-4 py-3 text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">Product</th>
                                    <th className="px-4 py-3 text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">SKU</th>
                                    <th className="px-4 py-3 text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">Category</th>
                                    <th className="px-4 py-3 text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider text-right">Price</th>
                                    <th className="px-4 py-3 text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">Created By</th>
                                    <th className="px-4 py-3 text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">Created At</th>
                                    <th className="px-4 py-3 text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--theme-border)]">
                                {pendingProducts.map((prod) => (
                                    <tr key={prod.id} className="hover:bg-[var(--theme-bg-hover)]/40 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-[var(--theme-bg-hover)] border border-[var(--theme-border)] flex items-center justify-center shrink-0 overflow-hidden">
                                                    {prod.image && !prod.image.includes('placeholder.com') ? (
                                                        <img
                                                            src={prod.image}
                                                            alt={prod.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                            }}
                                                        />
                                                    ) : (
                                                        <Package size={15} className="text-[var(--theme-text-secondary)]" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-[var(--theme-text-primary)] text-[13px]">{prod.name}</p>
                                                    <p className="text-[11px] text-[var(--theme-text-secondary)] font-medium">{prod.brand}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-mono tabular-nums text-[12px] text-[var(--theme-text-secondary)]">{prod.sku}</td>
                                        <td className="px-4 py-3 text-[12px] text-[var(--theme-text-secondary)]">{prod.category}</td>
                                        <td className="px-4 py-3 text-[13px] font-mono tabular-nums font-semibold text-[var(--theme-text-primary)] text-right">{currencySymbol} {prod.price?.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-[12px] text-[var(--theme-text-secondary)] font-medium">
                                            <div className="flex items-center gap-1.5">
                                                <User size={13} className="text-[var(--theme-text-secondary)]" />
                                                <span>{prod.createdBy || prod.created_by || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-[12px] tabular-nums text-[var(--theme-text-secondary)]">
                                            {prod.createdAt || prod.created_at ? formatDateTime(prod.createdAt || prod.created_at || '') : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1.5">
                                                {canApprove ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => onApproveProduct(prod)}
                                                            disabled={isSubmitting}
                                                            className="h-7 px-2.5 rounded-lg text-[11px] font-semibold bg-[#34C759] text-white hover:opacity-95 shadow-xs transition-all active:scale-[0.98] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                                        >
                                                            <CheckCircle size={12} />
                                                            <span>Approve</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const pseudoRequest: PendingInventoryChange = {
                                                                    id: 'view-only',
                                                                    productId: prod.id,
                                                                    productName: prod.name,
                                                                    productSku: prod.sku,
                                                                    changeType: 'create',
                                                                    proposedChanges: prod as any,
                                                                    requestedBy: (prod as any).createdBy || (prod as any).created_by || 'Unknown',
                                                                    requestedAt: (prod as any).createdAt || (prod as any).created_at || '',
                                                                    status: 'pending',
                                                                    siteId: prod.siteId || (prod as any).site_id || ''
                                                                };
                                                                setRequestForDetails(pseudoRequest);
                                                                setIsRequestDetailsModalOpen(true);
                                                            }}
                                                            className="h-7 px-2.5 rounded-lg text-[11px] font-semibold bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-hover)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] shadow-xs transition-all active:scale-[0.98] flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <Search size={12} />
                                                            <span>Details</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => { setSelectedPendingProduct(prod); setIsApprovalModalOpen(true); }}
                                                            className="h-7 px-2.5 rounded-lg text-[11px] font-semibold bg-[#FF3B30]/10 hover:bg-[#FF3B30]/15 text-[#FF3B30] border border-[#FF3B30]/20 shadow-xs transition-all active:scale-[0.98] flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <XCircle size={12} />
                                                            <span>Reject</span>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div className="flex items-center justify-center">
                                                        <span className="text-[11px] text-[#FF9F0A] border border-[#FF9F0A]/20 px-2.5 py-1 bg-[#FF9F0A]/10 rounded-full flex items-center gap-1 font-semibold">
                                                            <Clock size={11} /> Awaiting Approval
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pending Changes Section */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl overflow-hidden shadow-xs">
                <div className="px-5 py-4 border-b border-[var(--theme-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 flex items-center justify-center text-[var(--theme-accent)]">
                            <Edit size={16} />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-[var(--theme-text-primary)] tracking-tight">Change Requests Awaiting Approval</h3>
                            <p className="text-[12px] text-[var(--theme-text-secondary)]">Field edits, stock adjustments, and deletion proposals</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono tabular-nums px-2.5 py-1 rounded-full bg-[var(--theme-bg-hover)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]">
                            {pendingChanges.length} pending
                        </span>
                        {canApprove && pendingChanges.length > 0 && (
                            <button
                                type="button"
                                onClick={onBulkCleanup}
                                className="h-8 px-3 rounded-lg text-[12px] font-semibold bg-[#FF3B30]/10 text-[#FF3B30] hover:bg-[#FF3B30]/15 border border-[#FF3B30]/20 shadow-xs active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                                <Trash2 size={13} />
                                <span>Clear Ghost Requests</span>
                            </button>
                        )}
                    </div>
                </div>
                {pendingChanges.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-12 h-12 rounded-xl bg-[#34C759]/10 border border-[#34C759]/20 flex items-center justify-center text-[#34C759] mx-auto mb-3">
                            <CheckCircle size={22} />
                        </div>
                        <p className="text-[13px] font-semibold text-[var(--theme-text-primary)]">No pending change requests</p>
                        <p className="text-[12px] text-[var(--theme-text-secondary)] mt-0.5">All operational change proposals have been reviewed.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[var(--theme-bg-hover)]/40 border-b border-[var(--theme-border)]">
                                <tr>
                                    <th className="px-4 py-3 text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">Request Type</th>
                                    <th className="px-4 py-3 text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">Product</th>
                                    <th className="px-4 py-3 text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">SKU</th>
                                    <th className="px-4 py-3 text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">Details</th>
                                    <th className="px-4 py-3 text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">Requested By</th>
                                    <th className="px-4 py-3 text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">Requested At</th>
                                    <th className="px-4 py-3 text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--theme-border)]">
                                {pendingChanges.map((change) => (
                                    <tr key={change.id} className="hover:bg-[var(--theme-bg-hover)]/40 transition-colors">
                                        <td className="px-4 py-3">
                                            {isPriceChangeRequest(change) ? (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border text-[var(--theme-accent)] border-[var(--theme-accent)]/20 bg-[var(--theme-accent)]/10 inline-block w-fit">
                                                        Price Change
                                                    </span>
                                                    {requiresFinanceCoApproval(change) && (
                                                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border text-[#FF3B30] border-[#FF3B30]/20 bg-[#FF3B30]/10 inline-block w-fit">
                                                            &lt; 15% Margin
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                                                    change.changeType === 'edit'
                                                        ? 'text-[var(--theme-accent)] border-[var(--theme-accent)]/20 bg-[var(--theme-accent)]/10'
                                                        : change.changeType === 'delete'
                                                        ? 'text-[#FF3B30] border-[#FF3B30]/20 bg-[#FF3B30]/10'
                                                        : 'text-[#FF9F0A] border-[#FF9F0A]/20 bg-[#FF9F0A]/10'
                                                }`}>
                                                    {change.changeType === 'stock_adjustment' ? 'Stock Adj.' : change.changeType}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-[var(--theme-text-primary)] text-[13px]">{change.productName}</td>
                                        <td className="px-4 py-3 font-mono tabular-nums text-[12px] text-[var(--theme-text-secondary)]">{change.productSku}</td>
                                        <td className="px-4 py-3 text-[12px] text-[var(--theme-text-secondary)]">
                                            {change.changeType === 'delete' && (
                                                <span className="flex items-center gap-1.5 text-[#FF3B30] font-semibold text-[12px]">
                                                    <Trash2 size={12} /> Permanently delete product
                                                </span>
                                            )}
                                            {change.changeType === 'edit' && (
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-[var(--theme-accent)] font-semibold text-[11px] flex items-center gap-1">
                                                            <Edit size={11} /> Field Updates Requested:
                                                        </span>
                                                        {requiresFinanceCoApproval(change) && (
                                                            <span className="text-[11px] font-semibold text-[#FF3B30] bg-[#FF3B30]/10 border border-[#FF3B30]/20 px-2 py-0.5 rounded-full">
                                                                Finance Co-Approval Required
                                                            </span>
                                                        )}
                                                    </div>
                                                    {renderChangeDiff(change, allProducts)}
                                                </div>
                                            )}
                                            {change.changeType === 'stock_adjustment' && (
                                                <div className="space-y-1">
                                                    <span className="text-[#FF9F0A] font-semibold text-[11px] flex items-center gap-1">
                                                        <RefreshCw size={11} /> Stock Adjustment:
                                                    </span>
                                                    <span className={`font-mono tabular-nums font-semibold text-[12px] ${change.adjustmentType === 'IN' ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                                                        {change.adjustmentType === 'IN' ? '+' : '-'}{change.adjustmentQty} units
                                                    </span>
                                                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">Reason: {change.adjustmentReason}</p>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-[12px] text-[var(--theme-text-secondary)] font-medium">
                                            <div className="flex items-center gap-1.5">
                                                <User size={13} className="text-[var(--theme-text-secondary)]" />
                                                <span>{change.requestedBy}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-[12px] tabular-nums text-[var(--theme-text-secondary)]">
                                            {formatDateTime(change.requestedAt || (change as any).requested_at || '', { showTime: true })}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {canApproveThisChange(change) ? (
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => onApproveChange(change)}
                                                        disabled={isSubmitting}
                                                        className="h-7 px-2.5 rounded-lg text-[11px] font-semibold bg-[#34C759] text-white hover:opacity-95 shadow-xs transition-all active:scale-[0.98] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                                    >
                                                        <CheckCircle size={12} />
                                                        <span>Approve</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setRequestForDetails(change);
                                                            setIsRequestDetailsModalOpen(true);
                                                        }}
                                                        className="h-7 px-2.5 rounded-lg text-[11px] font-semibold bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-hover)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] shadow-xs transition-all active:scale-[0.98] flex items-center gap-1 cursor-pointer"
                                                    >
                                                        <Search size={12} />
                                                        <span>Details</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => { setSelectedPendingChange(change); setIsApprovalModalOpen(true); }}
                                                        className="h-7 px-2.5 rounded-lg text-[11px] font-semibold bg-[#FF3B30]/10 hover:bg-[#FF3B30]/15 text-[#FF3B30] border border-[#FF3B30]/20 shadow-xs transition-all active:scale-[0.98] flex items-center gap-1 cursor-pointer"
                                                    >
                                                        <XCircle size={12} />
                                                        <span>Reject</span>
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-[11px] text-[#FF9F0A] border border-[#FF9F0A]/20 px-2.5 py-1 bg-[#FF9F0A]/10 rounded-full inline-flex items-center gap-1 font-semibold">
                                                    <Clock size={11} /> {getAwaitingLabel(change)}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>            {/* Detailed Request Modal */}
            <InventoryRequestDetailsModal
                isOpen={isRequestDetailsModalOpen}
                onClose={() => {
                    setIsRequestDetailsModalOpen(false);
                    setRequestForDetails(null);
                }}
                requestForDetails={requestForDetails}
                canApprove={canApprove}
                canApproveThisChange={canApproveThisChange}
                getAwaitingLabel={getAwaitingLabel}
                onApproveProduct={onApproveProduct}
                onApproveChange={onApproveChange}
                pendingProducts={pendingProducts}
                setSelectedPendingProduct={setSelectedPendingProduct}
                setSelectedPendingChange={setSelectedPendingChange}
                setIsApprovalModalOpen={setIsApprovalModalOpen}
            >
                <DetailedComparison requestForDetails={requestForDetails} allProducts={allProducts} />
            </InventoryRequestDetailsModal>

            {/* Approval/Rejection Modal */}
            <InventoryRejectionModal
                isOpen={isApprovalModalOpen}
                onClose={() => {
                    setIsApprovalModalOpen(false);
                    setSelectedPendingProduct(null);
                    setSelectedPendingChange(null);
                    setRejectionReason('');
                }}
                rejectionReason={rejectionReason}
                setRejectionReason={setRejectionReason}
                isSubmitting={isSubmitting}
                selectedPendingProduct={selectedPendingProduct}
                selectedPendingChange={selectedPendingChange}
                onRejectProduct={onRejectProduct}
                onRejectChange={onRejectChange}
            />
        </div>
    );
};
