import React from 'react';
import { Plus, Check, Clock, AlertTriangle, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { ReceiveSplitCard, SplitVariant } from '../ReceiveSplitCard';

interface Step2ReceiveQualityBatchProps {
    splitVariants: SplitVariant[];
    setSplitVariants: React.Dispatch<React.SetStateAction<any[]>>;
    totalScanned: number;
    expectedSellable: number;
    previouslyReceived: number;
    isBlindReceiving: boolean;
    remaining: number;
    progress: number;
    barcodeInput: { [variantId: string]: string };
    setBarcodeInput: React.Dispatch<React.SetStateAction<{ [variantId: string]: string }>>;
    setActiveVariantForScan: (val: string | null) => void;
    scanOnlyHandlers: {
        onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
        onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
    };
    handleAddSplit: () => void;
    handleRemoveSplit: (id: string) => void;
    handleUpdateVariant: (id: string, updated: Partial<SplitVariant>) => void;
    handleAddBarcode: (variantId: string) => void;
    handleRemoveBarcode: (variantId: string, code: string) => void;
    t: (key: string) => string;
}

export const Step2ReceiveQualityBatch: React.FC<Step2ReceiveQualityBatchProps> = ({
    splitVariants,
    totalScanned,
    expectedSellable,
    previouslyReceived,
    isBlindReceiving,
    remaining,
    progress,
    barcodeInput,
    setBarcodeInput,
    setActiveVariantForScan,
    scanOnlyHandlers,
    handleAddSplit,
    handleRemoveSplit,
    handleUpdateVariant,
    handleAddBarcode,
    handleRemoveBarcode,
    t,
}) => {
    return (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-[var(--theme-bg-app)]">
            {/* Live Count Progress Toolbar */}
            <div className="p-3 md:p-4 border-b border-[var(--theme-border)] bg-[var(--theme-bg-card)] shrink-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                    <div>
                        <span className="text-[10px] font-mono font-semibold uppercase text-[var(--theme-text-secondary)] block">
                            Expected
                        </span>
                        <span className="text-sm md:text-lg font-mono font-bold text-[var(--theme-text-primary)]">
                            {isBlindReceiving ? '*** (Blind)' : `${expectedSellable} Units`}
                        </span>
                    </div>

                    <div className="h-6 w-px bg-[var(--theme-border)]" />

                    <div>
                        <span className="text-[10px] font-mono font-semibold uppercase text-[var(--theme-text-secondary)] block">
                            Intake Count
                        </span>
                        <span className="text-sm md:text-lg font-mono font-bold text-[var(--theme-accent)]">
                            {previouslyReceived + totalScanned} Units
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 font-mono text-xs font-semibold ${
                        isBlindReceiving
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400'
                            : remaining === 0
                                ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400'
                                : remaining > 0
                                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                                    : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                    }`}>
                        {remaining === 0 && !isBlindReceiving ? (
                            <Check size={14} className="stroke-[2.5]" />
                        ) : (
                            <Clock size={14} />
                        )}
                        <span>
                            {isBlindReceiving
                                ? 'Blind Audit'
                                : remaining === 0
                                    ? 'Matched'
                                    : remaining > 0
                                        ? `${remaining} Left`
                                        : `${Math.abs(remaining)} Over`}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleAddSplit}
                        className="min-h-[38px] px-3 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-app)] border border-[var(--theme-border)] text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-primary)] flex items-center gap-1.5 transition-colors cursor-pointer touch-manipulation"
                    >
                        <Plus size={14} />
                        <span className="hidden sm:inline">Add Split</span>
                    </button>
                </div>
            </div>

            {/* Split Cards Scrollable Container */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 md:p-5 space-y-3">
                {splitVariants.map((variant, index) => (
                    <ReceiveSplitCard
                        key={variant.id}
                        variant={variant}
                        index={index}
                        totalSplits={splitVariants.length}
                        barcodeInput={barcodeInput[variant.id] || ''}
                        onUpdateVariant={(updated) => handleUpdateVariant(variant.id, updated)}
                        onRemoveVariant={() => handleRemoveSplit(variant.id)}
                        onBarcodeInput={(val) => setBarcodeInput(prev => ({ ...prev, [variant.id]: val }))}
                        onAddBarcode={() => handleAddBarcode(variant.id)}
                        onRemoveBarcode={(code) => handleRemoveBarcode(variant.id, code)}
                        onFocusScan={() => setActiveVariantForScan(variant.id)}
                        scanOnlyHandlers={scanOnlyHandlers}
                        t={t}
                    />
                ))}
            </div>


        </div>
    );
};
