import React from 'react';
import { Package, Layers, CheckCircle, Printer, Plus, Loader2 } from 'lucide-react';
import { PurchaseOrder, WMSJob, Product } from '../../../types';
import { ProgressBar } from '../../shared/ProgressBar';
import Pagination from '../../shared/Pagination';
import { formatPOItemDescription, formatPackBadge, isDiscreteGeneralMerch } from '../../procurement/utils';
import { getSellUnit } from '../../../utils/units';
import { hasPermission } from '../../../utils/permissions';
import { convertToSellableUnits } from '../useReceiving';
import { useData } from '../../../contexts/DataContext';
import { generateBatchNumber } from '../../../utils/batchNumber';
import { resolveReceivingPolicy } from '../../../utils/receivingPolicy';
import { buildPOJobsReceivedMap, resolvePOLineItemProgress } from './receiveQuantityResolver';
import { ItemAttributeBadges } from '../ItemAttributeBadges';
import { useIsMobile } from '../../../hooks/useIsMobile';

interface ReceiveListProps {
    paginatedReceiveOrders: PurchaseOrder[];
    receiveOrdersTotalPages: number;
    filteredReceiveOrdersLength: number;
    receiveCurrentPage: number;
    setReceiveCurrentPage: (page: number) => void;
    jobs: WMSJob[];
    receivedQuantities: Record<string, number>;
    setReprintItem: (item: any) => void;
    setSplitReceivingItem: (item: any) => void;
    setSplitReceivingPO: (po: PurchaseOrder) => void;
    setSplitVariants: (variants: any[]) => void;
    setIsSplitReceiving: (isSplit: boolean) => void;
    allProducts: Product[];
    finalizedSkus: Record<string, string>;
    products: Product[];
    setReviewPO: (po: PurchaseOrder) => void;
    setShowReviewModal: (show: boolean) => void;
    t: (key: string) => string;
    isSubmitting: boolean;
    itemsPerPage: number;
    user?: any;
    employees?: any[];
    onAuthenticate?: (poId: string) => Promise<void>;
}

