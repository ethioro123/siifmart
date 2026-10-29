import React from 'react';
import { Product, PendingInventoryChange } from '../../../types';
import Modal from '../../Modal';
import Button from '../../shared/Button';

interface InventoryRejectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    rejectionReason: string;
    setRejectionReason: (reason: string) => void;
    isSubmitting: boolean;
    selectedPendingProduct: Product | null;
    selectedPendingChange: PendingInventoryChange | null;
    onRejectProduct: (product: Product, reason: string) => void;
    onRejectChange: (change: PendingInventoryChange, reason: string) => void;
}

export const InventoryRejectionModal: React.FC<InventoryRejectionModalProps> = ({
    isOpen,
    onClose,
    rejectionReason,
    setRejectionReason,
    isSubmitting,
    selectedPendingProduct,
    selectedPendingChange,
    onRejectProduct,
    onRejectChange,
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Reject Request"
        >
            <div className="space-y-4">
                <p className="text-[var(--theme-text-secondary)] text-[13px] leading-relaxed">
                    Please provide a reason for rejecting this request.
                    The requester will be notified immediately.
                </p>
                <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide detailed reason for rejection..."
                    className="w-full h-28 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl p-3.5 text-[13px] text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[#FF3B30]/20 focus:border-[var(--theme-status-danger-border)] shadow-xs transition-all"
                    autoFocus
                />
                <div className="flex gap-2.5 justify-end pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-9 px-4 rounded-xl text-[13px] font-semibold bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-hover)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={!rejectionReason.trim() || isSubmitting}
                        onClick={() => {
                            if (selectedPendingProduct) {
                                onRejectProduct(selectedPendingProduct, rejectionReason);
                            } else if (selectedPendingChange) {
                                onRejectChange(selectedPendingChange, rejectionReason);
                            }
                            onClose();
                        }}
                        className="h-9 px-4 rounded-xl text-[13px] font-semibold bg-[var(--theme-status-danger-bg)] text-white hover:opacity-95 shadow-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                        <span>Confirm Rejection</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
};
