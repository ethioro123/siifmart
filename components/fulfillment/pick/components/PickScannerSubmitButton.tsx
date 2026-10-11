import React from 'react';
import { RotateCcw, CheckCircle } from 'lucide-react';

interface PickScannerSubmitButtonProps {
    step: 'LOCATION' | 'ITEM' | 'QUANTITY';
    inputVal: string;
    currentItem: any;
    isItemMatched: boolean;
    isStrictlyValid: boolean;
    isProcessing: boolean;
    t: (key: string) => string;
}

export const PickScannerSubmitButton: React.FC<PickScannerSubmitButtonProps> = ({
    step,
    inputVal,
    currentItem,
    isItemMatched,
    isStrictlyValid,
    isProcessing,
    t,
}) => {
    return (
        <button
            type="submit"
            disabled={(step === 'LOCATION' && !inputVal.trim() && !!currentItem) || isProcessing}
            className={`w-full py-3.5 sm:py-4 px-4 min-h-[48px] rounded-xl flex items-center justify-center gap-2 transition-colors border text-xs sm:text-sm font-semibold uppercase tracking-wider ${
                ((!inputVal.trim() && !isItemMatched && !!currentItem)) || isProcessing
                    ? 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] opacity-60 cursor-not-allowed'
                    : (!currentItem)
                    ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white'
                    : (isItemMatched)
                    ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white'
                    : !isStrictlyValid
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                    : 'bg-[var(--theme-accent)] hover:opacity-90 border-[var(--theme-accent)] text-white'
            }`}
        >
            {isProcessing ? (
                <RotateCcw size={18} className="animate-spin shrink-0" />
            ) : (
                <CheckCircle size={18} className="shrink-0" />
            )}
            <span className="truncate">
                {isProcessing
                    ? t('warehouse.picking.validating')
                    : !currentItem
                    ? 'Finalize Mission & Create Pack Job'
                    : step === 'QUANTITY'
                    ? t('warehouse.picking.confirmPick')
                    : isItemMatched
                    ? t('warehouse.picking.completePick')
                    : t('warehouse.picking.confirmScan')}
            </span>
        </button>
    );
};
