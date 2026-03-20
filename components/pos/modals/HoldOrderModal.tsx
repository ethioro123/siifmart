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
                <p className="text-gray-300 mb-4">Enter a reference note for this order (e.g., Customer Name):</p>
                <input
                    type="text"
                    value={holdOrderNote}
                    onChange={(e) => setHoldOrderNote(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white mb-6 focus:outline-none focus:border-cyber-primary transition-colors"
                    placeholder="Note..."
                    autoFocus
                />
                <div className="flex justify-end gap-3">
                    <button onClick={() => setIsHoldOrderModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                    <button onClick={handleConfirmHoldOrder} className="px-6 py-2 bg-cyber-primary hover:bg-cyber-accent text-black font-bold rounded-lg">Hold Order</button>
                </div>
            </div>
        </Modal>
    );
};
