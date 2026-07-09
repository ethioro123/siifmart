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
        <div className="relative overflow-hidden rounded-xl p-[1px] group mt-6 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-[#2C5E3B]/10 via-transparent to-amber-500/5 opacity-30"></div>
            <div className="relative bg-white dark:bg-black/40 backdrop-blur-xl rounded-xl overflow-x-auto border border-[#E2DCCE] dark:border-emerald-950/20 shadow-xl dark:shadow-2xl">
                <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                        <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-[#E2DCCE]/50 dark:border-emerald-950/20 text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-black">
                            <th className="p-4 pl-6">Product Details</th>
                            <th className="p-4 text-right w-24">Qty</th>
                            <th className="p-4 text-right w-32">Unit Cost</th>
                            <th className="p-4 text-right w-32">Total</th>
                            <th className="p-4 text-right pr-6 w-32">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2DCCE]/40 dark:divide-emerald-950/20">
                        {items.map((item, i) => (
                            <tr key={i} className="hover:bg-[#2C5E3B]/5 dark:hover:bg-[#A9CBA2]/5 transition-all group/row">
                                <td className="p-4 pl-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-black/40 flex items-center justify-center border border-gray-200 dark:border-white/5 group-hover/row:border-[#2C5E3B]/30 dark:group-hover/row:border-[#A9CBA2]/30 group-hover/row:shadow-sm dark:group-hover/row:shadow-[0_0_10px_rgba(44,94,59,0.05)] transition-all">
                                            <Package size={16} className="text-gray-400 dark:text-gray-500 group-hover/row:text-[#2C5E3B] dark:group-hover/row:text-[#A9CBA2] transition-colors" />
                                        </div>
                                        <div>
                                            <div className="text-gray-900 dark:text-white text-sm font-black tracking-tight group-hover/row:text-[#2C5E3B] dark:group-hover/row:text-[#A9CBA2] transition-colors">
                                                {formatPOItemDescription(item)}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-500 font-mono mt-0.5 flex items-center gap-2">
                                                <span className="bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded text-[10px] border border-gray-200 dark:border-white/5 font-bold">{item.sku}</span>
                                                {item.identityType === 'new' && (
                                                    <span className="text-[9px] px-2 py-0.5 border border-[#2C5E3B]/30 rounded-md bg-[#2C5E3B]/10 text-[#2C5E3B] dark:border-[#A9CBA2]/30 dark:bg-[#A9CBA2]/10 dark:text-[#A9CBA2] font-extrabold tracking-widest shadow-sm">
                                                        NEW
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
                                                className="w-20 bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 text-stone-900 dark:text-white rounded-lg px-3 py-1.5 text-right text-xs outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-2 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 transition-all font-black font-mono"
                                                autoFocus
                                                value={editValues.qty}
                                                onChange={e => setEditValues({ ...editValues, qty: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    ) : <span className="text-gray-900 dark:text-white font-black bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-md border border-gray-200 dark:border-white/5">{item.quantity}</span>}
                                </td>
                                <td className="p-4 text-right font-mono">
                                    {editingIndex === i && editValues ? (
                                        <div className="relative group/edit">
                                            <input
                                                type="number"
                                                aria-label="Edit Price"
                                                className="w-24 bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 text-stone-900 dark:text-white rounded-lg px-3 py-1.5 text-right text-xs outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-2 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 transition-all font-black font-mono"
                                                value={editValues.price}
                                                onChange={e => setEditValues({ ...editValues, price: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-gray-500 dark:text-gray-400 group-hover/row:text-gray-900 dark:group-hover/row:text-white transition-colors font-bold">
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
                                                className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 rounded-lg border border-emerald-500/20 transition-all flex items-center gap-1.5 text-xs font-black shadow-sm"
                                                title="Save Changes"
                                            >
                                                <Check size={14} />
                                            </button>
                                            <button
                                                onClick={cancelInlineEdit}
                                                className="p-2 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 rounded-lg border border-red-500/20 transition-all flex items-center gap-1.5 text-xs font-black shadow-sm"
                                                title="Discard Changes"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex justify-end gap-1.5 opacity-0 group-hover/row:opacity-100 transition-all scale-95 group-hover/row:scale-100">
                                            <button onClick={() => onFullEdit(i)} className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg text-gray-400 dark:text-gray-500 hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2] border border-transparent hover:border-gray-300 dark:hover:border-white/10 transition-all shadow-sm" title="Full Redesign"><Edit3 size={14} /></button>
                                            <button onClick={() => startInlineEdit(i)} className="p-2 hover:bg-[#2C5E3B]/10 dark:hover:bg-[#A9CBA2]/10 rounded-lg text-gray-400 dark:text-gray-500 hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2] border border-transparent hover:border-[#2C5E3B]/20 dark:hover:border-[#A9CBA2]/20 transition-all shadow-sm" title="Quick Adjust"><FileText size={14} /></button>
                                            <button onClick={() => onRemoveItem(i)} className="p-2 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 border border-transparent hover:border-red-200 dark:hover:border-red-500/20 transition-all shadow-sm" title="Purge Record"><Trash2 size={14} /></button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-20 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="relative mb-6">
                                            <div className="absolute inset-0 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/20 blur-2xl rounded-full"></div>
                                            <div className="relative w-20 h-20 rounded-2xl bg-white dark:bg-black border border-gray-100 dark:border-white/5 flex items-center justify-center shadow-lg dark:shadow-2xl">
                                                <Package size={32} className="text-gray-300 dark:text-gray-700 animate-pulse" />
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight uppercase">Void Detected</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2 max-w-xs mx-auto font-black italic uppercase tracking-tighter">Initializing sequence. Integrate items from catalog or generate custom entities above.</p>
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
