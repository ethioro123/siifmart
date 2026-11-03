import React from 'react';
import { Trash2, Plus, ScanBarcode, ChevronRight, X, Sparkles, Layers, CheckCircle2, AlertTriangle, Info, Loader2 } from 'lucide-react';
import Badge from '../../shared/Badge';
import { generateBatchNumber, getBatchExpiryStatus } from '../../../utils/batchNumber';
import type { BarcodeFeedback } from './hooks/useReceiveBarcodeCheck';

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
    barcodeFeedback?: BarcodeFeedback | null;
    onUpdateVariant: (updated: Partial<SplitVariant>) => void;
    onRemoveVariant: () => void;
    onBarcodeInput: (val: string) => void;
    onAddBarcode: () => void;
    onRemoveBarcode: (code: string) => void;
    onDismissFeedback?: () => void;
    onFocusScan: () => void;
    scanOnlyHandlers: {
        onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
        onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
    };
    t: (key: string, params?: Record<string, string | number>) => string;
}

export const ReceiveSplitCard: React.FC<ReceiveSplitCardProps> = ({
    variant,
    index,
    totalSplits,
    barcodeInput,
    barcodeFeedback,
    onUpdateVariant,
    onRemoveVariant,
    onBarcodeInput,
    onAddBarcode,
    onRemoveBarcode,
    onDismissFeedback,
    onFocusScan,
    scanOnlyHandlers,
    t
}) => {

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
                            {t('warehouse.splitNum', { num: index + 1 }) || `Split #${index + 1}`}
                        </span>

                    </div>
                    {totalSplits > 1 && (
                        <button
                            type="button"
                            onClick={onRemoveVariant}
                            className="p-2 text-[var(--theme-text-secondary)] text-[var(--theme-status-danger-text)] bg-[var(--theme-status-danger-bg)] rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                            title={t('warehouse.removeScan')}
                            aria-label={t('warehouse.removeScan') || 'Remove split'}
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>

                {/* Grid: Qty & Condition */}
                <div className="grid grid-cols-2 gap-3 md:gap-4 w-full">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[var(--theme-text-secondary)] pl-0.5">{t('warehouse.quantityToReceive')}</label>
                        <input
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            min="0"
                            value={variant.quantity === 0 ? '' : variant.quantity}
                            onChange={(e) => onUpdateVariant({ quantity: Math.max(0, parseInt(e.target.value) || 0) })}
                            className="w-full px-3.5 py-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-lg md:text-xl font-bold font-mono text-[var(--theme-text-primary)] focus:outline-none focus:ring-2 ring-[var(--theme-status-info-border)] tabular-nums min-h-[44px]"
                            aria-label={t('warehouse.quantityToReceive')}
                            placeholder="0"
                        />
                        <div className="flex items-center gap-1.5 pt-1">
                            <button
                                type="button"
                                onClick={() => onUpdateVariant({ quantity: (variant.quantity || 0) + 1 })}
                                className="flex-1 py-1 px-2 rounded-lg bg-[var(--theme-bg-app)] hover:bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] font-mono text-xs font-bold transition-all active:scale-95 touch-manipulation min-h-[44px]"
                            >
                                +1
                            </button>
                            <button
                                type="button"
                                onClick={() => onUpdateVariant({ quantity: (variant.quantity || 0) + 5 })}
                                className="flex-1 py-1 px-2 rounded-lg bg-[var(--theme-bg-app)] hover:bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] font-mono text-xs font-bold transition-all active:scale-95 touch-manipulation min-h-[44px]"
                            >
                                +5
                            </button>
                            <button
                                type="button"
                                onClick={() => onUpdateVariant({ quantity: (variant.quantity || 0) + 10 })}
                                className="flex-1 py-1 px-2 rounded-lg bg-[var(--theme-bg-app)] hover:bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] font-mono text-xs font-bold transition-all active:scale-95 touch-manipulation min-h-[44px]"
                            >
                                +10
                            </button>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[var(--theme-text-secondary)] pl-0.5">{t('warehouse.condition')}</label>
                        <div className="relative">
                            <select
                                value={variant.condition || 'Good'}
                                onChange={(e) => onUpdateVariant({ condition: e.target.value })}
                                className="w-full px-3.5 py-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs md:text-sm font-semibold uppercase tracking-wider text-[var(--theme-text-primary)] focus:outline-none focus:ring-2 ring-[var(--theme-status-info-border)] min-h-[44px] cursor-pointer appearance-none pr-9"
                                aria-label={t('warehouse.condition')}
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
                            <label className="text-sm font-medium text-[var(--theme-text-secondary)] pl-0.5">{t('warehouse.expiryDate')}</label>
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
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs md:text-sm font-mono text-[var(--theme-text-primary)] min-h-[44px] focus:outline-none focus:ring-2 ring-[var(--theme-status-info-border)]"
                            aria-label={t('warehouse.expiryDate')}
                        />
                    </div>

                    {/* Batch / Lot Number */}
                    <details className="space-y-2 min-w-0">
                        <summary className="min-h-[44px] flex items-center cursor-pointer text-sm font-medium text-[var(--theme-text-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--theme-accent)]">{t('warehouse.receivingLotDetails')}</summary>
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-[var(--theme-text-secondary)] pl-0.5 flex items-center gap-1.5">
                                <Layers size={13} className="text-[var(--theme-text-secondary)]" /> {t('warehouse.batchLotNo') || 'Batch / Lot No'}
                            </label>
                            <button
                                type="button"
                                onClick={handleAutoGenerateLot}
                                className="text-[11px] font-semibold text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] flex items-center gap-1 uppercase tracking-wider transition-colors"
                                title={t('warehouse.autoGenerate') || 'Reset to standard date-received lot format'}
                            >
                                <Sparkles size={11} /> {t('warehouse.autoGenerate') || 'Auto-Generate'}
                            </button>
                        </div>
                        <input
                            type="text"
                            value={variant.batchNumber || ''}
                            onChange={(e) => onUpdateVariant({ batchNumber: e.target.value })}
                            placeholder={t('warehouse.batchLotNo')}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs md:text-sm font-mono tracking-wide text-[var(--theme-text-primary)] min-h-[44px] focus:outline-none focus:ring-2 ring-[var(--theme-status-info-border)]"
                            aria-label={t('warehouse.batchLotNo') || 'Batch Number'}
                        />
                        <p className="text-[11px] text-[var(--theme-text-secondary)] pl-0.5 font-mono">
                            {t('warehouse.receivingLotHint')}
                        </p>
                    </details>
                </div>

                {/* Barcodes Scanning & Chips */}
                <div className="space-y-2 w-full">
                    <label className="text-sm font-medium text-[var(--theme-text-secondary)] pl-0.5 flex items-center gap-2">
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
                                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs md:text-sm font-mono text-[var(--theme-text-primary)] min-h-[44px] focus:outline-none focus:ring-2 ring-[var(--theme-status-info-border)]"
                                aria-label={t('warehouse.scanBarcodePlaceholder')}
                            />
                            <ScanBarcode className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)]" size={16} />
                        </div>
                        <button
                            type="button"
                            onClick={onAddBarcode}
                            className="px-4 py-2.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors cursor-pointer"
                            aria-label={t('warehouse.receivingAddBarcode')}
                        >
                            <Plus size={16} />
                        </button>
                    </div>

                    {/* Barcode Check Status & Database Information Banner */}
                    {barcodeFeedback && (
                        <div
                            className={`flex items-start justify-between gap-2.5 p-3 rounded-xl border text-xs transition-all ${
                                barcodeFeedback.status === 'checking'
                                    ? 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)]'
                                    : barcodeFeedback.status === 'registered_this'
                                    ? 'bg-[var(--theme-status-success-bg)] border-[var(--theme-status-success-border)] text-[var(--theme-status-success-text)]'
                                    : barcodeFeedback.status === 'registered_other'
                                    ? 'bg-[var(--theme-status-warning-bg)] border-[var(--theme-status-warning-border)] text-[var(--theme-status-warning-text)]'
                                    : barcodeFeedback.status === 'available'
                                    ? 'bg-[var(--theme-status-info-bg)] border-[var(--theme-status-info-border)] text-[var(--theme-status-info-text)]'
                                    : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)]'
                            }`}
                            role="status"
                            aria-live="polite"
                        >
                            <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                {barcodeFeedback.status === 'checking' && (
                                    <Loader2 size={16} className="animate-spin shrink-0 mt-0.5 text-[var(--theme-text-muted)]" />
                                )}
                                {(barcodeFeedback.status === 'registered_this' || barcodeFeedback.status === 'available') && (
                                    <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-current" />
                                )}
                                {barcodeFeedback.status === 'registered_other' && (
                                    <AlertTriangle size={16} className="shrink-0 mt-0.5 text-[var(--theme-status-warning)]" />
                                )}
                                {barcodeFeedback.status === 'duplicate' && (
                                    <Info size={16} className="shrink-0 mt-0.5 text-[var(--theme-text-muted)]" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                            barcodeFeedback.status === 'registered_this'
                                                ? 'bg-[var(--theme-status-success)] text-[var(--theme-primary-text)]'
                                                : barcodeFeedback.status === 'registered_other'
                                                ? 'bg-[var(--theme-status-warning)] text-[var(--theme-primary-text)]'
                                                : barcodeFeedback.status === 'available'
                                                ? 'bg-[var(--theme-status-info)] text-[var(--theme-primary-text)]'
                                                : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]'
                                        }`}>
                                            {barcodeFeedback.status === 'checking'
                                                ? (t('warehouse.barcodeStatusChecking') || 'Checking…')
                                                : barcodeFeedback.status === 'registered_this'
                                                ? (t('warehouse.barcodeStatusRegistered') || 'Registered')
                                                : barcodeFeedback.status === 'registered_other'
                                                ? (t('warehouse.barcodeStatusConflict') || 'Conflict')
                                                : barcodeFeedback.status === 'available'
                                                ? (t('warehouse.barcodeStatusOk') || 'OK to Add')
                                                : (t('warehouse.variantLabel') || 'Notice')}
                                        </span>
                                        <span className="font-mono font-bold text-xs">{barcodeFeedback.barcode}</span>
                                    </div>
                                    <p className="mt-1 text-xs leading-relaxed font-medium">
                                        {barcodeFeedback.message}
                                    </p>
                                </div>
                            </div>
                            {onDismissFeedback && (
                                <button
                                    type="button"
                                    onClick={onDismissFeedback}
                                    className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/10 transition-opacity text-current shrink-0 min-h-[28px] min-w-[28px] flex items-center justify-center cursor-pointer"
                                    aria-label={t('warehouse.dismiss') || 'Dismiss'}
                                    title={t('warehouse.dismiss') || 'Dismiss'}
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    )}

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
                                    className="opacity-50 hover:opacity-100 text-[var(--theme-status-danger-text)] transition-opacity ml-0.5"
                                    aria-label={t('warehouse.receivingRemoveBarcode')}
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
