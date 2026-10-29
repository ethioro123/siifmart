import React from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, AlertTriangle, CheckCircle, Truck, UserCheck, X } from 'lucide-react';
import { WMSJob, ReceivingItem, Product, User } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { useLanguage } from '../../../contexts/LanguageContext';

interface CustodyHandshakeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (discrepancyDetails?: { hasDiscrepancy: boolean; discrepancyCount: number }) => Promise<void>;
    activeTransferJob: WMSJob;
    transferReceiveItems: ReceivingItem[];
    allProducts: Product[];
    products?: Product[];
    currentUser: User | null;
    driverName?: string;
    isSubmitting: boolean;
    verifiedHasDiscrepancy?: boolean;
    verifiedDiscrepancyCount?: number;
}

export const CustodyHandshakeModal: React.FC<CustodyHandshakeModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    activeTransferJob,
    transferReceiveItems,
    allProducts,
    products = [],
    currentUser,
    driverName = 'Assigned Driver / Logistics Courier',
    isSubmitting,
    verifiedHasDiscrepancy,
    verifiedDiscrepancyCount
}) => {
    const { t } = useLanguage();
    const isBlindReceiving = true;

    if (!isOpen) return null;

    // Evaluate discrepancies
    const discrepantItems = transferReceiveItems.filter(item => item.condition === 'Damaged' || item.condition === 'Short');

    const hasDiscrepancy = verifiedHasDiscrepancy ?? discrepantItems.length > 0;
    const displayedDiscrepantItems = discrepantItems;
    const totalDiscrepantUnits = verifiedDiscrepancyCount ?? discrepantItems.reduce((sum, item) => {
        const diff = Math.abs((item.expectedQty || 0) - (item.receivedQty || 0));
        return sum + (diff > 0 ? diff : (item.condition === 'Damaged' ? item.receivedQty || 1 : 0));
    }, 0);

    const handleExecute = async () => {
        if (isSubmitting) return;
        await onConfirm({
            hasDiscrepancy,
            discrepancyCount: totalDiscrepantUnits
        });
    };

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[color-mix(in_srgb,var(--theme-overlay)_80%,transparent)] animate-in fade-in duration-200">
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-[var(--theme-border)] flex items-center justify-between bg-[var(--theme-bg-subtle)]">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${hasDiscrepancy ? 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)]' : 'bg-primary/10 text-primary'}`}>
                            {hasDiscrepancy ? <AlertTriangle size={22} /> : <ShieldCheck size={22} />}
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-[var(--theme-text-primary)] tracking-tight">
                                {t('warehouse.receiptAccountability')}
                            </h3>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">
                                {t('warehouse.blindCountRecordedToReceiver')}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] rounded-xl hover:bg-[var(--theme-bg-card)] transition-colors touch-manipulation"
                        aria-label="Close modal"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar text-xs">

                    {/* Legal Custody Notice */}
                    <div className="p-3.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] leading-relaxed font-normal">
                        {t('warehouse.legalCustodyNotice')}
                    </div>

                    {/* Parties Handshake Card */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)]">
                            <div className="flex items-center gap-1.5 mb-1 text-[11px] font-semibold text-[var(--theme-status-warning-text)] uppercase tracking-wider">
                                <Truck size={14} /> {t('warehouse.relinquishingCustody')}
                            </div>
                            <p className="font-bold text-[var(--theme-text-primary)] break-words text-sm leading-tight">{driverName}</p>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] font-mono">{t('warehouse.transitDriverCourier')}</p>
                        </div>

                        <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5">
                            <div className="flex items-center gap-1.5 mb-1 text-[11px] font-semibold text-primary uppercase tracking-wider">
                                <UserCheck size={14} /> {t('warehouse.assumingCustody')}
                            </div>
                            <p className="font-bold text-[var(--theme-text-primary)] break-words text-sm leading-tight">{currentUser?.name || 'Receiver Staff'}</p>
                            <p className="text-[11px] text-primary font-mono">{t('warehouse.storeReceivingCustodian')}</p>
                        </div>
                    </div>

                    {/* Clean Receipt vs Discrepancy Alert */}
                    {!hasDiscrepancy ? (
                        <div className="p-4 rounded-xl bg-[var(--theme-status-success-bg)] border border-[var(--theme-status-success-border)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] flex items-center gap-3">
                            <CheckCircle size={20} className="text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] shrink-0" />
                            <div>
                                <p className="font-bold text-sm tracking-tight">{t('warehouse.countMatchedDispatchRecord')}</p>
                                <p className="text-[11px] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] mt-0.5">
                                    {t('warehouse.allUnitsGoodCondition', { jobId: formatJobId(activeTransferJob) })}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="p-3.5 rounded-xl bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] flex items-start gap-3">
                                <AlertTriangle size={18} className="text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold tracking-tight">
                                        {totalDiscrepantUnits > 0
                                            ? t('warehouse.receiptVarianceRecorded', { count: totalDiscrepantUnits })
                                            : t('warehouse.conditionIssueRecorded', { count: discrepantItems.length })}
                                    </p>
                                    <p className="text-[11px] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] mt-0.5">
                                        {t('warehouse.varianceAttributionNotice')}
                                    </p>
                                </div>
                            </div>

                            {/* Item condition notes */}
                            {displayedDiscrepantItems.length > 0 && <div className="border border-[var(--theme-border)] rounded-xl overflow-hidden divide-y divide-[var(--theme-border)]">
                                {displayedDiscrepantItems.map((item, idx) => {
                                    const product = allProducts.find(p => p.id === item.productId) || products.find(p => p.id === item.productId);
                                    const expected = item.expectedQty || 0;
                                    const received = item.receivedQty || 0;
                                    const variance = received - expected;

                                    return (
                                        <div key={idx} className="p-3 flex items-center justify-between bg-[var(--theme-bg-subtle)]">
                                            <div className="min-w-0 flex-1 mr-3">
                                                <p className="font-bold text-[var(--theme-text-primary)] truncate">{product?.name || 'Item'}</p>
                                                <p className="text-[11px] text-[var(--theme-text-secondary)] font-mono">{product?.sku} · Condition: <span className="font-semibold text-[var(--theme-status-warning-text)]">{item.condition}</span></p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded-full ${variance < 0 ? 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)]' : 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)]'}`}>
                                                    {isBlindReceiving
                                                        ? `Counted: ${received} (Variance)`
                                                        : `${variance > 0 ? `+${variance}` : variance} (${received}/${expected})`}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>}
                        </div>
                    )}

                </div>

                {/* Footer Actions */}
                <div className="p-4 px-6 border-t border-[var(--theme-border)] flex items-center justify-between gap-3 bg-[var(--theme-bg-subtle)]">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="min-h-[44px] px-4 py-2.5 rounded-xl border border-[var(--theme-border)] text-[var(--theme-text-secondary)] font-semibold hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] transition-all text-xs touch-manipulation"
                    >
                        {t('warehouse.reviseCounts')}
                    </button>
                    <button
                        onClick={handleExecute}
                        disabled={isSubmitting}
                        className={`min-h-[44px] flex-1 py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm touch-manipulation ${!isSubmitting
                            ? hasDiscrepancy
                                ? 'bg-[var(--theme-status-warning-bg)] bg-[var(--theme-status-warning-bg)] text-[var(--theme-text-primary)] active:scale-[0.99] cursor-pointer'
                                : 'bg-[var(--theme-primary)] hover:opacity-90 text-[var(--theme-primary-text)] active:scale-[0.99] cursor-pointer'
                            : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] opacity-50 cursor-not-allowed border border-[var(--theme-border)]'
                        }`}
                    >
                        <ShieldCheck size={16} />
                        {isSubmitting ? 'Recording Receipt...' : hasDiscrepancy ? t('warehouse.acceptVarianceAndTakeCustody') : t('warehouse.confirmReceiptAndTakeCustody')}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};
