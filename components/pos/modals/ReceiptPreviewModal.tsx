import React from 'react';
import { usePOS } from '../POSContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import Modal from '../../Modal';
import { Printer, Receipt } from 'lucide-react';

export const ReceiptPreviewModal: React.FC = () => {
    const { t } = useLanguage();
    const {
        isReceiptPreviewOpen,
        setIsReceiptPreviewOpen,
        receiptPreviewHTML,
        handleConfirmPrint,
    } = usePOS();

    return (
        <Modal
            isOpen={isReceiptPreviewOpen}
            onClose={() => setIsReceiptPreviewOpen(false)}
            title={t('pos.receiptPreview')}
            size="md"
        >
            <div className="space-y-4">
                <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] p-4 sm:p-5 rounded-2xl flex flex-col items-center justify-center">
                    {/* Realistic Thermal Paper Roll Container */}
                    <div className="w-[320px] max-w-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col transition-all">
                        {/* Thermal Paper Top Tear Edge */}
                        <div className="h-2 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 border-b border-dashed border-gray-300 shrink-0" />
                        
                        {receiptPreviewHTML ? (
                            <iframe
                                srcDoc={receiptPreviewHTML}
                                title={t('pos.receiptPreview')}
                                className="w-full h-[460px] border-none bg-white block"
                            />
                        ) : (
                            <div className="w-full h-[360px] flex flex-col items-center justify-center text-gray-400 gap-2 p-6 text-center">
                                <Receipt size={32} className="opacity-40" />
                                <p className="text-xs font-semibold text-gray-600">No receipt data generated</p>
                            </div>
                        )}

                        {/* Thermal Paper Bottom Cut Edge */}
                        <div className="h-2 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 border-t border-dashed border-gray-300 shrink-0" />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--theme-border)]">
                    <button
                        type="button"
                        onClick={() => setIsReceiptPreviewOpen(false)}
                        className="px-4 py-2 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] rounded-xl transition-colors font-bold text-xs cursor-pointer shadow-xs"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmPrint}
                        className="px-5 py-2 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] hover:opacity-90 font-bold rounded-xl transition-colors flex items-center gap-2 shadow-xs text-xs cursor-pointer"
                    >
                        <Printer size={16} />
                        {t('pos.printReceipt')}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
