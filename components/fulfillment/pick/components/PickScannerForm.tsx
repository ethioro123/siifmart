import React from 'react';
import { RotateCcw, CheckCircle } from 'lucide-react';
import { SELL_UNITS, getSellUnit, formatPackagingDescription } from '../../../../utils/units';
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
        <form onSubmit={handleScan} className="w-full max-w-2xl relative z-20 space-y-4">
            {currentItem && (
                <>
                    {step === 'QUANTITY' ? (
                        <div className="space-y-2.5">
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
                                    className="flex-1 min-h-[76px] bg-[var(--theme-bg-card)] border-2 rounded-2xl py-4 px-3 text-center text-4xl sm:text-5xl font-mono font-bold text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)] focus:outline-none focus:border-[var(--theme-accent)] border-[var(--theme-border)] shadow-xs"
                                    placeholder="QTY"
                                    autoFocus
                                    onFocus={(e) => e.target.select()}
                                />
                                <select
                                    value={selectedUnit}
                                    onChange={(e) => setSelectedUnit(e.target.value)}
                                    className="min-h-[64px] bg-[var(--theme-bg-card)] border-2 border-[var(--theme-border)] text-[var(--theme-text-primary)] font-bold rounded-xl px-3 py-3 text-base uppercase focus:outline-none focus:border-[var(--theme-accent)] cursor-pointer"
                                    aria-label="Select unit"
                                >
                                    {SELL_UNITS.map(u => (
                                        <option key={u.code} value={u.code}>
                                            {u.shortLabel.toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Rapid Thumb Stepper Pills */}
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const cur = parseFloat(qtyVal) || 0;
                                        setQtyVal(String(cur + 1));
                                    }}
                                    className="flex-1 py-3 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-subtle)]/80 border border-[var(--theme-border)] text-[var(--theme-text-primary)] font-mono text-lg font-bold transition-all active:scale-95 touch-manipulation min-h-[52px]"
                                >
                                    +1
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const cur = parseFloat(qtyVal) || 0;
                                        setQtyVal(String(cur + 5));
                                    }}
                                    className="flex-1 py-3 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-subtle)]/80 border border-[var(--theme-border)] text-[var(--theme-text-primary)] font-mono text-lg font-bold transition-all active:scale-95 touch-manipulation min-h-[52px]"
                                >
                                    +5
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const expected = currentItem?.expectedQty || 1;
                                        setQtyVal(expected.toString());
                                    }}
                                    className="flex-1 py-3 rounded-xl bg-[var(--theme-accent)]/10 hover:bg-[var(--theme-accent)]/20 border border-[var(--theme-accent)]/30 text-[var(--theme-accent)] font-mono text-lg font-bold transition-all active:scale-95 touch-manipulation min-h-[52px]"
                                >
                                    All ({currentItem?.expectedQty || 1})
                                </button>
                            </div>
                        </div>
                    ) : (
                        <input
                            ref={inputRef}
                            type="text"
                            inputMode="none"
                            aria-label="Scan barcode"
                            title="Scan barcode"
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                            onKeyDown={scanOnlyHandlers.onKeyDown}
                            onPaste={scanOnlyHandlers.onPaste}
                            className="w-full min-h-[68px] bg-[var(--theme-bg-card)] border-2 rounded-2xl py-4 px-3 text-center text-2xl sm:text-3xl font-mono font-bold text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)] focus:outline-none border-[var(--theme-border)] focus:border-[var(--theme-accent)] transition-colors shadow-xs"
                            placeholder={step === 'LOCATION' ? t('warehouse.picking.scan15DigitBarcode') : t('warehouse.picking.scanSkuBarcode')}
                            autoFocus
                            disabled={isProcessing}
                        />
                    )}

                    {step === 'LOCATION' && inputVal.trim() && (
                        <div className="text-center animate-in fade-in duration-200">
                            <p className="text-base font-bold uppercase tracking-wider text-[var(--theme-accent)] flex items-center justify-center gap-2">
                                {isLocationBarcode(inputVal.trim().toUpperCase()) ? `IDENTIFIED: ${decodeLocation(inputVal.trim().toUpperCase())}` : t('warehouse.picking.encodedBarcodeProtocolRequired')}
                            </p>
                        </div>
                    )}

                    {step === 'QUANTITY' && (
                        <div className="text-center animate-in fade-in duration-200 space-y-2">
                            <p className="text-base font-bold tracking-wide text-[var(--theme-text-secondary)]">
                                {t('warehouse.expected')}: {(() => {
                                    const expected = currentItem?.expectedQty || 1;
                                    const packDesc = formatPackagingDescription(currentProduct, expected);
                                    const unitDef = getSellUnit(currentProduct?.unit || currentItem?.unit);
                                    const unitLabel = unitDef.category === 'count' && unitDef.code !== 'UNIT' ? unitDef.shortLabel : 'pk';
                                    return <>{expected} {unitLabel} {packDesc ? `(${packDesc})` : ''}</>;
                                })()}
                            </p>

                            {currentItem && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        const expected = currentItem.expectedQty || 1;
                                        setQtyVal(expected.toString());
                                        setTimeout(() => {
                                            const formElem = (e.target as HTMLElement).closest('form');
                                            if (formElem) formElem.requestSubmit();
                                        }, 50);
                                    }}
                                    className="w-full py-4 px-4 rounded-2xl bg-[var(--theme-accent)] hover:opacity-90 text-white font-bold text-lg uppercase tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[60px] shadow-xs active:scale-[0.98] touch-manipulation"
                                >
                                    <CheckCircle size={16} />
                                    <span>Confirm Full Pick ({(() => {
                                        const expected = currentItem.expectedQty || 1;
                                        const packDesc = formatPackagingDescription(currentProduct, expected);
                                        const unitDef = getSellUnit(currentProduct?.unit || currentItem?.unit);
                                        const unitLabel = unitDef.category === 'count' && unitDef.code !== 'UNIT' ? unitDef.shortLabel : 'pk';
                                        return packDesc ? `${expected} ${unitLabel} (${packDesc})` : `${expected} ${unitLabel}`;
                                    })()})</span>
                                </button>
                            )}
                        </div>
                    )}
                </>
            )}

            {isProcessing && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <RotateCcw className="animate-spin text-[var(--theme-text-secondary)]" size={20} />
                </div>
            )}

            {/* ACTION BUTTON */}
            <PickScannerSubmitButton
                step={step}
                inputVal={inputVal}
                qtyVal={qtyVal}
                currentItem={currentItem}
                isItemMatched={isItemMatched}
                isStrictlyValid={isStrictlyValid}
                isProcessing={isProcessing}
                t={t}
            />
        </form>
    );
};
