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
    onConfirmReceive: () => void;
    t: (key: string) => string;
}

export const Step3ReceiveHandover: React.FC<Step3ReceiveHandoverProps> = ({
    splitReceivingPO,
    splitReceivingItem,
    splitVariants,
    totalScanned,
    isSubmitting,
    onPrintLabels,
    onConfirmReceive,
    t,
}) => {
    return (
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 md:p-6 space-y-4 md:space-y-6 bg-[var(--theme-bg-app)]">
            {/* Handover Summary Card */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl p-4 md:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--theme-border)]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 flex items-center justify-center">
                            <ShieldCheck size={22} />
                        </div>
                        <div>
                            <h3 className="text-sm md:text-base font-bold uppercase tracking-tight text-[var(--theme-text-primary)]">
                                Intake Ready for Dock Handover
                            </h3>
                            <span className="text-xs text-[var(--theme-text-secondary)]">
                                PO #{splitReceivingPO.poNumber || splitReceivingPO.id} · {splitReceivingPO.supplierName}
                            </span>
                        </div>
                    </div>

                    <span className="px-3 py-1 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 font-mono font-bold text-xs uppercase">
                        {totalScanned} Total Received
                    </span>
                </div>

                {/* Splits Summary Grid */}
                <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)] block mb-1">
                        Recorded Pallet / Lot Splits
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
                                        Lot: {v.batchNumber || 'STANDARD'}
                                    </span>
                                    {v.expiryDate && (
                                        <span className="text-[11px] text-[var(--theme-text-secondary)] ml-2">
                                            Exp: {v.expiryDate}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 sm:justify-end">
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                    v.condition === 'Damaged'
                                        ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                                        : 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                                }`}>
                                    {v.condition || 'Good'}
                                </span>
                                <span className="font-bold text-sm text-[var(--theme-text-primary)]">
                                    {v.quantity} Units
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Print and Confirmation Actions Card */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl p-4 md:p-6 shadow-sm space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                    Dock Handover & Storage Slotting Actions
                </h4>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                        type="button"
                        onClick={onPrintLabels}
                        disabled={isSubmitting}
                        className="flex-1 min-h-[52px] px-6 py-3 rounded-2xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-app)] border-2 border-[var(--theme-border)] hover:border-[var(--theme-accent)]/40 text-[var(--theme-text-primary)] font-bold text-xs md:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-colors cursor-pointer touch-manipulation disabled:opacity-50"
                    >
                        <Printer size={18} className="text-[var(--theme-accent)]" />
                        <span>Print Pallet & Intake Labels</span>
                    </button>

                    <button
                        type="button"
                        onClick={onConfirmReceive}
                        disabled={isSubmitting || totalScanned <= 0}
                        className="flex-1 min-h-[52px] px-6 py-3 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-bold text-xs md:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer touch-manipulation disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <>
                                <CheckCircle size={18} />
                                <span>Confirm Receipt & Create Putaway</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
