import { Edit, Trash2, RefreshCw, Plus, CheckCircle, XCircle, ShieldAlert } from 'lucide-react';
import { Product, PendingInventoryChange } from '../../../types';
import Modal from '../../Modal';
import Button from '../../shared/Button';
import { isPriceChangeRequest, requiresFinanceCoApproval } from '../../../utils/pricingGovernance';

interface InventoryRequestDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    requestForDetails: PendingInventoryChange | null;
    canApprove: boolean;
    canApproveThisChange: (change: PendingInventoryChange) => boolean;
    getAwaitingLabel: (change: PendingInventoryChange) => string;
    onApproveProduct: (product: Product) => void;
    onApproveChange: (change: PendingInventoryChange) => void;
    pendingProducts: Product[];
    setSelectedPendingProduct: (product: Product | null) => void;
    setSelectedPendingChange: (change: PendingInventoryChange | null) => void;
    setIsApprovalModalOpen: (isOpen: boolean) => void;
    children?: React.ReactNode;
}

export const InventoryRequestDetailsModal: React.FC<InventoryRequestDetailsModalProps> = ({
    isOpen,
    onClose,
    requestForDetails,
    canApprove,
    canApproveThisChange,
    getAwaitingLabel,
    onApproveProduct,
    onApproveChange,
    pendingProducts,
    setSelectedPendingProduct,
    setSelectedPendingChange,
    setIsApprovalModalOpen,
    children,
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Request Details: ${requestForDetails?.productName || 'Inventory Change'}`}
            size="lg"
        >
            <div className="space-y-5">
                <div className="flex items-center justify-between p-4 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                            requestForDetails?.changeType === 'edit'
                                ? 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border-[var(--theme-accent)]/20'
                                : requestForDetails?.changeType === 'delete'
                                ? 'bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/20'
                                : requestForDetails?.changeType === 'stock_adjustment'
                                ? 'bg-[#FF9F0A]/10 text-[#FF9F0A] border-[#FF9F0A]/20'
                                : 'bg-[#34C759]/10 text-[#34C759] border-[#34C759]/20'
                        }`}>
                            {requestForDetails?.changeType === 'edit' && <Edit size={18} />}
                            {requestForDetails?.changeType === 'delete' && <Trash2 size={18} />}
                            {requestForDetails?.changeType === 'stock_adjustment' && <RefreshCw size={18} />}
                            {requestForDetails?.changeType === 'create' && <Plus size={18} />}
                        </div>
                        <div>
                            <h4 className="text-[var(--theme-text-primary)] font-semibold text-sm tracking-tight">{requestForDetails?.productName}</h4>
                            <p className="text-[var(--theme-text-secondary)] text-[12px] font-mono tabular-nums">SKU: {requestForDetails?.productSku}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">Requested By</p>
                        <p className="text-[var(--theme-text-primary)] text-[13px] font-semibold mt-0.5">{requestForDetails?.requestedBy}</p>
                    </div>
                </div>

                {requestForDetails && isPriceChangeRequest(requestForDetails) && (
                    <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                        requiresFinanceCoApproval(requestForDetails)
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 dark:text-rose-400'
                            : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500 dark:text-indigo-400'
                    }`}>
                        <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold">
                                {requiresFinanceCoApproval(requestForDetails)
                                    ? 'Zero-Trust Price Governance — Finance Co-Approval Mandatory'
                                    : 'Merchandising Price Governance'}
                            </p>
                            <p className="text-[11px] opacity-90 mt-0.5">
                                {requiresFinanceCoApproval(requestForDetails)
                                    ? 'SOP-MER-037: This proposed price falls below the 15% gross margin floor. Country Finance Director or CEO co-approval is required before activation.'
                                    : 'SOP-MER-037: Standard price modification request. Proposed within authorized margin threshold.'}
                            </p>
                        </div>
                    </div>
                )}

                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {children}
                </div>

                {requestForDetails?.status === 'approved' && (
                    <div className="p-3.5 rounded-xl bg-[#34C759]/10 border border-[#34C759]/20 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-[#34C759] font-bold">
                            <CheckCircle size={15} />
                            <span>Approved by {requestForDetails.approvedBy || 'Regional Operations Manager'}</span>
                        </div>
                        {requestForDetails.approvedAt && (
                            <span className="text-[var(--theme-text-secondary)] font-mono text-[11px]">
                                {new Date(requestForDetails.approvedAt).toLocaleString()}
                            </span>
                        )}
                    </div>
                )}

                {requestForDetails?.status === 'rejected' && (
                    <div className="p-3.5 rounded-xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 flex flex-col gap-1 text-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[#FF3B30] font-bold flex items-center gap-1.5">
                                <XCircle size={15} /> Rejected by {requestForDetails.rejectedBy || 'Manager'}
                            </span>
                            {requestForDetails.rejectedAt && (
                                <span className="text-[var(--theme-text-secondary)] font-mono text-[11px]">
                                    {new Date(requestForDetails.rejectedAt).toLocaleString()}
                                </span>
                            )}
                        </div>
                        {requestForDetails.rejectionReason && (
                            <p className="text-[var(--theme-text-secondary)] mt-1 text-[11px]">
                                Reason: {requestForDetails.rejectionReason}
                            </p>
                        )}
                    </div>
                )}

                {canApprove && requestForDetails?.status === 'pending' && (
                    <div className="flex items-center gap-3 pt-3 border-t border-[var(--theme-border)]">
                        {(!requestForDetails?.approvalRole || canApproveThisChange(requestForDetails!)) ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose();
                                        if (requestForDetails) {
                                            if (requestForDetails.id === 'view-only') {
                                                const original = pendingProducts.find(p => p.id === requestForDetails.productId);
                                                if (original) onApproveProduct(original);
                                            } else {
                                                onApproveChange(requestForDetails);
                                            }
                                        }
                                    }}
                                    className="flex-1 h-10 px-4 rounded-xl font-semibold text-[13px] bg-[#34C759] text-white hover:opacity-95 shadow-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <CheckCircle size={16} />
                                    <span>Approve Request</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose();
                                        if (requestForDetails) {
                                            if (requestForDetails.id === 'view-only') {
                                                const original = pendingProducts.find(p => p.id === requestForDetails.productId);
                                                if (original) setSelectedPendingProduct(original);
                                            } else {
                                                setSelectedPendingChange(requestForDetails);
                                            }
                                            setIsApprovalModalOpen(true);
                                        }
                                    }}
                                    className="flex-1 h-10 px-4 rounded-xl font-semibold text-[13px] bg-[#FF3B30]/10 hover:bg-[#FF3B30]/15 text-[#FF3B30] border border-[#FF3B30]/20 shadow-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <XCircle size={16} />
                                    <span>Reject Request</span>
                                </button>
                            </>
                        ) : (
                            <div className="flex-1 text-center py-2.5 px-4 rounded-xl bg-[#FF9F0A]/10 border border-[#FF9F0A]/20 text-[#FF9F0A] text-[12px] font-semibold">
                                {requestForDetails ? getAwaitingLabel(requestForDetails) : 'Awaiting Approval'}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
};
