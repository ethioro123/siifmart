import React, { useState } from 'react';
import { RotateCcw, Search, AlertTriangle, Package, CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { Product, PendingInventoryChange, User } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { logger } from '../../../utils/logger';

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
    const { t } = useLanguage();
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
                        className="glass-panel p-6 rounded-2xl hover:bg-stone-100/50 dark:hover:bg-[#EAE5D9]/10 transition-colors text-left group"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 rounded-full bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2]">
                                <RotateCcw size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-stone-900 dark:text-stone-100">{t('warehouse.dailyCycleCount')}</h4>
                                <p className="text-xs text-stone-500 dark:text-stone-400">{t('warehouse.routineCountAisleA')}</p>
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
                        className="glass-panel p-6 rounded-2xl hover:bg-stone-100/50 dark:hover:bg-[#EAE5D9]/10 transition-colors text-left group"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 rounded-full bg-[#A9CBA2]/20 dark:bg-[#A9CBA2]/10 text-[#2C5E3B] dark:text-[#A9CBA2]">
                                <Search size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-stone-900 dark:text-stone-100">{t('warehouse.spotCheck')}</h4>
                                <p className="text-xs text-stone-500 dark:text-stone-400">{t('warehouse.randomAuditFiveItems')}</p>
                            </div>
                        </div>
                    </button>
                </div>
            )}

            {/* ACTIVE STATE: Blind Counting */}
            {countSessionStatus === 'Active' && (
                <div className="space-y-4">
                    <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-center gap-3">
                        <AlertTriangle className="text-amber-600 dark:text-amber-400" size={20} />
                        <p className="text-sm text-stone-800 dark:text-amber-200">
                            {t('warehouse.blindCountModeInfo')}
                        </p>
                    </div>

                    <div className="space-y-2">
                        {countSessionItems.map((item, idx) => {
                            const product = products.find(p => p.id === item.productId);
                            return (
                                <div key={item.productId} className={`p-4 rounded-2xl border ${item.status === 'Counted' ? 'bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 border-[#2C5E3B]/30 dark:border-[#A9CBA2]/30' : 'glass-panel'} flex items-center justify-between`}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-stone-50/50 dark:bg-[#1C2620]/30 border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] flex items-center justify-center overflow-hidden">
                                            {product?.image && !product.image.includes('placeholder.com') ? (
                                                <img
                                                    src={product.image}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package text-stone-500"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                                    }}
                                                />
                                            ) : (
                                                <Package size={20} className="text-stone-500" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-stone-900 dark:text-stone-100">{product?.name}</p>
                                            <p className="text-xs text-stone-500 dark:text-stone-400">{t('warehouse.location')}: {product?.location || t('warehouse.nA')} • {t('warehouse.sku')}: {product?.sku}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder={t('warehouse.qty')}
                                            aria-label={t('warehouse.qty')}
                                            title={t('warehouse.qty')}
                                            className="woody-input w-24 text-center font-mono text-lg"
                                            value={item.countedQty === undefined ? '' : item.countedQty}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                const newItems = [...countSessionItems];
                                                newItems[idx].countedQty = isNaN(val) ? undefined : val;
                                                newItems[idx].status = isNaN(val) ? 'Pending' : 'Counted';
                                                setCountSessionItems(newItems);
                                            }}
                                        />
                                        {item.status === 'Counted' && <CheckCircle className="text-[#2C5E3B] dark:text-[#A9CBA2]" size={20} />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="pt-4 border-t border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] flex justify-end">
                        <button
                            onClick={() => {
                                if (countSessionItems.some(i => i.status === 'Pending')) {
                                    addNotification('alert', t('warehouse.pleaseCountAllItems'));
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
                            className="woody-btn-primary px-6 py-3 flex items-center gap-2"
                        >
                            {t('warehouse.finishReview')} <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* REVIEW STATE: Manager Approval */}
            {countSessionStatus === 'Review' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="glass-panel p-3 rounded-xl text-center">
                            <p className="text-xs text-stone-500 dark:text-stone-400 uppercase">{t('warehouse.totalItems')}</p>
                            <p className="text-xl font-bold text-stone-900 dark:text-stone-100">{countSessionItems.length}</p>
                        </div>
                        <div className="bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 p-3 rounded-xl text-center border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20">
                            <p className="text-xs text-[#2C5E3B] dark:text-[#A9CBA2] uppercase">{t('warehouse.accurate')}</p>
                            <p className="text-xl font-bold text-[#2C5E3B] dark:text-[#A9CBA2]">{countSessionItems.filter(i => i.variance === 0).length}</p>
                        </div>
                        <div className="bg-red-500/10 p-3 rounded-xl text-center border border-red-500/20">
                            <p className="text-xs text-red-600 dark:text-red-400 uppercase">{t('warehouse.variance')}</p>
                            <p className="text-xl font-bold text-red-600 dark:text-red-400">{countSessionItems.filter(i => i.variance !== 0).length}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {countSessionItems.map((item, idx) => {
                            const product = products.find(p => p.id === item.productId);
                            const hasVariance = item.variance !== 0;

                            return (
                                <div key={item.productId} className={`p-4 rounded-xl border ${hasVariance ? 'bg-red-500/5 border-red-500/20' : 'bg-[#2C5E3B]/5 dark:bg-[#A9CBA2]/5 border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20'} flex flex-col md:flex-row items-center justify-between gap-4`}>
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="w-10 h-10 rounded-xl bg-stone-50/50 dark:bg-[#1C2620]/30 border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] flex items-center justify-center overflow-hidden">
                                            {product?.image && !product.image.includes('placeholder.com') ? (
                                                <img
                                                    src={product.image}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package text-stone-500"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                                    }}
                                                />
                                            ) : (
                                                <Package size={16} className="text-stone-500" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-stone-900 dark:text-stone-100">{product?.name}</p>
                                            <div className="flex gap-4 text-xs mt-1">
                                                <span className="text-stone-500 dark:text-stone-400">{t('warehouse.expected')}: <strong className="text-stone-900 dark:text-stone-100">{item.systemQty}</strong></span>
                                                <span className="text-[#2C5E3B] dark:text-[#A9CBA2]">{t('warehouse.picking')}: <strong className="text-stone-900 dark:text-stone-100">{item.countedQty}</strong></span>
                                                <span className={hasVariance ? 'text-red-600 dark:text-red-400 font-bold' : 'text-[#2C5E3B] dark:text-[#A9CBA2] font-bold'}>
                                                    {t('warehouse.variance').slice(0, 3)}: {item.variance && item.variance > 0 ? '+' : ''}{item.variance}
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
                                                    addNotification('info', t('warehouse.recountMarkedInfo').replace('{name}', product?.name || ''));
                                                }}
                                                className="woody-btn-secondary px-3 py-1.5 text-xs"
                                            >
                                                {t('warehouse.recount')}
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
                                                        addNotification('success', t('warehouse.varianceRequestSubmitted'));
                                                    } catch (e) {
                                                        logger.error('CountOperations', 'Failed to approve variance:', e);
                                                        addNotification('alert', t('warehouse.failedVarianceSubmit'));
                                                    } finally {
                                                        setApprovingVariance(null);
                                                    }
                                                }}
                                                className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1 ${approvingVariance === idx
                                                    ? 'bg-red-500/10 text-red-400/50 border-red-500/20 cursor-not-allowed'
                                                    : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 dark:border-red-500/20 hover:bg-red-500/20'
                                                    }`}
                                            >
                                                {approvingVariance === idx ? (
                                                    <>
                                                        <RefreshCw size={12} className="animate-spin" />
                                                        {t('warehouse.processing')}
                                                    </>
                                                ) : (
                                                    t('warehouse.approveVariance')
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    {(!hasVariance || item.status === 'Approved') && (
                                        <div className="flex items-center gap-2 text-[#2C5E3B] dark:text-[#A9CBA2] text-xs font-bold px-3 py-1.5 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 rounded-lg">
                                            <CheckCircle size={14} />
                                            {item.status === 'Approved' ? t('warehouse.adjusted') : t('warehouse.matched')}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="pt-4 border-t border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] flex justify-end">
                        <button
                            onClick={() => {
                                if (countSessionItems.some(i => i.status !== 'Approved' && i.variance !== 0)) {
                                    if (!confirm(t('warehouse.unapprovedVariancesPrompt'))) return;
                                }
                                setCountSessionStatus('Idle');
                                setCountSessionItems([]);
                                addNotification('success', t('warehouse.countSessionCompleted'));
                            }}
                            className="woody-btn-primary px-6 py-3"
                        >
                            {t('warehouse.completeSession')}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};
