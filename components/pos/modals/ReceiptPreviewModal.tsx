import React from 'react';
import { usePOS } from '../POSContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import Modal from '../../Modal';
import { Printer, Receipt } from 'lucide-react';
import { sanitizePreviewHTML } from '../../../utils/printHelper';

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
            mobileFullScreen={true}
        >
            <div className="space-y-4">
                <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] p-3 sm:p-5 rounded-2xl flex flex-col items-center justify-center">
                    {/* Realistic Thermal Paper Roll Container — locked to physical white paper */}
                    <div
                        style={{
                            colorScheme: 'light',
                            backgroundColor: 'var(--theme-print-canvas)',
                            color: 'var(--theme-print-text)'
                        }}
                        className="w-full max-w-[320px] bg-[var(--theme-print-canvas)] text-[var(--theme-print-text)] rounded-xl shadow-lg border border-[color-mix(in_srgb,var(--theme-print-text)_16%,transparent)] overflow-hidden flex flex-col transition-all"
                    >
                        {/* Thermal Paper Top Tear Edge */}
                        <div className="h-2 bg-[color-mix(in_srgb,var(--theme-print-text)_6%,var(--theme-print-canvas))] border-b border-dashed border-[color-mix(in_srgb,var(--theme-print-text)_22%,transparent)] shrink-0" />
                        
                        {receiptPreviewHTML ? (
                            <iframe
                                srcDoc={sanitizePreviewHTML(receiptPreviewHTML)}
                                title={t('pos.receiptPreview')}
                                style={{
                                    colorScheme: 'light',
                                    backgroundColor: 'var(--theme-print-canvas)'
                                }}
                                className="w-full h-[400px] sm:h-[460px] border-none bg-[var(--theme-print-canvas)] block"
                            />
                        ) : (
                            <div className="w-full h-[300px] sm:h-[360px] flex flex-col items-center justify-center text-[color-mix(in_srgb,var(--theme-print-text)_45%,transparent)] gap-2 p-6 text-center">
                                <Receipt size={32} className="opacity-40" />
                                <p className="text-xs font-semibold text-[color-mix(in_srgb,var(--theme-print-text)_70%,transparent)]">No receipt data generated</p>
                            </div>
                        )}

                        {/* Thermal Paper Bottom Cut Edge */}
                        <div className="h-2 bg-[color-mix(in_srgb,var(--theme-print-text)_6%,var(--theme-print-canvas))] border-t border-dashed border-[color-mix(in_srgb,var(--theme-print-text)_22%,transparent)] shrink-0" />
                    </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 pt-3 border-t border-[var(--theme-border)]">
                    <button
                        type="button"
                        onClick={() => setIsReceiptPreviewOpen(false)}
                        className="w-full sm:w-auto min-h-11 px-4 py-2 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] rounded-xl transition-colors font-bold text-xs cursor-pointer shadow-xs touch-manipulation flex items-center justify-center"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmPrint}
                        className="w-full sm:w-auto min-h-11 px-5 py-2 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] hover:opacity-90 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs text-xs cursor-pointer touch-manipulation"
                    >
                        <Printer size={16} />
                        {t('pos.printReceipt')}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
