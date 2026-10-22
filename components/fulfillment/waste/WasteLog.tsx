import React, { useState } from 'react';
import { Plus, Trash2, Package, X, RefreshCw, AlertTriangle } from 'lucide-react';
import { Product, PendingInventoryChange, User } from '../../../types';
import { formatCompactNumber } from '../../../utils/formatting';
import { CURRENCY_SYMBOL } from '../../../constants';
import { useCreateInventoryRequestMutation } from '../../../hooks/useInventoryRequestMutations';
import { useData } from '../../../contexts/DataContext';
import { resolveReceivingPolicy } from '../../../utils/receivingPolicy';
import { logger } from '../../../utils/logger';

interface WasteLogProps {
    products: Product[];
    user: User | null;
    addNotification: (type: 'alert' | 'success' | 'info', message: string) => void;
    inventoryRequestsService?: any;
}

export const WasteLog: React.FC<WasteLogProps> = ({
    products,
    user,
    addNotification,
}) => {
    const { settings, effectiveCountry } = useData();
    const isBlindMode = resolveReceivingPolicy(settings, effectiveCountry).blind;
    const isManagerOrHQ = ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'country_operations_director', 'country_supply_chain_director', 'warehouse_manager', 'store_manager', 'inventory_manager'].includes((user?.role || '').toLowerCase());
    const hideSystemStock = isBlindMode && !isManagerOrHQ;

    const createRequestMutation = useCreateInventoryRequestMutation();
    const [wasteBasket, setWasteBasket] = useState<{
        productId: string;
        quantity: number;
        reason: string;
        notes?: string;
    }[]>([]);
    const [isDisposingWaste, setIsDisposingWaste] = useState(false);

    // Controlled Form State
    const [selectedProductId, setSelectedProductId] = useState('');
    const [wasteQuantity, setWasteQuantity] = useState('');
    const [wasteReason, setWasteReason] = useState('Expired');
    const [wasteNotes, setWasteNotes] = useState('');

    const handleAddToBasket = () => {
        if (!selectedProductId || !wasteQuantity) {
            addNotification('alert', 'Please select product and quantity');
            return;
        }

        const qty = parseInt(wasteQuantity, 10);
        if (isNaN(qty) || qty <= 0) {
            addNotification('alert', 'Please enter a valid quantity greater than zero');
            return;
        }

        setWasteBasket(prev => [...prev, {
            productId: selectedProductId,
            quantity: qty,
            reason: wasteReason,
            notes: wasteNotes.trim() || undefined
        }]);

        // Reset form
        setSelectedProductId('');
        setWasteQuantity('');
        setWasteNotes('');
        setWasteReason('Expired');
        addNotification('success', 'Item added to waste basket');
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Form */}
            <div className="lg:col-span-1 space-y-4">
                <div className="bg-[var(--theme-bg-card)] p-5 rounded-2xl border border-[var(--theme-border)] space-y-4 shadow-xs">
                    <h4 className="font-bold text-[var(--theme-text-primary)] text-sm border-b border-[var(--theme-border)] pb-3">
                        Add Item to Log
                    </h4>

                    <div>
                        <label className="text-xs text-[var(--theme-text-secondary)] uppercase font-semibold mb-1.5 block">Product</label>
                        <select
                            value={selectedProductId}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                            className="w-full min-h-[44px] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl p-3 text-[var(--theme-text-primary)] text-sm focus:border-primary outline-none touch-manipulation"
                            aria-label="Select Product"
                        >
                            <option value="">Select Product...</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>
                                    {hideSystemStock ? `${p.name} (${p.sku})` : `${p.name} (Stock: ${p.stock})`}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-[var(--theme-text-secondary)] uppercase font-semibold mb-1.5 block">Quantity</label>
                            <input
                                title="Waste Quantity"
                                type="number"
                                min="1"
                                value={wasteQuantity}
                                onChange={(e) => setWasteQuantity(e.target.value)}
                                className="w-full min-h-[44px] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl p-3 text-[var(--theme-text-primary)] text-sm font-mono font-bold focus:border-primary outline-none touch-manipulation tabular-nums"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-[var(--theme-text-secondary)] uppercase font-semibold mb-1.5 block">Reason</label>
                            <select
                                value={wasteReason}
                                onChange={(e) => setWasteReason(e.target.value)}
                                className="w-full min-h-[44px] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl p-3 text-[var(--theme-text-primary)] text-sm focus:border-primary outline-none touch-manipulation"
                                aria-label="Select Reason"
                            >
                                <option value="Expired">Expired</option>
                                <option value="Damaged">Damaged</option>
                                <option value="Spoiled">Spoiled</option>
                                <option value="Theft">Theft</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-[var(--theme-text-secondary)] uppercase font-semibold mb-1.5 block">Notes / Evidence</label>
                        <textarea
                            value={wasteNotes}
                            onChange={(e) => setWasteNotes(e.target.value)}
                            className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl p-3 text-[var(--theme-text-primary)] text-sm focus:border-primary outline-none h-24 touch-manipulation"
                            placeholder="Describe damage..."
                        />
                    </div>

                    <button
                        onClick={handleAddToBasket}
                        className="w-full min-h-[44px] py-3 bg-[var(--theme-primary)] hover:opacity-90 text-[var(--theme-primary-text)] font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs touch-manipulation active:scale-[0.99] cursor-pointer"
                    >
                        <Plus size={18} /> Add to Basket
                    </button>
                </div>
            </div>

            {/* Basket & Summary */}
            <div className="lg:col-span-2 flex flex-col h-full">
                <div className="bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] flex-1 flex flex-col overflow-hidden shadow-xs">
                    <div className="p-4 border-b border-[var(--theme-border)] flex justify-between items-center bg-[var(--theme-bg-subtle)]">
                        <h4 className="font-bold text-[var(--theme-text-primary)] text-sm">Waste Basket ({wasteBasket.length})</h4>
                        {wasteBasket.length > 0 && (
                            <button
                                onClick={() => setWasteBasket([])}
                                className="min-h-[36px] px-2.5 text-xs text-red-500 hover:text-red-400 font-semibold touch-manipulation transition-colors"
                            >
                                Clear All
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
                        {wasteBasket.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-[var(--theme-text-secondary)] opacity-50 py-16">
                                <Trash2 size={48} className="mb-2" />
                                <p className="text-xs font-semibold">Basket is empty</p>
                            </div>
                        ) : (
                            wasteBasket.map((item, idx) => {
                                const product = products.find(p => p.id === item.productId);
                                const cost = (product?.price || 0) * item.quantity;
                                return (
                                    <div key={idx} className="bg-[var(--theme-bg-subtle)] p-3.5 rounded-xl border border-[var(--theme-border)] flex justify-between items-center group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center justify-center overflow-hidden shrink-0">
                                                {product?.image && !product.image.includes('placeholder.com') ? (
                                                    <img
                                                        src={product.image}
                                                        alt={product?.name || 'Product'}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                        }}
                                                    />
                                                ) : (
                                                    <Package size={16} className="text-[var(--theme-text-secondary)]" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-[var(--theme-text-primary)] text-sm">{product?.name || 'Unknown'}</p>
                                                <p className="text-[11px] text-[var(--theme-text-secondary)]">{item.reason} • {item.quantity} units</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className="font-mono font-bold text-[var(--theme-text-primary)] text-sm tabular-nums">{formatCompactNumber(cost, { currency: CURRENCY_SYMBOL })}</p>
                                            <button
                                                onClick={() => setWasteBasket(prev => prev.filter((_, i) => i !== idx))}
                                                className="min-h-[36px] min-w-[36px] flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-red-500 rounded-lg transition-colors touch-manipulation"
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

                    <div className="p-4 bg-[var(--theme-bg-subtle)] border-t border-[var(--theme-border)]">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Total Value Loss</span>
                            <span className="text-xl font-bold font-mono text-[var(--theme-text-primary)] tabular-nums">
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
                                    if (!confirm(`High value waste (${CURRENCY_SYMBOL}${totalValue.toFixed(2)}). Are you sure? This will be flagged for review.`)) return;
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
                                            countryCode: (product as any)?.countryCode || (product as any)?.country_code || (user as any)?.country || 'ET',
                                            changeType: 'stock_adjustment',
                                            requestedBy: user?.name || 'WMS',
                                            requestedAt: new Date().toISOString(),
                                            status: 'pending',
                                            adjustmentType: 'OUT',
                                            adjustmentQty: item.quantity,
                                            adjustmentReason: `Waste: ${item.reason}${item.notes ? ` (${item.notes})` : ''}`
                                        };
                                        await createRequestMutation.mutateAsync(request);
                                    }

                                    setWasteBasket([]);
                                    addNotification('success', 'Waste adjustment requests submitted for approval');
                                } catch (e) {
                                    logger.error('WasteLog', 'Failed to submit waste disposal:', e);
                                    addNotification('alert', 'Failed to submit waste disposal requests');
                                } finally {
                                    setIsDisposingWaste(false);
                                }
                            }}
                            className={`w-full min-h-[44px] py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs touch-manipulation ${isDisposingWaste || wasteBasket.length === 0
                                ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] opacity-50 cursor-not-allowed border border-[var(--theme-border)]'
                                : 'bg-red-500 hover:bg-red-600 text-white active:scale-[0.99] cursor-pointer'
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
