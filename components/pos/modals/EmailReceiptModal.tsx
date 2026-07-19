import React from 'react';
import { usePOS } from '../POSContext';
import Modal from '../../Modal';
import { Loader2 } from 'lucide-react';

export const EmailReceiptModal: React.FC = () => {
    const {
        isEmailReceiptModalOpen,
        setIsEmailReceiptModalOpen,
        emailReceiptAddress,
        setEmailReceiptAddress,
        handleConfirmEmailReceipt,
        isProcessing,
    } = usePOS();

    return (
        <Modal isOpen={isEmailReceiptModalOpen} onClose={() => setIsEmailReceiptModalOpen(false)} title="Email Receipt" size="sm">
            <div className="p-6">
                <p className="text-[#1E3F27] dark:text-gray-300 font-medium mb-4">Enter customer email address:</p>
                <input
                    type="email"
                    value={emailReceiptAddress}
                    onChange={(e) => setEmailReceiptAddress(e.target.value)}
                    className="w-full bg-white dark:bg-black/50 border border-[#E2DCCE] dark:border-white/10 rounded-lg px-4 py-3 text-[#1E3F27] dark:text-white mb-6 focus:outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] transition-colors"
                    placeholder="customer@example.com"
                    autoFocus
                />
                <div className="flex justify-end gap-3">
                    <button onClick={() => setIsEmailReceiptModalOpen(false)} className="px-4 py-2 text-stone-700 dark:text-stone-300 hover:text-[#2C5E3B] dark:hover:text-white transition-colors font-bold text-sm">Cancel</button>
                    <button onClick={handleConfirmEmailReceipt} disabled={!emailReceiptAddress || isProcessing} className="px-6 py-2 bg-gradient-to-br from-[#224429] to-[#2C5E3B] text-white hover:opacity-90 font-bold rounded-lg disabled:bg-stone-200 dark:disabled:bg-white/5 disabled:text-stone-400 dark:disabled:text-stone-600 border border-transparent disabled:border-stone-300 dark:disabled:border-white/10 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2 transition-all shadow-sm">
                        {isProcessing && <Loader2 size={16} className="animate-spin" />}
                        Send Receipt
                    </button>
                </div>
            </div>
        </Modal>
    );
};
