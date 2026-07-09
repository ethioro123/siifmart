import React from 'react';
import { Package, Layers, CheckCircle, Printer, Plus, Loader2 } from 'lucide-react';
import { PurchaseOrder, WMSJob, Product } from '../../../types';
import { ProgressBar } from '../../shared/ProgressBar';
import Pagination from '../../shared/Pagination';
import { formatPOItemDescription, formatPackBadge } from '../../procurement/utils';
import { getSellUnit } from '../../../utils/units';
import { hasPermission } from '../../../utils/permissions';

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
    employees
}) => {

    if (filteredReceiveOrdersLength === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center space-y-4 glass-panel border-dashed border-2 shadow-sm">
                <div className="p-6 md:p-8 bg-[#FAF8F5]/80 dark:bg-[#1C2620]/30 rounded-full border border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] shadow-inner">
                    <Package size={48} className="text-slate-300 dark:text-zinc-700" />
                </div>
                <div>
                    <p className="text-slate-900 dark:text-white font-black uppercase tracking-[0.2em] text-sm">{t('warehouse.noApprovedManifests')}</p>
                    <p className="text-slate-500 dark:text-zinc-500 font-black uppercase tracking-widest text-[9px] mt-2">{t('warehouse.approvedManifestsWillAppear')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 pb-6">
            <div className="grid grid-cols-1 gap-4">
                {paginatedReceiveOrders.map(po => {
                    const poJobs = jobs.filter(j => (j.orderRef === po.id || (po.po_number && j.orderRef === po.po_number) || (po.poNumber && j.orderRef === po.poNumber)) && j.type === 'PUTAWAY');
                    const receivedMap: Record<string, number> = {};
                    const jobSkuMap: Record<string, string> = {};
                    poJobs.forEach(job => {
                        job.lineItems.forEach((ji: any) => {
                            if (ji.productId) {
                                receivedMap[ji.productId] = (receivedMap[ji.productId] || 0) + (ji.expectedQty || 0);
                            }
                            if (ji.sku) {
                                receivedMap[ji.sku] = (receivedMap[ji.sku] || 0) + (ji.expectedQty || 0);
                            }
                            if (ji.productId && ji.sku) {
                                jobSkuMap[ji.productId] = ji.sku;
                                jobSkuMap[ji.sku] = ji.sku;
                            }
                        });
                    });
                    const allItemsReceived = po.lineItems?.every(item => {
                        const dbReceived = item.receivedQty || 0;
                        const product = allProducts.find(p => p.id === item.productId || (item.sku && p.sku === item.sku));
                        const candidateKeys = [
                            item.productId,
                            item.sku,
                            product?.id,
                            product?.sku
                        ].filter(Boolean) as string[];
                        
                        const mapReceived = candidateKeys.length > 0 
                            ? candidateKeys.reduce((max, k) => Math.max(max, receivedMap[k] || 0), 0)
                            : 0;
                        return Math.max(dbReceived, mapReceived) >= item.quantity;
                    }) || false;

                    return (
                        <div key={po.id} className={`group glass-panel p-4 md:p-6 relative overflow-hidden active:scale-[0.995] ${allItemsReceived ? 'border-[#2C5E3B] dark:border-[#A9CBA2]' : 'hover:border-[#2C5E3B]/40 dark:hover:border-[#A9CBA2]/30 hover:shadow-[0_8px_30px_rgba(44,94,59,0.05)]'}`}>
                            {/* 🌟 Card Ambient Glow — hidden on mobile */}
                            <div className="hidden md:block absolute -top-24 -right-24 w-48 h-48 bg-[#2C5E3B]/10 dark:bg-[#1E3F27]/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 md:gap-4 mb-4 md:mb-6 relative z-10">
                                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                                    <div className={`hidden md:flex p-3.5 rounded-2xl flex-shrink-0 transition-all duration-500 ${allItemsReceived ? 'bg-[#2C5E3B] dark:bg-[#EAE5D9] scale-110 shadow-lg text-[#FAF8F5] dark:text-[#1E3B24]' : 'bg-stone-50 dark:bg-white/5 group-hover:bg-[#2C5E3B]/10 group-hover:dark:bg-[#A9CBA2]/10 border border-stone-200 dark:border-white/5'}`}>
                                        <Layers size={20} className={allItemsReceived ? 'text-[#FAF8F5] dark:text-[#1E3B24]' : 'text-stone-400 dark:text-stone-500 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2]'} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-base md:text-xl font-black text-[#1E3F27] dark:text-[#EAE5D9] uppercase tracking-tight truncate drop-shadow-sm">{po.supplierName}</h3>
                                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                            <span className="text-[10px] text-stone-500 dark:text-stone-400 font-black uppercase tracking-widest font-mono">#{po.po_number || po.id.slice(0, 8)}</span>
                                            <span className="w-1 h-1 rounded-full bg-stone-300 dark:bg-stone-800" />
                                            <span className="text-[10px] text-[#1E3F27] dark:text-[#EAE5D9] font-black uppercase tracking-widest">{po.lineItems?.length || 0} {t('warehouse.itemPlural')}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm transition-all ${allItemsReceived ? 'text-[#1E3F27] dark:text-[#EAE5D9] border-[#2C5E3B]/40 dark:border-[#A9CBA2]/30 bg-white/50 dark:bg-white/10' : 'text-stone-400 dark:text-stone-500 border-stone-200 dark:border-white/5 bg-stone-50/50 dark:bg-black/20 group-hover:border-[#2C5E3B]/40 dark:group-hover:border-[#A9CBA2]/30'}`}>
                                    {allItemsReceived ? `✓ ${t('warehouse.authenticated')}` : t('warehouse.awaitingProcessing')}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 relative z-10">
                                {(po.lineItems || []).map((item, idx) => {
                                    const dbReceivedQty = item.receivedQty || 0;
                                    const product = allProducts.find(p => p.id === item.productId || (item.sku && p.sku === item.sku));
                                    const candidateKeys = [
                                        item.productId,
                                        item.sku,
                                        product?.id,
                                        product?.sku
                                    ].filter(Boolean) as string[];
                                    
                                    const mapReceivedQty = candidateKeys.length > 0 
                                        ? candidateKeys.reduce((max, k) => Math.max(max, receivedMap[k] || 0), 0)
                                        : 0;
                                    const receivedQty = Math.max(dbReceivedQty, mapReceivedQty);
                                    const remainingQty = Math.max(0, item.quantity - receivedQty);
                                    const isComplete = remainingQty <= 0;

                                    const employeeId = employees?.find((e: any) => e.email === user?.email || e.name === user?.name || e.id === user?.id)?.id;
                                    const isAssigned = jobs.some(j => 
                                        j.type === 'RECEIVE' && 
                                        j.orderRef === po.id && 
                                        j.assignedTo === employeeId &&
                                        !['completed', 'cancelled', 'deleted'].includes(j.status?.toLowerCase() || '')
                                    );
                                    const isAllowedToReceive = isAssigned || hasPermission(user?.role, 'RECEIVE_PO');

                                    return (
                                        <div key={item.productId || idx} className={`p-4 md:p-5 rounded-xl border transition-all group/item ${isComplete ? 'glass-panel-pushed opacity-60 shadow-inner' : 'bg-[#FAF8F5]/85 dark:bg-[#1C2620]/30 border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] shadow-sm hover:border-[#2C5E3B]/40 dark:hover:border-[#A9CBA2]/30 active:scale-[0.99] cursor-pointer'}`}>
                                            <div className="flex flex-col gap-5">
                                                <div className="flex justify-between items-start gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-[11px] md:text-xs font-black uppercase tracking-tight truncate ${isComplete ? 'text-stone-400 dark:text-stone-500' : 'text-slate-900 dark:text-white'}`}>{formatPOItemDescription(item)}</p>
                                                        {(() => {
                                                            const badge = formatPackBadge(item);
                                                            return badge ? (
                                                                <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest">
                                                                    {badge}
                                                                </span>
                                                            ) : null;
                                                        })()}
                                                        <p className="text-[9px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-[0.2em] mt-1.5 font-mono">
                                                            SKU: {jobSkuMap[item.productId || ''] || finalizedSkus[item.productId || ''] || product?.sku || item.sku || 'PENDING'}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col items-end flex-shrink-0">
                                                        {(() => {
                                                            const itemUnit = getSellUnit(item.unit);
                                                            const sizeNum = parseFloat(item.size || '') || 0;
                                                            const isWeightOrVolume = itemUnit.category === 'weight' || itemUnit.category === 'volume';

                                                            if (isWeightOrVolume && sizeNum > 0) {
                                                                const label = itemUnit.shortLabel.toLowerCase();
                                                                return (
                                                                    <span className={`text-lg font-black tabular-nums tracking-tighter leading-none ${isComplete ? 'text-stone-400 dark:text-stone-500' : 'text-slate-900 dark:text-white'}`}>
                                                                        {receivedQty}<span className="text-stone-400 dark:text-stone-600">/{item.quantity}</span>
                                                                        <span className="text-[10px] font-black text-stone-400 dark:text-stone-500 ml-1 uppercase">× {sizeNum}{label}</span>
                                                                    </span>
                                                                );
                                                            }

                                                            return (
                                                                <span className={`text-xl font-black tabular-nums tracking-tighter leading-none ${isComplete ? 'text-stone-400 dark:text-stone-500' : 'text-[#1E3F27] dark:text-[#A9CBA2]'}`}>
                                                                    {receivedQty}<span className="text-stone-400 dark:text-stone-600">/{item.quantity}</span>
                                                                </span>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center px-1">
                                                        <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">{t('warehouse.inboundVelocity')}</span>
                                                        <span className={`text-[8px] font-black uppercase tracking-widest ${isComplete ? 'text-stone-400' : 'text-[#2C5E3B] dark:text-[#A9CBA2]'}`}>{isComplete ? t('warehouse.completePercent') : `${Math.round((receivedQty / item.quantity) * 100)}${t('warehouse.receivedPercent')}`}</span>
                                                    </div>
                                                    <ProgressBar
                                                        progress={(receivedQty / item.quantity) * 100}
                                                        containerClassName="h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden"
                                                        fillClassName={`h-full transition-all duration-700 relative ${isComplete ? 'bg-[#224429] dark:bg-[#EAE5D9]' : 'bg-[#2C5E3B] dark:bg-[#A9CBA2] shadow-[0_0_8px_rgba(44,94,59,0.3)]'}`}
                                                    />
                                                </div>
                                                {
                                                    isComplete ? (
                                                        <button onClick={() => setReprintItem({
                                                            sku: jobSkuMap[item.productId || ''] || finalizedSkus[item.productId || ''] || product?.sku || item.sku || 'UNKNOWN',
                                                            name: item.productName,
                                                            qty: 1,
                                                            price: product?.retailPrice,
                                                            category: product?.category,
                                                            expiry: ''
                                                        })} className="w-full woody-btn-secondary h-10 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm">
                                                            <Printer size={14} className="text-[#4D6E56] dark:text-zinc-500" /> {t('warehouse.reprintLabel')}
                                                        </button>
                                                    ) : (
                                                        isAllowedToReceive ? (
                                                            <button onClick={() => {
                                                                const now = new Date();
                                                                const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
                                                                const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
                                                                const newBatch = `BN-${dateStr}-${randomStr}`;

                                                                const resolvedSku = item.sku
                                                                    || (item.productId ? (allProducts.find(p => p.id === item.productId)?.sku || '') : '')
                                                                    || allProducts.find(p => p.name === item.productName)?.sku
                                                                    || '';

                                                                let fullName = item.productName || '';

                                                                setSplitReceivingItem({
                                                                    ...item,
                                                                    sku: resolvedSku,
                                                                    productName: fullName
                                                                });
                                                                setSplitReceivingPO(po);
                                                                setSplitVariants([{
                                                                    id: `variant-${Date.now()}`,
                                                                    sku: resolvedSku,
                                                                    skuType: 'existing',
                                                                    quantity: 0,
                                                                    productId: item.productId,
                                                                    productName: fullName,
                                                                    batchNumber: newBatch
                                                                }]);
                                                                setIsSplitReceiving(true);
                                                            }}
                                                                disabled={isSubmitting}
                                                                className="w-full h-12 md:h-11 bg-[#224429] dark:bg-[#EAE5D9] hover:bg-[#1B3520] dark:hover:bg-[#DFD9CA] text-[#FAF8F5] dark:text-[#1E3B24] text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all border border-transparent dark:border-[#EAE5D9]/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                                                {isSubmitting ? (
                                                                    <Loader2 size={16} className="animate-spin" />
                                                                ) : (
                                                                    <>
                                                                        <Plus size={16} /> {t('warehouse.receiveAction')} {t('warehouse.itemSingular')}
                                                                    </>
                                                                )}
                                                            </button>
                                                        ) : (
                                                            <div className="w-full py-3 px-4 text-stone-500 dark:text-zinc-550 border border-dashed border-stone-200 dark:border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-center bg-stone-50/50 dark:bg-black/20">
                                                                {t('warehouse.accessRestricted')}
                                                            </div>
                                                        )
                                                    )
                                                }
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {
                                allItemsReceived && (
                                    <div className="mt-4 md:mt-8 pt-4 md:pt-8 border-t-2 border-stone-200 dark:border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 md:gap-6 relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-[#2C5E3B] dark:bg-zinc-800 rounded-xl shadow-lg border border-[#1E3F27] dark:border-zinc-700">
                                                <CheckCircle size={20} className="text-white dark:text-[#A9CBA2]" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-[#1E3F27] dark:text-white uppercase tracking-[0.2em] leading-none mb-1">{t('warehouse.inboundVerified')}</p>
                                                <p className="text-[9px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-widest">{t('warehouse.awaitingFinalManifest')}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { setReviewPO(po); setShowReviewModal(true); }}
                                            disabled={isSubmitting}
                                            className="w-full sm:w-auto px-10 py-4 bg-[#224429] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] hover:bg-[#1B3520] dark:hover:bg-[#DFD9CA] text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-sm active:scale-[0.98] transition-all border border-transparent dark:border-[#EAE5D9]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3">
                                            {isSubmitting ? (
                                                <Loader2 size={18} className="animate-spin" />
                                            ) : (
                                                <>
                                                    {t('warehouse.authenticateManifest')}
                                                    <CheckCircle size={16} />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )
                            }
                        </div>
                    );
                })}
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                <Pagination currentPage={receiveCurrentPage} totalPages={receiveOrdersTotalPages} totalItems={filteredReceiveOrdersLength} itemsPerPage={itemsPerPage} onPageChange={setReceiveCurrentPage} itemName="manifests" />
            </div>
        </div>
    );
};
