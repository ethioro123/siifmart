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
                    <div className="flex p-1 bg-[#F4F0E6] dark:bg-black/30 rounded-2xl mb-4 border border-[#E2DCCE] dark:border-white/5">
                        <button
                            onClick={() => setActiveTab2('pending')}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer ${
                                activeTab === 'pending'
                                    ? 'bg-[#224429] dark:bg-[#2C5E3B] text-white shadow-sm'
                                    : 'text-[#4D6E56] dark:text-gray-400 hover:text-[#2C5E3B] dark:hover:text-white'
                            }`}
                        >
                            {t('posCommand.pendingTab')} ({activeSite?.name})
                        </button>
                        <button
                            onClick={() => setActiveTab2('history')}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer ${
                                activeTab === 'history'
                                    ? 'bg-[#224429] dark:bg-[#2C5E3B] text-white shadow-sm'
                                    : 'text-[#4D6E56] dark:text-gray-400 hover:text-[#2C5E3B] dark:hover:text-white'
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
