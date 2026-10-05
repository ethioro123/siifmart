import React from 'react';
import { Box } from 'lucide-react';
import { Product } from '../../../../types';

interface PutawayScannerItemCardProps {
    currentItem: any;
    currentOccupants: Product[];
    t: (key: string) => string;
}

export const PutawayScannerItemCard: React.FC<PutawayScannerItemCardProps> = ({
    currentItem,
    currentOccupants,
    t,
}) => {
    return (
        <div className="text-center mb-6 w-full max-w-md">
            <p className="text-stone-400 dark:text-stone-500 text-[10px] font-black uppercase tracking-[0.2em] mb-3">
                {t('warehouse.putaway.itemVerification')}
            </p>
            <div className="bg-emerald-50/80 dark:bg-emerald-950/20 border-2 border-emerald-400/40 rounded-3xl p-6 shadow-lg">
                <p className="text-2xl text-stone-900 dark:text-white font-black uppercase tracking-tight leading-snug mb-3">
                    {currentItem?.name || currentItem?.productName}
                </p>
                <div className="inline-block px-4 py-2 bg-emerald-600 text-white font-black font-mono text-base rounded-xl shadow-md shadow-emerald-600/20 tracking-widest mb-3">
                    {currentItem?.sku}
                </div>

                {currentOccupants.length > 0 && (
                    <div className="mt-4 space-y-4 pt-6 border-t-2 border-emerald-400/20 text-left">
                        <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400/60 tracking-widest block mb-1">
                            {t('warehouse.putaway.locationOccupants')} ({currentOccupants.length})
                        </span>
                        {currentOccupants.slice(0, 3).map((occ: Product) => (
                            <div key={occ.id} className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-white/5 border border-emerald-200 dark:border-white/10 flex items-center justify-center shrink-0">
                                    <Box size={14} className="text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-black text-gray-900 dark:text-white truncate uppercase tracking-tight">
                                        {occ.name}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
