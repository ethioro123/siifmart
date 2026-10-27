import React from 'react';
import { AlertTriangle, Package } from 'lucide-react';
import { Product } from '../../../../types';
import { extractLocationBarcodeFromScan, decodeLocation } from '../../../../utils/locationEncoder';
import { getTransferQuantityConfig } from '../../transfer/transferQuantity';
import { remainingPickQuantity } from '../../../../utils/pickProgress';
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
        const scannedLocationBarcode = extractLocationBarcodeFromScan(inputVal);
        return (
            <div className="text-center z-10 mb-2 sm:mb-6 w-full max-w-full px-2">
                <div className="text-center mb-2 sm:mb-6">
                    <p className="text-[var(--theme-text-secondary)] text-sm sm:text-lg font-bold uppercase tracking-wider mb-2">
                        {t('warehouse.picking.goToSourceBay')}
                    </p>

                    <div className="block w-full mx-auto px-4 sm:px-8 py-3 sm:py-7 rounded-2xl sm:rounded-3xl border bg-[var(--theme-accent)]/10 border-[var(--theme-accent)]/30 text-[var(--theme-accent)] max-w-2xl">
                        <p className="text-xs sm:text-base font-bold uppercase tracking-widest text-[var(--theme-text-secondary)] mb-1 sm:mb-2">
                            {t('warehouse.picking.pickFromThisLocation') || 'Pick from this location'}
                        </p>
                        <p className="font-mono font-bold tracking-wide break-words text-4xl sm:text-6xl md:text-7xl leading-tight">
                            {scannedLocationBarcode
                                ? decodeLocation(scannedLocationBarcode)
                                : (normalizeLocation(inputVal) || targetLoc || t('warehouse.picking.unknownBay'))}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'QUANTITY') {
        return (
            <div className="text-center z-10 mb-1 sm:mb-6 w-full max-w-2xl px-2">
                <p className="text-amber-600 dark:text-amber-400 text-xs sm:text-base uppercase tracking-wider font-bold">
                    {t('warehouse.picking.enterPhysicalQtyPicked') || 'Enter the physical quantity picked'}
                </p>
                <ProductIdentity item={currentItem} product={currentProduct} t={t} />
                <p className="text-[var(--theme-text-secondary)] text-sm sm:text-base mt-2">{t('warehouse.expected')}: <span className="text-[var(--theme-text-primary)] font-bold text-xl sm:text-3xl tabular-nums">
                    {(() => {
                        const expected = remainingPickQuantity(currentItem);
                        const packDesc = formatPackagingDescription(currentProduct, expected);
                        const unitDef = getSellUnit(currentProduct?.unit || currentItem?.unit);
                        const unitLabel = getTransferQuantityConfig(currentProduct || currentItem).quantityLabel;
                        return <>{expected} {unitLabel} {packDesc ? <span className="text-xs sm:text-sm font-mono font-medium text-[var(--theme-text-secondary)]">({packDesc})</span> : null}</>;
                    })()}
                </span></p>
            </div>
        );
    }

    return (
        <div className="text-center z-10 mb-1 sm:mb-6 w-full max-w-full px-2">
            <p className="text-[var(--theme-text-secondary)] text-sm sm:text-lg font-semibold">{isItemMatched ? t('warehouse.picking.confirmItemPick') : t('warehouse.picking.scanProductToPick')}</p>
            <ProductIdentity item={currentItem} product={currentProduct} matched={isItemMatched} t={t} />
            <div className="mt-2 inline-flex flex-wrap items-center justify-center gap-x-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] px-3 py-1.5 shadow-sm">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">{t('warehouse.expected')}</span>
                <span className="font-bold text-[var(--theme-text-primary)] text-xl sm:text-3xl tabular-nums">{(() => {
                const expected = remainingPickQuantity(currentItem);
                const packDesc = formatPackagingDescription(currentProduct, expected);
                const unitDef = getSellUnit(currentProduct?.unit || currentItem?.unit);
                const unitLabel = getTransferQuantityConfig(currentProduct || currentItem).quantityLabel;
                return <>{expected} <span className="text-base uppercase text-[var(--theme-text-secondary)] font-semibold ml-0.5">{unitLabel}</span></>;
            })()}</span>
                {(() => {
                    const expected = remainingPickQuantity(currentItem);
                    return formatPackagingDescription(currentProduct, expected)
                        ? <span className="text-xs sm:text-sm font-mono text-[var(--theme-text-secondary)]">{formatPackagingDescription(currentProduct, expected)}</span>
                        : null;
                })()}
            </div>
            {!isItemMatched && (currentItem?.expectedQty || 1) > 0 && (
                <div className="mt-2 sm:mt-3">
                    <button
                        type="button"
                        onClick={() => setShortPickMode(!shortPickMode)}
                        className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors border flex items-center justify-center gap-1.5 mx-auto ${shortPickMode
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

const ProductIdentity: React.FC<{ item: any; product?: Product; matched?: boolean; t: (key: string) => string }> = ({ item, product, matched = false, t }) => (
    <div className="mt-2 sm:mt-5 mx-auto w-full max-w-2xl rounded-2xl sm:rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-3 sm:p-6 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4 text-left">
            <div className="w-16 h-16 sm:w-32 sm:h-32 rounded-xl sm:rounded-2xl overflow-hidden border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] flex items-center justify-center shrink-0">
                {product?.image
                    ? <img src={product.image} alt="" className="w-full h-full object-contain" />
                    : <Package size={30} className="text-[var(--theme-text-secondary)] sm:w-12 sm:h-12" aria-hidden="true" />}
            </div>
            <div className="w-full min-w-0">
                <h2 className={`text-xl sm:text-4xl md:text-5xl leading-tight font-bold break-words line-clamp-2 ${matched ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--theme-text-primary)]'}`}>
                    {item?.name || product?.name || t('warehouse.picking.unknownProduct') || 'Unknown product'}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex min-h-8 items-center rounded-lg bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] px-2.5 text-xs sm:text-lg font-mono font-bold text-[var(--theme-accent)] break-all">
                        {item?.sku || product?.sku || t('warehouse.picking.noSKU') || 'No SKU'}
                    </span>
                    {formatProductSize(product || item) && (
                        <span className="inline-flex min-h-8 items-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 text-xs sm:text-base font-semibold text-emerald-700 dark:text-emerald-400">
                            {formatProductSize(product || item)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    </div>
);
