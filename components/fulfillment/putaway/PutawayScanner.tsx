import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ArrowLeft, Box, CheckCircle, Map as MapIcon, X, Maximize2, RotateCcw, Info, AlertTriangle } from 'lucide-react';
import { WMSJob, Product } from '../../../types';
import { playBeep } from '../../../utils/audioUtils';
import { normalizeLocation } from '../../../utils/locationTracking';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { decodeLocation, isLocationBarcode, extractPrefixFromBarcode } from '../../../utils/locationEncoder';
import { useScanOnly } from '../../../hooks/useScanOnly';

interface PutawayScannerProps {
    job: WMSJob;
    currentItem: any;
    currentProduct?: Product;
    onClose: () => void;
    onScanLocation: (location: string) => void;
    onScanItem: (barcode: string) => void;
    isProcessing: boolean;
    recommendation?: {
        location: string;
        type: 'ASSIGNED' | 'SUGGESTED';
        label: string;
    } | null;
    occupants?: Product[];
    allProducts: Product[];
    activeSiteId?: string;
    expectedPrefix?: string;
}

export const PutawayScanner: React.FC<PutawayScannerProps> = ({
    job,
    currentItem,
    currentProduct,
    onClose,
    onScanLocation,
    onScanItem,
    isProcessing,
    recommendation,
    occupants = [],
    allProducts,
    activeSiteId,
    expectedPrefix
}) => {
    // Putaway Workflow: 
    // Usually: Scan Location -> Scan Item (to confirm placement) 
    // OR: Scan Item -> Scan Location (to confirm where you put it)
    // Based on `ScannerInterface.tsx` logic it was: NAV (Locate) -> SCAN (Item confirmation).
    // Let's stick to:
    // Step 1: Scan Location (Verify correct bay)
    // Step 2: Scan Item (Confirm item placed)

    // HOWEVER, for Putaway, you have the item IN HAND. 
    // You walk to a location.
    // So usually you scan location to say "I am here".
    // Then scan item to say "I put it here".

    const [step, setStep] = useState<'LOCATION' | 'ITEM'>('LOCATION');
    const [inputVal, setInputVal] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [awaitingOccupancyConfirmation, setAwaitingOccupancyConfirmation] = useState(false);
    const [awaitingMismatchConfirmation, setAwaitingMismatchConfirmation] = useState(false);
    const [lastCheckedLocation, setLastCheckedLocation] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Scan-only enforcement for ITEM step
    const scanOnlyHandlers = useScanOnly(setInputVal, {
        onReject: (reason) => {
            setErrorMsg(reason);
            setShowError(true);
            setTimeout(() => setShowError(false), 2000);
        }
    });

    // Auto-focus logic
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (inputRef.current) inputRef.current.focus();
        }, 100);
        return () => clearTimeout(timeout);
    }, [step, isProcessing]);

    // Reset confirmation if input changes or step changes
    useEffect(() => {
        setInputVal('');
    }, [currentItem?.id, step]);
    useEffect(() => {
        setAwaitingOccupancyConfirmation(false);
        setAwaitingMismatchConfirmation(false);
        setLastCheckedLocation(null);
    }, [step]);

    useEffect(() => {
        const normalized = normalizeLocation(inputVal);
        const canonLoc = normalized || inputVal.trim().toUpperCase();
        if (canonLoc !== lastCheckedLocation) {
            setAwaitingOccupancyConfirmation(false);
            setAwaitingMismatchConfirmation(false);
        }
    }, [inputVal, lastCheckedLocation]);

    // Local occupancy calculation for immediate UI response (Recalculates while typing)
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
                (p.stock || 0) > 0; // [FIX] Ignore 0-stock items so they don't block the location
        });
    }, [inputVal, step, allProducts, activeSiteId, job.siteId, (job as any).site_id, currentProduct]);

    const isStrictlyValid = useMemo(() => {
        if (step !== 'LOCATION') return inputVal.trim().length > 0;
        return isLocationBarcode(inputVal.trim().toUpperCase());
    }, [inputVal, step]);

    // Check for conflicting SKUs (different products in same bay)
    const conflictingOccupants = useMemo(() => {
        if (!currentOccupants.length || !currentItem?.sku) return [];
        return currentOccupants.filter(p => p.sku !== currentItem.sku);
    }, [currentOccupants, currentItem]);

    const isPlacementBlocked = conflictingOccupants.length > 0;

    // --- LIVE REJECTION LOGIC ---
    useEffect(() => {
        if (step !== 'LOCATION' || !inputVal || isProcessing || !expectedPrefix) return;

        const rawVal = inputVal.trim().toUpperCase();

        // Fix for partial scans: 
        // If we expect a 4-digit prefix, we MUST wait for 15 chars.
        // If we check at 14 chars, we extract a 3-digit prefix (wrong) and alert effectively "too early",
        // clearing the input before the 15th char arrives (leaving a trailing digit).
        const requiredLength = expectedPrefix.length === 4 ? 15 : 14;

        if (rawVal.length >= requiredLength) {
            const scanPrefix = extractPrefixFromBarcode(rawVal);
            if (scanPrefix && expectedPrefix !== scanPrefix) {
                playBeep('error');
                setErrorMsg(`WRONG SITE: ${scanPrefix}`);
                setShowError(true);
                setInputVal(''); // Clear input IMMEDIATELY so they can't submit it

                // Auto-hide error
                setTimeout(() => {
                    setShowError(false);
                }, 2000);
            }
        }
    }, [inputVal, step, expectedPrefix, isProcessing]);

    // --- MIXED SKU AUTO-CLEAR LOGIC REMOVED ---

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault();
        const rawVal = inputVal.trim();
        if (!rawVal || isProcessing) return;

        const val = rawVal.toUpperCase();

        // Strict Validation for LOCATION step: Must be an encoded barcode
        const scanPrefix = extractPrefixFromBarcode(val);
        if (step === 'LOCATION') {
            if (!isLocationBarcode(val)) {
                playBeep('error');
                setErrorMsg('ENCODED BARCODE REQUIRED');
                setShowError(true);
                setTimeout(() => setShowError(false), 2000);
                return;
            }

            // Site Awareness Check: Strictly compare prefixes
            // Both expectedPrefix and scanPrefix are now expected to be 4-digits.
            /*
            console.log('--- Site Validation Debug ---');
            console.log('Expected Prefix:', expectedPrefix);
            console.log('Scanned Prefix:', scanPrefix);
            console.log('Full Barcode:', val);
            */

            const isMatch = expectedPrefix === scanPrefix;

            if (expectedPrefix && !isMatch) {
                playBeep('error');
                setErrorMsg(`WRONG SITE: ${scanPrefix}`);
                setShowError(true);
                setTimeout(() => setShowError(false), 2000);
                return;
            }
        }

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

                // 1. Placement Blocked (Different SKU)
                if (isPlacementBlocked) {
                    playBeep('error');
                    return;
                }

                // 2. Occupancy Confirmation (Same SKU, first time confirming)
                if (currentOccupants.length > 0 && !awaitingOccupancyConfirmation) {
                    setLastCheckedLocation(targetLoc);
                    setAwaitingOccupancyConfirmation(true);
                    playBeep('warning');
                    return;
                }

                // 3. Assigned Location Deviation Logic
                if (recommendation?.type === 'ASSIGNED' && normalizedAssigned && targetLoc !== normalizedAssigned && !awaitingMismatchConfirmation) {
                    setLastCheckedLocation(targetLoc);
                    setAwaitingMismatchConfirmation(true);
                    playBeep('warning');
                    return;
                }

                // Proceed to next step
                await onScanLocation(targetLoc);
                setStep('ITEM');
                setInputVal('');
                setAwaitingOccupancyConfirmation(false);
                setAwaitingMismatchConfirmation(false);
                setLastCheckedLocation(null);
                playBeep('success');
            } else {
                const itemName = currentItem?.name || 'Item';
                try {
                    await onScanItem(val);
                } catch (err: any) {
                    // Localized Error Feedback
                    playBeep('error');
                    setErrorMsg('Incorrect Item Scanned');
                    setShowError(true);
                    setInputVal('');
                    setTimeout(() => setShowError(false), 2500);
                    return; // Stop here, don't trigger success
                }

                // Success feedback
                setSuccessMsg(`Relocated ${itemName}`);
                setShowSuccess(true);
                playBeep('success');
                setInputVal('');

                // Return to location step for next item in 2s
                setTimeout(() => {
                    setShowSuccess(false);
                    setStep('LOCATION');
                }, 2000);
            }
        } catch (err) {
            console.error("Scan failed:", err);
            // On error, let the parent show the notification (already does)
            // but clear input to allow retry
            setInputVal('');
            // Reset confirmation just in case
            setAwaitingOccupancyConfirmation(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col">
            {/* Top Bar */}
            <div className="p-4 bg-gray-900 border-b border-white/10 flex justify-between items-center text-white">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="p-2 -ml-2 text-gray-400 hover:text-white" aria-label="Close Scanner">
                        <X size={24} />
                    </button>
                    <div>
                        <h3 className="font-bold text-lg uppercase tracking-wider">{step === 'LOCATION' ? 'Scan Location' : 'Scan Item'}</h3>
                        <p className="text-xs text-blue-400 font-mono">JOB: {formatJobId(job)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded text-gray-300">
                        {step === 'LOCATION' ? '1/2' : '2/2'}
                    </span>
                </div>
            </div>

            {/* Main View */}
            <div className="flex-1 relative w-full overflow-hidden flex flex-col">
                {/* Background Decoration - Fixed */}
                <div className={`absolute inset-0 opacity-10 blur-3xl transition-colors duration-700 pointer-events-none ${step === 'LOCATION' ? 'bg-blue-600' : 'bg-green-600'
                    } `} />

                {/* Scrollable Content Container */}
                <div className="absolute inset-0 overflow-y-auto flex flex-col items-center p-6 pb-32">

                    {/* Icon Circle */}
                    <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center mb-8 shadow-2xl z-10 transition-all duration-500 ${showSuccess
                        ? 'border-green-400 bg-green-400/20 shadow-green-400/40 scale-110'
                        : showError
                            ? 'border-red-500 bg-red-500/20 shadow-red-500/40 scale-110 animate-shake'
                            : step === 'LOCATION'
                                ? 'border-blue-500 bg-blue-500/10 shadow-blue-500/20'
                                : 'border-green-500 bg-green-500/10 shadow-green-500/20'
                        }`}>
                        {showSuccess ? (
                            <CheckCircle size={64} className="text-green-400 animate-bounce" />
                        ) : showError ? (
                            <AlertTriangle size={64} className="text-red-500" />
                        ) : step === 'LOCATION' ? (
                            <MapIcon size={64} className="text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                        ) : (
                            <Box size={64} className="text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                        )}
                    </div>

                    {/* Instruction */}
                    <h1 className={`text-4xl md:text-5xl font-black text-white text-center uppercase italic tracking-tight mb-2 z-10 transition-all duration-300 ${isLocationBarcode(inputVal.trim().toUpperCase()) ? 'text-blue-400 scale-105' : showError ? 'text-red-500 animate-pulse' : ''}`}>
                        {showSuccess ? 'Success!' : showError ? 'Error!' : step === 'LOCATION' ? (isLocationBarcode(inputVal.trim().toUpperCase()) ? 'Location Identified' : 'Locate Bay') : 'Verify Item'}
                    </h1>

                    {showSuccess ? (
                        <div className="text-center z-10 mb-8 animate-in fade-in zoom-in duration-300">
                            <p className="text-green-400 text-xl font-bold uppercase tracking-widest">{successMsg}</p>
                        </div>
                    ) : showError ? (
                        <div className="text-center z-10 mb-8 animate-in fade-in zoom-in duration-300">
                            <p className="text-red-500 text-xl font-bold uppercase tracking-widest">{errorMsg}</p>
                        </div>
                    ) : step === 'LOCATION' ? (
                        <div className="text-center z-10 mb-8">
                            {/* HERO LOCATION DISPLAY */}
                            <div className="text-center mb-8 relative">
                                <p className="text-gray-400 text-sm font-medium uppercase tracking-widest mb-2">
                                    {recommendation?.type === 'ASSIGNED' ? 'Go to this location' : recommendation?.type === 'SUGGESTED' ? 'Recommended Area' : 'Action Required'}
                                </p>

                                {/* Location Text / Suggestion */}
                                <div className={`relative inline-block px-8 py-4 rounded-xl border-2 transition-all duration-300 ${recommendation?.type === 'ASSIGNED'
                                    ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.2)]'
                                    : recommendation?.type === 'SUGGESTED'
                                        ? 'bg-blue-500/5 border-blue-400/50 text-blue-300 shadow-[0_0_20px_rgba(96,165,250,0.1)]'
                                        : 'bg-white/5 border-white/10 text-white'
                                    }`}>
                                    <p className={`font-mono font-black tracking-widest ${isLocationBarcode(inputVal.trim().toUpperCase()) ? 'text-6xl md:text-7xl text-blue-400' : (recommendation?.location?.length || 0) > 10 ? 'text-2xl' : 'text-5xl'}`}>
                                        {isLocationBarcode(inputVal.trim().toUpperCase())
                                            ? decodeLocation(inputVal.trim().toUpperCase())
                                            : (normalizeLocation(inputVal) || recommendation?.location || 'SCAN BAY')}
                                    </p>

                                    {/* Subtext Logic */}
                                    {recommendation?.type === 'SUGGESTED' && !normalizeLocation(inputVal) && (
                                        <div className="mt-2 border-t border-white/10 pt-2">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                                                {currentProduct?.category}
                                            </p>
                                            <p className="text-[10px] italic text-blue-300/80 mt-1">
                                                Find an empty bay here
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>


                            {/* LIVE LOCATION OCCUPANCY PREVIEW */}
                            {currentOccupants.length > 0 && (
                                <div className="mt-8 max-w-sm mx-auto p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-left animate-in slide-in-from-top-2 duration-500">
                                    <div className="flex items-center gap-2 mb-3 border-b border-amber-500/10 pb-2">
                                        <Box size={14} className="text-amber-400" />
                                        <span className="text-[10px] font-black uppercase text-amber-500/60 tracking-wider">Occupancy Warning ({currentOccupants.length})</span>
                                    </div>
                                    <div className="space-y-3">
                                        {currentOccupants.slice(0, 2).map((occ: Product) => (
                                            <div key={occ.id} className="flex items-start gap-3 opacity-80">
                                                <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                                                    <Info size={12} className="text-amber-500" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-bold text-amber-100 truncate">{occ.name}</p>
                                                    <p className="text-[9px] font-mono text-amber-500/50 truncate">{occ.sku}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    ) : (
                        <div className="text-center z-10 mb-8">
                            <p className="text-gray-400 text-lg">Scan product barcode:</p>
                            <p className="text-2xl text-white font-bold mt-2">
                                {currentItem?.name}
                            </p>
                            <p className="text-green-400 font-mono text-xl mt-1">{currentItem?.sku}</p>

                            {/* OCCUPANTS DETAIL */}
                            {currentOccupants.length > 0 && (
                                <div className="mt-8 max-w-sm mx-auto p-4 rounded-2xl bg-white/5 border border-white/10 text-left animate-in slide-in-from-bottom-2 duration-500">
                                    <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
                                        <Info size={14} className="text-amber-400" />
                                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Bay Occupants ({currentOccupants.length})</span>
                                    </div>
                                    <div className="space-y-3">
                                        {currentOccupants.slice(0, 3).map((occ: Product) => (
                                            <div key={occ.id} className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                                    <Box size={14} className="text-gray-500" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-white truncate">{occ.name}</p>
                                                    <p className="text-[10px] font-mono text-gray-500 truncate">{occ.sku}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {currentOccupants.length > 3 && (
                                            <p className="text-[10px] text-zinc-600 italic pl-11">+ {currentOccupants.length - 3} more products...</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}


                    {/* Input Area */}
                    <form onSubmit={handleScan} className="w-full max-w-md relative z-20 group">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition-opacity" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                            onKeyDown={step === 'ITEM' ? scanOnlyHandlers.onKeyDown : undefined}
                            onPaste={scanOnlyHandlers.onPaste}
                            className={`w-full bg-gray-900/90 border-2 rounded-2xl py-6 px-4 text-center text-3xl font-mono text-white placeholder:text-gray-700 focus:outline-none relative z-10 shadow-xl transition-all ${awaitingOccupancyConfirmation || awaitingMismatchConfirmation ? 'border-amber-500 shadow-amber-500/20' : 'border-white/10 focus:border-white/30'
                                }`}
                            placeholder={step === 'LOCATION' ? 'SCAN 15-DIGIT BARCODE' : 'SCAN SKU BARCODE'}
                            autoFocus
                            disabled={isProcessing}
                        />

                        {/* FORMAT PREVIEW */}
                        {step === 'LOCATION' && inputVal.trim() && (
                            <div className="mb-4 text-center animate-in fade-in slide-in-from-bottom-1 duration-300">
                                <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-400 flex items-center justify-center gap-3">
                                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                                    {isLocationBarcode(inputVal.trim().toUpperCase()) ? `IDENTIFIED: ${decodeLocation(inputVal.trim().toUpperCase())}` : 'Encoded Barcode Protocol Required'}
                                </p>
                            </div>
                        )}

                        {isProcessing && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30">
                                <RotateCcw className="animate-spin text-white opacity-50" size={24} />
                            </div>
                        )}

                        {/* OCCUPANCY WARNING */}
                        {awaitingOccupancyConfirmation && !isPlacementBlocked && (
                            <div className="mt-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 animate-in zoom-in duration-300">
                                <div className="flex items-center gap-3 text-amber-400 mb-2">
                                    <Info size={20} />
                                    <span className="font-black uppercase tracking-wider text-sm">Action Required: Bay Occupied</span>
                                </div>
                                <p className="text-xs text-amber-200/70 leading-relaxed text-left">
                                    This location matches the current item. Clicking confirm again will merge them.
                                </p>
                            </div>
                        )}

                        {/* STRICT BLOCK WARNING */}
                        {isPlacementBlocked && (
                            <div className="mt-8 p-6 rounded-2xl bg-red-950/50 border-2 border-red-500 animate-in zoom-in duration-300">
                                <div className="flex items-center gap-3 text-red-500 mb-3">
                                    <X size={24} strokeWidth={3} />
                                    <span className="font-black uppercase tracking-widest text-sm border-b-2 border-red-500/30 pb-1">Placement Prohibited</span>
                                </div>
                                <p className="text-xs font-bold text-red-200 leading-relaxed text-left mb-2">
                                    This location contains <span className="text-white bg-red-900/50 px-1 rounded">{conflictingOccupants[0]?.sku}</span> which matches a different product.
                                </p>
                                <div className="flex items-center gap-2 bg-red-900/30 p-2 rounded text-[10px] font-mono text-red-300">
                                    <Info size={12} />
                                    <span>Mixed SKU storage is not permitted.</span>
                                </div>
                            </div>
                        )}

                        {/* MOBILE ACTION BUTTON */}
                        <button
                            type="submit"
                            disabled={!inputVal.trim() || isProcessing || isPlacementBlocked}
                            className={`mt-6 w-full py-6 rounded-2xl flex items-center justify-center gap-3 transition-all duration-500 active:scale-95 shadow-2xl border-2 relative z-30 pointer-events-auto ${!inputVal.trim() || isProcessing
                                ? 'bg-zinc-800/50 border-white/5 text-zinc-600 grayscale opacity-50 cursor-not-allowed'
                                : isPlacementBlocked
                                    ? 'bg-red-600/20 border-red-500/50 text-red-500 cursor-not-allowed'
                                    : !isStrictlyValid
                                        ? 'bg-zinc-700 border-red-500/50 text-red-400'
                                        : awaitingOccupancyConfirmation || awaitingMismatchConfirmation
                                            ? 'bg-amber-600 border-amber-400 text-white font-black uppercase tracking-widest shadow-amber-500/40 animate-pulse'
                                            : 'bg-gradient-to-r from-blue-600 to-cyan-600 border-white/20 text-white font-black uppercase tracking-widest shadow-blue-500/20'
                                }`}
                        >
                            {isProcessing ? (
                                <RotateCcw size={24} className="animate-spin" />
                            ) : isPlacementBlocked ? (
                                <X size={24} />
                            ) : (awaitingOccupancyConfirmation || awaitingMismatchConfirmation) ? (
                                <CheckCircle size={24} />
                            ) : (
                                <CheckCircle size={24} />
                            )}
                            {isProcessing ? 'Validating...' : isPlacementBlocked ? 'Placement Blocked' : awaitingOccupancyConfirmation ? 'Acknowledge Mixture' : awaitingMismatchConfirmation ? 'Confirm New Location' : 'Confirm Scan'}
                        </button>
                    </form>

                    <p className="mt-8 text-gray-500 text-[10px] font-mono font-bold uppercase tracking-widest z-10 text-center opacity-60">
                        15-Digit Encoded Protocol • Checksum Verified
                    </p>
                </div>
            </div>
        </div>
    );
};
