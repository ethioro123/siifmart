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
            <p className="text-stone-400 dark:text-stone-500 text-[10px] font-black uppercase tracking-[0.2em] mb-3">
                {recommendation?.type === 'ASSIGNED' 
                    ? t('warehouse.putaway.assignedLocation') 
                    : recommendation?.type === 'SUGGESTED' 
                        ? t('warehouse.putaway.suggestedLocation') 
                        : t('warehouse.putaway.awaitingScan')}
            </p>

            {/* Main Location Box - Original aesthetic with guaranteed 1-line horizontal fit */}
            <div className={`relative w-full px-5 sm:px-8 py-5 sm:py-6 rounded-3xl border-2 transition-all duration-500 shadow-xl ${
                recommendation?.type === 'ASSIGNED'
                    ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-400 text-amber-700 dark:text-amber-400 shadow-amber-500/10'
                    : recommendation?.type === 'SUGGESTED'
                        ? 'bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/5 border-[#2C5E3B]/30 dark:border-[#A9CBA2]/50 text-[#2C5E3B] dark:text-[#A9CBA2] shadow-[#2C5E3B]/10'
                        : 'bg-[#FAF8F5] dark:bg-white/5 border-[#E2DCCE]/60 dark:border-white/10 text-stone-900 dark:text-white'
            }`}>
                {/* Location code: single horizontal line, no truncation, responsive font size */}
                <p className={`font-mono font-black whitespace-nowrap leading-none tracking-normal sm:tracking-[0.05em] ${
                    isStrictlyValid
                        ? 'text-4xl sm:text-5xl md:text-6xl text-[#2C5E3B] dark:text-[#A9CBA2]'
                        : locStr.length > 10
                            ? 'text-2xl sm:text-3xl'
                            : 'text-4xl sm:text-5xl'
                }`}>
                    {locStr}
                </p>

                {/* Zone / Aisle / Bay segmented breakdown */}
                {parts && (
                    <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-current/15">
                        <div className="bg-white/60 dark:bg-black/30 p-2 sm:p-2.5 rounded-2xl border border-current/10 flex flex-col items-center justify-center">
                            <span className="text-[9px] font-black uppercase tracking-wider opacity-60">{t('warehouse.putaway.zone')}</span>
                            <span className="text-base sm:text-lg font-black font-mono leading-tight">{parts.zone}</span>
                        </div>
                        <div className="bg-white/60 dark:bg-black/30 p-2 sm:p-2.5 rounded-2xl border border-current/10 flex flex-col items-center justify-center">
                            <span className="text-[9px] font-black uppercase tracking-wider opacity-60">{t('warehouse.putaway.aisle')}</span>
                            <span className="text-base sm:text-lg font-black font-mono leading-tight">{parts.aisle}</span>
                        </div>
                        <div className="bg-white/60 dark:bg-black/30 p-2 sm:p-2.5 rounded-2xl border border-current/10 flex flex-col items-center justify-center">
                            <span className="text-[9px] font-black uppercase tracking-wider opacity-60">{t('warehouse.putaway.bay')}</span>
                            <span className="text-base sm:text-lg font-black font-mono leading-tight">{parts.bin}</span>
                        </div>
                    </div>
                )}

                {/* Category label */}
                {category && recommendation?.type === 'SUGGESTED' && !normalizeLocation(inputVal) && (
                    <div className="mt-3.5 border-t border-current/15 pt-2.5">
                        <p className="text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-black uppercase tracking-widest">
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
