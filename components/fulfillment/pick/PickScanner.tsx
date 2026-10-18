import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CheckCircle, Map as MapIcon, X, AlertTriangle, Package } from 'lucide-react';
import { WMSJob, Product } from '../../../types';
import { playBeep } from '../../../utils/audioUtils';
import { normalizeLocation } from '../../../utils/locationTracking';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { decodeLocation, isLocationBarcode, extractPrefixFromBarcode, extractSkuFromScan } from '../../../utils/locationEncoder';
import { useScanOnly } from '../../../hooks/useScanOnly';
import { isWeightBased, isVolumeBased, getSellUnit, getEffectivePackageSize, SELL_UNITS } from '../../../utils/units';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useData } from '../../../contexts/DataContext';
import { validateCrossBorderSku } from '../../../utils/skuValidation';
import { PickScannerPickedList } from './components/PickScannerPickedList';
import { PickScannerSummary } from './components/PickScannerSummary';
import { PickScannerInstructionPanel } from './components/PickScannerInstructionPanel';
import { PickScannerSubmitButton } from './components/PickScannerSubmitButton';
import { PickScannerHeader } from './components/PickScannerHeader';
import { PickScannerForm } from './components/PickScannerForm';

const normalizeSku = (s: string) => s.replace(/[-\/\s]/g, '').toUpperCase();

interface PickScannerProps {
    job: WMSJob;
    currentItem: any;
    currentProduct?: Product;
    products?: Product[];
    onClose: () => void;
    onScanLocation: (location: string) => void;
    onScanItem: (barcode: string, quantity?: number) => void;
    onCompleteJob?: (job: WMSJob) => void;
    isProcessing: boolean;
    expectedPrefix?: string;
}

