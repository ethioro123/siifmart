import React from 'react';

interface PutawayScannerQuantityCardProps {
    currentItem: any;
    scannedSku: string;
}

export const PutawayScannerQuantityCard: React.FC<PutawayScannerQuantityCardProps> = ({
    currentItem,
    scannedSku,
}) => {
    return (
        <div className="text-center mb-6 w-full max-w-md animate-in fade-in duration-200">
            <p className="text-[var(--theme-text-secondary)] text-[11px] font-semibold uppercase tracking-wider mb-2">
                Physical Count Verification
            </p>
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 shadow-sm">
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
            </div>
        </div>
    );
};
