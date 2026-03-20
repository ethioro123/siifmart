import React, { useState } from 'react';
import { Plus, Trash2, Package, X, RefreshCw, AlertTriangle } from 'lucide-react';
import { Product, PendingInventoryChange, User } from '../../../types';
import { formatCompactNumber } from '../../../utils/formatting';
import { CURRENCY_SYMBOL } from '../../../constants';

interface WasteLogProps {
    products: Product[];
    user: User | null;
    addNotification: (type: 'alert' | 'success' | 'info', message: string) => void;
    inventoryRequestsService: any;
}

export const WasteLog: React.FC<WasteLogProps> = ({
    products,
    user,
    addNotification,
    inventoryRequestsService
}) => {
    const [wasteBasket, setWasteBasket] = useState<{
        productId: string;
        quantity: number;
        reason: string;
        notes?: string;
    }[]>([]);
    const [isDisposingWaste, setIsDisposingWaste] = useState(false);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Form */}
            <div className="lg:col-span-1 space-y-4">
                <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-4">
                    <h4 className="font-bold text-white text-sm border-b border-white/10 pb-2">Add Item to Log</h4>

                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Product</label>
                        <select className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-red-500 outline-none" id="wasteProd" aria-label="Select Product">
                            <option value="">Select Product...</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Quantity</label>
                            <input title="Waste Quantity" type="number" min="1" className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-red-500 outline-none" id="wasteQty" placeholder="0" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Reason</label>
                            <select className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-red-500 outline-none" id="wasteReason" aria-label="Select Reason">
                                <option>Expired</option>
                                <option>Damaged</option>
                                <option>Spoiled</option>
                                <option>Theft</option>
                                <option>Other</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Notes / Evidence</label>
                        <textarea className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-red-500 outline-none h-20" id="wasteNotes" placeholder="Describe damage..." />
                    </div>

                    <button
                        onClick={() => {
                            const prodSelect = document.getElementById('wasteProd') as HTMLSelectElement;
                            const qtyInput = document.getElementById('wasteQty') as HTMLInputElement;
                            const reasonSelect = document.getElementById('wasteReason') as HTMLSelectElement;
                            const notesInput = document.getElementById('wasteNotes') as HTMLTextAreaElement;

                            if (!prodSelect.value || !qtyInput.value) {
                                addNotification('alert', 'Please select product and quantity');
                                return;
                            }

                            setWasteBasket(prev => [...prev, {
                                productId: prodSelect.value,
                                quantity: parseInt(qtyInput.value),
                                reason: reasonSelect.value,
                                notes: notesInput.value
                            }]);

                            // Reset form
                            prodSelect.value = '';
                            qtyInput.value = '';
                            notesInput.value = '';
                            addNotification('success', 'Item added to waste basket');
                        }}
                        className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus size={18} /> Add to Basket
                    </button>
                </div>
            </div>

            {/* Basket & Summary */}
            <div className="lg:col-span-2 flex flex-col h-full">
                <div className="bg-black/20 rounded-xl border border-white/5 flex-1 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center">
                        <h4 className="font-bold text-white text-sm">Waste Basket ({wasteBasket.length})</h4>
                        {wasteBasket.length > 0 && (
                            <button onClick={() => setWasteBasket([])} className="text-xs text-red-400 hover:text-red-300">Clear All</button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {wasteBasket.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                                <Trash2 size={48} className="mb-2" />
                                <p>Basket is empty</p>
                            </div>
                        ) : (
                            wasteBasket.map((item, idx) => {
                                const product = products.find(p => p.id === item.productId);
                                const cost = (product?.price || 0) * item.quantity;
                                return (
                                    <div key={idx} className="bg-white/5 p-3 rounded-lg flex justify-between items-center group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded bg-black flex items-center justify-center overflow-hidden">
                                                {product?.image && !product.image.includes('placeholder.com') ? (
                                                    <img
                                                        src={product.image}
                                                        alt={product?.name || 'Product'}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                            (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package text-gray-600"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                                        }}
                                                    />
                                                ) : (
                                                    <Package size={16} className="text-gray-600" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-sm">{product?.name}</p>
                                                <p className="text-xs text-gray-400">{item.reason} • {item.quantity} units</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className="font-mono text-white text-sm">{formatCompactNumber(cost, { currency: CURRENCY_SYMBOL })}</p>
                                            <button
                                                onClick={() => setWasteBasket(prev => prev.filter((_, i) => i !== idx))}
                                                className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                aria-label="Remove Item"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="p-4 bg-white/5 border-t border-white/10">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-400">Total Value Loss</span>
                            <span className="text-xl font-bold text-white">
                                {formatCompactNumber(wasteBasket.reduce((sum, item) => {
                                    const product = products.find(p => p.id === item.productId);
                                    return sum + ((product?.price || 0) * item.quantity);
                                }, 0), { currency: CURRENCY_SYMBOL })}
                            </span>
                        </div>
                        <button
                            disabled={isDisposingWaste || wasteBasket.length === 0}
                            onClick={async () => {
                                if (wasteBasket.length === 0) return;

                                const totalValue = wasteBasket.reduce((sum, item) => {
                                    const product = products.find(p => p.id === item.productId);
                                    return sum + ((product?.price || 0) * item.quantity);
                                }, 0);

                                if (totalValue > 100) {
                                    if (!confirm(`High value waste(${CURRENCY_SYMBOL}${totalValue.toFixed(2)}).Are you sure ? This will be flagged for review.`)) return;
                                } else {
                                    if (!confirm('Confirm disposal of these items?')) return;
                                }

                                setIsDisposingWaste(true);
                                try {
                                    for (const item of wasteBasket) {
                                        const product = products.find(p => p.id === item.productId);
                                        const request: Omit<PendingInventoryChange, 'id'> = {
                                            productId: item.productId,
                                            productName: product?.name || 'Unknown',
                                            productSku: product?.sku || 'Unknown',
                                            siteId: product?.siteId || user?.siteId || '',
                                            changeType: 'stock_adjustment',
                                            requestedBy: user?.name || 'WMS',
                                            requestedAt: new Date().toISOString(),
                                            status: 'pending',
                                            adjustmentType: 'OUT',
                                            adjustmentQty: item.quantity,
                                            adjustmentReason: `Waste: ${item.reason}${item.notes ? ` (${item.notes})` : ''}`
                                        };
                                        await inventoryRequestsService.create(request);
                                    }

                                    setWasteBasket([]);
                                    addNotification('success', 'Waste adjustment requests submitted for approval');
                                } catch (e) {
                                    console.error('Failed to submit waste disposal:', e);
                                    addNotification('alert', 'Failed to submit waste disposal requests');
                                } finally {
                                    setIsDisposingWaste(false);
                                }
                            }}
                            className={`w-full py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${isDisposingWaste || wasteBasket.length === 0
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
                                }`}
                        >
                            {isDisposingWaste ? (
                                <>
                                    <RefreshCw size={18} className="animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <AlertTriangle size={18} />
                                    Confirm Disposal
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
