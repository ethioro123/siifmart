import React, { useState, useMemo, useEffect } from 'react';
import { Search, ArrowRight, CheckCircle, Printer } from 'lucide-react';
import { formatDateTime, formatCompactNumber } from '../../../utils/formatting';
import { CURRENCY_SYMBOL } from '../../../constants';
import { Product, User } from '../../../types';
import Pagination from '../../shared/Pagination';
import { useCreateInventoryRequestMutation } from '../../../hooks/useInventoryRequestMutations';
import { useData } from '../../../contexts/DataContext';

interface ReturnsProcessProps {
    sales: any[];
    products: Product[];
    user: User | null;
    returnStep: 'Search' | 'Select' | 'Review' | 'Complete';
    setReturnStep: (step: 'Search' | 'Select' | 'Review' | 'Complete') => void;
    foundSale: any | null;
    setFoundSale: (sale: any | null) => void;
    returnItems: any[];
    setReturnItems: (items: any[]) => void;
    processReturn: (saleId: string, returnItems: any[], totalRefund: number, processedBy: string) => void;
    addNotification: (type: 'success' | 'alert' | 'info', message: string, duration?: number) => void;
    inventoryRequestsService?: any;
}

const RETURN_ITEMS_PER_PAGE = 5;

export const ReturnsProcess: React.FC<ReturnsProcessProps> = ({
    sales,
    products,
    user,
    returnStep,
    setReturnStep,
    foundSale,
    setFoundSale,
    returnItems,
    setReturnItems,
    processReturn,
    addNotification,
}) => {
    const { settings } = useData();
    const createRequestMutation = useCreateInventoryRequestMutation();
    const [returnSearch, setReturnSearch] = useState('');
    const [returnItemsPage, setReturnItemsPage] = useState(1);

    // Reset pagination when sale changes
    useEffect(() => {
        setReturnItemsPage(1);
    }, [foundSale]);

    const handleFindOrder = () => {
        const sale = sales.find(s => s.id.toLowerCase().includes(returnSearch.toLowerCase()));
        if (sale) {
            setFoundSale(sale);
            setReturnItems([]);
            setReturnStep('Select');
            addNotification('success', 'Order Found');
        } else {
            addNotification('alert', 'Order Not Found');
        }
    };

    const paginatedFoundSaleItems = useMemo(() => {
        if (!foundSale?.items) return [];
        const start = (returnItemsPage - 1) * RETURN_ITEMS_PER_PAGE;
        return foundSale.items.slice(start, start + RETURN_ITEMS_PER_PAGE);
    }, [foundSale, returnItemsPage]);

    const foundSaleTotalPages = Math.ceil((foundSale?.items?.length || 0) / RETURN_ITEMS_PER_PAGE);

    return (
        <div className="flex-1 flex flex-col">
            {/* Step 1: Search */}
            {returnStep === 'Search' && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-12">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 shadow-xs">
                        <Search className="text-primary" size={36} />
                    </div>
                    <div className="text-center space-y-1.5">
                        <h2 className="text-2xl font-bold text-[var(--theme-text-primary)] tracking-tight">Scan Order Receipt</h2>
                        <p className="text-xs text-[var(--theme-text-secondary)]">Enter the Order ID or invoice number on the receipt</p>
                    </div>
                    <div className="flex gap-2 w-full max-w-md">
                        <input
                            className="flex-1 min-h-[44px] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-4 py-2.5 text-[var(--theme-text-primary)] text-sm focus:border-primary outline-none transition-all touch-manipulation font-mono"
                            placeholder="Order ID (e.g. ORD-12345)"
                            value={returnSearch}
                            onChange={e => setReturnSearch(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleFindOrder();
                            }}
                        />
                        <button
                            onClick={handleFindOrder}
                            className="min-h-[44px] px-6 bg-[var(--theme-primary)] hover:opacity-90 text-[var(--theme-primary-text)] font-bold rounded-xl transition-all shadow-xs touch-manipulation active:scale-[0.99] text-xs uppercase tracking-wider cursor-pointer"
                        >
                            Find
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Select Items */}
            {returnStep === 'Select' && foundSale && (
                <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-5 bg-[var(--theme-bg-subtle)] p-4 rounded-2xl border border-[var(--theme-border)]">
                        <div>
                            <h4 className="font-bold text-[var(--theme-text-primary)] text-base font-mono">Order #{foundSale.id}</h4>
                            <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">{formatDateTime(foundSale.date)} • {foundSale.customer_id || foundSale.customerName || 'Walk-in Customer'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold">Total Paid</p>
                            <p className="font-bold text-primary text-lg font-mono tabular-nums">{formatCompactNumber(foundSale.total, { currency: CURRENCY_SYMBOL })}</p>
                        </div>
                    </div>

                    <h4 className="font-bold text-[var(--theme-text-primary)] mb-3 text-sm">Select Items to Return</h4>
                    <div className="flex-1 overflow-y-auto space-y-3 mb-5 pr-1 custom-scrollbar">
                        {paginatedFoundSaleItems.map((item: any, idx: number) => {
                            const isSelected = returnItems.some(ri => ri.productId === item.id);
                            const returnItem = returnItems.find(ri => ri.productId === item.id);

                            return (
                                <div key={idx} className={`p-4 rounded-2xl border transition-all ${isSelected ? 'bg-primary/5 border-primary/40' : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)]'} `}>
                                    <div className="flex items-start gap-4">
                                        <input
                                            type="checkbox"
                                            aria-label="Select Item"
                                            className="mt-1 w-5 h-5 accent-primary cursor-pointer touch-manipulation"
                                            checked={isSelected}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setReturnItems([...returnItems, {
                                                        productId: item.id,
                                                        quantity: 1,
                                                        reason: 'Defective',
                                                        condition: 'Damaged',
                                                        action: 'Discard'
                                                    }]);
                                                } else {
                                                    setReturnItems(returnItems.filter(ri => ri.productId !== item.id));
                                                }
                                            }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-bold text-[var(--theme-text-primary)] text-sm truncate">{item.name}</span>
                                                <span className="text-xs text-[var(--theme-text-secondary)] font-mono tabular-nums shrink-0 ml-2">Purchased: {item.quantity}</span>
                                            </div>

                                            {isSelected && returnItem && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3 bg-[var(--theme-bg-card)] p-3 rounded-xl border border-[var(--theme-border)]">
                                                    <div>
                                                        <label className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold block mb-1">Return Qty</label>
                                                        <input
                                                            type="number"
                                                            aria-label="Return Quantity"
                                                            min="1"
                                                            max={item.quantity}
                                                            className="w-full min-h-[44px] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl p-2.5 text-[var(--theme-text-primary)] text-sm font-mono font-bold focus:border-primary outline-none touch-manipulation tabular-nums"
                                                            value={returnItem.quantity}
                                                            onChange={(e) => {
                                                                const qty = Math.min(Math.max(1, parseInt(e.target.value) || 1), item.quantity);
                                                                setReturnItems(returnItems.map(ri => ri.productId === item.id ? { ...ri, quantity: qty } : ri));
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold block mb-1">Reason</label>
                                                        <select
                                                            aria-label="Return Reason"
                                                            className="w-full min-h-[44px] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl p-2.5 text-[var(--theme-text-primary)] text-sm focus:border-primary outline-none touch-manipulation"
                                                            value={returnItem.reason}
                                                            onChange={(e) => setReturnItems(returnItems.map(ri => ri.productId === item.id ? { ...ri, reason: e.target.value } : ri))}
                                                        >
                                                            <option>Defective</option>
                                                            <option>Wrong Item</option>
                                                            <option>Changed Mind</option>
                                                            <option>Expired</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold block mb-1">Condition</label>
                                                        <select
                                                            aria-label="Return Condition"
                                                            className="w-full min-h-[44px] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl p-2.5 text-[var(--theme-text-primary)] text-sm focus:border-primary outline-none touch-manipulation"
                                                            value={returnItem.condition}
                                                            onChange={(e) => setReturnItems(returnItems.map(ri => ri.productId === item.id ? { ...ri, condition: e.target.value } : ri))}
                                                        >
                                                            <option>New / Sealed</option>
                                                            <option>Open Box</option>
                                                            <option>Damaged</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold block mb-1">Action</label>
                                                        <select
                                                            aria-label="Return Action"
                                                            className="w-full min-h-[44px] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl p-2.5 text-[var(--theme-text-primary)] text-sm focus:border-primary outline-none touch-manipulation"
                                                            value={returnItem.action}
                                                            onChange={(e) => setReturnItems(returnItems.map(ri => ri.productId === item.id ? { ...ri, action: e.target.value } : ri))}
                                                        >
                                                            <option value="Restock">Restock</option>
                                                            <option value="Discard">Discard</option>
                                                            <option value="Quarantine">Quarantine</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {foundSale.items.length > 0 && (
                        <Pagination
                            currentPage={returnItemsPage}
                            totalPages={foundSaleTotalPages}
                            totalItems={foundSale.items.length}
                            itemsPerPage={RETURN_ITEMS_PER_PAGE}
                            onPageChange={setReturnItemsPage}
                            isLoading={false}
                            itemName="items"
                        />
                    )}

                    <div className="flex justify-between pt-5 border-t border-[var(--theme-border)]">
                        <button
                            onClick={() => {
                                setFoundSale(null);
                                setReturnStep('Search');
                                setReturnItems([]);
                            }}
                            className="min-h-[44px] px-6 py-2.5 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] font-semibold text-xs uppercase tracking-wider touch-manipulation transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={returnItems.length === 0}
                            onClick={() => setReturnStep('Review')}
                            className={`min-h-[44px] px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 text-xs uppercase tracking-wider transition-all touch-manipulation cursor-pointer ${returnItems.length > 0 ? 'bg-[var(--theme-primary)] hover:opacity-90 text-[var(--theme-primary-text)] shadow-xs active:scale-[0.99]' : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] opacity-50 cursor-not-allowed border border-[var(--theme-border)]'}`}
                        >
                            Review Return <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Review & Refund */}
            {returnStep === 'Review' && foundSale && (
                <div className="flex-1 flex flex-col">
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-4">
                            <h4 className="font-bold text-[var(--theme-text-primary)] text-sm mb-1">Return Summary</h4>
                            <div className="bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)] overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-[var(--theme-bg-card)] text-xs text-[var(--theme-text-secondary)] uppercase font-semibold border-b border-[var(--theme-border)]">
                                        <tr>
                                            <th className="p-3.5">Product</th>
                                            <th className="p-3.5">Reason</th>
                                            <th className="p-3.5">Action</th>
                                            <th className="p-3.5 text-right">Refund</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--theme-border)] text-sm">
                                        {returnItems.map((ri, idx) => {
                                            const originalItem = foundSale.items.find((i: any) => i.id === ri.productId);
                                            const refundAmount = (originalItem?.price || 0) * ri.quantity;
                                            return (
                                                <tr key={idx}>
                                                    <td className="p-3.5">
                                                        <div className="font-bold text-[var(--theme-text-primary)]">{originalItem?.name}</div>
                                                        <div className="text-[11px] text-[var(--theme-text-secondary)] font-mono">Qty: {ri.quantity}</div>
                                                    </td>
                                                    <td className="p-3.5 text-[var(--theme-text-secondary)] text-xs">{ri.reason}</td>
                                                    <td className="p-3.5">
                                                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${ri.action === 'Restock' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : ri.action === 'Discard' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'}`}>
                                                            {ri.action}
                                                        </span>
                                                    </td>
                                                    <td className="p-3.5 text-right font-mono font-bold text-[var(--theme-text-primary)] tabular-nums">
                                                        {formatCompactNumber(refundAmount, { currency: CURRENCY_SYMBOL })}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="lg:col-span-1">
                            <div className="bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)] p-5 space-y-4">
                                <h4 className="font-bold text-[var(--theme-text-primary)] text-sm border-b border-[var(--theme-border)] pb-2.5">Financial Breakdown</h4>

                                {(() => {
                                    const subtotal = returnItems.reduce((sum, ri) => {
                                        const item = foundSale.items.find((i: any) => i.id === ri.productId);
                                        return sum + ((item?.price || 0) * ri.quantity);
                                    }, 0);
                                    // Multi-country invariant: tax only applied if enabled in Settings
                                    const hasTax = settings?.taxOnSelling === true;
                                    const taxRate = hasTax ? (settings?.taxRate || 0.1) : 0;
                                    const tax = subtotal * taxRate;
                                    const total = subtotal + tax;

                                    return (
                                        <div className="space-y-2.5 text-sm">
                                            <div className="flex justify-between text-[var(--theme-text-secondary)]">
                                                <span>Subtotal</span>
                                                <span className="font-mono tabular-nums">{formatCompactNumber(subtotal, { currency: CURRENCY_SYMBOL })}</span>
                                            </div>
                                            {hasTax && (
                                                <div className="flex justify-between text-[var(--theme-text-secondary)]">
                                                    <span>Tax ({Math.round(taxRate * 100)}%)</span>
                                                    <span className="font-mono tabular-nums">{formatCompactNumber(tax, { currency: CURRENCY_SYMBOL })}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-[var(--theme-text-primary)] font-bold text-base pt-3 border-t border-[var(--theme-border)]">
                                                <span>Total Refund</span>
                                                <span className="text-primary font-mono tabular-nums">{formatCompactNumber(total, { currency: CURRENCY_SYMBOL })}</span>
                                            </div>
                                        </div>
                                    );
                                })()}

                                <div className="pt-3 space-y-2.5">
                                    <button
                                        onClick={async () => {
                                            if (!confirm('Process this return? This action cannot be undone.')) return;

                                            const subtotal = returnItems.reduce((sum, ri) => {
                                                const item = foundSale.items.find((i: any) => i.id === ri.productId);
                                                return sum + ((item?.price || 0) * ri.quantity);
                                            }, 0);
                                            const hasTax = settings?.taxOnSelling === true;
                                            const taxRate = hasTax ? (settings?.taxRate || 0.1) : 0;
                                            const totalRefund = subtotal * (1 + taxRate);

                                            processReturn(foundSale.id, returnItems, totalRefund, user?.name || 'WMS');

                                            // Stock Adjustments - CREATE REQUESTS
                                            for (const item of returnItems) {
                                                if (item.action === 'Restock') {
                                                    const product = products.find(p => p.id === item.productId);
                                                    const request: any = {
                                                        productId: item.productId,
                                                        productName: product?.name || 'Unknown',
                                                        productSku: product?.sku || 'Unknown',
                                                        siteId: product?.siteId || user?.siteId || '',
                                                        changeType: 'stock_adjustment',
                                                        requestedBy: user?.name || 'WMS',
                                                        requestedAt: new Date().toISOString(),
                                                        status: 'pending',
                                                        adjustmentType: 'IN',
                                                        adjustmentQty: item.quantity,
                                                        adjustmentReason: `RMA Restock: ${foundSale.id}`
                                                    };
                                                    await createRequestMutation.mutateAsync(request);
                                                }
                                            }

                                            setReturnStep('Complete');
                                            addNotification('success', 'Return processed successfully');
                                        }}
                                        className="w-full min-h-[44px] py-3 bg-[var(--theme-primary)] hover:opacity-90 text-[var(--theme-primary-text)] font-bold rounded-xl transition-all shadow-xs touch-manipulation active:scale-[0.99] text-xs uppercase tracking-wider cursor-pointer"
                                    >
                                        Process Refund
                                    </button>
                                    <button
                                        onClick={() => setReturnStep('Select')}
                                        className="w-full min-h-[44px] py-2 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] font-semibold text-xs uppercase tracking-wider transition-colors touch-manipulation cursor-pointer"
                                    >
                                        Back to Selection
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 4: Complete */}
            {returnStep === 'Complete' && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-12">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 shadow-xs">
                        <CheckCircle className="text-emerald-500" size={36} />
                    </div>
                    <div className="text-center space-y-1.5">
                        <h2 className="text-2xl font-bold text-[var(--theme-text-primary)] tracking-tight">Return Processed Successfully</h2>
                        <p className="text-xs text-[var(--theme-text-secondary)] font-mono">RMA-{Date.now().toString().slice(-6)} Generated</p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                window.print();
                                addNotification('info', 'Printing Receipt...');
                            }}
                            className="min-h-[44px] px-6 py-2.5 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] font-semibold rounded-xl border border-[var(--theme-border)] flex items-center gap-2 text-xs uppercase tracking-wider transition-all touch-manipulation shadow-xs cursor-pointer"
                        >
                            <Printer size={16} /> Print Receipt
                        </button>
                        <button
                            onClick={() => {
                                setFoundSale(null);
                                setReturnItems([]);
                                setReturnSearch('');
                                setReturnStep('Search');
                            }}
                            className="min-h-[44px] px-6 py-2.5 bg-[var(--theme-primary)] hover:opacity-90 text-[var(--theme-primary-text)] font-bold rounded-xl shadow-xs text-xs uppercase tracking-wider transition-all touch-manipulation active:scale-[0.99] cursor-pointer"
                        >
                            New Return
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
