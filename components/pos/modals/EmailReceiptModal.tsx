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
        <Modal isOpen={isEmailReceiptModalOpen} onClose={() => setIsEmailReceiptModalOpen(false)} title={t('pos.emailReceiptTitle')} size="sm">
            <div className="p-6">
                <p className="text-[var(--theme-text-primary)] font-medium mb-4 text-xs">{t('pos.enterCustomerEmail')}</p>
                <input
                    type="email"
                    value={emailReceiptAddress}
                    onChange={(e) => setEmailReceiptAddress(e.target.value)}
                    className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] mb-6 focus:outline-none focus:border-[var(--theme-border-focus)] transition-colors"
                    placeholder="customer@example.com"
                    autoFocus
                />
                <div className="flex justify-end gap-2.5">
                    <button onClick={() => setIsEmailReceiptModalOpen(false)} className="px-4 py-2 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors font-bold text-xs cursor-pointer">{t('common.cancel')}</button>
                    <button onClick={handleConfirmEmailReceipt} disabled={!emailReceiptAddress || isProcessing} className="px-5 py-2 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] hover:opacity-90 font-bold rounded-xl disabled:opacity-30 border border-transparent disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors shadow-xs text-xs cursor-pointer">
                        {isProcessing && <Loader2 size={14} className="animate-spin" />}
                        {t('pos.sendReceipt')}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
