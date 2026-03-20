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
        <div className="relative overflow-hidden rounded-xl p-[1px] group mt-6">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-cyber-primary/10 opacity-30"></div>
            <div className="relative bg-black/40 backdrop-blur-xl rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 border-b border-white/5 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                            <th className="p-4 pl-6">Product Details</th>
                            <th className="p-4 text-right w-24">Qty</th>
                            <th className="p-4 text-right w-32">Unit Cost</th>
                            <th className="p-4 text-right w-32">Total</th>
                            <th className="p-4 text-right pr-6 w-32">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {items.map((item, i) => (
                            <tr key={i} className="hover:bg-white/[0.03] transition-all group/row">
                                <td className="p-4 pl-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center border border-white/5 group-hover/row:border-cyber-primary/30 group-hover/row:shadow-[0_0_10px_rgba(0,255,157,0.1)] transition-all">
                                            <Package size={16} className="text-gray-500 group-hover/row:text-cyber-primary transition-colors" />
                                        </div>
                                        <div>
                                            <div className="text-white text-sm font-bold tracking-tight group-hover/row:text-cyber-primary transition-colors">
                                                {formatPOItemDescription(item)}
                                            </div>
                                            <div className="text-xs text-gray-500 font-mono mt-0.5 flex items-center gap-2">
                                                <span className="bg-white/5 px-2 py-0.5 rounded text-[10px] border border-white/5">{item.sku}</span>
                                                {item.identityType === 'new' && (
                                                    <span className="text-[10px] px-1.5 py-0.5 border border-cyber-primary/30 rounded bg-cyber-primary/10 text-cyber-primary font-bold tracking-tighter shadow-[0_0_5px_rgba(0,255,157,0.1)]">
                                                        NEW
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-right font-mono text-gray-300">
                                    {editingIndex === i && editValues ? (
                                        <div className="relative group/edit">
                                            <input
                                                type="number"
                                                aria-label="Edit Quantity"
                                                className="w-20 bg-black/60 border border-cyber-primary/50 text-cyber-primary rounded-lg px-3 py-1.5 text-right text-xs outline-none focus:shadow-[0_0_10px_rgba(0,255,157,0.2)] transition-all"
                                                autoFocus
                                                value={editValues.qty}
                                                onChange={e => setEditValues({ ...editValues, qty: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    ) : <span className="text-white font-medium bg-white/5 px-2 py-1 rounded-md border border-white/5">{item.quantity}</span>}
                                </td>
                                <td className="p-4 text-right font-mono text-gray-300">
                                    {editingIndex === i && editValues ? (
                                        <div className="relative group/edit">
                                            <input
                                                type="number"
                                                aria-label="Edit Price"
                                                className="w-24 bg-black/60 border border-cyber-primary/50 text-cyber-primary rounded-lg px-3 py-1.5 text-right text-xs outline-none focus:shadow-[0_0_10px_rgba(0,255,157,0.2)] transition-all"
                                                value={editValues.price}
                                                onChange={e => setEditValues({ ...editValues, price: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 group-hover/row:text-white transition-colors">
                                            {formatCompactNumber(item.unitCost, { currency: CURRENCY_SYMBOL })}
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 text-right font-mono">
                                    <div className="text-cyber-primary font-bold text-shadow-glow">
                                        {formatCompactNumber(editingIndex === i && editValues ? editValues.qty * editValues.price : item.totalCost, { currency: CURRENCY_SYMBOL })}
                                    </div>
                                </td>
                                <td className="p-4 text-right pr-6">
                                    {editingIndex === i ? (
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={saveInlineEdit}
                                                className="p-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg border border-green-500/20 transition-all flex items-center gap-1.5 text-xs font-bold"
                                                title="Save Changes"
                                            >
                                                <Check size={14} />
                                            </button>
                                            <button
                                                onClick={cancelInlineEdit}
                                                className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg border border-red-500/20 transition-all flex items-center gap-1.5 text-xs font-bold"
                                                title="Discard Changes"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex justify-end gap-1.5 opacity-0 group-hover/row:opacity-100 transition-all scale-95 group-hover/row:scale-100">
                                            <button onClick={() => onFullEdit(i)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white border border-transparent hover:border-white/10 transition-all" title="Full Redesign"><Edit3 size={14} /></button>
                                            <button onClick={() => startInlineEdit(i)} className="p-2 hover:bg-blue-500/10 rounded-lg text-gray-400 hover:text-blue-400 border border-transparent hover:border-blue-500/20 transition-all" title="Quick Adjust"><FileText size={14} /></button>
                                            <button onClick={() => onRemoveItem(i)} className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all" title="Purge Record"><Trash2 size={14} /></button>
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
                                            <div className="absolute inset-0 bg-cyber-primary/20 blur-2xl rounded-full"></div>
                                            <div className="relative w-20 h-20 rounded-2xl bg-black border border-white/5 flex items-center justify-center shadow-2xl">
                                                <Package size={32} className="text-gray-700 animate-pulse" />
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-bold text-white tracking-tight">Void Detected</h3>
                                        <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">Initializing your requisition sequence. Integrate items from the neural catalog or generate custom entities above.</p>
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
