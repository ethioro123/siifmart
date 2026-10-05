import React from 'react';
import { usePOS } from '../POSContext';
import Modal from '../../Modal';

export const HoldOrderModal: React.FC = () => {
    const {
        isHoldOrderModalOpen,
        setIsHoldOrderModalOpen,
        holdOrderNote,
        setHoldOrderNote,
        handleConfirmHoldOrder,
    } = usePOS();

    return (
        <Modal isOpen={isHoldOrderModalOpen} onClose={() => setIsHoldOrderModalOpen(false)} title="Hold Order" size="sm">
            <div className="p-6">
                <p className="text-[var(--theme-text-secondary)] mb-4 font-medium">Enter a reference note for this order (e.g., Customer Name):</p>
                <input
                    type="text"
                    value={holdOrderNote}
                    onChange={(e) => setHoldOrderNote(e.target.value)}
                    className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-4 py-3 text-[var(--theme-text-primary)] mb-6 focus:outline-none focus:border-[var(--theme-border-focus)] transition-colors"
                    placeholder="Note..."
                    autoFocus
                />
                <div className="flex justify-end gap-3">
                    <button onClick={() => setIsHoldOrderModalOpen(false)} className="px-4 py-2 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] font-bold text-sm">Cancel</button>
                    <button onClick={handleConfirmHoldOrder} className="px-6 py-2 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] hover:opacity-90 font-bold rounded-xl shadow-xs transition-transform active:scale-[0.98]">Hold Order</button>
                </div>
            </div>
        </Modal>
    );
};
