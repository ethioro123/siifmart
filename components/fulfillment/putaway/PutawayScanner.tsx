import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CheckCircle, X, RotateCcw } from 'lucide-react';
import { WMSJob, Product } from '../../../types';
import { playBeep } from '../../../utils/audioUtils';
import { normalizeLocation } from '../../../utils/locationTracking';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { decodeLocation, isLocationBarcode, extractPrefixFromBarcode, extractSkuFromScan } from '../../../utils/locationEncoder';
import { useScanOnly } from '../../../hooks/useScanOnly';
import { useData } from '../../../contexts/DataContext';
import { validateCrossBorderSku } from '../../../utils/skuValidation';
import { logger } from '../../../utils/logger';
import { PutawayScannerLocationCard } from './components/PutawayScannerLocationCard';
import { PutawayScannerItemCard } from './components/PutawayScannerItemCard';
import { PutawayScannerQuantityCard } from './components/PutawayScannerQuantityCard';
import { PutawayScannerStatusOrb } from './components/PutawayScannerStatusOrb';
import { PutawayScannerWarnings } from './components/PutawayScannerWarnings';
import { resolveFulfillmentScanningPolicy } from '../../../utils/receivingPolicy';

import { PutawayRoutingSuggestions, PutawayRoutingState } from './components/PutawayRoutingSuggestions';

const normalizeSku = (s: string) => s.replace(/[-\/\s]/g, '').toUpperCase();

interface PutawayScannerProps {
    job: WMSJob;
    currentItem: any;
    currentProduct?: Product;
    onClose: () => void;
    onScanLocation: (location: string) => void;
    onScanItem: (barcode: string, quantity?: number) => void | Promise<void>;
    isProcessing: boolean;
    recommendation?: { location: string; type: 'ASSIGNED' | 'SUGGESTED'; label: string } | null;
    routing?: PutawayRoutingState;
    occupants?: Product[];
    allProducts: Product[];
    activeSiteId?: string;
    expectedPrefix?: string;
    t: (key: string) => string;
}

