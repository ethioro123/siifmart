
import React, { useState } from 'react';
import {
    Package, CheckCircle, Clock, User, Edit, Trash2, RefreshCw, Plus, Search, XCircle, ArrowRight
} from 'lucide-react';
import Button from '../shared/Button';
import Modal from '../Modal';
import { formatDateTime } from '../../utils/formatting';
import { Product, PendingInventoryChange } from '../../types';
import { InventoryRequestDetailsModal } from './components/InventoryRequestDetailsModal';
import { InventoryRejectionModal } from './components/InventoryRejectionModal';

const CURRENCY_SYMBOL = 'ETB '; // Should probably be a prop or context, but defined as constant in Inventory.tsx

interface InventoryPendingProps {
    pendingProducts: Product[];
    pendingChanges: PendingInventoryChange[];
    allProducts: Product[];
    canApprove: boolean;
    isSubmitting: boolean;
    userRole?: string;
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
        // Super admin can approve everything
        if (role === 'super_admin') return true;
        const requiredRole = change.approvalRole || (change as any).approval_role;
        // No specific role required → use the existing canApprove
        if (!requiredRole) return true;
        // Check if user's role matches the required approval role
        if (requiredRole === 'procurement_manager' && (role === 'procurement_manager' || role === 'procurement')) return true;
        if (requiredRole === 'warehouse_manager' && (role === 'warehouse_manager' || role === 'manager' || role === 'warehouse')) return true;
        return false;
    };

    const getAwaitingLabel = (change: PendingInventoryChange): string => {
        const requiredRole = change.approvalRole || (change as any).approval_role;
        if (change.changeType === 'edit' || change.changeType === 'create') return 'Awaiting CEO Approval';
        if (requiredRole === 'procurement_manager') return 'Awaiting Procurement Manager';
        if (requiredRole === 'warehouse_manager') return 'Awaiting Warehouse Manager';
        return 'Awaiting CEO Approval';
    };

    // --- HELPER: Render Diff ---
    const renderChangeDiff = (change: PendingInventoryChange) => {
        if (change.changeType !== 'edit' || !change.proposedChanges) return null;

        const original = allProducts.find(p => p.id === change.productId);
        if (!original) return <span className="text-gray-500 italic">Original product not found</span>;

        const diffs: React.ReactNode[] = [];
        const propsToCompare: (keyof Product)[] = ['name', 'category', 'price', 'costPrice', 'salePrice', 'stock', 'sku', 'location', 'image'];

        propsToCompare.forEach(prop => {
            const oldValue = original[prop];
            // @ts-ignore
            const newValue = change.proposedChanges[prop];

            if (newValue !== undefined && newValue !== oldValue) {
                diffs.push(
                    <div key={prop as string} className="flex items-center gap-2 text-[10px] bg-gray-100 dark:bg-black/40 rounded px-1.5 py-0.5 border border-gray-200 dark:border-white/5">
                        <span className="text-gray-500 uppercase font-bold">{prop as string}:</span>
                        <span className="text-red-400 line-through truncate max-w-[60px]">{String(oldValue || 'None')}</span>
                        <ArrowRight size={10} className="text-blue-400 shrink-0" />
                        <span className="text-green-400 font-bold truncate max-w-[80px]">{String(newValue)}</span>
                    </div>
                );
            }
        });

        if (diffs.length === 0) return <span className="text-amber-400/50 italic text-[10px]">No visible differences</span>;

        return (
            <div className="flex flex-wrap gap-1 mt-1">
                {diffs}
            </div>
        );
    };

    const renderDetailedComparison = () => {
        if (!requestForDetails) return null;

        if (requestForDetails.changeType === 'create') {
            const prod = requestForDetails.proposedChanges as Product;
            return (
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 flex justify-center mb-4">
                        <div className="w-32 h-32 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden">
                            {prod?.image ? (
                                <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center"><Package size={32} className="opacity-20" /></div>
                            )}
                        </div>
                    </div>
                    {Object.entries(prod || {}).map(([key, value]) => {
                        if (['id', 'image', 'description', 'reviews', 'related', 'createdAt'].includes(key)) return null;
                        if (typeof value === 'object') return null;
                        return (
                            <div key={key} className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                                <p className="text-[10px] uppercase text-gray-500 font-bold mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{String(value)}</p>
                            </div>
                        );
                    })}
                </div>
            );
        }

        if (requestForDetails.changeType === 'edit' && requestForDetails.proposedChanges) {
            const original = allProducts.find(p => p.id === requestForDetails.productId);
            if (!original) return <div className="text-center p-8 text-gray-500">Original product not found.</div>;

            return (
                <div className="space-y-4">
                    <h5 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b border-white/5 pb-2">Changed Fields</h5>
                    <div className="grid grid-cols-1 gap-2">
                        {/* Logic similar to renderChangeDiff but more detailed if needed */}
                        {renderChangeDiff(requestForDetails)}
                    </div>
                    <div className="mt-8">
                        <h5 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b border-white/5 pb-2 mb-4">Full Json Comparison</h5>
                        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                                <h6 className="text-red-400 font-bold mb-2 uppercase">Original</h6>
                                <pre className="whitespace-pre-wrap text-gray-500">{JSON.stringify(original, null, 2)}</pre>
                            </div>
                            <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10">
                                <h6 className="text-green-400 font-bold mb-2 uppercase">Proposed</h6>
                                <pre className="whitespace-pre-wrap text-gray-500">{JSON.stringify({ ...original, ...requestForDetails.proposedChanges }, null, 2)}</pre>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (requestForDetails.changeType === 'stock_adjustment') {
            return (
                <div className="p-6 rounded-2xl bg-yellow-500/5 border border-yellow-500/10 text-center">
                    <RefreshCw size={48} className="mx-auto text-yellow-500 mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-white mb-2">Stock Adjustment Request</h3>
                    <div className="flex items-center justify-center gap-4 text-2xl font-mono my-6">
                        <span className="text-gray-500">Current: {allProducts.find(p => p.id === requestForDetails.productId)?.stock || 0}</span>
                        <ArrowRight className="text-gray-600" />
                        <span className={requestForDetails.adjustmentType === 'IN' ? 'text-green-400' : 'text-red-400'}>
                            {requestForDetails.adjustmentType === 'IN' ? '+' : '-'}{requestForDetails.adjustmentQty}
                        </span>
                    </div>
                    <div>
                        <p className="text-xs uppercase text-gray-500 font-bold mb-2">Reason Provided</p>
                        <div className="p-4 rounded-xl bg-black/20 border border-white/5 inline-block min-w-[300px]">
                            <span className="text-white text-lg font-bold block leading-tight">{requestForDetails.adjustmentReason}</span>
                        </div>
                    </div>
                </div>
            );
        }

        return null;
    };


    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Pending Products Section */}
            <div className="glass-panel rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-[#E2DCCE]/60 dark:border-[#A9CBA2]/10 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-amber-600 dark:text-amber-500 flex items-center gap-2">
                            <Package size={18} /> New Products Awaiting Approval
                        </h3>
                        <p className="text-xs text-secondary mt-1">{pendingProducts.length} products pending review</p>
                    </div>
                </div>

                {pendingProducts.length === 0 ? (
                    <div className="p-12 text-center text-secondary">
                        <CheckCircle size={48} className="mx-auto opacity-30 mb-4" />
                        <p>No pending products awaiting approval.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead><tr className="bg-gray-50 dark:bg-black/20 border-b border-gray-200 dark:border-white/10">
                                <th className="p-4 text-xs text-secondary uppercase font-bold">Product</th>
                                <th className="p-4 text-xs text-secondary uppercase font-bold">SKU</th>
                                <th className="p-4 text-xs text-secondary uppercase font-bold">Category</th>
                                <th className="p-4 text-xs text-secondary uppercase font-bold text-right">Price</th>
                                <th className="p-4 text-xs text-secondary uppercase font-bold">Created By</th>
                                <th className="p-4 text-xs text-secondary uppercase font-bold">Created At</th>
                                <th className="p-4 text-xs text-secondary uppercase font-bold text-center">Actions</th>
                            </tr></thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {pendingProducts.map((prod) => (
                                    <tr key={prod.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-black/30 border border-gray-200 dark:border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                    {prod.image && !prod.image.includes('placeholder.com') ? (
                                                        <img
                                                            src={prod.image}
                                                            alt={prod.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                                (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                                            }}
                                                        />
                                                    ) : (
                                                        <Package size={16} className="text-gray-600 animate-pulse" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{prod.name}</p>
                                                    <p className="text-[10px] text-secondary">{prod.brand}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono text-xs text-secondary">{prod.sku}</td>
                                        <td className="p-4 text-xs text-secondary">{prod.category}</td>
                                        <td className="p-4 text-sm font-bold text-gray-900 dark:text-white text-right">{CURRENCY_SYMBOL}{prod.price?.toLocaleString()}</td>
                                        <td className="p-4 text-xs text-[#2C5E3B] dark:text-[#A9CBA2] flex items-center gap-1 font-bold">
                                            <User size={12} /> {prod.createdBy || prod.created_by || 'Unknown'}
                                        </td>
                                        <td className="p-4 text-xs text-secondary">
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
                                                            className="px-3 py-1.5 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 text-[#2C5E3B] dark:text-[#A9CBA2] font-bold hover:bg-[#2C5E3B]/20 dark:hover:bg-[#A9CBA2]/20"
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
                                                        <span className="text-xs text-amber-600 dark:text-amber-500/80 italic border border-[#E2DCCE] dark:border-amber-500/10 px-3 py-1 bg-amber-500/5 rounded-lg flex items-center gap-1">
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
            <div className="glass-panel rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-[#E2DCCE]/60 dark:border-[#A9CBA2]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-orange-600 dark:text-orange-500 flex items-center gap-2">
                            <Edit size={18} /> Change Requests Awaiting Approval
                        </h3>
                        <p className="text-xs text-secondary mt-1">{pendingChanges.length} change requests pending review</p>
                    </div>
                    {canApprove && pendingChanges.length > 0 && (
                        <Button
                            onClick={onBulkCleanup}
                            variant="danger"
                            size="sm"
                            icon={<Trash2 size={14} />}
                            className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20"
                        >
                            Clear Ghost Requests
                        </Button>
                    )}
                </div>
                {pendingChanges.length === 0 ? (
                    <div className="p-12 text-center text-secondary">
                        <CheckCircle size={48} className="mx-auto opacity-30 mb-4" />
                        <p>No pending change requests.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead><tr className="bg-gray-50 dark:bg-black/20 border-b border-gray-200 dark:border-white/10">
                                <th className="p-4 text-xs text-secondary uppercase font-bold">Request Type</th>
                                <th className="p-4 text-xs text-secondary uppercase font-bold">Product</th>
                                <th className="p-4 text-xs text-secondary uppercase font-bold">SKU</th>
                                <th className="p-4 text-xs text-secondary uppercase font-bold">Details</th>
                                <th className="p-4 text-xs text-secondary uppercase font-bold">Requested By</th>
                                <th className="p-4 text-xs text-secondary uppercase font-bold">Requested At</th>
                                <th className="p-4 text-xs text-secondary uppercase font-bold text-center">Actions</th>
                            </tr></thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {pendingChanges.map((change) => (
                                    <tr key={change.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                                        <td className="p-4">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase border ${change.changeType === 'edit' ? 'text-blue-500 border-blue-500/20 bg-blue-500/10' :
                                                change.changeType === 'delete' ? 'text-red-500 border-red-500/20 bg-red-500/10' :
                                                    'text-yellow-600 dark:text-yellow-400 border-yellow-500/20 bg-yellow-500/10'
                                                }`}>
                                                {change.changeType === 'stock_adjustment' ? 'Stock Adj.' : change.changeType}
                                            </span>
                                        </td>
                                        <td className="p-4 font-semibold text-gray-900 dark:text-white text-sm">{change.productName}</td>
                                        <td className="p-4 font-mono text-xs text-secondary">{change.productSku}</td>
                                        <td className="p-4 text-xs text-secondary">
                                            {change.changeType === 'delete' && (
                                                <span className="flex items-center gap-2 text-red-500 font-medium">
                                                    <Trash2 size={12} /> Permanently delete this product
                                                </span>
                                            )}
                                            {change.changeType === 'edit' && (
                                                <div className="space-y-1">
                                                    <span className="text-blue-500 font-medium flex items-center gap-1">
                                                        <Edit size={12} /> Field Updates Requested:
                                                    </span>
                                                    {renderChangeDiff(change)}
                                                </div>
                                            )}
                                            {change.changeType === 'stock_adjustment' && (
                                                <div className="space-y-1">
                                                    <span className="text-yellow-600 dark:text-yellow-400 font-medium flex items-center gap-1">
                                                        <RefreshCw size={12} /> Stock Adjustment:
                                                    </span>
                                                    <span className={change.adjustmentType === 'IN' ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
                                                        {change.adjustmentType === 'IN' ? '+' : '-'}{change.adjustmentQty} units
                                                    </span>
                                                    <p className="text-[10px] text-secondary italic mt-0.5">Reason: {change.adjustmentReason}</p>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-xs text-[#2C5E3B] dark:text-[#A9CBA2] flex items-center gap-1 font-bold">
                                            <User size={12} /> {change.requestedBy}
                                        </td>
                                        <td className="p-4 text-xs text-secondary">
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
                                                        className="px-3 py-1.5 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 text-[#2C5E3B] dark:text-[#A9CBA2] font-bold hover:bg-[#2C5E3B]/20 dark:hover:bg-[#A9CBA2]/20"
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
                {renderDetailedComparison()}
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
