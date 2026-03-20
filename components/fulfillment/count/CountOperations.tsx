import React, { useState } from 'react';
import { RotateCcw, Search, AlertTriangle, Package, CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { Product, PendingInventoryChange, User } from '../../../types';

interface CountOperationsProps {
    products: Product[];
    user: User | null;
    countSessionStatus: 'Idle' | 'Active' | 'Review';
    setCountSessionStatus: (status: 'Idle' | 'Active' | 'Review') => void;
    countSessionItems: any[];
    setCountSessionItems: (items: any[]) => void;
    countSessionType: 'Cycle' | 'Spot';
    setCountSessionType: (type: 'Cycle' | 'Spot') => void;
    addNotification: (type: 'alert' | 'success' | 'info', message: string) => void;
    inventoryRequestsService: any;
}

export const CountOperations: React.FC<CountOperationsProps> = ({
    products,
    user,
    countSessionStatus,
    setCountSessionStatus,
    countSessionItems,
    setCountSessionItems,
    countSessionType,
    setCountSessionType,
    addNotification,
    inventoryRequestsService
}) => {
    const [approvingVariance, setApprovingVariance] = useState<number | null>(null);

    return (
        <>
            {/* IDLE STATE: Start Session */}
            {countSessionStatus === 'Idle' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={() => {
                            // Start Daily Cycle Count (Aisle A for demo)
                            const itemsToCount = products
                                .filter(p => (p.location || '').startsWith('A'))
                                .slice(0, 10)
                                .map(p => ({
                                    productId: p.id,
                                    systemQty: p.stock,
                                    status: 'Pending' as const
                                }));
                            setCountSessionItems(itemsToCount);
                            setCountSessionType('Cycle');
                            setCountSessionStatus('Active');
                        }}
                        className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-colors text-left group"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 rounded-full bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30">
                                <RotateCcw size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-white">Daily Cycle Count</h4>
                                <p className="text-xs text-gray-400">Routine count of Aisle A</p>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => {
                            // Start Spot Check (Random 5 items)
                            const itemsToCount = [...products]
                                .sort(() => 0.5 - Math.random())
                                .slice(0, 5)
                                .map(p => ({
                                    productId: p.id,
                                    systemQty: p.stock,
                                    status: 'Pending' as const
                                }));
                            setCountSessionItems(itemsToCount);
                            setCountSessionType('Spot');
                            setCountSessionStatus('Active');
                        }}
                        className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-colors text-left group"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 rounded-full bg-purple-500/20 text-purple-400 group-hover:bg-purple-500/30">
                                <Search size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-white">Spot Check</h4>
                                <p className="text-xs text-gray-400">Random audit of 5 items</p>
                            </div>
                        </div>
                    </button>
                </div>
            )}

            {/* ACTIVE STATE: Blind Counting */}
            {countSessionStatus === 'Active' && (
                <div className="space-y-4">
                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg flex items-center gap-3">
                        <AlertTriangle className="text-yellow-500" size={20} />
                        <p className="text-sm text-yellow-200">
                            <strong>Blind Count Mode:</strong> System quantities are hidden to ensure accuracy.
                        </p>
                    </div>

                    <div className="space-y-2">
                        {countSessionItems.map((item, idx) => {
                            const product = products.find(p => p.id === item.productId);
                            return (
                                <div key={item.productId} className={`p-4 rounded-xl border ${item.status === 'Counted' ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'} flex items-center justify-between`}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded bg-black flex items-center justify-center overflow-hidden">
                                            {product?.image && !product.image.includes('placeholder.com') ? (
                                                <img
                                                    src={product.image}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package text-gray-700"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                                    }}
                                                />
                                            ) : (
                                                <Package size={20} className="text-gray-700" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">{product?.name}</p>
                                            <p className="text-xs text-gray-400">Loc: {product?.location || 'N/A'} • SKU: {product?.sku}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="Qty"
                                            className="w-24 bg-black border border-white/20 rounded-lg p-2 text-center text-white font-mono text-lg"
                                            value={item.countedQty === undefined ? '' : item.countedQty}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                const newItems = [...countSessionItems];
                                                newItems[idx].countedQty = isNaN(val) ? undefined : val;
                                                newItems[idx].status = isNaN(val) ? 'Pending' : 'Counted';
                                                setCountSessionItems(newItems);
                                            }}
                                        />
                                        {item.status === 'Counted' && <CheckCircle className="text-green-500" size={20} />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="pt-4 border-t border-white/10 flex justify-end">
                        <button
                            onClick={() => {
                                if (countSessionItems.some(i => i.status === 'Pending')) {
                                    addNotification('alert', 'Please count all items before finishing.');
                                    return;
                                }
                                // Calculate variances
                                const reviewedItems = countSessionItems.map(i => ({
                                    ...i,
                                    variance: (i.countedQty || 0) - i.systemQty
                                }));
                                setCountSessionItems(reviewedItems);
                                setCountSessionStatus('Review');
                            }}
                            className="px-6 py-3 bg-cyber-primary text-black font-bold rounded-xl hover:bg-cyber-accent transition-colors flex items-center gap-2"
                        >
                            Finish & Review <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* REVIEW STATE: Manager Approval */}
            {countSessionStatus === 'Review' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="bg-white/5 p-3 rounded-lg text-center">
                            <p className="text-xs text-gray-400 uppercase">Total Items</p>
                            <p className="text-xl font-bold text-white">{countSessionItems.length}</p>
                        </div>
                        <div className="bg-green-500/10 p-3 rounded-lg text-center border border-green-500/20">
                            <p className="text-xs text-green-400 uppercase">Accurate</p>
                            <p className="text-xl font-bold text-green-400">{countSessionItems.filter(i => i.variance === 0).length}</p>
                        </div>
                        <div className="bg-red-500/10 p-3 rounded-lg text-center border border-red-500/20">
                            <p className="text-xs text-red-400 uppercase">Variance</p>
                            <p className="text-xl font-bold text-red-400">{countSessionItems.filter(i => i.variance !== 0).length}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {countSessionItems.map((item, idx) => {
                            const product = products.find(p => p.id === item.productId);
                            const hasVariance = item.variance !== 0;

                            return (
                                <div key={item.productId} className={`p-4 rounded-xl border ${hasVariance ? 'bg-red-500/5 border-red-500/20' : 'bg-green-500/5 border-green-500/20'} flex flex-col md:flex-row items-center justify-between gap-4`}>
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="w-10 h-10 rounded bg-black flex items-center justify-center overflow-hidden">
                                            {product?.image && !product.image.includes('placeholder.com') ? (
                                                <img
                                                    src={product.image}
                                                    alt=""
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
                                            <p className="font-bold text-white">{product?.name}</p>
                                            <div className="flex gap-4 text-xs mt-1">
                                                <span className="text-gray-400">System: <strong className="text-white">{item.systemQty}</strong></span>
                                                <span className="text-cyber-primary">Counted: <strong className="text-white">{item.countedQty}</strong></span>
                                                <span className={hasVariance ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>
                                                    Var: {item.variance && item.variance > 0 ? '+' : ''}{item.variance}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {hasVariance && item.status !== 'Approved' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    // Recount logic
                                                    const newItems = [...countSessionItems];
                                                    newItems[idx].status = 'Pending';
                                                    newItems[idx].countedQty = undefined;
                                                    newItems[idx].variance = undefined;
                                                    setCountSessionItems(newItems);
                                                    setCountSessionStatus('Active');
                                                    addNotification('info', `Marked ${product?.name} for recount.`);
                                                }}
                                                className="px-3 py-1.5 bg-white/5 text-white text-xs font-bold rounded-lg hover:bg-white/10"
                                            >
                                                Recount
                                            </button>
                                            <button
                                                disabled={approvingVariance === idx}
                                                onClick={async () => {
                                                    setApprovingVariance(idx);
                                                    try {
                                                        // Approve Variance - NOW CREATES REQUEST
                                                        const varianceQty = Math.abs(item.variance || 0);
                                                        const adjustType = (item.variance || 0) > 0 ? 'IN' : 'OUT';

                                                        const request: Omit<PendingInventoryChange, 'id'> = {
                                                            productId: item.productId,
                                                            productName: product?.name || 'Unknown',
                                                            productSku: product?.sku || 'Unknown',
                                                            siteId: product?.siteId || user?.siteId || '',
                                                            changeType: 'stock_adjustment',
                                                            requestedBy: user?.name || 'Manager',
                                                            requestedAt: new Date().toISOString(),
                                                            status: 'pending',
                                                            adjustmentType: adjustType,
                                                            adjustmentQty: varianceQty,
                                                            adjustmentReason: `Cycle Count Variance Approval`
                                                        };

                                                        await inventoryRequestsService.create(request);

                                                        const newItems = [...countSessionItems];
                                                        newItems[idx].status = 'Approved';
                                                        setCountSessionItems(newItems);
                                                        addNotification('success', 'Variance adjustment request submitted for approval.');
                                                    } catch (e) {
                                                        console.error('Failed to approve variance:', e);
                                                        addNotification('alert', 'Failed to submit variance approval');
                                                    } finally {
                                                        setApprovingVariance(null);
                                                    }
                                                }}
                                                className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1 ${approvingVariance === idx
                                                    ? 'bg-red-500/10 text-red-400/50 border-red-500/20 cursor-not-allowed'
                                                    : 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
                                                    }`}
                                            >
                                                {approvingVariance === idx ? (
                                                    <>
                                                        <RefreshCw size={12} className="animate-spin" />
                                                        Approving...
                                                    </>
                                                ) : (
                                                    'Approve Variance'
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    {(!hasVariance || item.status === 'Approved') && (
                                        <div className="flex items-center gap-2 text-green-400 text-xs font-bold px-3 py-1.5 bg-green-500/10 rounded-lg">
                                            <CheckCircle size={14} />
                                            {item.status === 'Approved' ? 'Adjusted' : 'Matched'}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="pt-4 border-t border-white/10 flex justify-end">
                        <button
                            onClick={() => {
                                if (countSessionItems.some(i => i.status !== 'Approved' && i.variance !== 0)) {
                                    if (!confirm('There are unapproved variances. Finish anyway?')) return;
                                }
                                setCountSessionStatus('Idle');
                                setCountSessionItems([]);
                                addNotification('success', 'Count session completed!');
                            }}
                            className="px-6 py-3 bg-cyber-primary text-black font-bold rounded-xl hover:bg-cyber-accent transition-colors"
                        >
                            Complete Session
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};
