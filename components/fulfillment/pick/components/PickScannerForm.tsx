import React from 'react';
import { RotateCcw, CheckCircle } from 'lucide-react';
import { SELL_UNITS, getEffectivePackageSize } from '../../../../utils/units';
import { isLocationBarcode, decodeLocation } from '../../../../utils/locationEncoder';
import { PickScannerSubmitButton } from './PickScannerSubmitButton';

interface PickScannerFormProps {
    step: 'LOCATION' | 'ITEM' | 'QUANTITY';
    inputVal: string;
    setInputVal: (val: string) => void;
    qtyVal: string;
    setQtyVal: (val: string) => void;
    selectedUnit: string;
    setSelectedUnit: (val: string) => void;
    currentItem: any;
    currentProduct?: any;
    isItemMatched: boolean;
    isStrictlyValid: boolean;
    isProcessing: boolean;
    handleScan: (e: React.FormEvent) => void;
    getItemMeasureQty: (item: any, prod?: any) => any;
    scanOnlyHandlers: any;
    lastKeyTime: React.MutableRefObject<number>;
    inputRef: React.RefObject<HTMLInputElement | null>;
    qtyRef: React.RefObject<HTMLInputElement | null>;
    playBeep: (type: 'success' | 'error') => void;
    setErrorMsg: (msg: string) => void;
    setShowError: (val: boolean) => void;
    t: (key: string) => string;
}

