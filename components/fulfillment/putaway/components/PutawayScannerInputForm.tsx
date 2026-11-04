import React from 'react';
import { CheckCircle, RotateCcw } from 'lucide-react';
import { decodeLocation } from '../../../../utils/locationEncoder';
import { PutawayScannerWarnings } from './PutawayScannerWarnings';
import { MobileScannerLocationBadge } from '../../components/MobileScannerLocationBadge';

interface PutawayScannerInputFormProps {
    step: 'LOCATION' | 'ITEM' | 'QUANTITY';
    inputVal: string;
    setInputVal: (val: string) => void;
    currentItem: any;
    inputRef: React.RefObject<HTMLInputElement | null>;
    scanOnlyHandlers: {
        onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
        onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
    };
    awaitingOccupancyConfirmation: boolean;
    awaitingMismatchConfirmation: boolean;
    isPlacementBlocked: boolean;
    conflictingOccupants: any[];
    isProcessing: boolean;
    showSuccess: boolean;
    isStrictlyValid: boolean;
    handleScan: (e: React.FormEvent) => void;
    targetLocation: string;
    targetLocationLabel?: string;
    sku?: string;
    t: (key: string, params?: Record<string, string | number>) => string;
    isMobilePinned?: boolean;
}

export const PutawayScannerInputForm: React.FC<PutawayScannerInputFormProps> = ({
    step,
    inputVal,
    setInputVal,
    currentItem,
    inputRef,
    scanOnlyHandlers,
    awaitingOccupancyConfirmation,
    awaitingMismatchConfirmation,
    isPlacementBlocked,
    conflictingOccupants,
    isProcessing,
    showSuccess,
    isStrictlyValid,
    handleScan,
    targetLocation,
    targetLocationLabel,
    sku,
    t,
    isMobilePinned = false
}) => {
    return (
        <form onSubmit={handleScan} className={`w-full max-w-md relative z-20 space-y-2.5 ${isMobilePinned ? 'p-2 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-md' : 'space-y-4'}`}>
            {/* Pinned Mobile Target Location Badge */}
            <MobileScannerLocationBadge
                label={targetLocationLabel || (step === 'LOCATION' ? (t('warehouse.putaway.assignedLocation') || 'Target Location') : (t('warehouse.putawayTarget') || 'Putaway Bay'))}
                location={targetLocation || t('warehouse.nA') || 'N/A'}
                sku={sku || currentItem?.sku}
                className="mb-1"
            />

            <div className="relative">
                <input
                    ref={inputRef}
                    type={step === 'QUANTITY' ? 'number' : 'text'}
                    min={step === 'QUANTITY' ? '0' : undefined}
                    step={step === 'QUANTITY' ? 'any' : undefined}
                    max={step === 'QUANTITY' ? (currentItem?.expectedQty || 1) : undefined}
                    aria-label="Scan location or SKU barcode"
                    title="Scan location or SKU barcode"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onFocus={(e) => {
                        const target = e.currentTarget;
                        setTimeout(() => {
                            target?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
                        }, 150);
                    }}
                    onKeyDown={step !== 'QUANTITY' ? scanOnlyHandlers.onKeyDown : undefined}
                    onPaste={step !== 'QUANTITY' ? scanOnlyHandlers.onPaste : undefined}
                    className={`w-full bg-[var(--theme-bg-card)] border-2 rounded-2xl py-3 sm:py-4 px-4 text-center text-xl sm:text-3xl font-bold font-mono text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)] focus:outline-none transition-colors scroll-mt-20 scroll-mb-20 min-h-[52px] sm:min-h-[64px] ${
                        awaitingOccupancyConfirmation || awaitingMismatchConfirmation
                            ? 'border-[var(--theme-status-warning-border)]'
                            : 'border-[var(--theme-border)] focus:border-[var(--theme-accent)]'
                    }`}
                    placeholder={
                        step === 'LOCATION'
                            ? t('warehouse.putaway.scanLocationPlaceholder')
                            : step === 'ITEM'
                                ? t('warehouse.putaway.scanSkuPlaceholder')
                                : t('warehouse.putaway.enterCountMax', { max: currentItem?.expectedQty || 1 }) || `Enter count (max ${currentItem?.expectedQty || 1})`
                    }
                    autoFocus
                    disabled={isProcessing || showSuccess}
                />
            </div>

            {step === 'LOCATION' && inputVal.trim() && (
                <div className="text-center animate-in fade-in duration-200">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-accent)] flex items-center justify-center gap-2">
                        {isStrictlyValid ? `DETECTED: ${decodeLocation(inputVal.trim().toUpperCase())}` : (t('warehouse.putaway.scanLocationBarcodePrompt') || 'Scan a location barcode')}
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
                disabled={!inputVal.trim() || isProcessing || showSuccess || isPlacementBlocked}
                className={`w-full py-3 sm:py-4 rounded-xl flex items-center justify-center gap-2 transition-colors min-h-[48px] border ${
                    !inputVal.trim() || isProcessing
                        ? 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] cursor-not-allowed opacity-60'
                        : isPlacementBlocked
                            ? 'bg-[var(--theme-status-danger-bg)] border-[var(--theme-status-danger-border)] text-[var(--theme-text-primary)] cursor-not-allowed'
                            : awaitingOccupancyConfirmation || awaitingMismatchConfirmation
                                ? 'bg-[var(--theme-status-warning-bg)] border-[var(--theme-status-warning-border)] text-[var(--theme-text-primary)] font-semibold uppercase tracking-wider'
                                : 'bg-[var(--theme-accent)] hover:opacity-90 border-[var(--theme-accent)] text-[var(--theme-text-primary)] font-semibold uppercase tracking-wider'
                }`}
            >
                {isProcessing ? (
                    <RotateCcw size={20} className="animate-spin" />
                ) : (
                    <CheckCircle size={20} />
                )}
                <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider">
                    {isProcessing ? (t('warehouse.processingStatus') || 'Processing...') : isPlacementBlocked ? (t('warehouse.putaway.blocked') || 'BLOCKED') : awaitingOccupancyConfirmation ? (t('warehouse.putaway.confirmMerge') || 'CONFIRM MERGE') : awaitingMismatchConfirmation ? (t('warehouse.putaway.confirmLocation') || 'CONFIRM LOCATION') : step === 'QUANTITY' ? (t('warehouse.putaway.confirmQuantity') || 'CONFIRM QUANTITY') : (t('warehouse.submitScan') || 'SUBMIT')}
                </span>
            </button>
        </form>
    );
};
