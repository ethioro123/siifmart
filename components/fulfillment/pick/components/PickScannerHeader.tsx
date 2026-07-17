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
    return (
        <>
            {/* Icon Circle */}
            <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center mb-8 shadow-2xl z-10 transition-all duration-500 ${showSuccess
                ? 'border-green-400 bg-green-500/20 shadow-green-500/40 scale-110'
                : showError
                    ? 'border-red-500 bg-red-500/20 shadow-red-500/40 scale-110 animate-shake'
                    : !currentItem
                        ? 'border-green-500 bg-green-500/10 shadow-green-500/20'
                        : step === 'LOCATION'
                            ? 'border-[#2C5E3B] bg-[#2C5E3B]/10 shadow-[#2C5E3B]/20'
                            : 'border-[#A9CBA2] bg-[#A9CBA2]/10 shadow-[#A9CBA2]/40'
                }`}>
                {showSuccess ? (
                    <CheckCircle size={64} className="text-green-500 dark:text-green-400 animate-bounce" />
                ) : showError ? (
                    <AlertTriangle size={64} className="text-red-500" />
                ) : step === 'LOCATION' ? (
                    <MapIcon size={64} className="text-[#2C5E3B] dark:text-[#A9CBA2] drop-shadow-[0_0_10px_rgba(44,94,59,0.5)]" />
                ) : (
                    <Package size={64} className="text-[#2C5E3B] dark:text-[#A9CBA2] drop-shadow-[0_0_15px_rgba(169,203,162,0.6)]" />
                )}
            </div>

            {/* Instruction Header */}
            <h1 className={`text-3xl md:text-5xl font-black text-gray-900 dark:text-[#EAE5D9] text-center uppercase italic tracking-tight mb-2 z-10 transition-all duration-300 ${isLocationBarcode(inputVal.trim().toUpperCase()) ? 'text-[#2C5E3B] dark:text-[#A9CBA2] scale-105' : showError ? 'text-red-600 dark:text-red-500 animate-pulse' : ''}`}>
                {showSuccess ? t('warehouse.picking.successCaps') : showError ? t('warehouse.picking.errorCaps') : !currentItem ? t('warehouse.picking.missionComplete') : step === 'LOCATION' ? (isLocationBarcode(inputVal.trim().toUpperCase()) ? t('warehouse.picking.locationIdentified') : t('warehouse.scanLocation')) : step === 'QUANTITY' ? t('warehouse.confirmQty') : t('warehouse.scanSkuToConfirm')}
            </h1>

            {showSuccess ? (
                <div className="text-center z-10 mb-8 animate-in fade-in zoom-in duration-300">
                    <p className="text-green-600 dark:text-green-400 text-xl font-bold uppercase tracking-widest">{successMsg}</p>
                </div>
            ) : showError ? (
                <div className="text-center z-10 mb-8 animate-in fade-in zoom-in duration-300">
                    <p className="text-red-600 dark:text-red-500 text-xl font-bold uppercase tracking-widest">{errorMsg}</p>
                </div>
            ) : !currentItem ? (
                <PickScannerSummary
                    job={job}
                    getProduct={getProduct}
                    getItemMeasureQty={getItemMeasureQty}
                    t={t}
                />
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
