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
                <p className="text-secondary text-sm">
                    Please provide a reason for rejecting this request.
                    The requester will be notified.
                </p>
                <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Reason for rejection..."
                    className="w-full h-32 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white placeholder-stone-400 dark:placeholder-stone-500 focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-4 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 focus:outline-none transition-all duration-300"
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
