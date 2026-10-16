import React from 'react';
import { Barcode, CheckCircle, ArrowRight, Scan, AlertTriangle, Sparkles } from 'lucide-react';
import { WMSJob, Product } from '../../../../types';
import { ProgressBar } from '../../../shared/ProgressBar';
import { PackJobItemCard } from '../components/PackJobItemCard';

interface Step1PackItemsProps {
    job: WMSJob;
    products: Product[];
    boxSize: string;
    totalItems: number;
    completedItems: number;
    progressPercent: number;
    isFullyPacked: boolean;
    scanInput: string;
    setScanInput: (val: string) => void;
    scanInputRef: React.RefObject<HTMLInputElement>;
    scanError: string;
    handleScanItem: (e: React.FormEvent) => void;
    scannedItemIndex: number | null;
    setScannedItemIndex: (idx: number | null) => void;
    confirmQty: string;
    setConfirmQty: (val: string) => void;
    submitQtyConfirm: () => void;
    onPrintItemLabel?: (item: any, product?: any, boxSize?: string) => void;
    onOpenScanner?: () => void;
    onAdvanceToBox: () => void;
    t: (key: string) => string;
}

export const Step1PackItems: React.FC<Step1PackItemsProps> = ({
    job,
    products,
    boxSize,
    totalItems,
    completedItems,
    progressPercent,
    isFullyPacked,
    scanInput,
    setScanInput,
    scanInputRef,
    scanError,
    handleScanItem,
    scannedItemIndex,
    setScannedItemIndex,
    confirmQty,
    setConfirmQty,
    submitQtyConfirm,
    onPrintItemLabel,
    onOpenScanner,
    onAdvanceToBox,
    t,
}) => {
    return (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-[var(--theme-bg-app)]">
            {/* Top Toolbar: Scanning Bar & Progress */}
            <div className="p-3 md:p-4 border-b border-[var(--theme-border)] bg-[var(--theme-bg-card)] shrink-0 space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    {/* Live Progress Pill */}
                    <div className="flex items-center gap-3 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] px-3.5 py-2 rounded-xl shrink-0">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono font-bold text-[var(--theme-text-primary)]">
                                {completedItems} / {totalItems}
                            </span>
                            <span className="text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                                {t('warehouse.packed') || 'Packed'}
                            </span>
                        </div>
                        <div className="w-24 md:w-32 h-2.5 bg-[var(--theme-bg-app)] rounded-full overflow-hidden shrink-0 border border-[var(--theme-border)]">
                            <ProgressBar
                                progress={progressPercent}
                                containerClassName="h-full bg-transparent"
                                fillClassName={`h-full transition-all duration-300 ${
                                    isFullyPacked ? 'bg-green-500' : 'bg-[var(--theme-accent)]'
                                }`}
                            />
                        </div>
                        <span className="text-xs font-mono font-bold text-[var(--theme-accent)]">
                            {Math.round(progressPercent)}%
                        </span>
                    </div>

                    {/* Scan Input & Fullscreen Trigger */}
                    <div className="flex items-center gap-2 flex-1 max-w-md sm:justify-end">
                        <form onSubmit={handleScanItem} className="relative flex-1">
                            <input
                                ref={scanInputRef}
                                type="text"
                                aria-label="Scan or enter barcode"
                                placeholder={t('warehouse.scanBarcodePlaceholder') || 'Scan item SKU / barcode...'}
                                value={scanInput}
                                onChange={(e) => setScanInput(e.target.value)}
                                className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] focus:border-[var(--theme-accent)] rounded-xl py-2 pl-9 pr-3 text-xs md:text-sm font-mono text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)] outline-none min-h-[44px]"
                            />
                            <Barcode size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)]" />
                        </form>

                        {onOpenScanner && (
                            <button
                                type="button"
                                onClick={onOpenScanner}
                                title="Open Fullscreen Barcode Gun Mode"
                                className="min-h-[44px] px-3 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/30 rounded-xl text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] flex items-center gap-1.5 shrink-0 transition-colors touch-manipulation cursor-pointer"
                            >
                                <Scan size={15} />
                                <span className="hidden md:inline">Gun Mode</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Scan Error Toast */}
                {scanError && (
                    <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-2 animate-in fade-in">
                        <AlertTriangle size={15} className="shrink-0" />
                        <span>{scanError}</span>
                    </div>
                )}
            </div>

            {/* Dynamic Step-Complete Auto-Advance Banner */}
            {isFullyPacked && (
                <div className="p-3 md:p-4 bg-green-500/10 border-b border-green-500/20 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-green-600 text-white flex items-center justify-center shrink-0">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <p className="text-xs md:text-sm font-bold text-green-700 dark:text-green-300 uppercase tracking-tight">
                                All {totalItems} items verified & packed!
                            </p>
                            <span className="text-[11px] text-green-600 dark:text-green-400">
                                Ready for carton packaging and material preparation.
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onAdvanceToBox}
                        className="w-full sm:w-auto min-h-[44px] px-5 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-xs md:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer touch-manipulation"
                    >
                        <span>Step 2: Carton & Prep</span>
                        <ArrowRight size={16} />
                    </button>
                </div>
            )}

            {/* Scrollable Item Cards List */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 md:p-5 space-y-2.5">
                {job.lineItems?.map((item, idx) => (
                    <PackJobItemCard
                        key={idx}
                        item={item}
                        idx={idx}
                        job={job}
                        products={products}
                        boxSize={boxSize}
                        scannedItemIndex={scannedItemIndex}
                        confirmQty={confirmQty}
                        setConfirmQty={setConfirmQty}
                        setScannedItemIndex={setScannedItemIndex}
                        submitQtyConfirm={submitQtyConfirm}
                        onPrintItemLabel={onPrintItemLabel}
                        t={t}
                    />
                ))}
            </div>
        </div>
    );
};
