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
                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                    <button
                        onClick={() => setIsReceiptPreviewOpen(false)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirmPrint}
                        className="px-6 py-2 bg-cyber-primary text-black font-bold rounded-lg hover:bg-cyber-primary/90 transition-colors flex items-center gap-2"
                    >
                        <Printer size={18} />
                        Print Receipt
                    </button>
                </div>
            </div>
        </Modal>
    );
};