export const ReceiveList: React.FC<ReceiveListProps> = ({
    paginatedReceiveOrders,
    receiveOrdersTotalPages,
    filteredReceiveOrdersLength,
    receiveCurrentPage,
    setReceiveCurrentPage,
    jobs,
    receivedQuantities,
    setReprintItem,
    setSplitReceivingItem,
    setSplitReceivingPO,
    setSplitVariants,
    setIsSplitReceiving,
    allProducts,
    finalizedSkus,
    products,
    setReviewPO,
    setShowReviewModal,
    t,
    isSubmitting,
    itemsPerPage,
    user,
    employees,
    onAuthenticate
}) => {
    const { settings, effectiveCountry } = useData();
    const isBlindReceiving = resolveReceivingPolicy(settings, effectiveCountry).blind;
    const isMobile = useIsMobile();

    if (filteredReceiveOrdersLength === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-6 sm:py-16 text-center space-y-2 sm:space-y-4 bg-[var(--theme-bg-card)] border border-dashed border-[var(--theme-border)] rounded-xl sm:rounded-2xl shadow-xs">
                <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-secondary)]">
                    <Package size={20} className="sm:w-8 sm:h-8" />
                </div>
                <div>
                    <p className="text-xs sm:text-sm font-semibold text-[var(--theme-text-primary)]">
                        {t('warehouse.noApprovedManifests')}
                    </p>
                    <p className="text-[11px] sm:text-xs text-[var(--theme-text-secondary)] font-medium mt-0.5 sm:mt-1">
                        {t('warehouse.approvedManifestsWillAppear')}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 custom-scrollbar space-y-2 sm:space-y-4 pb-6">
            <div className="grid grid-cols-1 gap-2 sm:gap-4">
                {paginatedReceiveOrders.map(po => {
                    const isActiveReceiveJob = jobs.some(job =>
                        job.type === 'RECEIVE' &&
                        job.status === 'In-Progress' &&
                        (job.orderRef === po.id || job.orderRef === po.poNumber || job.orderRef === po.po_number)
                    );
                    const poJobs = jobs.filter(j => (j.orderRef === po.id || (po.po_number && j.orderRef === po.po_number) || (po.poNumber && j.orderRef === po.poNumber)) && j.type === 'PUTAWAY');
                    const receivedMaps = buildPOJobsReceivedMap(poJobs);
                    const allItemsReceived = (po.lineItems || []).length > 0 && po.lineItems.every(item => {
                        const progress = resolvePOLineItemProgress(item, receivedMaps, allProducts);
                        return progress.isComplete;
                    });

                    return (
                        <details
                            key={po.id}
                            open={!isMobile || isActiveReceiveJob}
                            className={`group bg-[var(--theme-bg-card)] p-2 sm:p-5 md:p-6 rounded-lg sm:rounded-2xl border transition-all shadow-xs ${
                                allItemsReceived
                                    ? 'border-emerald-500/40 dark:border-emerald-500/30 ring-1 ring-emerald-500/20'
                                    : isActiveReceiveJob
                                        ? 'border-[var(--theme-accent)]/60 bg-[var(--theme-accent)]/5 ring-1 ring-[var(--theme-accent)]/20'
                                    : 'border-[var(--theme-border)] hover:border-[var(--theme-border-strong)]'
                            }`}
                        >
                            <summary className="list-none cursor-pointer min-h-[44px] flex flex-col sm:flex-row justify-between items-start gap-1.5 sm:gap-2 md:gap-4 mb-1.5 sm:mb-5">
                                <div className="flex items-center gap-2.5 sm:gap-3.5 flex-1 min-w-0">
                                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                                        allItemsReceived
                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                            : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)]'
                                    }`}>
                                        <Layers size={20} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-base md:text-lg font-semibold text-[var(--theme-text-primary)] tracking-tight truncate">
                                            {po.supplierName}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <span className="text-[11px] text-[var(--theme-text-secondary)] font-mono tabular-nums">
                                                #{po.po_number || po.id.slice(0, 8)}
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-[var(--theme-border)]" />
                                            <span className="text-[11px] text-[var(--theme-text-secondary)] font-medium">
                                                {po.lineItems?.length || 0} {t('warehouse.itemPlural')}
                                            </span>
                                            {isActiveReceiveJob && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--theme-accent)] uppercase">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--theme-accent)]" />
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border shadow-xs transition-all ${
                                    allItemsReceived
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                        : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)]'
                                }`}>
                                    {allItemsReceived ? (
                                        <span className="inline-flex items-center gap-1.5">
                                            <CheckCircle size={13} />
                                            {t('warehouse.authenticated')}
                                        </span>
                                    ) : (
                                        t('warehouse.awaitingProcessing')
                                    )}
                                </div>
                            </summary>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 sm:gap-3 md:gap-4">
                                {(po.lineItems || []).map((item, idx) => {
                                    const progress = resolvePOLineItemProgress(item, receivedMaps, allProducts);
                                    const { effectiveReceived: receivedQty, expectedSellable, remaining: remainingQty, isComplete, product, resolvedSku } = progress;

                                    const employeeId = employees?.find((e: any) => e.email === user?.email || e.name === user?.name || e.id === user?.id)?.id;
                                    const isAssigned = jobs.some(j => 
                                        j.type === 'RECEIVE' && 
                                        j.orderRef === po.id && 
                                        j.assignedTo === employeeId &&
                                        !['completed', 'cancelled', 'deleted'].includes(j.status?.toLowerCase() || '')
                                    );
                                    const isAllowedToReceive = isAssigned || hasPermission(user?.role, 'RECEIVE_PO');

                                    return (
                                        <div
                                            key={item.productId || idx}
                                            className={`p-2 sm:p-4 rounded-lg sm:rounded-xl border transition-all ${
                                                isComplete
                                                    ? 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] opacity-75'
                                                    : 'bg-[var(--theme-bg-card)] border-[var(--theme-border)] hover:border-[var(--theme-border-strong)] shadow-[var(--shadow-sm)]'
                                            }`}
                                        >
                                            <div className="flex flex-col gap-1.5 sm:gap-4">
                                                <div className="flex justify-between items-start gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-xs font-semibold tracking-tight truncate ${
                                                            isComplete ? 'text-[var(--theme-text-secondary)]' : 'text-[var(--theme-text-primary)]'
                                                        }`}>
                                                            {formatPOItemDescription(item)}
                                                        </p>
                                                        {(() => {
                                                            const badge = formatPackBadge(item);
                                                            return badge ? (
                                                                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-semibold">
                                                                    {badge}
                                                                </span>
                                                            ) : null;
                                                        })()}
                                                        <p className="hidden sm:block text-[11px] text-[var(--theme-text-secondary)] font-mono mt-1">
                                                            SKU: {resolvedSku || finalizedSkus[item.productId || ''] || product?.sku || item.sku || 'PENDING'}
                                                        </p>
                                                        <ItemAttributeBadges item={item} allProducts={allProducts} className="mt-0.5 sm:mt-1.5" />
                                                    </div>
                                                    <div className="flex flex-col items-end shrink-0">
                                                        {(() => {
                                                            const itemUnit = getSellUnit(item.unit);
                                                            const sizeNum = parseFloat(item.size || '') || 0;
                                                            const category = item.category || product?.category || '';
                                                            const isDiscrete = isDiscreteGeneralMerch(category);
                                                            const isWeightOrVolume = (itemUnit.category === 'weight' || itemUnit.category === 'volume') && !isDiscrete;

                                                            if (isWeightOrVolume && sizeNum > 0) {
                                                                const label = itemUnit.shortLabel.toLowerCase();
                                                                return (
                                                                    <span className={`text-base font-semibold font-mono tabular-nums leading-none ${
                                                                        isComplete ? 'text-[var(--theme-text-secondary)]' : 'text-[var(--theme-text-primary)]'
                                                                    }`}>
                                                                        {receivedQty}
                                                                        {isBlindReceiving && !isComplete ? (
                                                                            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 ml-1">Blind</span>
                                                                        ) : (
                                                                            <span className="text-[var(--theme-text-secondary)]">/{expectedSellable}</span>
                                                                        )}
                                                                        <span className="text-[11px] font-normal text-[var(--theme-text-secondary)] ml-1">× {sizeNum}{label}</span>
                                                                    </span>
                                                                );
                                                            }

                                                            return (
                                                                <span className={`text-base sm:text-lg font-semibold font-mono tabular-nums leading-none ${
                                                                    isComplete ? 'text-[var(--theme-text-secondary)]' : 'text-[var(--theme-text-primary)]'
                                                                }`}>
                                                                    {receivedQty}
                                                                    {isBlindReceiving && !isComplete ? (
                                                                        <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 ml-1">Blind</span>
                                                                    ) : (
                                                                        <span className="text-[var(--theme-text-secondary)]">/{expectedSellable}</span>
                                                                    )}
                                                                </span>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>

                                                {!isBlindReceiving && (
                                                    <div className="hidden sm:block space-y-1.5">
                                                        <div className="flex justify-between items-center text-[11px] font-medium text-[var(--theme-text-secondary)]">
                                                            <span>{t('warehouse.inboundVelocity')}</span>
                                                            <span className="font-mono tabular-nums">
                                                                {isComplete ? t('warehouse.completePercent') : `${expectedSellable > 0 ? Math.min(100, Math.round((receivedQty / expectedSellable) * 100)) : 0}%`}
                                                            </span>
                                                        </div>
                                                        <ProgressBar
                                                            progress={expectedSellable > 0 ? Math.min(100, (receivedQty / expectedSellable) * 100) : 0}
                                                            containerClassName="h-1.5 bg-[var(--theme-bg-subtle)] rounded-full overflow-hidden"
                                                            fillClassName={`h-full transition-all duration-500 rounded-full ${
                                                                isComplete ? 'bg-emerald-500' : 'bg-[var(--theme-accent)]'
                                                            }`}
                                                        />
                                                    </div>
                                                )}

                                                {isComplete ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setReprintItem({
                                                            sku: resolvedSku || finalizedSkus[item.productId || ''] || product?.sku || item.sku || 'UNKNOWN',
                                                            name: item.productName,
                                                            qty: 1,
                                                            price: product?.retailPrice,
                                                            category: product?.category,
                                                            expiry: product?.expiryDate || '',
                                                            batchNumber: product?.batchNumber,
                                                            packQuantity: item.packQuantity || product?.packQuantity || 1,
                                                            poNumber: po.poNumber || po.po_number
                                                        })}
                                                        className="w-full min-h-[44px] bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-subtle)]/80 text-[var(--theme-text-primary)] border border-[var(--theme-border)] text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer touch-manipulation active:scale-[0.98]"
                                                    >
                                                        <Printer size={14} className="text-[var(--theme-text-secondary)]" />
                                                        {t('warehouse.reprintLabel')}
                                                    </button>
                                                ) : (
                                                    isAllowedToReceive ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const itemResolvedSku = item.sku
                                                                    || (item.productId ? (allProducts.find(p => p.id === item.productId)?.sku || '') : '')
                                                                    || allProducts.find(p => p.name === item.productName)?.sku
                                                                    || '';
                                                                const newBatch = generateBatchNumber({
                                                                    sku: itemResolvedSku,
                                                                    sequence: 1
                                                                });

                                                                const sellable = convertToSellableUnits(item.quantity, item);
                                                                const fullName = item.productName || '';

                                                                setSplitReceivingItem({
                                                                    ...item,
                                                                    quantity: sellable,
                                                                    orderedPackages: item.quantity,
                                                                    sku: itemResolvedSku,
                                                                    productName: fullName
                                                                });
                                                                setSplitReceivingPO(po);
                                                                setSplitVariants([{
                                                                    id: `variant-${Date.now()}`,
                                                                    sku: itemResolvedSku,
                                                                    skuType: 'existing',
                                                                    quantity: 0,
                                                                    productId: item.productId,
                                                                    productName: fullName,
                                                                    batchNumber: newBatch
                                                                }]);
                                                                setIsSplitReceiving(true);
                                                            }}
                                                            disabled={isSubmitting}
                                                            className="w-full min-h-[44px] sm:min-h-[48px] bg-[var(--theme-accent)] hover:opacity-90 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-[var(--shadow-sm)] active:scale-[0.98] transition-all cursor-pointer touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {isSubmitting ? (
                                                                <Loader2 size={16} className="animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <Plus size={16} />
                                                                    {t('warehouse.receiveAction')} {t('warehouse.itemSingular')}
                                                                </>
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <div className="w-full py-2.5 px-4 text-[var(--theme-text-secondary)] border border-dashed border-[var(--theme-border)] rounded-xl text-xs font-medium text-center bg-[var(--theme-bg-subtle)]">
                                                            {t('warehouse.accessRestricted')}
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {allItemsReceived && (
                                <div className="mt-5 pt-4 border-t border-[var(--theme-border)] flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                            <CheckCircle size={18} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-[var(--theme-text-primary)]">
                                                {t('warehouse.inboundVerified')}
                                            </p>
                                            <p className="text-[11px] text-[var(--theme-text-secondary)] font-medium">
                                                {t('warehouse.awaitingFinalManifest')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                                        <button
                                            type="button"
                                            onClick={() => { setReviewPO(po); setShowReviewModal(true); }}
                                            disabled={isSubmitting}
                                            className="px-4 py-2.5 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-subtle)]/80 text-[var(--theme-text-primary)] border border-[var(--theme-border)] text-xs font-semibold rounded-xl transition-all disabled:opacity-50 min-h-[44px] cursor-pointer touch-manipulation"
                                        >
                                            Review
                                        </button>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                if (onAuthenticate) {
                                                    await onAuthenticate(po.id);
                                                } else {
                                                    setReviewPO(po);
                                                    setShowReviewModal(true);
                                                }
                                            }}
                                            disabled={isSubmitting}
                                            className="flex-1 sm:flex-initial px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-[var(--shadow-sm)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px] cursor-pointer touch-manipulation"
                                        >
                                            {isSubmitting ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <>
                                                    {t('warehouse.authenticateManifest')}
                                                    <CheckCircle size={15} />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </details>
                    );
                })}
            </div>
            <div className="pt-4 border-t border-[var(--theme-border)]">
                <Pagination
                    currentPage={receiveCurrentPage}
                    totalPages={receiveOrdersTotalPages}
                    totalItems={filteredReceiveOrdersLength}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setReceiveCurrentPage}
                    itemName="manifests"
                />
            </div>
        </div>
    );
};
