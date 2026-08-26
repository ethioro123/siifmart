import React, { useState } from 'react';
import { POItem } from '../../types';
import { CURRENCY_SYMBOL } from '../../constants';
import { formatCompactNumber } from '../../utils/formatting';
import { Package, Trash2, Edit3, FileText, Check, X } from 'lucide-react';
import { formatPOItemDescription } from './utils';

interface POItemsTableProps {
    items: POItem[];
    onUpdateItem: (index: number, updatedItem: POItem) => void;
    onRemoveItem: (index: number) => void;
    onFullEdit: (index: number) => void;
}

export const POItemsTable: React.FC<POItemsTableProps> = ({
    items,
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

        const originalItem = items[editingIndex];
        const newTotal = Math.round(editValues.qty * editValues.price * 100) / 100;

        const updatedItem: POItem = {
            ...originalItem,
            quantity: editValues.qty,
            unitCost: editValues.price,
            totalCost: newTotal
        };

        onUpdateItem(editingIndex, updatedItem);
        cancelInlineEdit();
    };

    return (
        <div className="relative overflow-hidden rounded-2xl p-[1px] group mt-6 transition-all duration-300">
            <div className="relative bg-white/85 dark:bg-[#18201B]/60 backdrop-blur-xl rounded-2xl overflow-x-auto border border-[#E2DCCE] dark:border-emerald-950/20 shadow-sm">
                <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                        <tr className="bg-[#FAF8F5] dark:bg-black/30 border-b border-[#E2DCCE]/60 dark:border-white/5 text-[10px] text-stone-500 dark:text-gray-400 uppercase tracking-widest font-black">
                            <th className="p-4 pl-6">Product Details</th>
                            <th className="p-4 text-right w-24">Qty</th>
                            <th className="p-4 text-right w-32">Unit Cost</th>
                            <th className="p-4 text-right w-32">Total</th>
                            <th className="p-4 text-right pr-6 w-32">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2DCCE]/40 dark:divide-white/5">
                        {items.map((item, i) => (
                            <tr key={i} className="hover:bg-[#FAF8F5] dark:hover:bg-white/5 transition-colors group/row">
                                <td className="p-4 pl-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#2C5E3B]/20 flex items-center justify-center border border-emerald-200 dark:border-emerald-950/30">
                                            <Package size={18} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                        </div>
                                        <div>
                                            <div className="text-[#1E3F27] dark:text-white text-sm font-black tracking-tight">
                                                {formatPOItemDescription(item)}
                                            </div>
                                            <div className="text-xs text-stone-500 dark:text-stone-400 font-mono mt-0.5 flex items-center gap-2">
                                                <span className="bg-stone-100 dark:bg-black/40 px-2 py-0.5 rounded-md text-[10px] border border-stone-200 dark:border-white/10 font-bold">{item.sku}</span>
                                                {item.identityType === 'new' && (
                                                    <span className="text-[9px] px-2 py-0.5 border border-amber-300 dark:border-amber-900/30 rounded-md bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 font-black tracking-widest">
                                                        CUSTOM
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-right font-mono">
                                    {editingIndex === i && editValues ? (
                                        <div className="relative group/edit">
                                            <input
                                                type="number"
                                                aria-label="Edit Quantity"
                                                className="w-20 bg-white dark:bg-black/40 border border-[#2C5E3B] text-stone-900 dark:text-white rounded-xl px-3 py-1.5 text-right text-xs outline-none font-black font-mono"
                                                autoFocus
                                                value={editValues.qty}
                                                onChange={e => setEditValues({ ...editValues, qty: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-[#1E3F27] dark:text-white font-black bg-[#FAF8F5] dark:bg-white/5 px-2.5 py-1 rounded-lg border border-[#E2DCCE] dark:border-white/5">
                                            {item.quantity}
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 text-right font-mono">
                                    {editingIndex === i && editValues ? (
                                        <div className="relative group/edit">
                                            <input
                                                type="number"
                                                aria-label="Edit Price"
                                                className="w-24 bg-white dark:bg-black/40 border border-[#2C5E3B] text-stone-900 dark:text-white rounded-xl px-3 py-1.5 text-right text-xs outline-none font-black font-mono"
                                                value={editValues.price}
                                                onChange={e => setEditValues({ ...editValues, price: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-stone-600 dark:text-stone-400 font-bold">
                                            {formatCompactNumber(item.unitCost, { currency: CURRENCY_SYMBOL })}
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 text-right font-mono">
                                    <div className="text-[#2C5E3B] dark:text-[#A9CBA2] font-black tabular-nums">
                                        {formatCompactNumber(editingIndex === i && editValues ? editValues.qty * editValues.price : item.totalCost, { currency: CURRENCY_SYMBOL })}
                                    </div>
                                </td>
                                <td className="p-4 text-right pr-6">
                                    {editingIndex === i ? (
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={saveInlineEdit}
                                                className="p-1.5 bg-emerald-50 text-[#2C5E3B] hover:bg-emerald-100 dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] rounded-xl border border-emerald-200 dark:border-emerald-950/30 transition-all cursor-pointer"
                                                title="Save Changes"
                                            >
                                                <Check size={14} />
                                            </button>
                                            <button
                                                onClick={cancelInlineEdit}
                                                className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-900/30 transition-all cursor-pointer"
                                                title="Discard Changes"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex justify-end gap-1.5">
                                            <button onClick={() => onFullEdit(i)} className="p-1.5 hover:bg-stone-100 dark:hover:bg-white/10 rounded-xl text-stone-500 hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2] transition-colors cursor-pointer" title="Full Edit"><Edit3 size={14} /></button>
                                            <button onClick={() => startInlineEdit(i)} className="p-1.5 hover:bg-emerald-50 dark:hover:bg-[#2C5E3B]/20 rounded-xl text-stone-500 hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2] transition-colors cursor-pointer" title="Quick Adjust"><FileText size={14} /></button>
                                            <button onClick={() => onRemoveItem(i)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl text-stone-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer" title="Remove Item"><Trash2 size={14} /></button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-12 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-[#2C5E3B]/20 border border-emerald-200 dark:border-emerald-950/30 flex items-center justify-center mb-3">
                                            <Package size={26} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                        </div>
                                        <h3 className="text-sm font-black text-[#1E3F27] dark:text-[#EAE5D9]">No Products Added Yet</h3>
                                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm mx-auto">Select a product from the catalog or generate custom line items above to build this purchase order.</p>
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
