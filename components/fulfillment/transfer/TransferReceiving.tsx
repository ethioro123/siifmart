import React, { useEffect, useState } from 'react';
import { ArrowDown, Box, ShieldCheck, MapPin } from 'lucide-react';
import { WMSJob, Site, ReceivingItem, Product } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { useTransferIntake } from '../../../hooks/useTransferIntake';
import { TransferVariancePanel } from './TransferVariancePanel';
import { useLanguage } from '../../../contexts/LanguageContext';
import { logger } from '../../../utils/logger';
import { useFulfillment } from '../FulfillmentContext';
import { CustodyHandshakeModal } from './CustodyHandshakeModal';
import { useData } from '../../../contexts/DataContext';
import { TransferReceiveItemCard } from './TransferReceiveItemCard';
import { transferReceiptVerificationService, type TransferReceiptVerification } from '../../../services/transfer-receipt-verification.service';
import { useTransferReceiptVerification } from '../../../hooks/useTransferReceiptVerification';

interface TransferReceivingProps {
    activeTransferJob: WMSJob;
    transferReceiveItems: ReceivingItem[];
    setTransferReceiveItems: (items: ReceivingItem[]) => void;
    setTransferReceiveMode: (val: boolean) => void;
    setActiveTransferJob: (job: WMSJob | null) => void;
    allProducts: Product[];
    wmsJobsService: any;
    adjustStockMutation: any;
    addProduct?: any;
    addNotification: (type: string, message: string) => void;
    refreshData: () => Promise<void>;
    activeSite: Site | null;
}

