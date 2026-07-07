import React from 'react';
import { Product } from '../../../../types';
import { isLocationBarcode, decodeLocation } from '../../../../utils/locationEncoder';
import { normalizeLocation } from '../../../../utils/locationTracking';

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
        return (
            <div className="text-center z-10 mb-8">
                <div className="text-center mb-8 relative">
                    <p className="text-gray-550 dark:text-gray-400 text-sm font-medium uppercase tracking-widest mb-2">
                        {t('warehouse.picking.goToSourceBay')}
                    </p>

                    <div className={`relative inline-block px-8 py-4 rounded-xl border-2 transition-all duration-300 bg-[#2C5E3B]/5 dark:bg-[#2C5E3B]/10 border-[#2C5E3B] text-[#2C5E3B] dark:text-[#A9CBA2] shadow-[0_0_30px_rgba(44,94,59,0.2)]`}>
                        <p className={`font-mono font-black tracking-widest ${isLocationBarcode(inputVal.trim().toUpperCase()) ? 'text-4xl md:text-7xl text-[#2C5E3B] dark:text-[#A9CBA2]' : ((currentProduct?.location?.length || 0) > 10 ? 'text-xl md:text-2xl' : 'text-3xl md:text-5xl')}`}>
                            {isLocationBarcode(inputVal.trim().toUpperCase())
                                ? decodeLocation(inputVal.trim().toUpperCase())
                                : (normalizeLocation(inputVal) || currentProduct?.location || t('warehouse.picking.unknownBay'))}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'QUANTITY') {
        return (
            <div className="text-center z-10 mb-8">
                <p className="text-amber-600 dark:text-amber-400 text-lg uppercase tracking-widest font-bold">{t('warehouse.picking.shortPickEnterQty')}</p>
                <p className="text-gray-900 dark:text-[#EAE5D9] text-2xl font-black mt-2">{currentItem?.name}</p>
                <p className="text-[#2C5E3B] dark:text-[#A9CBA2] font-mono text-xl">{currentItem?.sku}</p>
                <p className="text-gray-550 text-sm mt-2">{t('warehouse.expected')}: <span className="text-gray-900 dark:text-white font-bold">
                    {(() => {
                        let expected = currentItem?.expectedQty || 1;
                        const measureQty = getItemMeasureQty(currentItem);
                        if (measureQty) {
                            const unitDef = currentProduct?.unit ? currentProduct.unit : '';
                            const sizeNum = currentProduct?.size ? parseFloat(currentProduct.size as string) : 0;
                            return <>{expected} x {sizeNum} <span className="text-xs uppercase text-gray-500 dark:text-gray-400">{unitDef}</span></>;
                        }
                        return expected;
                    })()}
                </span></p>
            </div>
        );
    }

    return (
        <div className="text-center z-10 mb-8">
            <p className="text-gray-555 dark:text-gray-400 text-lg">{isItemMatched ? t('warehouse.picking.confirmItemPick') : t('warehouse.picking.scanProductToPick')}</p>
            <p className={`text-2xl font-bold mt-2 transition-colors ${isItemMatched ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                {currentItem?.name}
            </p>
            <p className="text-[#2C5E3B] dark:text-[#A9CBA2] font-mono text-xl mt-1">{currentItem?.sku}</p>
            <p className="text-gray-555 text-xs mt-1">{t('warehouse.expected')}: <span className="font-bold text-gray-900 dark:text-white">{(() => {
                let expected = currentItem?.expectedQty || 1;
                const measureQty = getItemMeasureQty(currentItem);
                if (measureQty) {
                    const unitDef = currentProduct?.unit ? currentProduct.unit : '';
                    const sizeNum = currentProduct?.size ? parseFloat(currentProduct.size as string) : 0;
                    return <>{expected} x {sizeNum} <span className="text-[10px] uppercase text-gray-505">{(unitDef as string)}</span></>;
                }
                return expected;
            })()}</span></p>
            {!isItemMatched && (currentItem?.expectedQty || 1) > 0 && (
                <button
                    type="button"
                    onClick={() => setShortPickMode(!shortPickMode)}
                    className={`mt-3 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${shortPickMode
                        ? 'bg-amber-100 dark:bg-amber-500/20 border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                        : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-655 dark:text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-300 dark:hover:border-amber-500/30'
                        }`}
                >
                    {shortPickMode ? t('warehouse.picking.shortPickModeOn') : `⚠ ${t('warehouse.shortPick')}`}
                </button>
            )}
        </div>
    );
};
