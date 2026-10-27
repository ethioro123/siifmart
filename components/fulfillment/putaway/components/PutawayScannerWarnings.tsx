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
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
                        <AlertTriangle size={16} className="shrink-0" />
                        <span className="font-semibold uppercase tracking-wider text-xs">
                            {t('warehouse.putaway.stockMergeRequired')}
                        </span>
                    </div>
                    <p className="text-xs text-[var(--theme-text-secondary)] leading-relaxed">
                        {t('warehouse.putaway.stockMergeInstruction')}
                    </p>
                </div>
            )}

            {/* Mismatch Warning */}
            {awaitingMismatchConfirmation && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
                        <AlertTriangle size={16} className="shrink-0" />
                        <span className="font-semibold uppercase tracking-wider text-xs">
                            {t('warehouse.putaway.alternateLocationScanned')}
                        </span>
                    </div>
                    <p className="text-xs text-[var(--theme-text-secondary)] leading-relaxed">
                        {t('warehouse.putaway.alternateLocationInstruction')}
                    </p>
                </div>
            )}

            {/* Strict Block Warning */}
            {isPlacementBlocked && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-left">
                    <div className="flex items-center gap-2 text-rose-500 mb-1.5">
                        <X size={18} className="shrink-0" />
                        <span className="font-semibold uppercase tracking-wider text-xs">
                            {t('warehouse.putaway.placementBlocked')}
                        </span>
                    </div>
                    <p className="text-xs font-medium text-[var(--theme-text-primary)] leading-relaxed mb-1.5">
                        {t('warehouse.putaway.incompatibleInventoryDetected') || 'Incompatible inventory detected:'}{' '}
                        <span className="bg-rose-500/20 text-rose-500 px-2 py-0.5 rounded-md font-mono font-semibold">
                            {conflictingOccupants[0]?.sku}
                        </span>
                    </p>
                    <p className="text-[11px] text-rose-500/80 uppercase font-semibold tracking-wider">
                        {t('warehouse.putaway.mixedSkuNotAllowed')}
                    </p>
                </div>
            )}
        </>
    );
};
