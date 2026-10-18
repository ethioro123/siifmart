import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Product } from '../../../../types';
import { isLocationBarcode, decodeLocation } from '../../../../utils/locationEncoder';
import { normalizeLocation } from '../../../../utils/locationTracking';
import { getSellUnit, formatProductSize, formatPackagingDescription } from '../../../../utils/units';

interface PickScannerInstructionPanelProps {
    step: 'LOCATION' | 'ITEM' | 'QUANTITY';
    inputVal: string;
    currentItem: any;
    currentProduct?: Product;
    isItemMatched: boolean;
    shortPickMode: boolean;
    setShortPickMode: (mode: boolean) => void;
    getItemMeasureQty: (item: any) => number | null;
    t: (key: string) => string;
}

export const PickScannerInstructionPanel: React.FC<PickScannerInstructionPanelProps> = ({
    step,
    inputVal,
    currentItem,
    currentProduct,
    isItemMatched,
    shortPickMode,
    setShortPickMode,
    getItemMeasureQty,
    t,
}) => {
    if (step === 'LOCATION') {
        const targetLoc = currentItem?.location || currentProduct?.location || '';
        return (
            <div className="text-center z-10 mb-4 sm:mb-6 w-full max-w-full px-2">
                <div className="text-center mb-4 sm:mb-6">
                    <p className="text-[var(--theme-text-secondary)] text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2">
                        {t('warehouse.picking.goToSourceBay')}
                    </p>

                    <div className="inline-block px-5 sm:px-8 py-3.5 sm:py-4 rounded-2xl border bg-[var(--theme-accent)]/10 border-[var(--theme-accent)]/30 text-[var(--theme-accent)] max-w-full">
                        <p className={`font-mono font-bold tracking-wider break-words ${
                            isLocationBarcode(inputVal.trim().toUpperCase()) 
                                ? 'text-2xl sm:text-4xl md:text-5xl text-[var(--theme-accent)]' 
                                : ((targetLoc.length || 0) > 10 ? 'text-lg sm:text-xl md:text-2xl' : 'text-2xl sm:text-3xl md:text-4xl')
                        }`}>
                            {isLocationBarcode(inputVal.trim().toUpperCase())
                                ? decodeLocation(inputVal.trim().toUpperCase())
                                : (normalizeLocation(inputVal) || targetLoc || t('warehouse.picking.unknownBay'))}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'QUANTITY') {
        return (
            <div className="text-center z-10 mb-4 sm:mb-6 w-full max-w-full px-2">
                <p className="text-amber-600 dark:text-amber-400 text-sm sm:text-base uppercase tracking-wider font-semibold">{t('warehouse.picking.shortPickEnterQty')}</p>
                <p className="text-[var(--theme-text-primary)] text-lg sm:text-xl font-bold mt-1 break-words max-w-sm mx-auto">{currentItem?.name}</p>
                <p className="text-[var(--theme-accent)] font-mono text-base break-all">{currentItem?.sku}</p>
                <p className="text-[var(--theme-text-secondary)] text-xs sm:text-sm mt-1">{t('warehouse.expected')}: <span className="text-[var(--theme-text-primary)] font-bold">
                    {(() => {
                        const expected = currentItem?.expectedQty || 1;
                        const packDesc = formatPackagingDescription(currentProduct, expected);
                        const unitDef = getSellUnit(currentProduct?.unit || currentItem?.unit);
                        const unitLabel = unitDef.category === 'count' && unitDef.code !== 'UNIT' ? unitDef.shortLabel : 'pk';
                        return <>{expected} {unitLabel} {packDesc ? <span className="text-xs font-mono text-[var(--theme-text-secondary)]">({packDesc})</span> : null}</>;
                    })()}
                </span></p>
            </div>
        );
    }

    return (
        <div className="text-center z-10 mb-4 sm:mb-6 w-full max-w-full px-2">
            <p className="text-[var(--theme-text-secondary)] text-sm sm:text-base font-medium">{isItemMatched ? t('warehouse.picking.confirmItemPick') : t('warehouse.picking.scanProductToPick')}</p>
            <p className={`text-lg sm:text-xl font-bold mt-1 break-words max-w-sm mx-auto transition-colors ${isItemMatched ? 'text-emerald-500' : 'text-[var(--theme-text-primary)]'}`}>
                {currentItem?.name}
            </p>
            <div className="flex items-center justify-center gap-2 mt-1">
                <p className="text-[var(--theme-accent)] font-mono text-base break-all">{currentItem?.sku}</p>
                {formatProductSize(currentProduct || currentItem) && (
                    <span className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        {formatProductSize(currentProduct || currentItem)}
                    </span>
                )}
            </div>
            <span className="font-semibold text-[var(--theme-text-primary)] text-xs sm:text-sm mt-1 block">{(() => {
                const expected = currentItem?.expectedQty || 1;
                const packDesc = formatPackagingDescription(currentProduct, expected);
                const unitDef = getSellUnit(currentProduct?.unit || currentItem?.unit);
                const unitLabel = unitDef.category === 'count' && unitDef.code !== 'UNIT' ? unitDef.shortLabel : 'pk';

                return <>{expected} <span className="text-[11px] uppercase text-[var(--theme-text-secondary)] font-semibold ml-0.5">{unitLabel}</span> {packDesc ? <span className="text-[11px] font-mono text-[var(--theme-text-secondary)] ml-1">({packDesc})</span> : null}</>;
            })()}</span>
            {!isItemMatched && (currentItem?.expectedQty || 1) > 0 && (
                <div className="mt-3">
                    <button
                        type="button"
                        onClick={() => setShortPickMode(!shortPickMode)}
                        className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors border flex items-center justify-center gap-1.5 mx-auto ${shortPickMode
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                            : 'bg-[var(--theme-bg-card)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-amber-600 hover:border-amber-400/40'
                            }`}
                    >
                        <AlertTriangle size={14} className={shortPickMode ? 'text-amber-500' : 'text-[var(--theme-text-secondary)]'} />
                        <span>{shortPickMode ? t('warehouse.picking.shortPickModeOn') : t('warehouse.shortPick')}</span>
                    </button>
                </div>
            )}
        </div>
    );
};
