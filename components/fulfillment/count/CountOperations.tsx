import React, { useState } from 'react';
import { RotateCcw, Search, AlertTriangle, Package, CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { Product, PendingInventoryChange, User } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useData } from '../../../contexts/DataContext';
import { useCreateInventoryRequestMutation } from '../../../hooks/useInventoryRequestMutations';
import { resolveCountAndPackPolicy, resolveReceivingPolicy } from '../../../utils/receivingPolicy';
import { RecountAuthModal } from './components/RecountAuthModal';
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
    inventoryRequestsService?: any;
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
}) => {
    const { t } = useLanguage();
    const { settings, effectiveCountry, employees, logSystemEvent } = useData();
    const policy = resolveCountAndPackPolicy(settings, effectiveCountry);
    const receivingPolicy = resolveReceivingPolicy(settings, effectiveCountry);
    const createRequestMutation = useCreateInventoryRequestMutation();

    const isManagerOrHQ = [
        'super_admin',
        'ceo',
        'operations_manager',
        'warehouse_manager',
        'inventory_manager',
        'store_manager',
        'shift_supervisor'
    ].includes(user?.role?.toLowerCase() || '');

    const [approvingVariance, setApprovingVariance] = useState<number | null>(null);
    const [authModalItem, setAuthModalItem] = useState<{ idx: number; product: Product } | null>(null);

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
                        className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 hover:border-[var(--theme-accent)]/40 transition-colors shadow-sm text-left group"
                    >
                        <div className="flex items-center gap-3.5 mb-2">
                            <div className="w-12 h-12 rounded-xl bg-[var(--theme-bg-subtle)] text-[var(--theme-accent)] border border-[var(--theme-border)] flex items-center justify-center shrink-0">
                                <RotateCcw size={22} />
                            </div>
                            <div>
                                <h4 className="font-bold text-[var(--theme-text-primary)] text-base">{t('warehouse.dailyCycleCount')}</h4>
                                <p className="text-xs text-[var(--theme-text-secondary)] font-medium mt-0.5">{t('warehouse.routineCountAisleA')}</p>
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
                        className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 hover:border-[var(--theme-accent)]/40 transition-colors shadow-sm text-left group"
                    >
                        <div className="flex items-center gap-3.5 mb-2">
                            <div className="w-12 h-12 rounded-xl bg-[var(--theme-bg-subtle)] text-[var(--theme-accent)] border border-[var(--theme-border)] flex items-center justify-center shrink-0">
                                <Search size={22} />
                            </div>
                            <div>
                                <h4 className="font-bold text-[var(--theme-text-primary)] text-base">{t('warehouse.spotCheck')}</h4>
                                <p className="text-xs text-[var(--theme-text-secondary)] font-medium mt-0.5">{t('warehouse.randomAuditFiveItems')}</p>
                            </div>
                        </div>
                    </button>
                </div>
            )}

            {/* ACTIVE STATE: Blind Counting */}
            {countSessionStatus === 'Active' && (
                <div className="space-y-4">
                    <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl flex items-center gap-3">
                        <AlertTriangle className="text-amber-600 dark:text-amber-400 shrink-0" size={20} />
                        <p className="text-xs text-stone-800 dark:text-amber-200 font-medium">
                            {t('warehouse.blindCountModeInfo')}
                        </p>
                    </div>

                    <div className="space-y-2.5">
                        {countSessionItems.map((item, idx) => {
                            const product = products.find(p => p.id === item.productId);
                            const isCounted = item.status === 'Counted';
                            return (
                                <div
                                    key={item.productId}
                                    className={`p-4 rounded-2xl border transition-colors flex items-center justify-between gap-3 shadow-sm ${
                                        isCounted
                                            ? 'bg-green-500/5 border-green-500/30'
                                            : 'bg-[var(--theme-bg-card)] border-[var(--theme-border)]'
                                    }`}
                                >
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <div className="w-12 h-12 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center overflow-hidden shrink-0">
                                            {product?.image && !product.image.includes('placeholder.com') ? (
                                                <img
                                                    src={product.image}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <Package size={20} className="text-[var(--theme-text-secondary)]/50" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-sm text-[var(--theme-text-primary)] truncate">{product?.name}</p>
                                            <p className="text-[11px] text-[var(--theme-text-secondary)] font-mono tabular-nums mt-0.5">
                                                {t('warehouse.location')}: {product?.location || t('warehouse.nA')} • {t('warehouse.sku')}: {product?.sku}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2.5 shrink-0">
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder={t('warehouse.qty')}
                                            aria-label={t('warehouse.qty')}
                                            title={t('warehouse.qty')}
                                            className="w-24 text-center font-mono tabular-nums text-lg py-2 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] focus:border-[var(--theme-accent)] rounded-xl outline-none min-h-[44px] text-[var(--theme-text-primary)] transition-colors"
                                            value={item.countedQty === undefined ? '' : item.countedQty}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                const newItems = [...countSessionItems];
                                                newItems[idx].countedQty = isNaN(val) ? undefined : val;
                                                newItems[idx].status = isNaN(val) ? 'Pending' : 'Counted';
                                                setCountSessionItems(newItems);
                                            }}
                                        />
                                        {isCounted && <CheckCircle className="text-green-500" size={20} />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="pt-4 border-t border-[var(--theme-border)] flex justify-end">
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
                            className="bg-[var(--theme-accent)] hover:opacity-90 text-white font-semibold rounded-xl px-6 py-2.5 min-h-[44px] flex items-center gap-2 shadow-sm transition-opacity"
                        >
                            <span>{t('warehouse.finishReview')}</span>
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* REVIEW STATE: Manager Approval */}
            {countSessionStatus === 'Review' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3.5 mb-4">
                        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] p-3.5 rounded-xl text-center shadow-sm">
                            <p className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">{t('warehouse.totalItems')}</p>
                            <p className="text-xl font-bold font-mono tabular-nums text-[var(--theme-text-primary)] mt-0.5">{countSessionItems.length}</p>
                        </div>
                        <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 p-3.5 rounded-xl text-center shadow-sm">
                            <p className="text-[11px] font-semibold uppercase tracking-wider">{t('warehouse.accurate')}</p>
                            <p className="text-xl font-bold font-mono tabular-nums mt-0.5">{countSessionItems.filter(i => i.variance === 0).length}</p>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-3.5 rounded-xl text-center shadow-sm">
                            <p className="text-[11px] font-semibold uppercase tracking-wider">{t('warehouse.variance')}</p>
                            <p className="text-xl font-bold font-mono tabular-nums mt-0.5">{countSessionItems.filter(i => i.variance !== 0).length}</p>
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        {countSessionItems.map((item, idx) => {
                            const product = products.find(p => p.id === item.productId);
                            const hasVariance = item.variance !== 0;

                            return (
                                <div
                                    key={item.productId}
                                    className={`p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 transition-colors ${
                                        hasVariance
                                            ? 'bg-[var(--theme-bg-card)] border-red-500/30'
                                            : 'bg-[var(--theme-bg-card)] border-green-500/30'
                                    }`}
                                >
                                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                        <div className="w-12 h-12 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center overflow-hidden shrink-0">
                                            {product?.image && !product.image.includes('placeholder.com') ? (
                                                <img
                                                    src={product.image}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <Package size={20} className="text-[var(--theme-text-secondary)]/50" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-sm text-[var(--theme-text-primary)] truncate">{product?.name}</p>
                                            <div className="flex gap-4 text-xs mt-1 flex-wrap font-mono tabular-nums">
                                                <span className="text-[var(--theme-text-secondary)]">
                                                    {t('warehouse.expected')}: <strong className="text-[var(--theme-text-primary)]">
                                                        {receivingPolicy.blind && !isManagerOrHQ ? '*** (Blind)' : item.systemQty}
                                                    </strong>
                                                </span>
                                                <span className="text-[var(--theme-accent)]">
                                                    {t('warehouse.picking')}: <strong className="text-[var(--theme-text-primary)]">{item.countedQty}</strong>
                                                </span>
                                                <span className={hasVariance ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-green-600 dark:text-green-400 font-semibold'}>
                                                    {receivingPolicy.blind && !isManagerOrHQ
                                                        ? (hasVariance ? 'Variance Detected' : 'Matched')
                                                        : `${t('warehouse.variance').slice(0, 3)}: ${item.variance && item.variance > 0 ? '+' : ''}${item.variance}`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {hasVariance && item.status !== 'Approved' && (() => {
                                        const recountsDone = item.recountsDone || 0;
                                        const isRecountCapReached = recountsDone >= policy.maxCycleCountRecounts;

                                        const triggerRecount = (supervisorName?: string, supervisorRole?: string) => {
                                            const newItems = [...countSessionItems];
                                            newItems[idx].status = 'Pending';
                                            newItems[idx].countedQty = undefined;
                                            newItems[idx].variance = undefined;
                                            newItems[idx].recountsDone = recountsDone + 1;
                                            if (supervisorName) {
                                                newItems[idx].recountAuthorizedBy = supervisorName;
                                            }
                                            setCountSessionItems(newItems);
                                            setCountSessionStatus('Active');
                                            addNotification('info', t('warehouse.recountMarkedInfo').replace('{name}', product?.name || ''));

                                            if (logSystemEvent) {
                                                logSystemEvent(
                                                    'CYCLE_COUNT_RECOUNT_INITIATED',
                                                    `Recount #${recountsDone + 1} for SKU ${product?.sku || item.productId} initiated by ${user?.name || 'Counter'}${supervisorName ? ` (Authorized by ${supervisorName} - ${supervisorRole})` : ''}`,
                                                    user?.name || 'Counter',
                                                    'WMS_INVENTORY_COUNT'
                                                );
                                            }
                                        };

                                        return (
                                            <div className="flex gap-2 shrink-0">
                                                <button
                                                    disabled={isRecountCapReached}
                                                    onClick={() => {
                                                        if (isRecountCapReached) return;
                                                        if (policy.requireSecondCounterOnVariance && product) {
                                                            setAuthModalItem({ idx, product });
                                                        } else {
                                                            triggerRecount();
                                                        }
                                                    }}
                                                    className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors min-h-[38px] ${
                                                        isRecountCapReached
                                                            ? 'opacity-40 cursor-not-allowed bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)]'
                                                            : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]'
                                                    }`}
                                                    title={isRecountCapReached ? `Recount limit (${policy.maxCycleCountRecounts}) reached.` : undefined}
                                                >
                                                    {isRecountCapReached ? `Recounts (${recountsDone}/${policy.maxCycleCountRecounts})` : t('warehouse.recount')}
                                                </button>
                                                <button
                                                    disabled={approvingVariance === idx}
                                                    onClick={async () => {
                                                        setApprovingVariance(idx);
                                                        try {
                                                            const varianceQty = Math.abs(item.variance || 0);
                                                            const adjustType = (item.variance || 0) > 0 ? 'IN' : 'OUT';

                                                            const request: Omit<PendingInventoryChange, 'id'> = {
                                                                productId: item.productId,
                                                                productName: product?.name || 'Unknown',
                                                                productSku: product?.sku || 'Unknown',
                                                                siteId: product?.siteId || user?.siteId || '',
                                                                countryCode: (product as any)?.countryCode || (product as any)?.country_code || (user as any)?.country || 'ET',
                                                                changeType: 'stock_adjustment',
                                                                requestedBy: user?.name || 'Manager',
                                                                requestedAt: new Date().toISOString(),
                                                                status: 'pending',
                                                                adjustmentType: adjustType,
                                                                adjustmentQty: varianceQty,
                                                                adjustmentReason: `Cycle Count Variance Approval`
                                                            };

                                                            await createRequestMutation.mutateAsync(request);

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
                                                    className={`px-3.5 py-2 text-xs font-semibold rounded-xl border flex items-center gap-1.5 min-h-[38px] transition-colors ${
                                                        approvingVariance === idx
                                                            ? 'bg-red-500/10 text-red-400/50 border-red-500/20 cursor-not-allowed'
                                                            : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/20'
                                                    }`}
                                                >
                                                    {approvingVariance === idx ? (
                                                        <>
                                                            <RefreshCw size={12} className="animate-spin" />
                                                            <span>{t('warehouse.processing')}</span>
                                                        </>
                                                    ) : (
                                                        t('warehouse.approveVariance')
                                                    )}
                                                </button>
                                            </div>
                                        );
                                    })()}

                                    {(!hasVariance || item.status === 'Approved') && (
                                        <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-xs font-semibold px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-xl shrink-0">
                                            <CheckCircle size={14} />
                                            <span>{item.status === 'Approved' ? t('warehouse.adjusted') : t('warehouse.matched')}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="pt-4 border-t border-[var(--theme-border)] flex justify-end">
                        <button
                            onClick={() => {
                                if (countSessionItems.some(i => i.status !== 'Approved' && i.variance !== 0)) {
                                    if (!confirm(t('warehouse.unapprovedVariancesPrompt'))) return;
                                }
                                setCountSessionStatus('Idle');
                                setCountSessionItems([]);
                                addNotification('success', t('warehouse.countSessionCompleted'));
                            }}
                            className="bg-[var(--theme-accent)] hover:opacity-90 text-white font-semibold rounded-xl px-6 py-2.5 min-h-[44px] shadow-sm transition-opacity"
                        >
                            {t('warehouse.completeSession')}
                        </button>
                    </div>
                </div>
            )}

            {authModalItem && (
                <RecountAuthModal
                    isOpen={!!authModalItem}
                    onClose={() => setAuthModalItem(null)}
                    productName={authModalItem.product.name}
                    productSku={authModalItem.product.sku}
                    employees={employees}
                    currentUserId={user?.id || user?.name}
                    onAuthorize={(supName, supRole) => {
                        const targetIdx = authModalItem.idx;
                        const targetItem = countSessionItems[targetIdx];
                        const recounts = targetItem?.recountsDone || 0;
                        const newItems = [...countSessionItems];
                        newItems[targetIdx].status = 'Pending';
                        newItems[targetIdx].countedQty = undefined;
                        newItems[targetIdx].variance = undefined;
                        newItems[targetIdx].recountsDone = recounts + 1;
                        newItems[targetIdx].recountAuthorizedBy = supName;
                        setCountSessionItems(newItems);
                        setCountSessionStatus('Active');
                        setAuthModalItem(null);
                        addNotification('info', t('warehouse.recountMarkedInfo').replace('{name}', authModalItem.product.name));

                        if (logSystemEvent) {
                            logSystemEvent(
                                'CYCLE_COUNT_RECOUNT_AUTHORIZED',
                                `Dual-control recount #${recounts + 1} for SKU ${authModalItem.product.sku} authorized by ${supName} (${supRole}) for counter ${user?.name || 'Counter'}`,
                                supName,
                                'WMS_INVENTORY_COUNT'
                            );
                        }
                    }}
                />
            )}
        </>
    );
};

export default CountOperations;
