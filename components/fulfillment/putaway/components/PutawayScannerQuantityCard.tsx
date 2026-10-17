import React from 'react';

interface PutawayScannerQuantityCardProps {
    currentItem: any;
    scannedSku: string;
    onSetQty?: (qty: string) => void;
}

export const PutawayScannerQuantityCard: React.FC<PutawayScannerQuantityCardProps> = ({
    currentItem,
    scannedSku,
    onSetQty,
}) => {
    return (
        <div className="text-center mb-6 w-full max-w-md animate-in fade-in duration-200">
            <p className="text-[var(--theme-text-secondary)] text-[11px] font-semibold uppercase tracking-wider mb-2">
                Physical Count Verification
            </p>
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-5 shadow-sm">
                <p className="text-xl sm:text-2xl text-[var(--theme-text-primary)] font-bold uppercase tracking-tight leading-snug mb-2">
                    {currentItem?.name || currentItem?.productName}
                </p>
                <div className="inline-block px-3 py-1 bg-[var(--theme-accent)] text-white font-semibold font-mono text-xs rounded-xl mb-3">
                    {scannedSku || currentItem?.sku}
                </div>
                <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] text-xs font-medium text-[var(--theme-text-secondary)]">
                    Expected:{' '}
                    <span className="font-mono font-bold text-[var(--theme-text-primary)]">
                        {currentItem?.expectedQty || 1} units
                    </span>
                </div>
                {onSetQty && (
                    <div className="flex items-center gap-2 mt-3">
                        <button
                            type="button"
                            onClick={() => onSetQty('1')}
                            className="flex-1 py-2 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-subtle)]/80 border border-[var(--theme-border)] text-[var(--theme-text-primary)] font-mono text-xs font-bold transition-all active:scale-95 touch-manipulation min-h-[38px]"
                        >
                            1
                        </button>
                        <button
                            type="button"
                            onClick={() => onSetQty('5')}
                            className="flex-1 py-2 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-subtle)]/80 border border-[var(--theme-border)] text-[var(--theme-text-primary)] font-mono text-xs font-bold transition-all active:scale-95 touch-manipulation min-h-[38px]"
                        >
                            5
                        </button>
                        <button
                            type="button"
                            onClick={() => onSetQty(String(currentItem?.expectedQty || 1))}
                            className="flex-1 py-2 rounded-xl bg-[var(--theme-accent)]/10 hover:bg-[var(--theme-accent)]/20 border border-[var(--theme-accent)]/30 text-[var(--theme-accent)] font-mono text-xs font-bold transition-all active:scale-95 touch-manipulation min-h-[38px]"
                        >
                            All ({currentItem?.expectedQty || 1})
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
