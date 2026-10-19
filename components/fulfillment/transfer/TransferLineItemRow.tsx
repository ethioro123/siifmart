import React from 'react';
import { Box, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { WMSJob, Product } from '../../../types';
import { getSellUnit, getEffectivePackageSize } from '../../../utils/units';
import { TransferQtyDisplay } from './TransferQtyDisplay';

interface TransferLineItemRowProps {
    item: any;
    idx: number;
    product?: Product;
    selectedJob: WMSJob;
    onResolveDiscrepancy?: (job: WMSJob, item: any, index: number) => void;
    t: (key: string) => string;
    isBlindExpected?: boolean;
}

export const TransferLineItemRow: React.FC<TransferLineItemRowProps> = ({
    item,
    idx,
    product,
    selectedJob,
    onResolveDiscrepancy,
    t,
    isBlindExpected = false
}) => {
    const itemQty = item.expectedQty || item.quantity || item.pickedQty || 0;
    const itemSku = item.sku || product?.sku || 'N/A';
    const itemUnit = getSellUnit(item.unit || product?.unit);
    const sizeNum = getEffectivePackageSize(item.unit || product?.unit, product?.size || item.size);
    const isWeightVol = (itemUnit.category === 'weight' || itemUnit.category === 'volume') && sizeNum > 0;
    const expectedMeasure = isWeightVol
        ? (item.requestedMeasureQty !== undefined ? item.requestedMeasureQty : (itemQty * sizeNum))
        : itemQty;
    const showsPhysicalMeasure = item.requestedMeasureQty !== undefined || (isWeightVol && !product?.size && !item.size);
    const showReceived = item.receivedQty !== undefined &&
        ['Received', 'Delivered', 'Completed'].some(s => s === selectedJob.transferStatus || s === selectedJob.status);
    const hasDiscrepancy = showReceived && (item.receivedQty !== expectedMeasure || item.condition === 'Damaged');
    const isDone = showReceived && !hasDiscrepancy;

    return (
        <div
            className={`bg-[var(--theme-bg-card)] border ${isDone ? 'border-green-500/30' : 'border-[var(--theme-border)]'} rounded-xl px-4 py-3 flex items-center justify-between gap-3 shadow-sm`}
        >
            <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-10 h-10 rounded-lg bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center overflow-hidden shrink-0">
                    {product?.image ? (
                        <img src={product.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <Box size={18} className="text-[var(--theme-text-secondary)]/50" />
                    )}
                    {isDone && (
                        <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                            <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                        </div>
                    )}
                    {hasDiscrepancy && (
                        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                            <XCircle size={16} className="text-red-600 dark:text-red-400" />
                        </div>
                    )}
                </div>
                <div className="min-w-0">
                    <h4 className="text-[var(--theme-text-primary)] font-semibold tracking-tight truncate uppercase text-xs leading-snug">
                        {item.name || item.productName || product?.name || 'Unknown'}
                    </h4>
                    <span className="text-[11px] font-mono tabular-nums text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)] px-1.5 py-0.5 rounded border border-[var(--theme-border)] uppercase">
                        {itemSku}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                <div className="text-right">
                    <span className="text-[11px] text-[var(--theme-text-secondary)] font-medium uppercase tracking-wider block">
                        {t('warehouse.expected')}{isBlindExpected && !showReceived ? ' (Blind)' : ''}
                    </span>
                    {isBlindExpected && !showReceived ? (
                        <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 tracking-widest">
                            *** Blind
                        </span>
                    ) : (
                        <TransferQtyDisplay qty={showsPhysicalMeasure ? expectedMeasure : itemQty} size={product?.size || item.size} unit={itemUnit} measureQty={showsPhysicalMeasure} t={t} />
                    )}
                </div>

                {showReceived && (
                    <div className="text-right">
                        <span className={`text-[11px] font-medium uppercase tracking-wider block ${hasDiscrepancy ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                            {t('warehouse.received')}
                        </span>
                        <TransferQtyDisplay qty={item.receivedQty} size={product?.size || item.size} unit={itemUnit} measureQty={showsPhysicalMeasure} color={hasDiscrepancy ? 'red' : 'green'} t={t} />
                    </div>
                )}

                {hasDiscrepancy && onResolveDiscrepancy && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onResolveDiscrepancy(selectedJob, item, idx); }}
                        className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 text-[11px] uppercase font-semibold tracking-wider rounded-lg transition-colors flex items-center gap-1 min-h-[36px]"
                    >
                        <AlertTriangle size={12} />
                        <span>Resolve</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default TransferLineItemRow;

