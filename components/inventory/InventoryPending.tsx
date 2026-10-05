
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
                <div className="p-6 border-b border-[var(--theme-border)] flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-amber-600 dark:text-amber-500 flex items-center gap-2">
                            <Package size={18} /> New Products Awaiting Approval
                        </h3>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-1">{pendingProducts.length} products pending review</p>
                    </div>
                </div>

                {pendingProducts.length === 0 ? (
                    <div className="p-12 text-center text-[var(--theme-text-muted)]">
                        <CheckCircle size={48} className="mx-auto opacity-30 mb-4" />
                        <p>No pending products awaiting approval.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead><tr className="bg-[var(--theme-bg-panel)] border-b border-[var(--theme-border)]">
                                <th className="p-4 text-xs text-[var(--theme-text-secondary)] uppercase font-bold">Product</th>
                                <th className="p-4 text-xs text-[var(--theme-text-secondary)] uppercase font-bold">SKU</th>
                                <th className="p-4 text-xs text-[var(--theme-text-secondary)] uppercase font-bold">Category</th>
                                <th className="p-4 text-xs text-[var(--theme-text-secondary)] uppercase font-bold text-right">Price</th>
                                <th className="p-4 text-xs text-[var(--theme-text-secondary)] uppercase font-bold">Created By</th>
                                <th className="p-4 text-xs text-[var(--theme-text-secondary)] uppercase font-bold">Created At</th>
                                <th className="p-4 text-xs text-[var(--theme-text-secondary)] uppercase font-bold text-center">Actions</th>
                            </tr></thead>
                            <tbody className="divide-y divide-[var(--theme-border)]">
                                {pendingProducts.map((prod) => (
                                    <tr key={prod.id} className="hover:bg-[var(--theme-bg-panel-hover)]">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                    {prod.image && !prod.image.includes('placeholder.com') ? (
                                                        <img
                                                            src={prod.image}
                                                            alt={prod.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                                (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="text-[var(--theme-text-muted)]"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                                            }}
                                                        />
                                                    ) : (
                                                        <Package size={16} className="text-[var(--theme-text-muted)] animate-pulse" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-[var(--theme-text-primary)] text-sm">{prod.name}</p>
                                                    <p className="text-[10px] text-[var(--theme-text-secondary)]">{prod.brand}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono text-xs text-[var(--theme-text-secondary)]">{prod.sku}</td>
                                        <td className="p-4 text-xs text-[var(--theme-text-secondary)]">{prod.category}</td>
                                        <td className="p-4 text-sm font-bold text-[var(--theme-text-primary)] text-right">{currencySymbol} {prod.price?.toLocaleString()}</td>
                                        <td className="p-4 text-xs text-[var(--theme-text-primary)] flex items-center gap-1 font-bold">
                                            <User size={12} className="text-[var(--theme-text-secondary)]" /> {prod.createdBy || prod.created_by || 'Unknown'}
                                        </td>
                                        <td className="p-4 text-xs text-[var(--theme-text-secondary)]">
                                            {prod.createdAt || prod.created_at ? formatDateTime(prod.createdAt || prod.created_at || '') : '-'}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2">
                                                {canApprove ? (
                                                    <>
                                                        <Button
                                                            onClick={() => onApproveProduct(prod)}
                                                            disabled={isSubmitting}
                                                            loading={isSubmitting}
                                                            variant="success"
                                                            size="sm"
                                                            icon={<CheckCircle size={14} />}
                                                            className="px-3 py-1.5 font-bold"
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
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
                                                            variant="ghost"
                                                            size="sm"
                                                            icon={<Search size={14} />}
                                                            className="px-3 py-1.5 bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] font-bold hover:bg-[var(--theme-bg-panel-hover)]"
                                                        >
                                                            Details
                                                        </Button>
                                                        <Button
                                                            onClick={() => { setSelectedPendingProduct(prod); setIsApprovalModalOpen(true); }}
                                                            variant="danger"
                                                            size="sm"
                                                            icon={<XCircle size={14} />}
                                                            className="px-3 py-1.5 font-bold"
                                                        >
                                                            Reject
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <div className="flex items-center justify-center">
                                                        <span className="text-xs text-amber-600 dark:text-amber-500/80 italic border border-amber-500/20 px-3 py-1 bg-amber-500/10 rounded-lg flex items-center gap-1">
                                                            <Clock size={12} /> Awaiting CEO
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
                <div className="p-6 border-b border-[var(--theme-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-orange-600 dark:text-orange-500 flex items-center gap-2">
                            <Edit size={18} /> Change Requests Awaiting Approval
                        </h3>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-1">{pendingChanges.length} change requests pending review</p>
                    </div>
                    {canApprove && pendingChanges.length > 0 && (
                        <Button
                            onClick={onBulkCleanup}
                            variant="danger"
                            size="sm"
                            icon={<Trash2 size={14} />}
                            className="px-4 py-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold active:scale-[0.98]"
                        >
                            Clear Ghost Requests
                        </Button>
                    )}
                </div>
                {pendingChanges.length === 0 ? (
                    <div className="p-12 text-center text-[var(--theme-text-muted)]">
                        <CheckCircle size={48} className="mx-auto opacity-30 mb-4" />
                        <p>No pending change requests.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead><tr className="bg-[var(--theme-bg-panel)] border-b border-[var(--theme-border)]">
                                <th className="p-4 text-xs text-[var(--theme-text-secondary)] uppercase font-bold">Request Type</th>
                                <th className="p-4 text-xs text-[var(--theme-text-secondary)] uppercase font-bold">Product</th>
                                <th className="p-4 text-xs text-[var(--theme-text-secondary)] uppercase font-bold">SKU</th>
                                <th className="p-4 text-xs text-[var(--theme-text-secondary)] uppercase font-bold">Details</th>
                                <th className="p-4 text-xs text-[var(--theme-text-secondary)] uppercase font-bold">Requested By</th>
                                <th className="p-4 text-xs text-[var(--theme-text-secondary)] uppercase font-bold">Requested At</th>
                                <th className="p-4 text-xs text-[var(--theme-text-secondary)] uppercase font-bold text-center">Actions</th>
                            </tr></thead>
                            <tbody className="divide-y divide-[var(--theme-border)]">
                                {pendingChanges.map((change) => (
                                    <tr key={change.id} className="hover:bg-[var(--theme-bg-panel-hover)]">
                                        <td className="p-4">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase border ${change.changeType === 'edit' ? 'text-blue-500 border-blue-500/20 bg-blue-500/10' :
                                                change.changeType === 'delete' ? 'text-rose-500 border-rose-500/20 bg-rose-500/10' :
                                                    'text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-500/10'
                                                }`}>
                                                {change.changeType === 'stock_adjustment' ? 'Stock Adj.' : change.changeType}
                                            </span>
                                        </td>
                                        <td className="p-4 font-semibold text-[var(--theme-text-primary)] text-sm">{change.productName}</td>
                                        <td className="p-4 font-mono text-xs text-[var(--theme-text-secondary)]">{change.productSku}</td>
                                        <td className="p-4 text-xs text-[var(--theme-text-secondary)]">
                                            {change.changeType === 'delete' && (
                                                <span className="flex items-center gap-2 text-rose-500 font-medium">
                                                    <Trash2 size={12} /> Permanently delete this product
                                                </span>
                                            )}
                                            {change.changeType === 'edit' && (
                                                <div className="space-y-1">
                                                    <span className="text-blue-500 font-medium flex items-center gap-1">
                                                        <Edit size={12} /> Field Updates Requested:
                                                    </span>
                                                    {renderChangeDiff(change, allProducts)}
                                                </div>
                                            )}
                                            {change.changeType === 'stock_adjustment' && (
                                                <div className="space-y-1">
                                                    <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                                                        <RefreshCw size={12} /> Stock Adjustment:
                                                    </span>
                                                    <span className={change.adjustmentType === 'IN' ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                                                        {change.adjustmentType === 'IN' ? '+' : '-'}{change.adjustmentQty} units
                                                    </span>
                                                    <p className="text-[10px] text-[var(--theme-text-secondary)] italic mt-0.5">Reason: {change.adjustmentReason}</p>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-xs text-[var(--theme-text-primary)] flex items-center gap-1 font-bold">
                                            <User size={12} className="text-[var(--theme-text-secondary)]" /> {change.requestedBy}
                                        </td>
                                        <td className="p-4 text-xs text-[var(--theme-text-secondary)]">
                                            {formatDateTime(change.requestedAt || (change as any).requested_at || '', { showTime: true })}
                                        </td>
                                        <td className="p-4 text-center">
                                            {canApproveThisChange(change) ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button
                                                        onClick={() => onApproveChange(change)}
                                                        disabled={isSubmitting}
                                                        loading={isSubmitting}
                                                        variant="success"
                                                        size="sm"
                                                        icon={<CheckCircle size={14} />}
                                                        className="px-3 py-1.5 font-bold"
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        onClick={() => {
                                                            setRequestForDetails(change);
                                                            setIsRequestDetailsModalOpen(true);
                                                        }}
                                                        variant="ghost"
                                                        size="sm"
                                                        icon={<Search size={14} />}
                                                        className="px-3 py-1.5 bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] font-bold hover:bg-[var(--theme-bg-panel-hover)]"
                                                    >
                                                        Details
                                                    </Button>
                                                    <Button
                                                        onClick={() => { setSelectedPendingChange(change); setIsApprovalModalOpen(true); }}
                                                        variant="danger"
                                                        size="sm"
                                                        icon={<XCircle size={14} />}
                                                        className="px-3 py-1.5 font-bold"
                                                    >
                                                        Reject
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-amber-500/50 italic">{getAwaitingLabel(change)}</span>
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
