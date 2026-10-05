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
                <p className="text-[var(--theme-text-secondary)] text-sm">
                    Please provide a reason for rejecting this request.
                    The requester will be notified.
                </p>
                <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Reason for rejection..."
                    className="w-full h-32 bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-xl p-4 text-[var(--theme-text-primary)] placeholder-[var(--theme-text-muted)] focus:border-[var(--theme-border-strong)] focus:outline-none transition-all duration-150"
                    autoFocus
                />
                <div className="flex gap-4 justify-end">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        disabled={!rejectionReason.trim() || isSubmitting}
                        loading={isSubmitting}
                        onClick={() => {
                            if (selectedPendingProduct) {
                                onRejectProduct(selectedPendingProduct, rejectionReason);
                            } else if (selectedPendingChange) {
                                onRejectChange(selectedPendingChange, rejectionReason);
                            }
                            onClose();
                        }}
                    >
                        Confirm Rejection
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