export const TransferReceiving: React.FC<TransferReceivingProps> = ({
    activeTransferJob,
    transferReceiveItems,
    setTransferReceiveItems,
    setTransferReceiveMode,
    setActiveTransferJob,
    allProducts,
    wmsJobsService,
    adjustStockMutation,
    addProduct,
    addNotification,
    refreshData,
    activeSite
}) => {
    const { t } = useLanguage();
    const { user, employees, logSystemEvent } = useFulfillment();
    const { products } = useData();
    // Store transfer acceptance is always a blind physical count, independent of PO receiving settings.
    const isBlindReceiving = true;
    const [isHandshakeModalOpen, setIsHandshakeModalOpen] = useState(false);
    const [isSubmittingReceipt, setIsSubmittingReceipt] = useState(false);
    const [receiptVerification, setReceiptVerification] = useState<TransferReceiptVerification | null>(null);
    const [isLoadingVerification, setIsLoadingVerification] = useState(true);
    const verificationMutation = useTransferReceiptVerification();
    const intake = useTransferIntake();

    useEffect(() => {
        let active = true;
        setIsLoadingVerification(true);
        transferReceiptVerificationService.get(activeTransferJob.id)
            .then(result => {
                if (!active) return;
                setReceiptVerification(result);
                setTransferReceiveItems(result.items.map((item, index) => ({
                    ...transferReceiveItems[index],
                    ...item,
                    productName: item.productName || transferReceiveItems[index]?.productName,
                    expectedQty: transferReceiveItems[index]?.expectedQty,
                    receivedQty: result.status === 'verified' ? item.receivedQty : 0
                })));
            })
            .catch(error => {
                if (!active) return;
                logger.error('TransferReceiving', 'Failed to load receipt verification', error as Error);
                addNotification('alert', 'Could not load transfer verification. Refresh and try again.');
            })
            .finally(() => { if (active) setIsLoadingVerification(false); });
        return () => { active = false; };
    }, [activeTransferJob.id, user?.id]);

    const handleCountSubmission = async () => {
        if (!receiptVerification?.canCount || isLoadingVerification || verificationMutation.isPending) return;
        try {
            const result = await verificationMutation.mutateAsync({ jobId: activeTransferJob.id, items: transferReceiveItems });
            setReceiptVerification(result);
            setTransferReceiveItems(result.items.map((item, index) => ({
                ...transferReceiveItems[index],
                ...item,
                productName: item.productName || transferReceiveItems[index]?.productName,
                expectedQty: transferReceiveItems[index]?.expectedQty
            })));
            setIsHandshakeModalOpen(true);
        } catch (error) {
            logger.error('TransferReceiving', 'Transfer count verification failed', error as Error);
            addNotification('alert', error instanceof Error ? error.message : 'Could not save transfer count');
        }
    };

    // Delivering driver lookup
    const assignedDriver = employees.find(e => e.id === activeTransferJob.assignedTo);
    const driverName = (activeTransferJob as any).carrierName || (activeTransferJob as any).carrier || assignedDriver?.name || 'Assigned Driver / Courier';

    const handleConfirmReceipt = async () => {
        if (isSubmittingReceipt) return;
        setIsSubmittingReceipt(true);
        try {
            await intake.mutateAsync(activeTransferJob.id);
            addNotification('success', t('warehouse.transferReceiptSaved'));
            setIsHandshakeModalOpen(false);
            setTransferReceiveMode(false);
            setActiveTransferJob(null);
            setTransferReceiveItems([]);
            try { await refreshData(); } catch { logger.warn('TransferReceiving', 'Receipt saved; refresh failed'); }
        } catch (cause) {
            const details = cause && typeof cause === 'object' && 'details' in cause ? cause.details : undefined;
            addNotification('alert', t(details === 'TRANSFER_VARIANCE_REVIEW_REQUIRED' ? 'warehouse.varianceHold' : 'warehouse.transferReceiptFailed'));
        } finally { setIsSubmittingReceipt(false); }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header - Sticky on mobile */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-5 mb-3 sm:mb-5 shadow-xs sticky top-0 z-20">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-[var(--theme-text-primary)] flex items-center gap-2 text-lg tracking-tight">
                            <ArrowDown className="text-primary" size={20} />
                            {t('warehouse.shipmentReceiving')}
                        </h3>
                        {activeTransferJob && (
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="text-primary font-mono text-xs font-semibold">{formatJobId(activeTransferJob)}</span>
                                <span className="text-[var(--theme-text-secondary)] text-xs">•</span>
                                <span className="flex items-center gap-1 text-xs font-mono font-bold text-[var(--theme-accent)]">
                                    <MapPin size={11} className="shrink-0" />
                                    <span>{activeSite?.name || 'Destination Site'}</span>
                                </span>
                                <span className="text-[var(--theme-text-secondary)] text-xs">•</span>
                                <span className="text-[var(--theme-text-secondary)] text-xs font-medium">{activeTransferJob.items} {t('warehouse.itemPlural')}</span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => {
                            setTransferReceiveMode(false);
                            setActiveTransferJob(null);
                            setTransferReceiveItems([]);
                        }}
                        className="min-h-[44px] px-4 py-2 bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] rounded-xl font-semibold transition-all text-xs touch-manipulation"
                    >
                        {t('warehouse.dismiss')}
                    </button>
                </div>
            </div>

            {receiptVerification?.hasDiscrepancy && <TransferVariancePanel jobId={activeTransferJob.id} />}
            {/* Receive List */}
            <div className="flex-1 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 overflow-hidden flex flex-col shadow-xs">
                <div className="overflow-y-auto space-y-3.5 custom-scrollbar flex-1 pb-4">
                    {transferReceiveItems.map((item, idx) => {
                        const product = allProducts.find(p => p.id === item.productId) || products.find(p => p.id === item.productId);
                        return (
                            <TransferReceiveItemCard
                                key={idx}
                                item={item}
                                idx={idx}
                                product={product}
                                isBlindReceiving={isBlindReceiving}
                                readOnly={isLoadingVerification || !receiptVerification?.canCount || receiptVerification.status === 'verified'}
                                onUpdateItem={(targetIdx, updates) => {
                                    const newItems = [...transferReceiveItems];
                                    newItems[targetIdx] = { ...newItems[targetIdx], ...updates };
                                    setTransferReceiveItems(newItems);
                                }}
                                t={t}
                            />
                        );
                    })}
                </div>
                <div className="pt-4 border-t border-[var(--theme-border)] mt-2">
                    <button
                        onClick={receiptVerification?.status === 'verified' ? () => setIsHandshakeModalOpen(true) : handleCountSubmission}
                        disabled={isLoadingVerification || (!receiptVerification?.canCount && receiptVerification?.status !== 'verified') || verificationMutation.isPending}
                        className="w-full min-h-[44px] py-3.5 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] hover:opacity-90 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all touch-manipulation active:scale-[0.99] cursor-pointer"
                    >
                        <ShieldCheck size={16} />
                        {isLoadingVerification ? t('warehouse.loadingTransferCount')
                            : verificationMutation.isPending ? t('warehouse.savingVerifiedCount')
                            : receiptVerification?.status === 'verified' ? t('warehouse.reviewAndAcceptReceipt')
                            : t('warehouse.submitCountAndAcceptResponsibility')}
                    </button>
                </div>
            </div>

            {/* Custody Handshake Modal */}
            <CustodyHandshakeModal
                isOpen={isHandshakeModalOpen}
                onClose={() => setIsHandshakeModalOpen(false)}
                onConfirm={handleConfirmReceipt}
                activeTransferJob={activeTransferJob}
                transferReceiveItems={transferReceiveItems}
                allProducts={allProducts}
                products={products}
                currentUser={user}
                driverName={driverName}
                isSubmitting={isSubmittingReceipt}
                verifiedHasDiscrepancy={receiptVerification?.hasDiscrepancy}
                verifiedDiscrepancyCount={receiptVerification?.discrepancyCount}
            />
        </div>
    );
};
