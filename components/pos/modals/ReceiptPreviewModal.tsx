import React from 'react';
import { usePOS } from '../POSContext';
import Modal from '../../Modal';
import { Printer } from 'lucide-react';

export const ReceiptPreviewModal: React.FC = () => {
    const {
        isReceiptPreviewOpen,
        setIsReceiptPreviewOpen,
        receiptPreviewHTML,
        handleConfirmPrint,
    } = usePOS();

    return (
        <Modal isOpen={isReceiptPreviewOpen} onClose={() => setIsReceiptPreviewOpen(false)} title="Receipt Preview" size="md">
            <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg shadow-inner h-96 overflow-y-auto">
                    <iframe
                        srcDoc={receiptPreviewHTML}
                        title="Receipt Preview"
                        className="w-full h-full border-none bg-white"
                    />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-[#E2DCCE] dark:border-white/10">
                    <button
                        onClick={() => setIsReceiptPreviewOpen(false)}
                        className="px-4 py-2 bg-white/90 dark:bg-black/35 border border-[#E2DCCE] dark:border-white/10 hover:bg-[#2C5E3B]/10 hover:text-[#2C5E3B] dark:hover:text-white text-stone-700 dark:text-stone-300 rounded-lg transition-colors font-bold text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirmPrint}
                        className="px-6 py-2 bg-gradient-to-br from-[#224429] to-[#2C5E3B] text-white hover:opacity-90 font-bold rounded-lg transition-all flex items-center gap-2 shadow-sm"
                    >
                        <Printer size={18} />
                        Print Receipt
                    </button>
                </div>
            </div>
        </Modal>
    );
};
