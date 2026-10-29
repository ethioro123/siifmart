import React from 'react';
import { usePOS } from '../POSContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import Modal from '../../Modal';

export const HoldOrderModal: React.FC = () => {
    const { t } = useLanguage();
    const {
        isHoldOrderModalOpen,
        setIsHoldOrderModalOpen,
        holdOrderNote,
        setHoldOrderNote,
        handleConfirmHoldOrder,
    } = usePOS();

    return (
        <Modal isOpen={isHoldOrderModalOpen} onClose={() => setIsHoldOrderModalOpen(false)} title={t('pos.holdOrder')} size="sm">
            <div className="space-y-4">
                <p className="text-[var(--theme-text-secondary)] text-sm font-medium">{t('pos.holdOrderPrompt')}</p>
                <input
                    type="text"
                    value={holdOrderNote}
                    onChange={(e) => setHoldOrderNote(e.target.value)}
                    className="w-full bg-[var(--theme-input-bg)] border border-[var(--theme-input-border)] rounded-xl px-4 py-3 text-[var(--theme-input-text)] text-sm focus:outline-none focus:border-[var(--theme-border-focus)] transition-colors"
                    placeholder={t('pos.notePlaceholder') || "Note..."}
                    autoFocus
                />
                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => setIsHoldOrderModalOpen(false)}
                        className="min-h-11 px-4 py-2 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] rounded-xl font-bold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmHoldOrder}
                        className="min-h-11 px-6 py-2 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] hover:opacity-90 font-bold rounded-xl shadow-xs transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                    >
                        {t('pos.holdOrder')}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
