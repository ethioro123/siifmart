import React from 'react';
import { CheckCircle, AlertTriangle, Map as MapIcon, Package } from 'lucide-react';
import { PickScannerSummary } from './PickScannerSummary';
import { PickScannerInstructionPanel } from './PickScannerInstructionPanel';
import { isLocationBarcode } from '../../../../utils/locationEncoder';

interface PickScannerHeaderProps {
    showSuccess: boolean;
    showError: boolean;
    step: 'LOCATION' | 'ITEM' | 'QUANTITY';
    inputVal: string;
    currentItem: any;
    currentProduct?: any;
    isItemMatched: boolean;
    shortPickMode: boolean;
    setShortPickMode: (val: boolean) => void;
    successMsg: string;
    errorMsg: string;
    job: any;
    getProduct: (item: any) => any;
    getItemMeasureQty: (item: any, productInfo?: any) => any;
    t: (key: string) => string;
}

export const PickScannerHeader: React.FC<PickScannerHeaderProps> = ({
    showSuccess,
    showError,
    step,
    inputVal,
    currentItem,
    currentProduct,
    isItemMatched,
    shortPickMode,
    setShortPickMode,
    successMsg,
    errorMsg,
    job,
    getProduct,
    getItemMeasureQty,
    t,
}) => {
    // When mission is complete (no current item left to pick)
    if (!currentItem) {
        return (
            <PickScannerSummary
                job={job}
                getProduct={getProduct}
                getItemMeasureQty={getItemMeasureQty}
                t={t}
            />
        );
    }

    return (
        <>
            {/* Status Icon */}
            <div className={`w-12 h-12 sm:w-20 sm:h-20 rounded-2xl border-2 flex items-center justify-center mb-2 sm:mb-4 transition-all duration-300 z-10 shrink-0 ${
                showSuccess
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : showError
                    ? 'border-rose-500 bg-rose-500/10 animate-shake'
                    : step === 'LOCATION'
                    ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/10'
                    : 'border-emerald-500 bg-emerald-500/10'
            }`}>
                {showSuccess ? (
                    <CheckCircle size={26} className="text-emerald-500 sm:w-8 sm:h-8" />
                ) : showError ? (
                    <AlertTriangle size={26} className="text-rose-500 sm:w-8 sm:h-8" />
                ) : step === 'LOCATION' ? (
                    <MapIcon size={26} className="text-[var(--theme-accent)] sm:w-8 sm:h-8" />
                ) : (
                    <Package size={26} className="text-emerald-500 sm:w-8 sm:h-8" />
                )}
            </div>

            {/* Instruction Header */}
            <h1 className={`text-lg sm:text-2xl md:text-3xl font-bold text-[var(--theme-text-primary)] text-center uppercase tracking-tight mb-1 sm:mb-2 z-10 transition-colors px-2 max-w-full ${
                isLocationBarcode(inputVal.trim().toUpperCase()) ? 'text-[var(--theme-accent)]' : showError ? 'text-rose-500' : ''
            }`}>
                {showSuccess ? t('warehouse.picking.successCaps') : showError ? t('warehouse.picking.errorCaps') : step === 'LOCATION' ? (isLocationBarcode(inputVal.trim().toUpperCase()) ? t('warehouse.picking.locationIdentified') : t('warehouse.scanLocation')) : step === 'QUANTITY' ? t('warehouse.confirmQty') : t('warehouse.scanSkuToConfirm')}
            </h1>

            {showSuccess ? (
                <div className="text-center z-10 mb-6 animate-in fade-in duration-200">
                    <p className="text-emerald-500 text-lg font-bold uppercase tracking-wider">{successMsg}</p>
                </div>
            ) : showError ? (
                <div className="text-center z-10 mb-6 animate-in fade-in duration-200">
                    <p className="text-rose-500 text-lg font-bold uppercase tracking-wider">{errorMsg}</p>
                </div>
            ) : (
                <PickScannerInstructionPanel
                    step={step}
                    inputVal={inputVal}
                    currentItem={currentItem}
                    currentProduct={currentProduct}
                    isItemMatched={isItemMatched}
                    shortPickMode={shortPickMode}
                    setShortPickMode={setShortPickMode}
                    getItemMeasureQty={getItemMeasureQty}
                    t={t}
                />
            )}
        </>
    );
};
