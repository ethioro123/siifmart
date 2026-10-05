import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Product } from '../../../../types';

interface PutawayScannerWarningsProps {
    awaitingOccupancyConfirmation: boolean;
    awaitingMismatchConfirmation: boolean;
    isPlacementBlocked: boolean;
    conflictingOccupants: Product[];
    t: (key: string) => string;
}

export const PutawayScannerWarnings: React.FC<PutawayScannerWarningsProps> = ({
    awaitingOccupancyConfirmation,
    awaitingMismatchConfirmation,
    isPlacementBlocked,
    conflictingOccupants,
    t,
}) => {
    return (
        <>
            {/* Occupancy Warning */}
            {awaitingOccupancyConfirmation && !isPlacementBlocked && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-400/50 animate-in zoom-in-95 duration-300 shadow-sm text-left">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-1">
                        <AlertTriangle size={18} className="shrink-0 stroke-[2.5]" />
                        <span className="font-black uppercase tracking-wider text-xs">
                            {t('warehouse.putaway.stockMergeRequired')}
                        </span>
                    </div>
                    <p className="text-[11px] text-stone-700 dark:text-stone-300 leading-relaxed">
                        {t('warehouse.putaway.stockMergeInstruction')}
                    </p>
                </div>
            )}

            {/* Mismatch Warning */}
            {awaitingMismatchConfirmation && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-400/50 animate-in zoom-in-95 duration-300 shadow-sm text-left">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-1">
                        <AlertTriangle size={18} className="shrink-0 stroke-[2.5]" />
                        <span className="font-black uppercase tracking-wider text-xs">
                            {t('warehouse.putaway.alternateLocationScanned')}
                        </span>
                    </div>
                    <p className="text-[11px] text-stone-700 dark:text-stone-300 leading-relaxed">
                        {t('warehouse.putaway.alternateLocationInstruction')}
                    </p>
                </div>
            )}

            {/* Strict Block Warning */}
            {isPlacementBlocked && (
                <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 animate-in zoom-in-95 duration-300 shadow-md text-left">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-2">
                        <X size={20} className="shrink-0 stroke-[3]" />
                        <span className="font-black uppercase tracking-wider text-sm">
                            {t('warehouse.putaway.placementBlocked')}
                        </span>
                    </div>
                    <p className="text-xs font-black text-rose-900 dark:text-rose-200 leading-relaxed mb-2">
                        Incompatible inventory detected:{' '}
                        <span className="bg-rose-600 text-white px-2 py-0.5 rounded-lg font-mono">
                            {conflictingOccupants[0]?.sku}
                        </span>
                    </p>
                    <p className="text-[10px] text-rose-700 dark:text-rose-300 uppercase font-bold tracking-wider">
                        {t('warehouse.putaway.mixedSkuNotAllowed')}
                    </p>
                </div>
            )}
        </>
    );
};