export const PickScannerForm: React.FC<PickScannerFormProps> = ({
    step,
    inputVal,
    setInputVal,
    qtyVal,
    setQtyVal,
    selectedUnit,
    setSelectedUnit,
    currentItem,
    currentProduct,
    isItemMatched,
    isStrictlyValid,
    isProcessing,
    handleScan,
    getItemMeasureQty,
    scanOnlyHandlers,
    lastKeyTime,
    inputRef,
    qtyRef,
    playBeep,
    setErrorMsg,
    setShowError,
    t,
}) => {
    return (
        <form onSubmit={handleScan} className="w-full max-w-md relative z-20 group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#2C5E3B] to-[#A9CBA2] rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition-opacity" />

            {currentItem && (
                <>
                    {step === 'QUANTITY' ? (
                        <div className="flex gap-2 items-center w-full">
                            <input
                                ref={qtyRef}
                                type="number"
                                inputMode="decimal"
                                pattern="[0-9]*"
                                aria-label="Pick quantity"
                                title="Pick quantity"
                                value={qtyVal}
                                onChange={(e) => setQtyVal(e.target.value)}
                                className="flex-1 bg-white/90 dark:bg-[#1C2620]/90 border-2 rounded-2xl py-6 px-4 text-center text-5xl font-mono text-gray-900 dark:text-[#EAE5D9] placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none relative z-10 shadow-xl transition-all border-[#2C5E3B] dark:border-[#A9CBA2]/40 focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2]"
                                placeholder="QTY"
                                autoFocus
                                onFocus={(e) => e.target.select()}
                            />
                            <select
                                value={selectedUnit}
                                onChange={(e) => setSelectedUnit(e.target.value)}
                                className="bg-white/90 dark:bg-[#1C2620] border-2 border-[#2C5E3B] dark:border-[#A9CBA2]/40 text-gray-900 dark:text-white font-black rounded-2xl px-4 py-6 text-base uppercase focus:outline-none shadow-xl cursor-pointer relative z-10"
                                aria-label="Select unit"
                            >
                                {SELL_UNITS.map(u => (
                                    <option key={u.code} value={u.code}>
                                        {u.shortLabel.toUpperCase()}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <input
                            ref={inputRef}
                            type="text"
                            aria-label="Scan barcode"
                            title="Scan barcode"
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                            onKeyDown={(e) => {
                                if (step === 'LOCATION') {
                                    const now = Date.now();
                                    if (now - lastKeyTime.current > 300 && e.key !== 'Enter') {
                                        lastKeyTime.current = now;
                                        return;
                                    }
                                    lastKeyTime.current = now;
                                } else {
                                    scanOnlyHandlers.onKeyDown(e);
                                }
                            }}
                            onPaste={(e) => {
                                e.preventDefault();
                                playBeep('error');
                                setErrorMsg(t('warehouse.picking.scanOnlyNoPasting'));
                                setShowError(true);
                                setTimeout(() => setShowError(false), 2000);
                            }}
                            className={`w-full bg-white/90 dark:bg-[#1C2620]/90 border-2 rounded-2xl py-6 px-4 text-center text-xl md:text-3xl font-mono text-gray-900 dark:text-[#EAE5D9] placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none relative z-10 shadow-xl transition-all border-[#E2DCCE] dark:border-[#A9CBA2]/10 focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2]/40`}
                            placeholder={step === 'LOCATION' ? t('warehouse.picking.scan15DigitBarcode') : t('warehouse.picking.scanSkuBarcode')}
                            autoFocus
                            disabled={isProcessing}
                        />
                    )}

                    {step === 'LOCATION' && inputVal.trim() && (
                        <div className="mb-4 text-center animate-in fade-in slide-in-from-bottom-1 duration-300 mt-2">
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#2C5E3B] dark:text-[#A9CBA2] flex items-center justify-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-[#2C5E3B] dark:bg-[#A9CBA2] animate-ping" />
                                {isLocationBarcode(inputVal.trim().toUpperCase()) ? `IDENTIFIED: ${decodeLocation(inputVal.trim().toUpperCase())}` : t('warehouse.picking.encodedBarcodeProtocolRequired')}
                            </p>
                        </div>
                    )}

                    {step === 'QUANTITY' && (
                        <div className="mb-4 text-center mt-2 animate-in fade-in duration-300">
                            <p className="text-xs font-black uppercase tracking-widest text-[#2C5E3B] dark:text-[#A9CBA2]">
                                {t('warehouse.expected')}: {(() => {
                                    const measureQty = getItemMeasureQty(currentItem);
                                    if (measureQty) {
                                        const expected = currentItem?.expectedQty || 1;
                                        const unitDef = currentProduct?.unit ? currentProduct.unit : '';
                                        const sizeNum = getEffectivePackageSize(unitDef, currentProduct?.size);
                                        return <>{expected} x {sizeNum} {unitDef}</>;
                                    }
                                    return currentItem?.expectedQty || 1;
                                })()}
                            </p>

                            {step === 'QUANTITY' && currentItem && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        const measureQty = getItemMeasureQty(currentItem, currentProduct);
                                        const expectedCases = currentItem.expectedQty || 1;
                                        const quickVal = measureQty !== null ? measureQty : expectedCases;
                                        setQtyVal(quickVal.toString());
                                        setTimeout(() => {
                                            const formElem = (e.target as HTMLElement).closest('form');
                                            if (formElem) formElem.requestSubmit();
                                        }, 50);
                                    }}
                                    className="w-full mt-3 py-4 px-6 rounded-2xl bg-[#2C5E3B] text-[#EAE5D9] dark:bg-[#A9CBA2] dark:text-[#1C2620] font-black text-sm uppercase tracking-wider shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#A9CBA2]/30 relative z-30"
                                >
                                    <CheckCircle size={18} />
                                    Confirm Full Pick ({(() => {
                                        const measureQty = getItemMeasureQty(currentItem, currentProduct);
                                        const expectedCases = currentItem.expectedQty || 1;
                                        const unitDef = currentProduct?.unit || '';
                                        return measureQty !== null ? `${measureQty} ${unitDef} (${expectedCases} cases)` : `${expectedCases} cases`;
                                    })()})
                                </button>
                            )}
                        </div>
                    )}
                </>
            )}

            {isProcessing && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30">
                    <RotateCcw className="animate-spin text-gray-500 dark:text-white opacity-50" size={24} />
                </div>
            )}

            {/* MOBILE ACTION BUTTON */}
            <PickScannerSubmitButton
                step={step}
                inputVal={inputVal}
                currentItem={currentItem}
                isItemMatched={isItemMatched}
                isStrictlyValid={isStrictlyValid}
                isProcessing={isProcessing}
                t={t}
            />
        </form>
    );
};
