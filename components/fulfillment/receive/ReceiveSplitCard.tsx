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
        <div className="group relative glass-panel-pushed hover:border-[#2C5E3B]/40 dark:hover:border-[#A9CBA2]/20 hover:bg-[#FAF8F5]/80 dark:hover:bg-[#1C2620]/40 rounded-xl md:rounded-2xl p-4 md:p-6 transition-colors shadow-sm hover:shadow-md animate-in fade-in duration-200">
            <div className="hidden md:block absolute top-0 left-0 w-1 h-full bg-[#2C5E3B] dark:bg-[#A9CBA2] rounded-l-2xl opacity-10 group-hover:opacity-100 transition-opacity shadow-[2px_0_10px_rgba(44,94,59,0.3)]" />

            <div className="flex flex-col gap-4 md:gap-6">
                {/* Top Row: Split Indicator & Quick Actions */}
                <div className="flex items-center justify-between border-b border-stone-200/50 dark:border-white/5 pb-2.5">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 text-[#2C5E3B] dark:text-[#A9CBA2] font-mono border border-[#2C5E3B]/20">
                            Split #{index + 1}
                        </span>
                        {parsedBatch.isStandard && (
                            <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono flex items-center gap-1">
                                <Calendar size={11} className="text-[#2C5E3B]" />
                                Date Rcvd: {parsedBatch.formattedDate || 'Today'}
                            </span>
                        )}
                    </div>
                    {totalSplits > 1 && (
                        <button
                            type="button"
                            onClick={onRemoveVariant}
                            className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                            title={t('warehouse.removeScan')}
                            aria-label="Remove split"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>

                {/* Grid: Qty & Condition */}
                <div className="grid grid-cols-2 gap-3 md:gap-6 w-full">
                    <div className="space-y-1.5 md:space-y-2">
                        <label className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest pl-1">{t('warehouse.quantityToReceive')}</label>
                        <div className="relative group/input">
                            <input
                                type="number"
                                inputMode="decimal"
                                pattern="[0-9]*"
                                min="0"
                                value={variant.quantity === 0 ? '' : variant.quantity}
                                onChange={(e) => onUpdateVariant({ quantity: Math.max(0, parseInt(e.target.value) || 0) })}
                                className="woody-input text-xl md:text-2xl font-black tabular-nums py-3 md:py-4 placeholder:text-slate-400 dark:placeholder:text-gray-750"
                                aria-label="Quantity"
                                placeholder="0"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5 md:space-y-2">
                        <label className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest pl-1">{t('warehouse.condition')}</label>
                        <div className="relative group/select">
                            <select
                                value={variant.condition || 'Good'}
                                onChange={(e) => onUpdateVariant({ condition: e.target.value })}
                                className="woody-input text-xs md:text-sm font-black uppercase tracking-widest cursor-pointer py-3.5 md:py-4.5 pr-8 appearance-none"
                                aria-label="Condition"
                            >
                                <option value="Good">{t('warehouse.conditionGood')}</option>
                                <option value="Damaged">{t('warehouse.conditionDamaged')}</option>
                                <option value="Expired">{t('warehouse.conditionExpired')}</option>
                                <option value="Missing Parts">{t('warehouse.conditionMissing')}</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <ChevronRight className="rotate-90" size={16} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Batch & Expiry (Date Received Anchored) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 w-full">
                    {/* Expiry Date with Realtime Status Badge */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest pl-1">{t('warehouse.expiryDate')}</label>
                            {variant.expiryDate && (
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${expiryStatus.badgeColor}`}>
                                    {expiryStatus.label}
                                </span>
                            )}
                        </div>
                        <input
                            type="date"
                            value={variant.expiryDate || ''}
                            onChange={(e) => onUpdateVariant({ expiryDate: e.target.value })}
                            className="woody-input py-2 text-sm"
                            aria-label="Expiry Date"
                        />
                    </div>

                    {/* Batch / Lot Number (Editable + Auto-Gen + Visual Clarity) */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                                <Layers size={11} className="text-[#2C5E3B]" /> Batch / Lot No (Date Rcvd)
                            </label>
                            <button
                                type="button"
                                onClick={handleAutoGenerateLot}
                                className="text-[9px] font-black text-[#2C5E3B] dark:text-[#A9CBA2] hover:underline flex items-center gap-1 uppercase tracking-wider"
                                title="Reset to standard date-received lot format"
                            >
                                <Sparkles size={10} /> Auto-Generate
                            </button>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                value={variant.batchNumber || ''}
                                onChange={(e) => onUpdateVariant({ batchNumber: e.target.value })}
                                placeholder="e.g. LOT-20261003-KEGR001-01"
                                className="woody-input py-2 text-xs md:text-sm font-mono tracking-wider"
                                aria-label="Batch Number"
                            />
                        </div>
                        <p className="text-[9px] text-stone-400 dark:text-stone-500 pl-1 font-mono">
                            Format: LOT-YYYYMMDD-[SKU]-[SEQ] or Supplier Lot
                        </p>
                    </div>
                </div>

                {/* Barcodes Scanning & Chips */}
                <div className="space-y-2 w-full">
                    <label className="text-[10px] font-black text-zinc-500 dark:text-gray-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                        <ScanBarcode size={12} className="text-zinc-400" /> {t('warehouse.barcodes')}
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
                                className="woody-input !pl-10 font-mono py-2 text-sm"
                                aria-label="New Barcode Input"
                            />
                            <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-gray-600" size={14} />
                        </div>
                        <button
                            type="button"
                            onClick={onAddBarcode}
                            className="woody-btn-secondary px-3 py-2 text-xs rounded-lg flex items-center justify-center"
                            aria-label="Add barcode"
                        >
                            <Plus size={16} />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 min-h-[28px]">
                        {variant.barcode && (
                            <Badge variant="neutral" className="bg-[#FAF8F5]/85 dark:bg-[#1C2620]/30 border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] text-stone-600 dark:text-[#A9CBA2] font-mono text-[10px] pl-2 pr-3 py-1">
                                {variant.barcode} <span className="opacity-50 ml-2 text-[8px] uppercase tracking-wider">{t('warehouse.primary')}</span>
                            </Badge>
                        )}
                        {(variant.barcodes || []).map(code => (
                            <span
                                key={code}
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 text-xs text-[#2C5E3B] dark:text-[#A9CBA2] font-mono group/badge hover:bg-[#2C5E3B]/20 dark:hover:bg-[#A9CBA2]/20 transition-colors cursor-default shadow-sm"
                            >
                                {code}
                                <button
                                    type="button"
                                    onClick={() => onRemoveBarcode(code)}
                                    className="opacity-50 hover:opacity-100 hover:text-white transition-opacity"
                                    aria-label="Remove barcode"
                                >
                                    <X size={10} />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
