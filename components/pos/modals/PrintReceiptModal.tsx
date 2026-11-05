import React from 'react';
import { usePOS } from '../POSContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import Modal from '../../Modal';
import { CURRENCY_SYMBOL } from '../../../constants';
import { Printer, Mail, CheckCircle } from 'lucide-react';

export const PrintReceiptModal: React.FC = () => {
    const { t } = useLanguage();
    const {
        isReceiptModalOpen,
        setIsReceiptModalOpen,
        lastSale,
        handlePrintReceipt,
        handleEmailReceipt,
        setShowCart,
    } = usePOS();

    const handleCloseReceipt = () => {
        setIsReceiptModalOpen(false);
        setShowCart(false);
    };

    return (
        <Modal
            isOpen={isReceiptModalOpen}
            onClose={handleCloseReceipt}
            title={t('pos.paymentSuccess')}
            size="md"
            mobileFullScreen={true}
        >
            <div className="flex flex-col items-center py-4 sm:py-6 animate-in zoom-in-95 duration-300 relative overflow-hidden">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[var(--theme-pill-bg)] border border-[var(--theme-border)] text-[var(--theme-primary)] flex items-center justify-center mb-4 sm:mb-6 relative">
                    <CheckCircle size={32} className="relative z-10" />
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-[var(--theme-text-primary)] tracking-tight mb-1">{t('pos.paymentSuccess')}</h3>
                <p className="text-[var(--theme-text-secondary)] text-xs font-semibold mb-4 sm:mb-6 uppercase tracking-wider">{t('pos.transactionVerified')}</p>

                <div className="w-full space-y-3 mb-6 px-3 sm:px-6">
                    <div className="flex justify-between items-center py-3 border-b border-[var(--theme-border)]">
                        <span className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">{t('pos.totalPaid')}</span>
                        <span className="text-xl font-bold text-[var(--theme-primary)] tabular-nums font-mono">{CURRENCY_SYMBOL} {(lastSale?.total || 0).toLocaleString()}</span>
                    </div>
                    {lastSale && lastSale.method === 'Cash' && (
                        <div className="flex justify-between items-center py-3 border-b border-[var(--theme-border)]">
                            <span className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">{t('pos.changeDue')}</span>
                            <span className="text-xl font-bold text-[var(--theme-text-primary)] tabular-nums font-mono">{CURRENCY_SYMBOL} {lastSale.change?.toLocaleString()}</span>
                        </div>
                    )}
                </div>

                <div className="w-full grid grid-cols-2 gap-3 px-3 sm:px-6">
                    <button
                        type="button"
                        onClick={() => {
                            handlePrintReceipt();
                            handleCloseReceipt();
                        }}
                        className="min-h-11 flex flex-col items-center justify-center gap-2 p-3 sm:p-4 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] hover:bg-[var(--theme-bg-card-hover)] rounded-2xl text-[var(--theme-text-primary)] transition-all cursor-pointer touch-manipulation active:scale-95 shadow-xs"
                    >
                        <div className="w-10 h-10 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-primary)]">
                            <Printer size={20} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider">{t('pos.printReceipt')}</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleEmailReceipt}
                        className="min-h-11 flex flex-col items-center justify-center gap-2 p-3 sm:p-4 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] hover:bg-[var(--theme-bg-card-hover)] rounded-2xl text-[var(--theme-text-primary)] transition-all cursor-pointer touch-manipulation active:scale-95 shadow-xs"
                    >
                        <div className="w-10 h-10 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-status-warning-text)]">
                            <Mail size={20} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider">{t('pos.digitalCopy')}</span>
                    </button>
                </div>

                <div className="w-full px-3 sm:px-6 mt-6">
                    <button
                        type="button"
                        onClick={handleCloseReceipt}
                        className="w-full min-h-11 p-3.5 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] font-bold uppercase tracking-wider text-xs rounded-xl hover:opacity-90 shadow-xs transition-all touch-manipulation active:scale-[0.98] cursor-pointer flex items-center justify-center"
                    >
                        {t('pos.newOrder')}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
