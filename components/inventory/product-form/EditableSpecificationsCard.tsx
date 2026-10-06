import React, { useState } from 'react';
import {
    Info, Sparkles, Hash, ScanBarcode, Tag, Package, Box, Layers, Calendar, Building2, TrendingUp, Archive, Wand2, X, Plus
} from 'lucide-react';
import { GROCERY_CATEGORIES, COMMON_UNITS } from '../../../constants';
import { parseBatchNumber } from '../../../utils/batchNumber';
import { SELL_UNITS } from '../../../utils/units';

interface EditableSpecificationsCardProps {
    register: any;
    watch: any;
    setValue: (name: string, value: any) => void;
    onOpenSmartUnitModal: () => void;
    onGenerateSKU?: () => void;
    onGenerateBarcode?: () => void;
    barcodes?: string[];
    onUpdateBarcodes?: (barcodes: string[]) => void;
}

export const EditableSpecificationsCard: React.FC<EditableSpecificationsCardProps> = ({
    register,
    watch,
    setValue,
    onOpenSmartUnitModal,
    onGenerateSKU,
    onGenerateBarcode,
    barcodes = [],
    onUpdateBarcodes
}) => {
    const batchNumber = watch('batchNumber') || '';
    const expiryDate = watch('expiryDate') || '';
    const [newBarcode, setNewBarcode] = useState('');

    // Calculate expiry alert badge if expiry date is present
    let expiryAlert = '';
    let expiryColor = '';
    if (expiryDate) {
        const daysDiff = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
        if (daysDiff < 0) {
            expiryAlert = `Expired ${Math.abs(daysDiff)}d ago`;
            expiryColor = 'text-red-500';
        } else if (daysDiff < 30) {
            expiryAlert = `${daysDiff}d left`;
            expiryColor = 'text-amber-500';
        }
    }

    // Parse batch number if present
    const parsedBatch = batchNumber ? parseBatchNumber(batchNumber) : null;

    const handleAddBarcode = () => {
        const val = newBarcode.trim();
        if (!val || barcodes.includes(val)) return;
        if (onUpdateBarcodes) {
            onUpdateBarcodes([...barcodes, val]);
            setNewBarcode('');
        }
    };

    return (
        <div className="bg-[var(--theme-bg-card)] p-5 rounded-2xl border border-[var(--theme-border)] space-y-4 shadow-sm">
            {/* Header with Smart Unit Spec Modal Trigger */}
            <div className="flex items-center justify-between border-b border-[var(--theme-border)] pb-2">
                <div className="flex items-center gap-2">
                    <Info size={14} className="text-[var(--theme-text-secondary)]" />
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-primary)]">
                        Product Specifications
                    </h3>
                </div>
                <button
                    type="button"
                    onClick={onOpenSmartUnitModal}
                    className="px-2.5 py-1 text-[10px] font-bold uppercase bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-primary)] rounded-lg border border-[var(--theme-border)] flex items-center gap-1 transition-all cursor-pointer active:scale-[0.98]"
                >
                    <Sparkles size={12} className="text-amber-500" />
                    <span>Smart Unit Spec</span>
                </button>
            </div>

            {/* Specifications Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* 1. SKU */}
                <div className="p-3 rounded-xl flex items-start gap-3 border bg-[var(--theme-bg-subtle)] border-[var(--theme-border)]">
                    <Hash size={14} className="mt-1 flex-shrink-0 text-[var(--theme-text-primary)]" />
                    <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                            <label className="text-[9px] text-[var(--theme-text-muted)] font-medium uppercase tracking-wider block">
                                SKU Code *
                            </label>
                            {onGenerateSKU && (
                                <button
                                    type="button"
                                    onClick={onGenerateSKU}
                                    title="Auto-generate sovereign SKU"
                                    className="text-[9px] text-[var(--theme-accent)] hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                                >
                                    <Wand2 size={10} /> Gen
                                </button>
                            )}
                        </div>
                        <input
                            {...register('sku')}
                            placeholder="e.g. KEGR001"
                            className="w-full bg-transparent border-0 p-0 text-xs font-mono font-bold text-[var(--theme-text-primary)] focus:outline-none focus:ring-0 uppercase"
                        />
                    </div>
                </div>

                {/* 2. Barcodes */}
                <div className="p-3 rounded-xl flex items-start gap-3 border bg-[var(--theme-bg-subtle)] border-[var(--theme-border)]">
                    <ScanBarcode size={14} className="mt-1 flex-shrink-0 text-[var(--theme-text-primary)]" />
                    <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                            <label className="text-[9px] text-[var(--theme-text-muted)] font-medium uppercase tracking-wider block">
                                Primary Barcode
                            </label>
                            {onGenerateBarcode && (
                                <button
                                    type="button"
                                    onClick={onGenerateBarcode}
                                    title="Auto-generate internal EAN-13"
                                    className="text-[9px] text-[var(--theme-accent)] hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                                >
                                    <Wand2 size={10} /> EAN-13
                                </button>
                            )}
                        </div>
                        <input
                            {...register('barcode')}
                            placeholder="Scan or enter barcode"
                            className="w-full bg-transparent border-0 p-0 text-xs font-mono font-bold text-[var(--theme-text-primary)] focus:outline-none focus:ring-0"
                        />
                    </div>
                </div>

                {/* 3. Category */}
                <div className="p-3 rounded-xl flex items-start gap-3 border bg-[var(--theme-bg-subtle)] border-[var(--theme-border)]">
                    <Tag size={14} className="mt-1 flex-shrink-0 text-[var(--theme-text-primary)]" />
                    <div className="space-y-1 min-w-0 flex-1">
                        <label className="text-[9px] text-[var(--theme-text-muted)] font-medium uppercase tracking-wider block">
                            Category *
                        </label>
                        <select
                            {...register('category')}
                            className="w-full bg-transparent border-0 p-0 text-xs font-semibold text-[var(--theme-text-primary)] focus:outline-none focus:ring-0 cursor-pointer"
                        >
                            <option value="" className="bg-[var(--theme-bg-card)]">Select category...</option>
                            {Object.entries(GROCERY_CATEGORIES).map(([group, items]) => (
                                <optgroup key={group} label={group} className="bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]">
                                    {items.map(c => (
                                        <option key={c} value={c} className="bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]">
                                            {c}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 4. Sell Unit */}
                <div className="p-3 rounded-xl flex items-start gap-3 border bg-[var(--theme-bg-subtle)] border-[var(--theme-border)]">
                    <Package size={14} className="mt-1 flex-shrink-0 text-[var(--theme-text-primary)]" />
                    <div className="space-y-1 min-w-0 flex-1">
                        <label className="text-[9px] text-[var(--theme-text-muted)] font-medium uppercase tracking-wider block">
                            Sell Unit
                        </label>
                        <select
                            {...register('unit')}
                            className="w-full bg-transparent border-0 p-0 text-xs font-semibold text-[var(--theme-text-primary)] focus:outline-none focus:ring-0 cursor-pointer uppercase"
                        >
                            {SELL_UNITS.map(u => (
                                <option key={u.code} value={u.code} className="bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]">
                                    {u.label} ({u.shortLabel})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 5. Size / Vol */}
                <div className="p-3 rounded-xl flex items-start gap-3 border bg-[var(--theme-bg-subtle)] border-[var(--theme-border)]">
                    <Box size={14} className="mt-1 flex-shrink-0 text-[var(--theme-text-primary)]" />
                    <div className="space-y-1 min-w-0 flex-1">
                        <label className="text-[9px] text-[var(--theme-text-muted)] font-medium uppercase tracking-wider block">
                            Size / Weight
                        </label>
                        <input
                            {...register('size')}
                            placeholder="e.g. 1kg, 500ml"
                            className="w-full bg-transparent border-0 p-0 text-xs font-semibold text-[var(--theme-text-primary)] focus:outline-none focus:ring-0"
                        />
                    </div>
                </div>

                {/* 6. Variant */}
                <div className="p-3 rounded-xl flex items-start gap-3 border bg-[var(--theme-bg-subtle)] border-[var(--theme-border)]">
                    <Tag size={14} className="mt-1 flex-shrink-0 text-[var(--theme-text-primary)]" />
                    <div className="space-y-1 min-w-0 flex-1">
                        <label className="text-[9px] text-[var(--theme-text-muted)] font-medium uppercase tracking-wider block">
                            Variant
                        </label>
                        <input
                            {...register('variant')}
                            placeholder="e.g. Family Size, Original"
                            className="w-full bg-transparent border-0 p-0 text-xs font-semibold text-[var(--theme-text-primary)] focus:outline-none focus:ring-0"
                        />
                    </div>
                </div>

                {/* 7. Batch / Lot No */}
                <div className="p-3 rounded-xl flex items-start gap-3 border bg-[var(--theme-bg-subtle)] border-[var(--theme-border)]">
                    <Layers size={14} className="mt-1 flex-shrink-0 text-[var(--theme-text-primary)]" />
                    <div className="space-y-1 min-w-0 flex-1">
                        <label className="text-[9px] text-[var(--theme-text-muted)] font-medium uppercase tracking-wider block">
                            Batch / Lot No
                        </label>
                        <input
                            {...register('batchNumber')}
                            placeholder="e.g. LOT-2026-001"
                            className="w-full bg-transparent border-0 p-0 text-xs font-mono font-bold text-[var(--theme-text-primary)] focus:outline-none focus:ring-0"
                        />
                        {parsedBatch?.isStandard && parsedBatch.formattedDate && (
                            <span className="text-[9px] text-[var(--theme-text-secondary)] font-semibold block pt-0.5">
                                Rcvd {parsedBatch.formattedDate}
                            </span>
                        )}
                    </div>
                </div>

                {/* 8. Expiry Date */}
                <div className="p-3 rounded-xl flex items-start gap-3 border bg-[var(--theme-bg-subtle)] border-[var(--theme-border)]">
                    <Calendar size={14} className={`mt-1 flex-shrink-0 ${expiryColor || 'text-[var(--theme-text-primary)]'}`} />
                    <div className="space-y-1 min-w-0 flex-1">
                        <label className="text-[9px] text-[var(--theme-text-muted)] font-medium uppercase tracking-wider block">
                            Expiry Date
                        </label>
                        <input
                            type="date"
                            {...register('expiryDate')}
                            className="w-full bg-transparent border-0 p-0 text-xs font-semibold text-[var(--theme-text-primary)] focus:outline-none focus:ring-0"
                        />
                        {expiryAlert && (
                            <span className={`text-[9px] font-bold block pt-0.5 ${expiryColor}`}>
                                {expiryAlert}
                            </span>
                        )}
                    </div>
                </div>

                {/* 9. Shelf Position */}
                <div className="p-3 rounded-xl flex items-start gap-3 border bg-[var(--theme-bg-subtle)] border-[var(--theme-border)]">
                    <Layers size={14} className="mt-1 flex-shrink-0 text-[var(--theme-text-primary)]" />
                    <div className="space-y-1 min-w-0 flex-1">
                        <label className="text-[9px] text-[var(--theme-text-muted)] font-medium uppercase tracking-wider block">
                            Shelf Position
                        </label>
                        <select
                            {...register('shelfPosition')}
                            className="w-full bg-transparent border-0 p-0 text-xs font-semibold text-[var(--theme-text-primary)] focus:outline-none focus:ring-0 cursor-pointer"
                        >
                            <option value="" className="bg-[var(--theme-bg-card)]">Unassigned</option>
                            <option value="Eye Level" className="bg-[var(--theme-bg-card)]">Eye Level</option>
                            <option value="Top Shelf" className="bg-[var(--theme-bg-card)]">Top Shelf</option>
                            <option value="Bottom Shelf" className="bg-[var(--theme-bg-card)]">Bottom Shelf</option>
                            <option value="End Cap" className="bg-[var(--theme-bg-card)]">End Cap</option>
                            <option value="Checkout" className="bg-[var(--theme-bg-card)]">Checkout</option>
                            <option value="Back Aisle" className="bg-[var(--theme-bg-card)]">Back Aisle</option>
                            <option value="Secure" className="bg-[var(--theme-bg-card)]">Secure</option>
                        </select>
                    </div>
                </div>

                {/* 10. Storage Location */}
                <div className="p-3 rounded-xl flex items-start gap-3 border bg-[var(--theme-bg-subtle)] border-[var(--theme-border)]">
                    <Building2 size={14} className="mt-1 flex-shrink-0 text-[var(--theme-text-primary)]" />
                    <div className="space-y-1 min-w-0 flex-1">
                        <label className="text-[9px] text-[var(--theme-text-muted)] font-medium uppercase tracking-wider block">
                            Storage Location
                        </label>
                        <input
                            {...register('location')}
                            placeholder="e.g. A-04-12"
                            className="w-full bg-transparent border-0 p-0 text-xs font-mono font-bold text-[var(--theme-text-primary)] focus:outline-none focus:ring-0 uppercase"
                        />
                    </div>
                </div>

                {/* 11. Pack Quantity */}
                <div className="p-3 rounded-xl flex items-start gap-3 border bg-[var(--theme-bg-subtle)] border-[var(--theme-border)]">
                    <Archive size={14} className="mt-1 flex-shrink-0 text-[var(--theme-text-primary)]" />
                    <div className="space-y-1 min-w-0 flex-1">
                        <label className="text-[9px] text-[var(--theme-text-muted)] font-medium uppercase tracking-wider block">
                            Pack Quantity
                        </label>
                        <input
                            type="number"
                            min="1"
                            {...register('packQuantity', { valueAsNumber: true })}
                            placeholder="1"
                            className="w-full bg-transparent border-0 p-0 text-xs font-mono font-bold text-[var(--theme-text-primary)] focus:outline-none focus:ring-0"
                        />
                    </div>
                </div>

                {/* 12. Sales Velocity */}
                <div className="p-3 rounded-xl flex items-start gap-3 border bg-[var(--theme-bg-subtle)] border-[var(--theme-border)]">
                    <TrendingUp size={14} className="mt-1 flex-shrink-0 text-[var(--theme-text-primary)]" />
                    <div className="space-y-1 min-w-0 flex-1">
                        <label className="text-[9px] text-[var(--theme-text-muted)] font-medium uppercase tracking-wider block">
                            Sales Velocity
                        </label>
                        <select
                            {...register('salesVelocity')}
                            className="w-full bg-transparent border-0 p-0 text-xs font-semibold text-[var(--theme-text-primary)] focus:outline-none focus:ring-0 cursor-pointer"
                        >
                            <option value="High" className="bg-[var(--theme-bg-card)]">High</option>
                            <option value="Medium" className="bg-[var(--theme-bg-card)]">Medium</option>
                            <option value="Low" className="bg-[var(--theme-bg-card)]">Low</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Multi-Barcode Aliases Section */}
            {onUpdateBarcodes && (
                <div className="pt-3 border-t border-[var(--theme-border)] space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <ScanBarcode size={12} className="text-[var(--theme-text-secondary)]" />
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">
                                Barcode Aliases & Secondary Codes (Case / Unit Aliases)
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                        {barcodes && barcodes.map((bc, idx) => (
                            <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)]"
                            >
                                <span>{bc}</span>
                                <button
                                    type="button"
                                    onClick={() => onUpdateBarcodes(barcodes.filter((_, i) => i !== idx))}
                                    className="text-[var(--theme-text-muted)] hover:text-red-500 cursor-pointer ml-0.5"
                                >
                                    <X size={10} />
                                </button>
                            </span>
                        ))}
                        <div className="inline-flex items-center gap-1">
                            <input
                                value={newBarcode}
                                onChange={(e) => setNewBarcode(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddBarcode();
                                    }
                                }}
                                placeholder="+ Add Alias"
                                className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] w-28 focus:outline-none focus:border-[var(--theme-primary)]"
                            />
                            {newBarcode.trim() && (
                                <button
                                    type="button"
                                    onClick={handleAddBarcode}
                                    className="p-1 rounded-lg bg-[var(--theme-primary)] text-[var(--theme-primary-text)] hover:opacity-90 cursor-pointer transition-all"
                                >
                                    <Plus size={11} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
