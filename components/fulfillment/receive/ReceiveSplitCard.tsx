import React from 'react';
import { Trash2, Plus, ScanBarcode, ChevronRight, X, Sparkles, Calendar, Layers } from 'lucide-react';
import Badge from '../../shared/Badge';
import { generateBatchNumber, parseBatchNumber, getBatchExpiryStatus } from '../../../utils/batchNumber';

export interface SplitVariant {
    id: string;
    sku: string;
    skuType: 'existing' | 'new';
    productId?: string;
    productName?: string;
    quantity: number;
    barcode?: string;
    barcodes?: string[];
    expiryDate?: string;
    batchNumber?: string;
    condition?: string;
}

interface ReceiveSplitCardProps {
    variant: SplitVariant;
    index: number;
    totalSplits: number;
    barcodeInput: string;
    onUpdateVariant: (updated: Partial<SplitVariant>) => void;
    onRemoveVariant: () => void;
    onBarcodeInput: (val: string) => void;
    onAddBarcode: () => void;
    onRemoveBarcode: (code: string) => void;
    onFocusScan: () => void;
    scanOnlyHandlers: {
        onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
        onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
    };
    t: (key: string) => string;
}

export const ReceiveSplitCard: React.FC<ReceiveSplitCardProps> = ({
    variant,
    index,
    totalSplits,
    barcodeInput,
    onUpdateVariant,
    onRemoveVariant,
    onBarcodeInput,
    onAddBarcode,
    onRemoveBarcode,
    onFocusScan,
    scanOnlyHandlers,
    t
}) => {
    const parsedBatch = parseBatchNumber(variant.batchNumber);
    const expiryStatus = getBatchExpiryStatus(variant.expiryDate);

    const handleAutoGenerateLot = () => {
        const newLot = generateBatchNumber({
            sku: variant.sku,
            sequence: index + 1
        });
        onUpdateVariant({ batchNumber: newLot });
    };

    return (
        <div className="rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] p-4 md:p-5 transition-colors shadow-sm animate-in fade-in duration-200">
            <div className="flex flex-col gap-4">
                {/* Top Row: Split Indicator & Quick Actions */}
                <div className="flex items-center justify-between border-b border-[var(--theme-border)] pb-3">
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] font-mono border border-[var(--theme-border)]">
                            Split #{index + 1}
                        </span>
                        {parsedBatch.isStandard && (
                            <span className="text-[11px] text-[var(--theme-text-secondary)] font-mono flex items-center gap-1">
                                <Calendar size={13} className="text-[var(--theme-text-secondary)]" />
                                Date Rcvd: {parsedBatch.formattedDate || 'Today'}
                            </span>
                        )}
                    </div>
                    {totalSplits > 1 && (
                        <button
                            type="button"
                            onClick={onRemoveVariant}
                            className="p-2 text-[var(--theme-text-secondary)] hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                            title={t('warehouse.removeScan')}
                            aria-label="Remove split"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>

                {/* Grid: Qty & Condition */}
                <div className="grid grid-cols-2 gap-3 md:gap-4 w-full">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider pl-0.5">{t('warehouse.quantityToReceive')}</label>
                        <input
                            type="number"
                            inputMode="decimal"
                            pattern="[0-9]*"
                            min="0"
                            value={variant.quantity === 0 ? '' : variant.quantity}
                            onChange={(e) => onUpdateVariant({ quantity: Math.max(0, parseInt(e.target.value) || 0) })}
                            className="w-full px-3.5 py-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-lg md:text-xl font-bold font-mono text-[var(--theme-text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 tabular-nums min-h-[44px]"
                            aria-label="Quantity"
                            placeholder="0"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider pl-0.5">{t('warehouse.condition')}</label>
                        <div className="relative">
                            <select
                                value={variant.condition || 'Good'}
                                onChange={(e) => onUpdateVariant({ condition: e.target.value })}
                                className="w-full px-3.5 py-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs md:text-sm font-semibold uppercase tracking-wider text-[var(--theme-text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[44px] cursor-pointer appearance-none pr-9"
                                aria-label="Condition"
                            >
                                <option value="Good">{t('warehouse.conditionGood')}</option>
                                <option value="Damaged">{t('warehouse.conditionDamaged')}</option>
                                <option value="Expired">{t('warehouse.conditionExpired')}</option>
                                <option value="Missing Parts">{t('warehouse.conditionMissing')}</option>
                            </select>
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--theme-text-secondary)]">
                                <ChevronRight className="rotate-90" size={16} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Batch & Expiry */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 w-full">
                    {/* Expiry Date */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider pl-0.5">{t('warehouse.expiryDate')}</label>
                            {variant.expiryDate && (
                                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${expiryStatus.badgeColor}`}>
                                    {expiryStatus.label}
                                </span>
                            )}
                        </div>
                        <input
                            type="date"
                            value={variant.expiryDate || ''}
                            onChange={(e) => onUpdateVariant({ expiryDate: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs md:text-sm font-mono text-[var(--theme-text-primary)] min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            aria-label="Expiry Date"
                        />
                    </div>

                    {/* Batch / Lot Number */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider pl-0.5 flex items-center gap-1.5">
                                <Layers size={13} className="text-[var(--theme-text-secondary)]" /> Batch / Lot No
                            </label>
                            <button
                                type="button"
                                onClick={handleAutoGenerateLot}
                                className="text-[11px] font-semibold text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] flex items-center gap-1 uppercase tracking-wider transition-colors"
                                title="Reset to standard date-received lot format"
                            >
                                <Sparkles size={11} /> Auto-Generate
                            </button>
                        </div>
                        <input
                            type="text"
                            value={variant.batchNumber || ''}
                            onChange={(e) => onUpdateVariant({ batchNumber: e.target.value })}
                            placeholder="e.g. LOT-20261003-KEGR001-01"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs md:text-sm font-mono tracking-wide text-[var(--theme-text-primary)] min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            aria-label="Batch Number"
                        />
                        <p className="text-[11px] text-[var(--theme-text-secondary)] pl-0.5 font-mono">
                            Format: LOT-YYYYMMDD-[SKU]-[SEQ] or Supplier Lot
                        </p>
                    </div>
                </div>

                {/* Barcodes Scanning & Chips */}
                <div className="space-y-2 w-full">
                    <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider pl-0.5 flex items-center gap-2">
                        <ScanBarcode size={13} className="text-[var(--theme-text-secondary)]" /> {t('warehouse.barcodes')}
                    </label>

                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={barcodeInput || ''}
                                onFocus={onFocusScan}
                                onChange={(e) => onBarcodeInput(e.target.value)}
                                onKeyDown={(e) => {
                                    scanOnlyHandlers.onKeyDown(e);
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        onAddBarcode();
                                    }
                                }}
                                onPaste={scanOnlyHandlers.onPaste}
                                placeholder={t('warehouse.scanBarcodePlaceholder')}
                                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs md:text-sm font-mono text-[var(--theme-text-primary)] min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                aria-label="New Barcode Input"
                            />
                            <ScanBarcode className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)]" size={16} />
                        </div>
                        <button
                            type="button"
                            onClick={onAddBarcode}
                            className="px-4 py-2.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                            aria-label="Add barcode"
                        >
                            <Plus size={16} />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 min-h-[28px]">
                        {variant.barcode && (
                            <Badge variant="neutral" className="bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-primary)] font-mono text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1.5">
                                <span>{variant.barcode}</span>
                                <span className="opacity-60 text-[11px] uppercase tracking-wider">{t('warehouse.primary')}</span>
                            </Badge>
                        )}
                        {(variant.barcodes || []).map(code => (
                            <span
                                key={code}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[11px] text-[var(--theme-text-primary)] font-mono cursor-default shadow-sm"
                            >
                                {code}
                                <button
                                    type="button"
                                    onClick={() => onRemoveBarcode(code)}
                                    className="opacity-50 hover:opacity-100 hover:text-red-500 transition-opacity ml-0.5"
                                    aria-label="Remove barcode"
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
