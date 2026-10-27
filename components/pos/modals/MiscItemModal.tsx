import React from 'react';
import { usePOS } from '../POSContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import Modal from '../../Modal';

export const MiscItemModal: React.FC = () => {
    const { t } = useLanguage();
    const {
        isMiscItemModalOpen,
        setIsMiscItemModalOpen,
        miscItem,
        setMiscItem,
        addMiscItem,
    } = usePOS();

    return (
        <Modal isOpen={isMiscItemModalOpen} onClose={() => setIsMiscItemModalOpen(false)} title={t('pos.miscItemTitle')} size="sm">
            <div className="space-y-4">
                <div>
                    <label htmlFor="misc-desc" className="text-xs text-[var(--theme-text-secondary)] uppercase font-bold tracking-wider mb-1.5 block">{t('pos.description')}</label>
                    <input
                        id="misc-desc"
                        value={miscItem.name}
                        onChange={e => setMiscItem({ ...miscItem, name: e.target.value })}
                        className="w-full bg-[var(--theme-input-bg)] border border-[var(--theme-input-border)] rounded-xl px-3.5 py-2.5 text-[var(--theme-input-text)] focus:outline-none focus:border-[var(--theme-border-focus)] transition-colors text-sm"
                    />
                </div>
                <div>
                    <label className="text-xs text-[var(--theme-text-secondary)] uppercase font-bold tracking-wider mb-1.5 block">{t('common.price')}</label>
                    <input
                        type="number"
                        value={miscItem.price}
                        onChange={e => setMiscItem({ ...miscItem, price: e.target.value })}
                        className="w-full bg-[var(--theme-input-bg)] border border-[var(--theme-input-border)] rounded-xl px-3.5 py-2.5 text-[var(--theme-input-text)] font-mono focus:outline-none focus:border-[var(--theme-border-focus)] transition-colors text-sm"
                        placeholder="0.00"
                        autoFocus
                    />
                </div>
                <button
                    onClick={addMiscItem}
                    disabled={!miscItem.price}
                    className="w-full py-3 bg-[var(--theme-primary)] hover:opacity-90 text-[var(--theme-primary-text)] font-bold rounded-xl shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-xs uppercase tracking-wider"
                >
                    {t('pos.addToCart')}
                </button>
            </div>
        </Modal>
    );
};
