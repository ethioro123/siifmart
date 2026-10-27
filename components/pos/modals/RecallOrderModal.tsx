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
                        <div key={order.id} className="p-4 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl flex justify-between items-center group hover:border-[var(--theme-border-strong)] transition-colors cursor-pointer" onClick={() => handleRecallOrder(order.id)}>
                            <div>
                                <p className="text-[var(--theme-text-primary)] font-bold">{order.note}</p>
                                <p className="text-xs text-[var(--theme-text-secondary)] font-medium">{order.time} • {order.items.length} {order.items.length === 1 ? t('pos.item') : t('pos.items')}</p>
                            </div>
                            <ArrowRight size={16} className="text-[var(--theme-text-secondary)] group-hover:text-[var(--theme-text-primary)] transition-colors" />
                        </div>
                    ))}
                    {heldOrders.length === 0 && (
                        <p className="text-center text-[var(--theme-text-secondary)] font-medium py-8">{t('pos.noHeldOrders')}</p>
                    )}
                </div>
            </Modal>

            {/* Overwrite Cart Confirmation Modal */}
            <Modal isOpen={isOverwriteCartModalOpen} onClose={() => setIsOverwriteCartModalOpen(false)} title={t('pos.overwriteCartTitle')} size="sm">
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                        <div className="p-3 bg-amber-500/20 rounded-full shrink-0">
                            <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-[var(--theme-text-primary)]">{t('pos.cartNotEmpty')}</h3>
                            <p className="text-amber-800 dark:text-amber-200 text-sm font-medium">{t('pos.cartOverwriteWarning')}</p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setIsOverwriteCartModalOpen(false)} className="px-4 py-2 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] font-bold text-sm">{t('common.cancel')}</button>
                        <button onClick={handleConfirmOverwriteCart} className="px-6 py-2 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] hover:opacity-90 font-bold rounded-xl shadow-xs transition-transform active:scale-[0.98]">{t('pos.overwrite')}</button>
                    </div>
                </div>
            </Modal>
        </>
    );
};
