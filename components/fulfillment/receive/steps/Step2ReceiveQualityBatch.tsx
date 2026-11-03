import React from 'react';
import { Plus } from 'lucide-react';
import { ReceiveSplitCard, SplitVariant } from '../ReceiveSplitCard';
import type { BarcodeFeedback } from '../hooks/useReceiveBarcodeCheck';

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
    barcodeFeedback?: { [variantId: string]: BarcodeFeedback | null };
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
    onDismissFeedback?: (variantId: string) => void;
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
    barcodeFeedback,
    setBarcodeInput,
    setActiveVariantForScan,
    scanOnlyHandlers,
    handleAddSplit,
    handleRemoveSplit,
    handleUpdateVariant,
    handleAddBarcode,
    handleRemoveBarcode,
    onDismissFeedback,
    t,
}) => {
    return (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-[var(--theme-bg-app)]">
            <div className="p-4 border-b border-[var(--theme-border)] bg-[var(--theme-bg-card)] flex flex-wrap items-center justify-between gap-3">
                <div className="text-[var(--theme-text-primary)]">
                    <p className="text-sm text-[var(--theme-text-secondary)]">{t('warehouse.receivingCurrentCount')}</p>
                    <p className="text-2xl font-semibold tabular-nums">{totalScanned} <span className="text-sm font-normal">{t('warehouse.unitsLabel')}</span></p>
                    {!isBlindReceiving && <p className="text-sm text-[var(--theme-text-secondary)]">{t('warehouse.expected')}: {expectedSellable} · {t('warehouse.previouslyReceived')}: {previouslyReceived}</p>}
                </div>
                <button type="button" onClick={handleAddSplit}
                    className="min-h-[44px] px-4 rounded-xl bg-[var(--theme-bg-subtle)] text-sm font-medium text-[var(--theme-text-primary)] flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--theme-accent)]">
                    <Plus size={16} aria-hidden="true" />{t('warehouse.addSplit')}
                </button>
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
                        barcodeFeedback={barcodeFeedback?.[variant.id]}
                        onUpdateVariant={(updated) => handleUpdateVariant(variant.id, updated)}
                        onRemoveVariant={() => handleRemoveSplit(variant.id)}
                        onBarcodeInput={(val) => setBarcodeInput(prev => ({ ...prev, [variant.id]: val }))}
                        onAddBarcode={() => handleAddBarcode(variant.id)}
                        onRemoveBarcode={(code) => handleRemoveBarcode(variant.id, code)}
                        onDismissFeedback={() => onDismissFeedback?.(variant.id)}
                        onFocusScan={() => setActiveVariantForScan(variant.id)}
                        scanOnlyHandlers={scanOnlyHandlers}
                        t={t}
                    />
                ))}
            </div>


        </div>
    );
};
