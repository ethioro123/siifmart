import React from 'react';
import { usePOS } from '../POSContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import Modal from '../../Modal';
import { Loader2 } from 'lucide-react';

export const EmailReceiptModal: React.FC = () => {
    const { t } = useLanguage();
    const {
        isEmailReceiptModalOpen,
        setIsEmailReceiptModalOpen,
        emailReceiptAddress,
        setEmailReceiptAddress,
        handleConfirmEmailReceipt,
        isProcessing,
    } = usePOS();

    return (
        <Modal isOpen={isEmailReceiptModalOpen} onClose={() => setIsEmailReceiptModalOpen(false)} title={t('pos.emailReceiptTitle')} size="sm" mobileFullScreen={true}>
            <div className="p-4 sm:p-6">
                <p className="text-[var(--theme-text-primary)] font-medium mb-3 text-xs">{t('pos.enterCustomerEmail')}</p>
                <input
                    type="email"
                    value={emailReceiptAddress}
                    onChange={(e) => setEmailReceiptAddress(e.target.value)}
                    className="w-full min-h-11 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] mb-6 focus:outline-none focus:border-[var(--theme-border-focus)] transition-colors"
                    placeholder="customer@example.com"
                    autoFocus
                />
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5">
                    <button type="button" onClick={() => setIsEmailReceiptModalOpen(false)} className="w-full sm:w-auto min-h-11 px-4 py-2 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] rounded-xl transition-colors font-bold text-xs cursor-pointer touch-manipulation flex items-center justify-center">{t('common.cancel')}</button>
                    <button type="button" onClick={handleConfirmEmailReceipt} disabled={!emailReceiptAddress || isProcessing} className="w-full sm:w-auto min-h-11 px-5 py-2 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] hover:opacity-90 font-bold rounded-xl disabled:opacity-30 border border-transparent disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-colors shadow-xs text-xs cursor-pointer touch-manipulation">
                        {isProcessing && <Loader2 size={14} className="animate-spin" />}
                        {t('pos.sendReceipt')}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
