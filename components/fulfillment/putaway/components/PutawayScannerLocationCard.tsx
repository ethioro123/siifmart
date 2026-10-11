import React from 'react';
import { Product } from '../../../../types';
import { decodeLocation, parseLocationParts } from '../../../../utils/locationEncoder';
import { normalizeLocation } from '../../../../utils/locationTracking';
import { PutawayScannerOverflowPanel } from './PutawayScannerOverflowPanel';

interface PutawayScannerLocationCardProps {
    isStrictlyValid: boolean;
    inputVal: string;
    recommendation?: {
        location: string;
        type: 'ASSIGNED' | 'SUGGESTED';
        label: string;
    } | null;
    currentProduct?: Product;
    currentItem?: any;
    isOverflowMode: boolean;
    setIsOverflowMode: (v: boolean) => void;
    setAwaitingMismatchConfirmation: (v: boolean) => void;
    existingSkuLocations: Product[];
    handleSelectLocation: (loc: string) => void;
    currentOccupants: Product[];
    t: (key: string) => string;
}

export const PutawayScannerLocationCard: React.FC<PutawayScannerLocationCardProps> = ({
    isStrictlyValid,
    inputVal,
    recommendation,
    currentProduct,
    currentItem,
    isOverflowMode,
    setIsOverflowMode,
    setAwaitingMismatchConfirmation,
    existingSkuLocations,
    handleSelectLocation,
    currentOccupants,
    t
}) => {
    const rawLoc = isStrictlyValid
        ? decodeLocation(inputVal.trim().toUpperCase())
        : (normalizeLocation(inputVal) || recommendation?.location || currentProduct?.location || '—');
    const locStr = rawLoc || '—';

    const parts = parseLocationParts(locStr !== '—' ? locStr : '');
    const category = currentProduct?.category || currentItem?.category;

    return (
        <div className="text-center w-full max-w-sm mx-auto">
            {/* Header label */}
            <p className="text-[var(--theme-text-secondary)] text-[11px] font-semibold uppercase tracking-wider mb-2">
                {recommendation?.type === 'ASSIGNED' 
                    ? t('warehouse.putaway.assignedLocation') 
                    : recommendation?.type === 'SUGGESTED' 
                        ? t('warehouse.putaway.suggestedLocation') 
                        : t('warehouse.putaway.awaitingScan')}
            </p>

            {/* Main Location Box */}
            <div className={`w-full px-5 sm:px-6 py-5 rounded-2xl border transition-colors ${
                recommendation?.type === 'ASSIGNED'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                    : recommendation?.type === 'SUGGESTED'
                        ? 'bg-[var(--theme-accent)]/10 border-[var(--theme-accent)]/30 text-[var(--theme-accent)]'
                        : 'bg-[var(--theme-bg-card)] border-[var(--theme-border)] text-[var(--theme-text-primary)]'
            }`}>
                <p className={`font-mono font-bold whitespace-nowrap leading-none tracking-wider ${
                    isStrictlyValid
                        ? 'text-4xl sm:text-5xl text-[var(--theme-accent)]'
                        : locStr.length > 10
                            ? 'text-2xl sm:text-3xl'
                            : 'text-4xl sm:text-5xl'
                }`}>
                    {locStr}
                </p>

                {/* Zone / Aisle / Bay breakdown */}
                {parts && (
                    <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[var(--theme-border)]">
                        <div className="bg-[var(--theme-bg-subtle)] p-2 rounded-xl border border-[var(--theme-border)] flex flex-col items-center justify-center">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">{t('warehouse.putaway.zone')}</span>
                            <span className="text-base font-bold font-mono text-[var(--theme-text-primary)]">{parts.zone}</span>
                        </div>
                        <div className="bg-[var(--theme-bg-subtle)] p-2 rounded-xl border border-[var(--theme-border)] flex flex-col items-center justify-center">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">{t('warehouse.putaway.aisle')}</span>
                            <span className="text-base font-bold font-mono text-[var(--theme-text-primary)]">{parts.aisle}</span>
                        </div>
                        <div className="bg-[var(--theme-bg-subtle)] p-2 rounded-xl border border-[var(--theme-border)] flex flex-col items-center justify-center">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">{t('warehouse.putaway.bay')}</span>
                            <span className="text-base font-bold font-mono text-[var(--theme-text-primary)]">{parts.bin}</span>
                        </div>
                    </div>
                )}

                {/* Category label */}
                {category && recommendation?.type === 'SUGGESTED' && !normalizeLocation(inputVal) && (
                    <div className="mt-3 border-t border-[var(--theme-border)] pt-2">
                        <p className="text-[11px] text-[var(--theme-accent)] font-semibold uppercase tracking-wider">
                            {category}
                        </p>
                    </div>
                )}
            </div>

            {/* Alternate Bay / Overflow panel */}
            <div className="mt-4">
                <PutawayScannerOverflowPanel
                    isOverflowMode={isOverflowMode}
                    setIsOverflowMode={setIsOverflowMode}
                    setAwaitingMismatchConfirmation={setAwaitingMismatchConfirmation}
                    existingSkuLocations={existingSkuLocations}
                    handleSelectLocation={handleSelectLocation}
                    currentItem={currentItem}
                    currentOccupants={currentOccupants}
                    t={t}
                />
            </div>
        </div>
    );
};
