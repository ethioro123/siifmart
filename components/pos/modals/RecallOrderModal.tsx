import React from 'react';
import { usePOS } from '../POSContext';
import { useData } from '../../../contexts/DataContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import Modal from '../../Modal';
import { ArrowRight, AlertTriangle } from 'lucide-react';

export const RecallOrderModal: React.FC = () => {
    const { t } = useLanguage();
    const {
        isRecallModalOpen,
        setIsRecallModalOpen,
        handleRecallOrder,
        isOverwriteCartModalOpen,
        setIsOverwriteCartModalOpen,
        handleConfirmOverwriteCart,
    } = usePOS();

    const { heldOrders } = useData();

    return (
        <>
             <Modal isOpen={isRecallModalOpen} onClose={() => setIsRecallModalOpen(false)} title={t('pos.recallOrder')}>
                <div className="space-y-3">
                    {heldOrders.map(order => (
                        <button
                            key={order.id}
                            type="button"
                            className="w-full min-h-11 p-3.5 sm:p-4 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl flex justify-between items-center group hover:border-[var(--theme-border-strong)] transition-colors cursor-pointer touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                            onClick={() => handleRecallOrder(order.id)}
                        >
                            <div className="text-left">
                                <p className="text-[var(--theme-text-primary)] font-bold text-sm">{order.note}</p>
                                <p className="text-xs text-[var(--theme-text-secondary)] font-medium mt-0.5">{order.time} • {order.items.length} {order.items.length === 1 ? t('pos.item') : t('pos.items')}</p>
                            </div>
                            <ArrowRight size={16} className="text-[var(--theme-text-secondary)] group-hover:text-[var(--theme-text-primary)] transition-transform group-hover:translate-x-0.5" />
                        </button>
                    ))}
                    {heldOrders.length === 0 && (
                        <p className="text-center text-[var(--theme-text-secondary)] font-medium py-8">{t('pos.noHeldOrders')}</p>
                    )}
                </div>
            </Modal>

            {/* Overwrite Cart Confirmation Modal */}
            <Modal isOpen={isOverwriteCartModalOpen} onClose={() => setIsOverwriteCartModalOpen(false)} title={t('pos.overwriteCartTitle')} size="sm">
                <div className="space-y-4">
                    <div className="flex items-center gap-3.5 p-4 bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] rounded-xl">
                        <div className="p-2.5 bg-[var(--theme-bg-card)] rounded-xl text-[var(--theme-status-warning)] shrink-0 shadow-2xs">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-[var(--theme-text-primary)]">{t('pos.cartNotEmpty')}</h3>
                            <p className="text-[var(--theme-status-warning-text)] text-xs font-medium mt-0.5 leading-snug">{t('pos.cartOverwriteWarning')}</p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsOverwriteCartModalOpen(false)}
                            className="min-h-11 px-4 py-2 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] rounded-xl font-bold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmOverwriteCart}
                            className="min-h-11 px-6 py-2 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] hover:opacity-90 font-bold rounded-xl shadow-xs transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                        >
                            {t('pos.overwrite')}
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
};