export const PickScanner: React.FC<PickScannerProps> = ({
    job,
    currentItem,
    currentProduct,
    products = [],
    onClose,
    onScanLocation,
    onScanItem,
    onCompleteJob,
    isProcessing,
    expectedPrefix
}) => {
    const { t } = useLanguage();
    const { effectiveCountry } = useData();
    const [step, setStep] = useState<'LOCATION' | 'ITEM' | 'QUANTITY'>('LOCATION');
    const [inputVal, setInputVal] = useState('');
    const [qtyVal, setQtyVal] = useState('');
    const [selectedUnit, setSelectedUnit] = useState<string>('UNIT');
    const [shortPickMode, setShortPickMode] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isItemMatched, setIsItemMatched] = useState(false);
    const [matchedBarcode, setMatchedBarcode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const lastStepChangeRef = useRef<number>(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const qtyRef = useRef<HTMLInputElement>(null);
    const lastKeyTime = useRef<number>(Date.now());

    const getProduct = (item: any) => {
        const targetSiteId = job.siteId || (job as any).site_id;
        return products?.find(p =>
            (p.id === item.productId || p.sku === item.sku) &&
            (p.siteId === targetSiteId || p.site_id === targetSiteId)
        ) || currentProduct;
    };

    const getItemMeasureQty = (item: any, productInfo?: Product | null) => {
        if (!item) return null;
        if ((item as any).requestedMeasureQty !== undefined && (item as any).requestedMeasureQty !== null) {
            return (item as any).requestedMeasureQty;
        }
        const prod = productInfo || getProduct(item);
        const customAttrs = prod?.customAttributes || (prod as any)?.custom_attributes;
        const sellBy = customAttrs?.commercial?.sellBy || '';
        const isWeighted = customAttrs?.commercial?.isWeighted === true;

        if (sellBy === 'Weight' || sellBy === 'Volume' || isWeighted) {
            return item.expectedQty || (item as any).quantity || null;
        }
        return null;
    };

    const scanOnlyHandlers = useScanOnly(setInputVal, {
        onReject: (reason) => {
            setErrorMsg(reason);
            setShowError(true);
            setTimeout(() => setShowError(false), 2000);
        }
    });

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (step === 'QUANTITY') {
                if (qtyRef.current) qtyRef.current.focus();
            } else {
                if (inputRef.current) inputRef.current.focus();
            }
        }, 100);
        return () => clearTimeout(timeout);
    }, [step, isProcessing]);

    useEffect(() => {
        lastStepChangeRef.current = Date.now();
        setInputVal('');
        setQtyVal('');
    }, [currentItem?.id, step]);

    useEffect(() => {
        if (step !== 'LOCATION' || !inputVal || isProcessing || !expectedPrefix) return;
        const rawVal = inputVal.trim().toUpperCase();
        const requiredLength = expectedPrefix.length === 4 ? 15 : 14;

        if (rawVal.length >= requiredLength) {
            const scanPrefix = extractPrefixFromBarcode(rawVal);
            if (scanPrefix && expectedPrefix !== scanPrefix) {
                playBeep('error');
                setErrorMsg(t('warehouse.picking.wrongSite').replace('{site}', scanPrefix));
                setShowError(true);
                setInputVal('');
                setTimeout(() => setShowError(false), 2000);
            }
        }
    }, [inputVal, step, expectedPrefix, isProcessing]);

    const isStrictlyValid = useMemo(() => {
        if (step === 'QUANTITY') return Number.isFinite(Number(qtyVal)) && Number(qtyVal) > 0;
        if (step !== 'LOCATION') return inputVal.trim().length > 0;
        return isLocationBarcode(inputVal.trim().toUpperCase());
    }, [inputVal, qtyVal, step]);

    const totalItems = job.lineItems?.length || 0;
    const completedItems = job.lineItems?.filter((item: any) =>
        item.status === 'Completed' || item.status === 'Picked'
    ).length || 0;
    const currentItemNumber = currentItem ? Math.min(completedItems + 1, totalItems) : totalItems;

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault();

        if (Date.now() - lastStepChangeRef.current < 250) {
            return;
        }

        // If there are no items left to pick, clicking the button completes the job
        if (!currentItem) {
            if (onCompleteJob) {
                onCompleteJob(job);
            }
            return;
        }

        const rawVal = inputVal.trim();
        if (step !== 'QUANTITY' && !rawVal) return;
        if (isProcessing) return;

        const val = rawVal.toUpperCase();

        if (step === 'LOCATION') {
            if (!isLocationBarcode(val)) {
                playBeep('error');
                setErrorMsg(t('warehouse.picking.encodedBarcodeRequired'));
                setShowError(true);
                setTimeout(() => setShowError(false), 2000);
                return;
            }
            const scanPrefix = extractPrefixFromBarcode(val);
            const isMatch = expectedPrefix === scanPrefix;
            if (expectedPrefix && !isMatch) {
                playBeep('error');
                setErrorMsg(t('warehouse.picking.wrongSite').replace('{site}', scanPrefix || ''));
                setShowError(true);
                setTimeout(() => setShowError(false), 2000);
                return;
            }
        }

        if (step === 'LOCATION') {
            const targetLoc = currentItem?.location || currentProduct?.location || '';
            const normalizedTarget = normalizeLocation(targetLoc) || targetLoc.trim().toUpperCase();
            const decodedScanned = decodeLocation(val);

            if (!decodedScanned) {
                playBeep('error');
                setErrorMsg(t('warehouse.picking.corruptLocationData'));
                setShowError(true);
                return;
            }

            if (decodedScanned !== normalizedTarget) {
                playBeep('error');
                setErrorMsg(t('warehouse.picking.bayMismatch').replace('{location}', normalizedTarget));
                setShowError(true);
                setInputVal('');
                setTimeout(() => setShowError(false), 2000);
                return;
            }

            await onScanLocation(decodedScanned);
            setStep('ITEM');
            setInputVal('');
            playBeep('success');
        } else if (step === 'ITEM') {
            const product = getProduct(currentItem);
            const targetSku = currentItem.sku ? normalizeSku(currentItem.sku) : '';
            const decodedSku = extractSkuFromScan(val);

            // Sovereign Multi-Country SKU check (§4 Architecture)
            const countryCheck = validateCrossBorderSku(decodedSku, effectiveCountry || 'ET');
            if (!countryCheck.isValid && countryCheck.isForeign) {
                playBeep('error');
                setErrorMsg(countryCheck.errorMessage || 'Foreign SKU Detected');
                setShowError(true);
                setInputVal('');
                setTimeout(() => setShowError(false), 3000);
                return;
            }

            const scannedVal = normalizeSku(decodedSku);
            
            const matchesSku = scannedVal === targetSku;
            const matchesBarcode = product?.barcode && normalizeSku(product.barcode) === scannedVal;

            if (!matchesSku && !matchesBarcode) {
                playBeep('error');
                setErrorMsg(t('warehouse.picking.incorrectItemScanned'));
                setShowError(true);
                setInputVal('');
                setTimeout(() => setShowError(false), 2000);
                return;
            }

            playBeep('success');
            const prod = product || getProduct(currentItem);
            const measureQty = getItemMeasureQty(currentItem, prod);
            setQtyVal(measureQty !== null ? measureQty.toString() : (currentItem?.expectedQty || 1).toString());
            if (shortPickMode) {
                setIsItemMatched(true);
                setMatchedBarcode(val);
                setSelectedUnit(prod?.unit || currentItem?.unit || 'UNIT');
                setStep('QUANTITY');
            } else {
                await executePick(val);
            }
        } else if (step === 'QUANTITY') {
            const qty = parseFloat(qtyVal);
            const maxExpectedCases = currentItem?.expectedQty || 1;
            const prod = getProduct(currentItem);
            const sizeNum = getEffectivePackageSize(prod?.unit || currentItem?.unit, prod?.size || currentItem?.size);
            const unitDef = prod?.unit ? getSellUnit(prod.unit) : null;
            const isWeightVol = unitDef && (unitDef.category === 'weight' || unitDef.category === 'volume');
            const expectedMeasureQty = getItemMeasureQty(currentItem, prod) || (sizeNum > 0 ? maxExpectedCases * sizeNum : maxExpectedCases);

            const selUnitDef = getSellUnit(selectedUnit);

            // Explicit unit conversion based on selectedUnit:
            let finalQty = qty;
            if (isWeightVol && sizeNum > 0) {
                if (selUnitDef.category === 'count') {
                    // User entered cases/packaging count (e.g. 2.25 cases) -> 2.25 * 20 = 45 kg
                    finalQty = qty * sizeNum;
                } else if (selUnitDef.code === 'G' || selUnitDef.code === 'ML' || selUnitDef.code === 'MG') {
                    // User entered sub-scale units (e.g. 45000 g) -> 45000 / 1000 = 45 kg
                    const factor = selUnitDef.conversionFactor || 1000;
                    finalQty = qty / factor;
                } else {
                    // User entered direct base measure (e.g. 45 kg) -> 45 kg
                    finalQty = qty;
                    // SMART FALLBACK: If they typed the exact case count (e.g. 1.85) but forgot to change unit to cases
                    if (Math.abs(qty - maxExpectedCases) < 0.005) {
                        finalQty = maxExpectedCases * sizeNum;
                    }
                }
            }

            const displayMax = isWeightVol && sizeNum > 0 ? expectedMeasureQty : maxExpectedCases;

            if (isNaN(finalQty) || finalQty <= 0 || finalQty > displayMax + 0.001) {
                playBeep('error');
                setErrorMsg(t('warehouse.picking.invalidQuantityRange').replace('{max}', String(displayMax)));
                setShowError(true);
                setTimeout(() => setShowError(false), 2000);
                return;
            }

            if (finalQty < displayMax - 0.001) {
                const confirmed = window.confirm(t('warehouse.picking.shortPickConfirmPrompt').replace('{qty}', String(finalQty)).replace('{expected}', String(displayMax)));
                if (!confirmed) return;
            }

            await executePick(matchedBarcode, finalQty);
        }
    };

    const executePick = async (barcode: string, quantity?: number) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            // Pass the catalog SKU after barcode validation so encoded labels
            // and UPCs resolve to the same trusted pick line in the parent.
            await onScanItem(currentItem?.sku || barcode, quantity);
            const itemName = currentItem?.name || 'Item';
            setSuccessMsg(`Picked ${quantity || 1}x ${itemName}`);
            setShowSuccess(true);
            playBeep('success');
            setInputVal('');
            setQtyVal('');

            setTimeout(() => {
                setShowSuccess(false);
                setIsItemMatched(false);
                setMatchedBarcode('');
                setStep('LOCATION'); 
                scanOnlyHandlers.reset();
            }, 800);
        } catch (err: any) {
            playBeep('error');
            setErrorMsg(err.message || 'Error saving pick');
            setShowError(true);
            setIsItemMatched(false);
            setStep('ITEM');
            setTimeout(() => {
                setShowError(false);
                scanOnlyHandlers.reset(); 
            }, 2500);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-[var(--theme-bg-app)] flex flex-col overflow-hidden max-w-full">
            {/* Top Bar */}
            <div className="px-3 py-2.5 sm:p-4 bg-[var(--theme-bg-card)] border-b border-[var(--theme-border)] text-[var(--theme-text-primary)] shrink-0">
                <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <button
                            onClick={onClose}
                            className="p-2 -ml-1 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
                            aria-label={t('warehouse.dismiss')}
                        >
                            <X size={20} />
                        </button>
                        <div className="min-w-0">
                            <h3 className="font-bold text-sm sm:text-lg tracking-tight truncate">
                                {step === 'LOCATION'
                                    ? t('warehouse.picking.goToSourceBay')
                                    : step === 'QUANTITY'
                                        ? t('warehouse.confirmQty')
                                        : t('warehouse.picking.scanProductToPick')}
                            </h3>
                            <p className="text-[11px] text-[var(--theme-accent)] font-mono font-semibold truncate">
                                JOB: {formatJobId(job)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] sm:text-[11px] font-semibold bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] px-2.5 py-1.5 rounded-full text-[var(--theme-text-secondary)] whitespace-nowrap">
                            {currentItem ? `${currentItemNumber}/${totalItems} · ` : ''}{step === 'LOCATION' ? '1/3' : step === 'ITEM' ? '2/3' : '3/3'}
                        </span>
                    </div>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-[var(--theme-bg-subtle)] overflow-hidden" role="progressbar" aria-label="Pick mission progress" aria-valuenow={completedItems} aria-valuemin={0} aria-valuemax={totalItems}>
                    <div
                        ref={el => el?.style.setProperty('--progress', `${totalItems ? (completedItems / totalItems) * 100 : 0}%`)}
                        className="w-dynamic h-full rounded-full bg-[var(--theme-accent)] transition-[width] duration-300"
                    />
                </div>
            </div>

            {/* Main View */}
            <div className="flex-1 min-h-0 relative w-full overflow-hidden flex flex-col">
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col items-center px-3 py-3 sm:p-6 pb-4 w-full max-w-full custom-scrollbar">
                    {/* Header & Status Instruction View */}
                    <PickScannerHeader
                        showSuccess={showSuccess}
                        showError={showError}
                        step={step}
                        inputVal={inputVal}
                        currentItem={currentItem}
                        currentProduct={currentProduct}
                        isItemMatched={isItemMatched}
                        shortPickMode={shortPickMode}
                        setShortPickMode={setShortPickMode}
                        successMsg={successMsg}
                        errorMsg={errorMsg}
                        job={job}
                        getProduct={getProduct}
                        getItemMeasureQty={getItemMeasureQty}
                        t={t}
                    />

                    {/* PICKED SO FAR (Only while active picking) */}
                    {!!currentItem && (
                        <PickScannerPickedList
                            job={job}
                            getProduct={getProduct}
                            getItemMeasureQty={getItemMeasureQty}
                            t={t}
                        />
                    )}

                    <p className="mt-4 sm:mt-8 text-[var(--theme-text-secondary)] text-[10px] sm:text-[11px] font-medium z-10 text-center">
                        {t('warehouse.picking.checksumVerifiedInfo')}
                    </p>
                </div>
                <div className="shrink-0 border-t border-[var(--theme-border)] bg-[var(--theme-bg-card)] px-3 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:px-6 sm:py-4">
                    <div className="mx-auto w-full max-w-xl">
                        <PickScannerForm
                            step={step}
                            inputVal={inputVal}
                            setInputVal={setInputVal}
                            qtyVal={qtyVal}
                            setQtyVal={setQtyVal}
                            selectedUnit={selectedUnit}
                            setSelectedUnit={setSelectedUnit}
                            currentItem={currentItem}
                            currentProduct={currentProduct}
                            isItemMatched={isItemMatched}
                            isStrictlyValid={isStrictlyValid}
                            isProcessing={isProcessing || isSubmitting}
                            handleScan={handleScan}
                            getItemMeasureQty={getItemMeasureQty}
                            scanOnlyHandlers={scanOnlyHandlers}
                            lastKeyTime={lastKeyTime}
                            inputRef={inputRef}
                            qtyRef={qtyRef}
                            playBeep={playBeep}
                            setErrorMsg={setErrorMsg}
                            setShowError={setShowError}
                            t={t}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
