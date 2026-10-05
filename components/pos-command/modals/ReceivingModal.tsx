import React, { useState, useEffect } from 'react';
import Modal from '../../Modal';
import { usePOSCommand } from '../POSCommandContext';
import { useData } from '../../../contexts/DataContext';
import { useLanguage } from '../../../contexts/LanguageContext';

// --- Subcomponents ---
import { ReceivingSummary } from './components/ReceivingSummary';
import { ReceivingForm } from './components/ReceivingForm';
import { ReceivingHistory } from './components/ReceivingHistory';
import { ReceivingPendingList } from './components/ReceivingPendingList';

export const ReceivingModal: React.FC = () => {
    const { t } = useLanguage();
    const { activeSite } = useData();

    const {
        isReceivingModalOpen,
        handleCloseReceivingModal,
        receivingSummary,
        selectedTransferForReceiving
    } = usePOSCommand();

    const [activeTab, setActiveTab2] = useState<'pending' | 'history'>('pending');

    // Allow external reset when modal closes
    useEffect(() => {
        if (!isReceivingModalOpen) setActiveTab2('pending');
    }, [isReceivingModalOpen]);

    // Auto-switch to history after a successful receipt is confirmed
    useEffect(() => {
        if (receivingSummary && !(receivingSummary as any).isHistory) {
            // When summary is dismissed, the next view should be history
            setActiveTab2('history');
        }
    }, [receivingSummary]);

    return (
        <Modal isOpen={isReceivingModalOpen} onClose={handleCloseReceivingModal} title={t('posCommand.receivingModalTitle')} size="xl">
            <div className="space-y-4 p-1 bg-transparent">
                {/* Tabs */}
                {!receivingSummary && !selectedTransferForReceiving && (
                    <div className="flex p-1 bg-[var(--theme-bg-subtle)] rounded-2xl mb-4 border border-[var(--theme-border)]">
                        <button
                            onClick={() => setActiveTab2('pending')}
                            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                                activeTab === 'pending'
                                    ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-xs'
                                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)]'
                            }`}
                        >
                            {t('posCommand.pendingTab')} ({activeSite?.name})
                        </button>
                        <button
                            onClick={() => setActiveTab2('history')}
                            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                                activeTab === 'history'
                                    ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-xs'
                                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)]'
                            }`}
                        >
                            {t('posCommand.historyTab')}
                        </button>
                    </div>
                )}

                {/* 1. Receiving Summary View */}
                {receivingSummary && <ReceivingSummary />}

                {/* 2. Pending Active Shipment Form View */}
                {!receivingSummary && selectedTransferForReceiving && <ReceivingForm />}

                {/* 3. Transaction lists */}
                {!receivingSummary && !selectedTransferForReceiving && (
                    activeTab === 'history' ? (
                        <ReceivingHistory />
                    ) : (
                        <ReceivingPendingList />
                    )
                )}
            </div>
        </Modal>
    );
};
export default ReceivingModal;
