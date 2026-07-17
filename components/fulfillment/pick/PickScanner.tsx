import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ArrowLeft, Box, CheckCircle, Map as MapIcon, X, Maximize2, RotateCcw, Info, AlertTriangle, Package } from 'lucide-react';
import { WMSJob, Product } from '../../../types';
import { playBeep } from '../../../utils/audioUtils';
import { normalizeLocation } from '../../../utils/locationTracking';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { decodeLocation, isLocationBarcode, extractPrefixFromBarcode, extractSkuFromScan } from '../../../utils/locationEncoder';
import { useScanOnly } from '../../../hooks/useScanOnly';
import { isWeightBased, isVolumeBased, getSellUnit, getEffectivePackageSize, SELL_UNITS } from '../../../utils/units';
import { useLanguage } from '../../../contexts/LanguageContext';
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
        if (prod) {
            const unit = prod.unit;
            const isWeightVol = isWeightBased(unit) || isVolumeBased(unit);
            const sizeNum = getEffectivePackageSize(unit, prod.size || item.size);
            if (isWeightVol && sizeNum > 0) {
                const expected = item.expectedQty || (item as any).quantity || 0;
                return expected * sizeNum;
            }
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
        if (step !== 'LOCATION') return inputVal.trim().length > 0;
        return isLocationBarcode(inputVal.trim().toUpperCase());
    }, [inputVal, step]);

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
            const targetLoc = currentProduct?.location || '';
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
            await onScanItem(barcode, quantity);
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
            }, 1500);
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
        <div className="fixed inset-0 z-[200] bg-[#FAF8F5] dark:bg-[#1C2620] flex flex-col overflow-hidden max-w-full">
            {/* Top Bar */}
            <div className="p-4 bg-[#EAE5D9] dark:bg-[#1C2620]/80 border-b border-[#E2DCCE] dark:border-[#A9CBA2]/10 flex justify-between items-center text-gray-900 dark:text-[#EAE5D9] transition-colors">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="p-2 -ml-2 text-gray-500 dark:text-[#A9CBA2]/70 hover:text-gray-900 dark:hover:text-[#EAE5D9] transition-colors" aria-label={t('warehouse.dismiss')}>
                        <X size={24} />
                    </button>
                    <div>
                        <h3 className="font-bold text-lg uppercase tracking-wider">{step === 'LOCATION' ? t('warehouse.putaway.confirmLocation') : t('warehouse.scanProductBarcode')}</h3>
                        <p className="text-xs text-[#2C5E3B] dark:text-[#A9CBA2] font-mono font-black">JOB: {formatJobId(job)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-[#E2DCCE] dark:bg-[#2C5E3B]/20 px-2 py-1 rounded text-gray-600 dark:text-[#A9CBA2]">
                        {step === 'LOCATION' ? '1/3' : step === 'ITEM' ? '2/3' : '3/3'}
                    </span>
                </div>
            </div>

            {/* Main View */}
            <div className="flex-1 relative w-full overflow-hidden flex flex-col transition-colors">
                {/* Background Decoration */}
                <div className={`absolute inset-0 opacity-[0.05] dark:opacity-20 blur-3xl transition-colors duration-700 pointer-events-none ${step === 'LOCATION' ? 'bg-[#2C5E3B]' : 'bg-[#A9CBA2]'}`} />

                {/* Scrollable Content Container */}
                <div className="absolute inset-0 overflow-y-auto overflow-x-hidden flex flex-col items-center p-6 pb-32 w-full">

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


                    {/* Input & Action Form */}
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
                        isProcessing={isProcessing}
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

                    {/* PICKED SO FAR */}
                    <PickScannerPickedList
                        job={job}
                        getProduct={getProduct}
                        getItemMeasureQty={getItemMeasureQty}
                        t={t}
                    />

                    <p className="mt-8 text-gray-550 text-[10px] font-mono font-bold uppercase tracking-widest z-10 text-center opacity-60">
                        {t('warehouse.picking.checksumVerifiedInfo')}
                    </p>
                </div>
            </div>
        </div>
    );
};
