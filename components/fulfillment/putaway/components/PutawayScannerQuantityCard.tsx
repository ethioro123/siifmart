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
            <p className="text-stone-400 dark:text-stone-500 text-[10px] font-black uppercase tracking-[0.2em] mb-3">
                Zero-Trust Physical Count Verification
            </p>
            <div className="bg-emerald-50/80 dark:bg-emerald-950/20 border-2 border-emerald-400/40 rounded-3xl p-6 shadow-lg">
                <p className="text-2xl text-stone-900 dark:text-white font-black uppercase tracking-tight leading-snug mb-2">
                    {currentItem?.name || currentItem?.productName}
                </p>
                <div className="inline-block px-3 py-1 bg-emerald-600 text-white font-black font-mono text-sm rounded-xl mb-4">
                    {scannedSku || currentItem?.sku}
                </div>
                <div className="p-3 bg-white/60 dark:bg-white/5 rounded-2xl border border-emerald-400/20 text-xs font-bold text-stone-700 dark:text-stone-300">
                    Order Expected:{' '}
                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                        {currentItem?.expectedQty || 1} units
                    </span>
                </div>
            </div>
        </div>
    );
};
