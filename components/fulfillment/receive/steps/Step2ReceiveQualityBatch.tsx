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
                            {t('warehouse.expected') || 'Expected'}
                        </span>
                        <span className="text-sm md:text-lg font-mono font-bold text-[var(--theme-text-primary)]">
                            {isBlindReceiving ? `*** (${t('warehouse.blindAudit') || 'Blind'})` : `${expectedSellable} ${t('warehouse.unitsLabel') || 'Units'}`}
                        </span>
                    </div>

                    <div className="h-6 w-px bg-[var(--theme-border)]" />

                    <div>
                        <span className="text-[10px] font-mono font-semibold uppercase text-[var(--theme-text-secondary)] block">
                            {t('warehouse.intakeCount') || 'Intake Count'}
                        </span>
                        <span className="text-sm md:text-lg font-mono font-bold text-[var(--theme-accent)]">
                            {previouslyReceived + totalScanned} {t('warehouse.unitsLabel') || 'Units'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 font-mono text-xs font-semibold ${
                        isBlindReceiving
                            ? 'bg-[var(--theme-status-warning-bg)] border-[var(--theme-status-warning-border)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]'
                            : remaining === 0
                                ? 'bg-[var(--theme-status-success-bg)] border-[var(--theme-status-success-border)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]'
                                : remaining > 0
                                    ? 'bg-[var(--theme-status-warning-bg)] border-[var(--theme-status-warning-border)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]'
                                    : 'bg-[var(--theme-status-danger-bg)] border-[var(--theme-status-danger-border)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)]'
                    }`}>
                        {remaining === 0 && !isBlindReceiving ? (
                            <Check size={14} className="stroke-[2.5]" />
                        ) : (
                            <Clock size={14} />
                        )}
                        <span>
                            {isBlindReceiving
                                ? (t('warehouse.blindAudit') || 'Blind Audit')
                                : remaining === 0
                                    ? (t('warehouse.matched') || 'Matched')
                                    : remaining > 0
                                        ? `${remaining} ${t('warehouse.left') || 'Left'}`
                                        : `${Math.abs(remaining)} ${t('warehouse.over') || 'Over'}`}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleAddSplit}
                        className="min-h-[38px] px-3 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-app)] border border-[var(--theme-border)] text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-primary)] flex items-center gap-1.5 transition-colors cursor-pointer touch-manipulation"
                    >
                        <Plus size={14} />
                        <span className="hidden sm:inline">{t('warehouse.addSplit') || 'Add Split'}</span>
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
