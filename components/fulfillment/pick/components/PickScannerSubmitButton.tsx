import React from 'react';
import { RotateCcw, CheckCircle } from 'lucide-react';

interface PickScannerSubmitButtonProps {
    step: 'LOCATION' | 'ITEM' | 'QUANTITY';
    inputVal: string;
    qtyVal: string;
    currentItem: any;
    isItemMatched: boolean;
    isStrictlyValid: boolean;
    isProcessing: boolean;
    t: (key: string) => string;
}

export const PickScannerSubmitButton: React.FC<PickScannerSubmitButtonProps> = ({
    step,
    inputVal,
    qtyVal,
    currentItem,
    isItemMatched,
    isStrictlyValid,
    isProcessing,
    t,
}) => {
    const hasValue = step === 'QUANTITY' ? qtyVal.trim().length > 0 : inputVal.trim().length > 0;
    const isReady = !currentItem || (hasValue && isStrictlyValid);

    return (
        <button
            type="submit"
            disabled={!isReady || isProcessing}
            className={`w-full py-4 sm:py-5 px-4 min-h-[64px] rounded-2xl flex items-center justify-center gap-3 transition-colors border text-base sm:text-lg font-bold uppercase tracking-wide ${
                (!isReady || isProcessing)
                    ? 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] opacity-60 cursor-not-allowed'
                    : (!currentItem)
                    ? 'bg-[var(--theme-status-success-bg)] bg-[var(--theme-status-success-bg)] border-[var(--theme-status-success-border)] text-white'
                    : (isItemMatched)
                    ? 'bg-[var(--theme-status-success-bg)] bg-[var(--theme-status-success-bg)] border-[var(--theme-status-success-border)] text-white'
                    : hasValue && !isStrictlyValid
                    ? 'bg-[var(--theme-status-danger-bg)] border-[var(--theme-status-danger-border)] text-[var(--theme-status-danger-text)]'
                    : 'bg-[var(--theme-accent)] hover:opacity-90 border-[var(--theme-accent)] text-white'
            }`}
        >
            {isProcessing ? (
                <RotateCcw size={18} className="animate-spin shrink-0" />
            ) : (
                <CheckCircle size={22} className="shrink-0" />
            )}
            <span className="text-center leading-snug">
                {isProcessing
                    ? t('warehouse.picking.validating')
                    : !currentItem
                    ? (t('warehouse.picking.completePicking') || 'Complete picking')
                    : step === 'QUANTITY'
                    ? t('warehouse.picking.confirmPick')
                    : isItemMatched
                    ? t('warehouse.picking.completePick')
                    : t('warehouse.picking.confirmScan')}
            </span>
        </button>
    );
};
