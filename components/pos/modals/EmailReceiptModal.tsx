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
                <p className="text-gray-300 mb-4">Enter customer email address:</p>
                <input
                    type="email"
                    value={emailReceiptAddress}
                    onChange={(e) => setEmailReceiptAddress(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white mb-6 focus:outline-none focus:border-cyber-primary transition-colors"
                    placeholder="customer@example.com"
                    autoFocus
                />
                <div className="flex justify-end gap-3">
                    <button onClick={() => setIsEmailReceiptModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                    <button onClick={handleConfirmEmailReceipt} disabled={!emailReceiptAddress || isProcessing} className="px-6 py-2 bg-cyber-primary hover:bg-cyber-accent text-black font-bold rounded-lg disabled:opacity-50 flex items-center gap-2">
                        {isProcessing && <Loader2 size={16} className="animate-spin" />}
                        Send Receipt
                    </button>
                </div>
            </div>
        </Modal>
    );
};
