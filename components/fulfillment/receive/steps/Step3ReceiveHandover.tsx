import React from 'react';
import { Printer, CheckCircle, ShieldCheck, Tag, Box, Loader2, Calendar, AlertTriangle } from 'lucide-react';
import { SplitVariant } from '../ReceiveSplitCard';
import { PurchaseOrder } from '../../../../types';

interface Step3ReceiveHandoverProps {
    splitReceivingPO: PurchaseOrder;
    splitReceivingItem: any;
    splitVariants: SplitVariant[];
    totalScanned: number;
    isSubmitting: boolean;
    onPrintLabels: () => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

export const Step3ReceiveHandover: React.FC<Step3ReceiveHandoverProps> = ({
    splitReceivingPO,
    splitReceivingItem,
    splitVariants,
    totalScanned,
    isSubmitting,
    onPrintLabels,
    t,
}) => {
    return (
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 md:p-6 space-y-4 md:space-y-6 bg-[var(--theme-bg-app)]">
            {/* Handover Summary Card */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl p-4 md:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--theme-border)]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[var(--theme-status-success-bg)] border border-[var(--theme-status-success-border)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] flex items-center justify-center">
                            <ShieldCheck size={22} />
                        </div>
                        <div>
                            <h3 className="text-sm md:text-base font-bold uppercase tracking-tight text-[var(--theme-text-primary)]">
                                {t('warehouse.reviewBeforeSaving') || 'Review before saving receipt'}
                            </h3>
                            <span className="text-xs text-[var(--theme-text-secondary)]">
                                PO #{splitReceivingPO.poNumber || splitReceivingPO.id} · {splitReceivingPO.supplierName}
                            </span>
                        </div>
                    </div>

                    <span className="px-3 py-1 rounded-xl bg-[var(--theme-status-success-bg)] border border-[var(--theme-status-success-border)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] font-mono font-bold text-xs uppercase">
                        {t('warehouse.countedNotSaved', { count: totalScanned }) || `${totalScanned} Counted · Not saved`}
                    </span>
                </div>

                {/* Splits Summary Grid */}
                <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)] block mb-1">
                        {t('warehouse.recordedSplitsTitle') || 'Recorded Pallet / Lot Splits'}
                    </span>
                    {splitVariants.map((v, i) => (
                        <div
                            key={v.id || i}
                            className="p-3 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-mono"
                        >
                            <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-lg bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center justify-center text-[11px] font-bold">
                                    {i + 1}
                                </span>
                                <div>
                                    <span className="font-bold text-[var(--theme-text-primary)] uppercase">
                                        {t('warehouse.batchLotNo') || 'Lot'}: {v.batchNumber || 'STANDARD'}
                                    </span>
                                    {v.expiryDate && (
                                        <span className="text-[11px] text-[var(--theme-text-secondary)] ml-2">
                                            {t('warehouse.expiryDate') || 'Exp'}: {v.expiryDate}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 sm:justify-end">
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                    v.condition === 'Damaged'
                                        ? 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)]'
                                        : 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)]'
                                }`}>
                                    {v.condition === 'Damaged' ? (t('warehouse.conditionDamaged') || 'Damaged') : (t('warehouse.conditionGood') || 'Good')}
                                </span>
                                <span className="font-bold text-sm text-[var(--theme-text-primary)]">
                                    {v.quantity} {t('warehouse.unitsLabel') || 'Units'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Print and Confirmation Actions Card */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl p-4 md:p-6 shadow-sm space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                    {t('warehouse.dockHandoverActionsTitle') || 'Dock Handover & Storage Slotting Actions'}
                </h4>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                        type="button"
                        onClick={onPrintLabels}
                        disabled={isSubmitting}
                        className="flex-1 min-h-[52px] px-6 py-3 rounded-2xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-app)] border-2 border-[var(--theme-border)] hover:border-[var(--theme-accent)]/40 text-[var(--theme-text-primary)] font-bold text-xs md:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-colors cursor-pointer touch-manipulation disabled:opacity-50"
                    >
                        <Printer size={18} className="text-[var(--theme-accent)]" />
                        <span>{t('warehouse.printPalletAndIntakeLabels') || 'Print Pallet & Intake Labels'}</span>
                    </button>


                </div>
            </div>
        </div>
    );
};