export const PutawayScanner: React.FC<PutawayScannerProps> = ({
    job,
    currentItem,
    currentProduct,
    onClose,
    onScanLocation,
    onScanItem,
    isProcessing,
    recommendation, routing,
    occupants = [],
    allProducts,
    activeSiteId,
    expectedPrefix,
    t
}) => {
    const { effectiveCountry, settings } = useData();
    const scanningPolicy = resolveFulfillmentScanningPolicy(settings, effectiveCountry);
    const [step, setStep] = useState<'LOCATION' | 'ITEM' | 'QUANTITY'>('LOCATION');
    const [scannedSku, setScannedSku] = useState<string>('');
    const [inputVal, setInputVal] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [awaitingOccupancyConfirmation, setAwaitingOccupancyConfirmation] = useState(false);
    const [awaitingMismatchConfirmation, setAwaitingMismatchConfirmation] = useState(false);
    const [isOverflowMode, setIsOverflowMode] = useState(false);
    const [lastCheckedLocation, setLastCheckedLocation] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const scanLockRef = useRef(false);

    const scanOnlyHandlers = useScanOnly(setInputVal, {
        onReject: (reason) => {
            setErrorMsg(reason);
            setShowError(true);
            setTimeout(() => setShowError(false), 2000);
        }
    });

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (inputRef.current) inputRef.current.focus();
        }, 100);
        return () => clearTimeout(timeout);
    }, [step, isProcessing]);

    useEffect(() => {
        setInputVal('');
        setAwaitingOccupancyConfirmation(false);
        setAwaitingMismatchConfirmation(false);
        setLastCheckedLocation(null);
    }, [currentItem?.id, step]);

    useEffect(() => {
        const normalized = normalizeLocation(inputVal);
        const canonLoc = normalized || inputVal.trim().toUpperCase();
        if (canonLoc !== lastCheckedLocation) {
            setAwaitingOccupancyConfirmation(false);
            setAwaitingMismatchConfirmation(false);
        }
    }, [inputVal, lastCheckedLocation]);

    const currentOccupants = useMemo(() => {
        const targetSiteId = activeSiteId || job.siteId || (job as any).site_id;
        const normalized = isLocationBarcode(inputVal.trim().toUpperCase())
            ? decodeLocation(inputVal.trim().toUpperCase())
            : (normalizeLocation(inputVal) || inputVal.trim().toUpperCase());
        const canonLoc = normalized;
        if (!canonLoc) return [];

        return allProducts.filter(p => {
            const pLoc = p.location || '';
            const normalizedPLoc = normalizeLocation(pLoc) || pLoc.trim().toUpperCase();
            return normalizedPLoc === canonLoc &&
                (p.siteId === targetSiteId || p.site_id === targetSiteId) &&
                p.id !== currentProduct?.id &&
                (p.stock || 0) > 0;
        });
    }, [inputVal, allProducts, activeSiteId, job.siteId, currentProduct]);

    const isStrictlyValid = useMemo(() => {
        if (step !== 'LOCATION') return inputVal.trim().length > 0;
        return isLocationBarcode(inputVal.trim().toUpperCase());
    }, [inputVal, step]);

    const conflictingOccupants = useMemo(() => {
        if (!currentOccupants.length || !currentItem?.sku) return [];
        return currentOccupants.filter(p => p.sku !== currentItem.sku);
    }, [currentOccupants, currentItem]);

    const isPlacementBlocked = conflictingOccupants.length > 0;

    useEffect(() => {
        if (step !== 'LOCATION' || !inputVal || isProcessing || !expectedPrefix) return;
        const rawVal = inputVal.trim().toUpperCase();
        const requiredLength = expectedPrefix.length === 4 ? 15 : 14;

        if (rawVal.length >= requiredLength) {
            const scanPrefix = extractPrefixFromBarcode(rawVal);
            if (scanPrefix && expectedPrefix !== scanPrefix) {
                playBeep('error');
                setErrorMsg(`WRONG SITE: ${scanPrefix}`);
                setShowError(true);
                setInputVal('');
                setTimeout(() => setShowError(false), 2000);
            }
        }
    }, [inputVal, step, expectedPrefix, isProcessing]);

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault();
        const rawVal = inputVal.trim();
        if (!rawVal || isProcessing || scanLockRef.current) return;
        const val = rawVal.toUpperCase();

        if (step === 'LOCATION') {
            if (!isLocationBarcode(val)) {
                playBeep('error');
                setErrorMsg('ENCODED BARCODE REQUIRED');
                setShowError(true);
                setTimeout(() => setShowError(false), 2000);
                return;
            }
            const scanPrefix = extractPrefixFromBarcode(val);
            const isMatch = expectedPrefix === scanPrefix;
            if (expectedPrefix && !isMatch) {
                playBeep('error');
                setErrorMsg(`WRONG SITE: ${scanPrefix}`);
                setShowError(true);
                setTimeout(() => setShowError(false), 2000);
                return;
            }
        }

        scanLockRef.current = true;
        try {
            if (step === 'LOCATION') {
                const decoded = decodeLocation(val);
                if (!decoded) {
                    playBeep('error');
                    setErrorMsg('Corrupt Location Data');
                    setShowError(true);
                    return;
                }
                const targetLoc = decoded;
                const normalizedAssigned = recommendation?.location ? (normalizeLocation(recommendation.location) || recommendation.location.trim().toUpperCase()) : null;

                if (isPlacementBlocked) { playBeep('error'); return; }
                if (currentOccupants.length > 0 && !awaitingOccupancyConfirmation) {
                    setLastCheckedLocation(targetLoc);
                    setAwaitingOccupancyConfirmation(true);
                    playBeep('warning');
                    return;
                }
                if (!isOverflowMode && recommendation?.type === 'ASSIGNED' && normalizedAssigned && targetLoc !== normalizedAssigned && !awaitingMismatchConfirmation) {
                    setLastCheckedLocation(targetLoc);
                    setAwaitingMismatchConfirmation(true);
                    playBeep('warning');
                    return;
                }

                await onScanLocation(targetLoc);
                setStep('ITEM');
                setInputVal('');
                setAwaitingOccupancyConfirmation(false);
                setAwaitingMismatchConfirmation(false);
                setLastCheckedLocation(null);
                playBeep('success');
            } else if (step === 'ITEM') {
                const itemName = currentItem?.name || 'Item';
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

                // Zero-Trust physical quantity verification config gate
                if (scanningPolicy.requirePutawayQuantityEntry) {
                    setScannedSku(decodedSku);
                    setStep('QUANTITY');
                    setInputVal(String(currentItem?.expectedQty || 1));
                    playBeep('success');
                    return;
                }

                // If quantity entry disabled, auto-credit full expected quantity
                try {
                    await onScanItem(decodedSku, currentItem?.expectedQty);
                } catch (err: any) {
                    playBeep('error');
                    setErrorMsg('Incorrect Item Scanned');
                    setShowError(true);
                    setInputVal('');
                    setTimeout(() => setShowError(false), 2500);
                    return;
                }
                setSuccessMsg(`Relocated ${itemName}`);
                setShowSuccess(true);
                playBeep('success');
                setInputVal('');
                setTimeout(() => {
                    setShowSuccess(false);
                    setStep('LOCATION');
                }, 2000);
            } else if (step === 'QUANTITY') {
                const itemName = currentItem?.name || 'Item';
                const enteredQty = parseInt(rawVal, 10);
                if (isNaN(enteredQty) || enteredQty <= 0) {
                    playBeep('error');
                    setErrorMsg('Enter valid count > 0');
                    setShowError(true);
                    setTimeout(() => setShowError(false), 2000);
                    return;
                }

                const maxAllowed = currentItem?.expectedQty || 1;
                if (enteredQty > maxAllowed) {
                    playBeep('error');
                    setErrorMsg(`Cannot exceed ${maxAllowed} units`);
                    setShowError(true);
                    setTimeout(() => setShowError(false), 2500);
                    return;
                }

                try {
                    await onScanItem(scannedSku || currentItem?.sku, enteredQty);
                } catch (err: any) {
                    playBeep('error');
                    setErrorMsg('Error confirming putaway');
                    setShowError(true);
                    setTimeout(() => setShowError(false), 2500);
                    return;
                }

                setSuccessMsg(`Shelved ${enteredQty}x ${itemName}`);
                setShowSuccess(true);
                playBeep('success');
                setInputVal('');
                setScannedSku('');
                setTimeout(() => {
                    setShowSuccess(false);
                    setStep('LOCATION');
                }, 2000);
            }
        } catch (err) {
            logger.error('PutawayScanner', "Scan failed:", err);
            setInputVal('');
            setAwaitingOccupancyConfirmation(false);
        } finally {
            scanLockRef.current = false;
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-[var(--theme-bg-app)] flex flex-col transition-colors overflow-hidden">
            {/* Top Navigation Bar */}
            <div className="p-3.5 sm:p-4 bg-[var(--theme-bg-card)] border-b border-[var(--theme-border)] flex justify-between items-center gap-2 shrink-0">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <button
                        onClick={onClose}
                        className="p-2 -ml-1 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors rounded-xl hover:bg-[var(--theme-bg-subtle)] min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
                        aria-label={t('warehouse.dismiss')}
                    >
                        <X size={20} />
                    </button>
                    <div className="min-w-0">
                        <h3 className="font-bold text-[var(--theme-text-primary)] text-base sm:text-lg uppercase tracking-tight truncate">
                            {step === 'LOCATION' ? t('warehouse.scanLocation') : step === 'ITEM' ? t('warehouse.scanSkuToConfirm') : 'Enter Shelved Quantity'}
                        </h3>
                        <p className="text-[11px] text-[var(--theme-accent)] font-semibold uppercase tracking-wider font-mono break-all">
                            JOB: {formatJobId(job)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider bg-[var(--theme-bg-subtle)] px-3 py-1 rounded-full text-[var(--theme-text-secondary)] border border-[var(--theme-border)]">
                        STEP {step === 'LOCATION' ? '1' : step === 'ITEM' ? '2' : '3'} OF {scanningPolicy.requirePutawayQuantityEntry ? '3' : '2'}
                    </span>
                </div>
            </div>

            {/* Main View Area */}
            <div className="flex-1 min-h-0 relative w-full overflow-x-hidden overflow-y-auto custom-scrollbar">
                <div className="relative w-full min-w-0 min-h-full flex flex-col items-center justify-start p-4 sm:p-6 pb-32 max-w-lg mx-auto">
                    {/* Status Orb */}
                    <PutawayScannerStatusOrb
                        showSuccess={showSuccess}
                        showError={showError}
                        step={step}
                    />

                    <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold text-[var(--theme-text-primary)] text-center uppercase tracking-tight break-words mb-3 sm:mb-4 transition-colors ${isStrictlyValid ? 'text-[var(--theme-accent)]' : showError ? 'text-rose-500' : ''}`}>
                        {showSuccess ? 'Success!' : showError ? 'Scan Error' : step === 'LOCATION' ? (isStrictlyValid ? t('warehouse.putaway.confirmLocation') : t('warehouse.scanLocation')) : step === 'ITEM' ? t('warehouse.scanSkuToConfirm') : 'Enter Shelved Quantity'}
                    </h1>

                    {showSuccess ? (
                        <div className="text-center mb-6 animate-in fade-in duration-200">
                            <p className="text-emerald-500 text-sm sm:text-lg break-words font-bold uppercase tracking-wider">{successMsg}</p>
                        </div>
                    ) : showError ? (
                        <div className="text-center mb-6 animate-in fade-in duration-200">
                            <p className="text-rose-500 text-sm sm:text-lg break-words font-bold uppercase tracking-wider">{errorMsg}</p>
                        </div>
                    ) : step === 'LOCATION' ? (
                        <div className="w-full mb-6">
                            {routing && <PutawayRoutingSuggestions routing={routing} />}
                            <PutawayScannerLocationCard
                                isStrictlyValid={isStrictlyValid}
                                inputVal={inputVal}
                                recommendation={recommendation}
                                currentProduct={currentProduct}
                                currentItem={currentItem}
                                currentOccupants={currentOccupants}
                                t={t}
                            />
                        </div>
                    ) : step === 'ITEM' ? (
                        <PutawayScannerItemCard
                            currentItem={currentItem}
                            currentOccupants={currentOccupants}
                            t={t}
                        />
                    ) : (
                        <PutawayScannerQuantityCard
                            currentItem={currentItem}
                            scannedSku={scannedSku}
                            onSetQty={setInputVal}
                        />
                    )}

                    {/* Input Area */}
                    <form onSubmit={handleScan} className="w-full max-w-md relative z-20 space-y-4">
                        <div className="relative">
                            <input
                                ref={inputRef}
                                type={step === 'QUANTITY' ? 'number' : 'text'}
                                min={step === 'QUANTITY' ? '1' : undefined}
                                max={step === 'QUANTITY' ? (currentItem?.expectedQty || 1) : undefined}
                                aria-label="Scan location or SKU barcode"
                                title="Scan location or SKU barcode"
                                value={inputVal}
                                onChange={(e) => setInputVal(e.target.value)}
                                onKeyDown={step !== 'QUANTITY' ? scanOnlyHandlers.onKeyDown : undefined}
                                onPaste={step !== 'QUANTITY' ? scanOnlyHandlers.onPaste : undefined}
                                className={`w-full bg-[var(--theme-bg-card)] border-2 rounded-2xl py-3.5 sm:py-4 px-4 text-center text-2xl sm:text-3xl font-bold font-mono text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)] focus:outline-none transition-colors ${
                                    awaitingOccupancyConfirmation || awaitingMismatchConfirmation 
                                        ? 'border-amber-400' 
                                        : 'border-[var(--theme-border)] focus:border-[var(--theme-accent)]'
                                }`}
                                placeholder={
                                    step === 'LOCATION'
                                        ? t('warehouse.putaway.scanLocationPlaceholder')
                                        : step === 'ITEM'
                                            ? t('warehouse.putaway.scanSkuPlaceholder')
                                            : `Enter count (max ${currentItem?.expectedQty || 1})`
                                }
                                autoFocus
                                disabled={isProcessing}
                            />
                        </div>

                        {step === 'LOCATION' && inputVal.trim() && (
                            <div className="text-center animate-in fade-in duration-200">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-accent)] flex items-center justify-center gap-2">
                                    {isStrictlyValid ? `DETECTED: ${decodeLocation(inputVal.trim().toUpperCase())}` : 'Scan a location barcode'}
                                </p>
                            </div>
                        )}

                        <PutawayScannerWarnings
                            awaitingOccupancyConfirmation={awaitingOccupancyConfirmation}
                            awaitingMismatchConfirmation={awaitingMismatchConfirmation}
                            isPlacementBlocked={isPlacementBlocked}
                            conflictingOccupants={conflictingOccupants}
                            t={t}
                        />

                        {/* Action Button */}
                        <button
                            type="submit"
                            disabled={!inputVal.trim() || isProcessing || isPlacementBlocked}
                            className={`w-full py-3.5 sm:py-4 rounded-xl flex items-center justify-center gap-2 transition-colors min-h-[48px] border ${
                                !inputVal.trim() || isProcessing
                                    ? 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] cursor-not-allowed opacity-60'
                                    : isPlacementBlocked
                                        ? 'bg-rose-600 border-rose-500 text-white cursor-not-allowed'
                                        : awaitingOccupancyConfirmation || awaitingMismatchConfirmation
                                            ? 'bg-amber-600 hover:bg-amber-500 border-amber-500 text-white font-semibold uppercase tracking-wider'
                                            : 'bg-[var(--theme-accent)] hover:opacity-90 border-[var(--theme-accent)] text-white font-semibold uppercase tracking-wider'
                            }`}
                        >
                            {isProcessing ? (
                                <RotateCcw size={20} className="animate-spin" />
                            ) : (
                                <CheckCircle size={20} />
                            )}
                            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider">
                                {isProcessing ? 'Processing...' : isPlacementBlocked ? 'BLOCKED' : awaitingOccupancyConfirmation ? 'CONFIRM MERGE' : awaitingMismatchConfirmation ? 'CONFIRM LOCATION' : step === 'QUANTITY' ? 'CONFIRM QUANTITY' : 'SUBMIT'}
                            </span>
                        </button>
                    </form>

                    <p className="mt-8 text-[var(--theme-text-secondary)] text-[11px] font-medium font-mono uppercase tracking-widest text-center">
                        Warehouse Scanner / Active Mode
                    </p>
                </div>
            </div>
        </div>
    );
};
