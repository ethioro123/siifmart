import React, { useState, useMemo, useEffect } from 'react';
import { Search, ArrowRight, CheckCircle, Printer } from 'lucide-react';
import { formatDateTime, formatCompactNumber } from '../../../utils/formatting';
import { CURRENCY_SYMBOL } from '../../../constants';
import { Product, User } from '../../../types';
import Pagination from '../../shared/Pagination';

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
    inventoryRequestsService: any;
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
    inventoryRequestsService
}) => {
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
                <div className="flex-1 flex flex-col items-center justify-center space-y-8 py-12">
                    <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                        <Search className="text-blue-400" size={40} />
                    </div>
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold text-white">Scan Order Receipt</h2>
                        <p className="text-gray-400">Enter the Order ID or scan the barcode on the receipt</p>
                    </div>
                    <div className="flex gap-2 w-full max-w-md">
                        <input
                            className="flex-1 bg-black/30 border border-white/10 rounded-xl p-4 text-white text-lg focus:border-blue-500 outline-none transition-all"
                            placeholder="Order ID (e.g. ORD-12345)"
                            value={returnSearch}
                            onChange={e => setReturnSearch(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleFindOrder();
                            }}
                        />
                        <button
                            onClick={handleFindOrder}
                            className="px-8 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all"
                        >
                            Find
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Select Items */}
            {returnStep === 'Select' && foundSale && (
                <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-6 bg-white/5 p-4 rounded-xl border border-white/5">
                        <div>
                            <h4 className="font-bold text-white text-lg">Order #{foundSale.id}</h4>
                            <p className="text-sm text-gray-400">{formatDateTime(foundSale.date)} • {foundSale.customer_id || 'Walk-in Customer'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-400">Total Paid</p>
                            <p className="font-bold text-cyber-primary text-xl">{formatCompactNumber(foundSale.total, { currency: CURRENCY_SYMBOL })}</p>
                        </div>
                    </div>

                    <h4 className="font-bold text-white mb-4">Select Items to Return</h4>
                    <div className="flex-1 overflow-y-auto space-y-3 mb-6 pr-2 custom-scrollbar">
                        {paginatedFoundSaleItems.map((item: any, idx: number) => {
                            const isSelected = returnItems.some(ri => ri.productId === item.id);
                            const returnItem = returnItems.find(ri => ri.productId === item.id);

                            return (
                                <div key={idx} className={`p-4 rounded-xl border transition-all ${isSelected ? 'bg-blue-500/10 border-blue-500/50' : 'bg-white/5 border-white/5'} `}>
                                    <div className="flex items-start gap-4">
                                        <input
                                            type="checkbox"
                                            aria-label="Select Item"
                                            className="mt-1 w-5 h-5 accent-blue-500 cursor-pointer"
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
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-bold text-white">{item.name}</span>
                                                <span className="text-sm text-gray-400">Purchased: {item.quantity}</span>
                                            </div>

                                            {isSelected && returnItem && (
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3 bg-black/20 p-3 rounded-lg border border-white/5">
                                                    <div>
                                                        <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Return Qty</label>
                                                        <input
                                                            type="number"
                                                            aria-label="Return Quantity"
                                                            min="1"
                                                            max={item.quantity}
                                                            className="w-full bg-black border border-white/10 rounded p-3 text-white text-sm"
                                                            value={returnItem.quantity}
                                                            onChange={(e) => {
                                                                const qty = Math.min(Math.max(1, parseInt(e.target.value) || 1), item.quantity);
                                                                setReturnItems(returnItems.map(ri => ri.productId === item.id ? { ...ri, quantity: qty } : ri));
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Reason</label>
                                                        <select
                                                            aria-label="Return Reason"
                                                            className="w-full bg-black border border-white/10 rounded p-3 text-white text-sm"
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
                                                        <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Condition</label>
                                                        <select
                                                            aria-label="Return Condition"
                                                            className="w-full bg-black border border-white/10 rounded p-3 text-white text-sm"
                                                            value={returnItem.condition}
                                                            onChange={(e) => setReturnItems(returnItems.map(ri => ri.productId === item.id ? { ...ri, condition: e.target.value } : ri))}
                                                        >
                                                            <option>New / Sealed</option>
                                                            <option>Open Box</option>
                                                            <option>Damaged</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Action</label>
                                                        <select
                                                            aria-label="Return Action"
                                                            className="w-full bg-black border border-white/10 rounded p-3 text-white text-sm"
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

                    <div className="flex justify-between pt-6 border-t border-white/10">
                        <button
                            onClick={() => {
                                setFoundSale(null);
                                setReturnStep('Search');
                                setReturnItems([]);
                            }}
                            className="px-6 py-3 text-gray-400 hover:text-white font-bold"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={returnItems.length === 0}
                            onClick={() => setReturnStep('Review')}
                            className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 ${returnItems.length > 0 ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                        >
                            Review Return <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Review & Refund */}
            {returnStep === 'Review' && foundSale && (
                <div className="flex-1 flex flex-col">
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-4">
                            <h4 className="font-bold text-white mb-2">Return Summary</h4>
                            <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-black/20 text-xs text-gray-400 uppercase">
                                        <tr>
                                            <th className="p-4">Product</th>
                                            <th className="p-4">Reason</th>
                                            <th className="p-4">Action</th>
                                            <th className="p-4 text-right">Refund</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-sm">
                                        {returnItems.map((ri, idx) => {
                                            const originalItem = foundSale.items.find((i: any) => i.id === ri.productId);
                                            const refundAmount = (originalItem?.price || 0) * ri.quantity;
                                            return (
                                                <tr key={idx}>
                                                    <td className="p-4">
                                                        <div className="font-bold text-white">{originalItem?.name}</div>
                                                        <div className="text-xs text-gray-500">Qty: {ri.quantity}</div>
                                                    </td>
                                                    <td className="p-4 text-gray-300">{ri.reason}</td>
                                                    <td className="p-4">
                                                        <span className={`text-xs px-2 py-1 rounded font-bold ${ri.action === 'Restock' ? 'bg-green-500/20 text-green-400' : ri.action === 'Discard' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                            {ri.action}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right font-mono text-white">
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
                            <div className="bg-black/20 rounded-xl border border-white/5 p-6 space-y-4">
                                <h4 className="font-bold text-white border-b border-white/10 pb-2">Financial Breakdown</h4>

                                {(() => {
                                    const subtotal = returnItems.reduce((sum, ri) => {
                                        const item = foundSale.items.find((i: any) => i.id === ri.productId);
                                        return sum + ((item?.price || 0) * ri.quantity);
                                    }, 0);
                                    const tax = subtotal * 0.1; // Mock 10% tax
                                    const total = subtotal + tax;

                                    return (
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between text-gray-400">
                                                <span>Subtotal</span>
                                                <span>{formatCompactNumber(subtotal, { currency: CURRENCY_SYMBOL })}</span>
                                            </div>
                                            <div className="flex justify-between text-gray-400">
                                                <span>Tax (10%)</span>
                                                <span>{formatCompactNumber(tax, { currency: CURRENCY_SYMBOL })}</span>
                                            </div>
                                            <div className="flex justify-between text-white font-bold text-lg pt-4 border-t border-white/10">
                                                <span>Total Refund</span>
                                                <span className="text-cyber-primary">{formatCompactNumber(total, { currency: CURRENCY_SYMBOL })}</span>
                                            </div>
                                        </div>
                                    );
                                })()}

                                <div className="pt-4 space-y-3">
                                    <button
                                        onClick={async () => {
                                            if (!confirm('Process this return? This action cannot be undone.')) return;

                                            // Calculate total
                                            const totalRefund = returnItems.reduce((sum, ri) => {
                                                const item = foundSale.items.find((i: any) => i.id === ri.productId);
                                                return sum + ((item?.price || 0) * ri.quantity);
                                            }, 0) * 1.1; // Including tax

                                            processReturn(foundSale.id, returnItems, totalRefund, user?.name || 'WMS');

                                            // Stock Adjustments - CREATE REQUESTS
                                            for (const item of returnItems) {
                                                if (item.action === 'Restock') {
                                                    const product = products.find(p => p.id === item.productId);
                                                    const request: any = { // Omit<PendingInventoryChange, 'id'> - using any for simplicity in extraction
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
                                                    await inventoryRequestsService.create(request);
                                                }
                                            }

                                            setReturnStep('Complete');
                                            addNotification('success', 'Return processed successfully');
                                        }}
                                        className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all"
                                    >
                                        Process Refund
                                    </button>
                                    <button
                                        onClick={() => setReturnStep('Select')}
                                        className="w-full py-3 text-gray-400 hover:text-white font-bold"
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
                <div className="flex-1 flex flex-col items-center justify-center space-y-8 py-12">
                    <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                        <CheckCircle className="text-green-500" size={40} />
                    </div>
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold text-white">Return Processed Successfully</h2>
                        <p className="text-gray-400">RMA - {Date.now().toString().slice(-6)} Generated</p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => {
                                window.print();
                                addNotification('info', 'Printing Receipt...');
                            }}
                            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl flex items-center gap-2"
                        >
                            <Printer size={18} /> Print Receipt
                        </button>
                        <button
                            onClick={() => {
                                setFoundSale(null);
                                setReturnItems([]);
                                setReturnSearch('');
                                setReturnStep('Search');
                            }}
                            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20"
                        >
                            New Return
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
