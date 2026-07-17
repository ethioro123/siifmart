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
            className={`mt-6 w-full py-6 rounded-2xl flex items-center justify-center gap-3 transition-all duration-500 active:scale-95 shadow-2xl border-2 relative z-30 pointer-events-auto ${((!inputVal.trim() && !isItemMatched && !!currentItem)) || isProcessing
                ? 'bg-gray-200 dark:bg-[#1C2620]/50 border-gray-300 dark:border-white/5 text-gray-400 dark:text-gray-600 grayscale opacity-50 cursor-not-allowed'
                : (!currentItem)
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-400 text-white font-black uppercase tracking-widest shadow-[0_0_40px_rgba(34,197,94,0.4)] scale-105'
                    : (isItemMatched)
                        ? 'bg-green-600 border-green-400 text-white font-black uppercase tracking-widest shadow-[0_0_40px_rgba(34,197,94,0.3)]'
                        : !isStrictlyValid
                            ? 'bg-red-50 dark:bg-[#1C2620] border-red-500/50 text-red-600 dark:text-red-400'
                            : 'bg-gradient-to-r from-[#2C5E3B] to-[#3a7a4d] dark:from-[#2C5E3B] dark:to-[#3a7a4d] border-[#2C5E3B] dark:border-[#A9CBA2]/20 text-white font-black uppercase tracking-widest shadow-[#2C5E3B]/20'
                }`}
        >
            {isProcessing ? (
                <RotateCcw size={24} className="animate-spin" />
            ) : (isItemMatched || !currentItem) ? (
                <CheckCircle size={24} className="animate-bounce" />
            ) : (
                <CheckCircle size={24} />
            )}
            {isProcessing
                ? t('warehouse.picking.validating')
                : !currentItem
                    ? t('warehouse.completed')
                    : step === 'QUANTITY'
                        ? t('warehouse.picking.confirmPick')
                        : isItemMatched
                            ? t('warehouse.picking.completePick')
                            : t('warehouse.picking.confirmScan')}
        </button>
    );
};
