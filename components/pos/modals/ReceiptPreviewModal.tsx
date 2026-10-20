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
                <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] p-4 rounded-2xl shadow-xs">
                    <div className="bg-white p-4 rounded-xl shadow-md h-96 overflow-y-auto max-w-sm mx-auto border border-black/10">
                        <iframe
                            srcDoc={receiptPreviewHTML}
                            title="Receipt Preview"
                            className="w-full h-full border-none bg-white"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--theme-border)]">
                    <button
                        onClick={() => setIsReceiptPreviewOpen(false)}
                        className="px-4 py-2 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] rounded-xl transition-colors font-bold text-xs cursor-pointer shadow-xs"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirmPrint}
                        className="px-5 py-2 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] hover:opacity-90 font-bold rounded-xl transition-colors flex items-center gap-2 shadow-xs text-xs cursor-pointer"
                    >
                        <Printer size={16} />
                        Print Receipt
                    </button>
                </div>
            </div>
        </Modal>
    );
};
