import React from 'react';
import { Edit, Trash2, RefreshCw, Plus, CheckCircle, XCircle } from 'lucide-react';
import { Product, PendingInventoryChange } from '../../../types';
import Modal from '../../Modal';
import Button from '../../shared/Button';

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
            <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-55/50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${requestForDetails?.changeType === 'edit' ? 'bg-blue-500/20 text-blue-400' :
                            requestForDetails?.changeType === 'delete' ? 'bg-red-500/20 text-red-400' :
                                requestForDetails?.changeType === 'stock_adjustment' ? 'bg-yellow-500/20 text-yellow-505' :
                                    'bg-green-500/20 text-green-400'
                            }`}>
                            {requestForDetails?.changeType === 'edit' && <Edit size={20} />}
                            {requestForDetails?.changeType === 'delete' && <Trash2 size={20} />}
                            {requestForDetails?.changeType === 'stock_adjustment' && <RefreshCw size={20} />}
                            {requestForDetails?.changeType === 'create' && <Plus size={20} />}
                        </div>
                        <div>
                            <h4 className="text-gray-900 dark:text-white font-bold">{requestForDetails?.productName}</h4>
                            <p className="text-secondary text-xs">SKU: {requestForDetails?.productSku}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-secondary uppercase font-bold">Requested By</p>
                        <p className="text-[#2C5E3B] dark:text-[#A9CBA2] text-sm font-bold">{requestForDetails?.requestedBy}</p>
                    </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {children}
                </div>

                {canApprove && (
                    <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-white/10">
                        {(!requestForDetails?.approvalRole || canApproveThisChange(requestForDetails!)) ? (
                            <>
                                <Button
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
                                    variant="success"
                                    icon={<CheckCircle size={18} />}
                                    className="flex-1 py-3 font-bold transition-all shadow-md"
                                >
                                    Approve Request
                                </Button>
                                <Button
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
                                    variant="danger"
                                    icon={<XCircle size={18} />}
                                    className="flex-1 py-3 font-bold transition-all shadow-md"
                                >
                                    Reject Request
                                </Button>
                            </>
                        ) : (
                            <div className="flex-1 text-center py-3 text-amber-500/60 text-sm font-bold italic">
                                {requestForDetails ? getAwaitingLabel(requestForDetails) : 'Awaiting Approval'}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
};
