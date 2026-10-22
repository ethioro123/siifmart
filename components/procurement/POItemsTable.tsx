import React, { useState } from 'react';
import { POItem } from '../../types';
import { formatCompactNumber } from '../../utils/formatting';
import { Package, Trash2, Edit3, FileText, Check, X } from 'lucide-react';
import { formatPOItemDescription, getPOItemPackagingSummary, getPOItemPhysicalSummary, getPOItemCategorySpecsSummary } from './utils';
import { SmartProductAttributeStrip } from '../SmartProductAttributeStrip';

interface POItemsTableProps {
    items: POItem[];
    currencySymbol?: string;
    onUpdateItem: (index: number, updatedItem: POItem) => void;
    onRemoveItem: (index: number) => void;
    onFullEdit: (index: number) => void;
}

export const POItemsTable: React.FC<POItemsTableProps> = ({
    items,
    currencySymbol = 'ETB',
    onUpdateItem,
    onRemoveItem,
    onFullEdit
}) => {
    // Local state for inline editing
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editValues, setEditValues] = useState<{ qty: number; price: number } | null>(null);

    const startInlineEdit = (index: number) => {
        const item = items[index];
        setEditingIndex(index);
        setEditValues({
            qty: item.quantity,
            price: item.unitCost
        });
    };

    const cancelInlineEdit = () => {
        setEditingIndex(null);
        setEditValues(null);
    };

    const saveInlineEdit = () => {
        if (editingIndex === null || !editValues) return;

        const safeQty = Math.max(1, Math.floor(editValues.qty || 1));
        const safePrice = Math.max(0, Math.round(editValues.price || 0));
        const originalItem = items[editingIndex];
        const newTotal = safeQty * safePrice;

        const updatedItem: POItem = {
            ...originalItem,
            quantity: safeQty,
            unitCost: safePrice,
            totalCost: newTotal
        };

        onUpdateItem(editingIndex, updatedItem);
        cancelInlineEdit();
    };

    return (
        <div className="relative overflow-hidden rounded-2xl group mt-6 transition-all duration-300">
            <div className="relative bg-[var(--theme-bg-panel)] rounded-2xl overflow-x-auto border border-[var(--theme-border)] shadow-sm">
                <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                        <tr className="bg-[var(--theme-bg-subtle)] border-b border-[var(--theme-border)] text-[11px] text-[var(--theme-text-secondary)] uppercase tracking-wider font-bold">
                            <th className="p-4 pl-6">Product Details</th>
                            <th className="p-4 text-left w-40">Packaging</th>
                            <th className="p-4 text-right w-28">Sellable Qty</th>
                            <th className="p-4 text-right w-36">Order Cost</th>
                            <th className="p-4 text-right w-32">Total</th>
                            <th className="p-4 text-right pr-6 w-32">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--theme-border-subtle)]">
                        {items.map((item, i) => {
                            const pkg = getPOItemPackagingSummary(item);
                            const phys = getPOItemPhysicalSummary(item);
                            const catSpecs = getPOItemCategorySpecsSummary(item);
                            return (
                                <tr key={i} className="hover:bg-[var(--theme-bg-subtle)] transition-colors group/row">
                                    <td className="p-4 pl-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                                                <Package size={18} />
                                            </div>
                                            <div>
                                                <div className="text-[var(--theme-text-primary)] text-sm font-bold tracking-tight">
                                                    {formatPOItemDescription(item)}
                                                </div>
                                                <div className="text-xs text-[var(--theme-text-secondary)] font-mono mt-0.5 flex items-center gap-2 flex-wrap">
                                                    <span className="bg-[var(--theme-bg-subtle)] px-2 py-0.5 rounded-md text-[11px] border border-[var(--theme-border)] font-bold">{item.sku}</span>
                                                    {item.identityType === 'new' && (
                                                        <span className="text-[11px] px-2 py-0.5 border border-amber-500/30 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold tracking-widest">
                                                            CUSTOM
                                                        </span>
                                                    )}
                                                    {phys.specBadge && (
                                                        <span className="bg-[var(--theme-bg-subtle)] px-2 py-0.5 rounded-md text-[11px] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] font-medium">
                                                            {phys.specBadge}
                                                        </span>
                                                    )}
                                                    {catSpecs.summaryText && (
                                                        <span className="bg-[var(--theme-bg-subtle)] px-2 py-0.5 rounded-md text-[11px] border border-[var(--theme-border)] text-[var(--theme-text-primary)] font-medium">
                                                            {catSpecs.summaryText}
                                                        </span>
                                                    )}
                                                </div>
                                                <SmartProductAttributeStrip
                                                    item={item}
                                                    currencySymbol={currencySymbol}
                                                    maxPills={5}
                                                    showDomainSpecs={true}
                                                    showUnitPrice={false}
                                                    className="mt-1.5"
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-xs font-bold text-[var(--theme-text-primary)]">
                                            {pkg.packBadge || (pkg.hasMultiplier ? pkg.manifestUnitName : 'Single Unit (1 ea)')}
                                        </div>
                                        <div className="text-[10px] text-[var(--theme-text-secondary)] font-medium mt-0.5">
                                            Ordered: {item.quantity} {pkg.hasMultiplier ? pkg.manifestUnitName.toLowerCase() : 'units'}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right font-mono">
                                        {editingIndex === i && editValues ? (
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        step="1"
                                                        aria-label="Edit Order Quantity"
                                                        className="w-20 bg-[var(--theme-bg-subtle)] border border-[var(--theme-accent)] text-[var(--theme-text-primary)] rounded-xl px-2.5 py-1.5 text-right text-xs outline-none font-bold font-mono tabular-nums"
                                                        autoFocus
                                                        value={editValues.qty}
                                                        onChange={e => setEditValues({ ...editValues, qty: Math.max(0, parseInt(e.target.value) || 0) })}
                                                    />
                                                    <span className="text-[10px] text-[var(--theme-text-secondary)] font-semibold">
                                                        {pkg.hasMultiplier ? pkg.manifestUnitName.toLowerCase() : pkg.sellUnitLabel}
                                                    </span>
                                                </div>
                                                {pkg.hasMultiplier && (
                                                    <span className="text-[10px] text-[var(--theme-accent)] font-mono font-semibold">
                                                        = {(Math.max(1, editValues.qty) * pkg.unitsPerOrderUnit).toLocaleString()} {pkg.sellUnitLabel}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="text-[var(--theme-text-primary)] font-bold text-sm tabular-nums">
                                                    {pkg.sellableQty.toLocaleString()} <span className="text-xs text-[var(--theme-text-secondary)] font-medium">{pkg.sellUnitLabel}</span>
                                                </div>
                                                {pkg.hasMultiplier ? (
                                                    <div className="text-[10px] text-[var(--theme-text-secondary)] font-medium">
                                                        ({item.quantity} {pkg.manifestUnitName.toLowerCase()})
                                                    </div>
                                                ) : (
                                                    <div className="text-[9px] text-[var(--theme-text-secondary)] font-medium">
                                                        (1:1 Consumer Each)
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 text-right font-mono">
                                        {editingIndex === i && editValues ? (
                                            <div className="relative group/edit">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    aria-label="Edit Order Unit Cost"
                                                    className="w-24 bg-[var(--theme-bg-subtle)] border border-[var(--theme-accent)] text-[var(--theme-text-primary)] rounded-xl px-3 py-1.5 text-right text-xs outline-none font-bold font-mono tabular-nums"
                                                    value={editValues.price}
                                                    onChange={e => setEditValues({ ...editValues, price: Math.max(0, Math.round(parseFloat(e.target.value) || 0)) })}
                                                />
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="text-[var(--theme-text-primary)] font-semibold tabular-nums">
                                                    {formatCompactNumber(item.unitCost, { currency: currencySymbol })}
                                                    <span className="text-[10px] text-[var(--theme-text-secondary)] font-medium ml-1">
                                                        /{pkg.manifestUnitName.replace(/s$/, '').toLowerCase()}
                                                    </span>
                                                </div>
                                                {pkg.hasMultiplier && (
                                                    <div className="text-[10px] text-[var(--theme-text-secondary)] font-mono">
                                                        ~{formatCompactNumber(pkg.costPerSellableUnit, { currency: currencySymbol })}/{pkg.sellUnitLabel}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 text-right font-mono">
                                        <div className="text-[var(--theme-text-primary)] font-bold tabular-nums">
                                            {formatCompactNumber(editingIndex === i && editValues ? editValues.qty * editValues.price : item.totalCost, { currency: currencySymbol })}
                                        </div>
                                    </td>
                                <td className="p-4 text-right pr-6">
                                    {editingIndex === i ? (
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={saveInlineEdit}
                                                className="p-1.5 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400 rounded-xl border border-emerald-500/20 transition-all cursor-pointer"
                                                title="Save Changes"
                                            >
                                                <Check size={14} />
                                            </button>
                                            <button
                                                onClick={cancelInlineEdit}
                                                className="p-1.5 bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400 rounded-xl border border-red-500/20 transition-all cursor-pointer"
                                                title="Discard Changes"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex justify-end gap-1.5">
                                            <button onClick={() => onFullEdit(i)} className="p-1.5 hover:bg-[var(--theme-bg-subtle)] rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors cursor-pointer" title="Full Edit"><Edit3 size={14} /></button>
                                            <button onClick={() => startInlineEdit(i)} className="p-1.5 hover:bg-[var(--theme-bg-subtle)] rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-accent)] transition-colors cursor-pointer" title="Quick Adjust"><FileText size={14} /></button>
                                            <button onClick={() => onRemoveItem(i)} className="p-1.5 hover:bg-red-500/10 rounded-xl text-[var(--theme-text-secondary)] hover:text-red-500 transition-colors cursor-pointer" title="Remove Item"><Trash2 size={14} /></button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                    {items.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-12 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3 text-emerald-600 dark:text-emerald-400">
                                            <Package size={26} />
                                        </div>
                                        <h3 className="text-sm font-bold text-[var(--theme-text-primary)]">No Products Added Yet</h3>
                                        <p className="text-xs text-[var(--theme-text-secondary)] font-medium mt-1 max-w-sm mx-auto">Select a product from the catalog or generate custom line items above to build this purchase order.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
