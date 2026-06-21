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
                <p className="text-[#4D6E56] dark:text-gray-300 mb-4">Enter a reference note for this order (e.g., Customer Name):</p>
                <input
                    type="text"
                    value={holdOrderNote}
                    onChange={(e) => setHoldOrderNote(e.target.value)}
                    className="w-full bg-[#FAF8F5] dark:bg-black/50 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-4 py-3 text-[#1E3F27] dark:text-white mb-6 focus:outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] transition-colors"
                    placeholder="Note..."
                    autoFocus
                />
                <div className="flex justify-end gap-3">
                    <button onClick={() => setIsHoldOrderModalOpen(false)} className="px-4 py-2 text-stone-500 hover:text-[#1E3F27] dark:hover:text-white">Cancel</button>
                    <button onClick={handleConfirmHoldOrder} className="px-6 py-2 bg-[#2C5E3B] hover:opacity-90 text-white font-bold rounded-xl shadow-sm">Hold Order</button>
                </div>
            </div>
        </Modal>
    );
};
