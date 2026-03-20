import React from 'react';
import { Package, Layers, CheckCircle, Printer, Plus, Loader2 } from 'lucide-react';
import { PurchaseOrder, WMSJob, Product } from '../../../types';
import { ProgressBar } from '../../shared/ProgressBar';
import Pagination from '../../shared/Pagination';
import { Protected } from '../../Protected';
import { formatPOItemDescription } from '../../procurement/utils';
import { getSellUnit } from '../../../utils/units';

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
    itemsPerPage
}) => {

    if (filteredReceiveOrdersLength === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center space-y-4 bg-white dark:bg-black rounded-2xl md:rounded-3xl border-2 border-dashed border-zinc-300 dark:border-white/10 shadow-sm">
                <div className="p-6 md:p-8 bg-zinc-50 dark:bg-white/[0.05] rounded-full border border-zinc-200 dark:border-white/5 shadow-inner">
                    <Package size={48} className="text-zinc-600 dark:text-zinc-600" />
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 font-black uppercase tracking-widest text-xs mt-4">{t('warehouse.noApprovedPOs')}</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 pb-6">
            <div className="grid grid-cols-1 gap-4">
                {paginatedReceiveOrders.map(po => {
                    const poJobs = jobs.filter(j => j.orderRef === po.id && j.type === 'PUTAWAY');
                    const receivedMap: Record<string, number> = {};
                    const jobSkuMap: Record<string, string> = {};
                    poJobs.forEach(job => {
                        job.lineItems.forEach((item: any) => {
                            if (item.productId) {
                                receivedMap[item.productId] = (receivedMap[item.productId] || 0) + (item.expectedQty || 0);
                                if (item.sku) jobSkuMap[item.productId] = item.sku;
                            }
                        });
                    });
                    console.log('🔍 [ReceiveList] poJobs for', po.id.slice(0, 8), ':', poJobs.length, 'jobs');
                    const allItemsReceived = po.lineItems?.every(item => {
                        const dbReceived = item.receivedQty || 0;
                        const mapReceived = item.productId ? (receivedMap[item.productId] || 0) : 0;
                        return Math.max(dbReceived, mapReceived) >= item.quantity;
                    }) || false;

                    return (
                        <div key={po.id} className={`group bg-white dark:bg-black/40 backdrop-blur-sm border-2 rounded-xl md:rounded-2xl p-3 md:p-6 transition-all relative overflow-hidden shadow-sm hover:shadow-cyan-500/10 active:scale-[0.99] ${allItemsReceived ? 'border-zinc-950 dark:border-white/10' : 'border-zinc-200 dark:border-white/5 hover:border-cyan-500/30 dark:hover:border-cyan-400/30'}`}>
                            {/* 🌟 Card Ambient Glow — hidden on mobile */}
                            <div className="hidden md:block absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/5 dark:bg-cyan-500/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 md:gap-4 mb-3 md:mb-5 relative z-10">
                                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                                    <div className={`hidden md:flex p-3 rounded-xl flex-shrink-0 transition-all duration-500 ${allItemsReceived ? 'bg-zinc-100 dark:bg-zinc-200 scale-110 shadow-md' : 'bg-zinc-50 dark:bg-white/5 group-hover:bg-cyan-500/10'}`}>
                                        <Layers size={20} className={allItemsReceived ? 'text-zinc-950 dark:text-zinc-900' : 'text-zinc-900 dark:text-zinc-400 group-hover:text-cyan-400'} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-base md:text-lg font-black text-zinc-950 dark:text-zinc-200 uppercase tracking-tight truncate">{po.supplierName}</h3>
                                        <p className="text-[10px] text-zinc-600 dark:text-zinc-500 font-black uppercase tracking-widest mt-1 font-mono">#{po.po_number || po.id.slice(0, 8)} • <span className="text-zinc-900 dark:text-zinc-400">{po.lineItems?.length || 0} Items</span></p>
                                    </div>
                                </div>
                                <div className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm transition-all ${allItemsReceived ? 'text-zinc-950 dark:text-white border-zinc-950 dark:border-white/20 bg-white dark:bg-white/10' : 'text-zinc-600 dark:text-zinc-500 border-zinc-300 dark:border-white/5 bg-zinc-50/50 dark:bg-black/20 group-hover:border-cyan-500/50'}`}>
                                    {allItemsReceived ? '✓ Authenticated' : 'Awaiting Processing'}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 relative z-10">
                                {(po.lineItems || []).map((item, idx) => {
                                    const dbReceivedQty = item.receivedQty || 0;
                                    const mapReceivedQty = item.productId ? (receivedMap[item.productId] || 0) : 0;
                                    const receivedQty = Math.max(dbReceivedQty, mapReceivedQty);
                                    const remainingQty = Math.max(0, item.quantity - receivedQty);
                                    const isComplete = remainingQty <= 0;
                                    const product = products.find(p => p.id === item.productId);

                                    return (
                                        <div key={item.productId || idx} className={`p-3 md:p-4 rounded-lg md:rounded-xl border-2 transition-all group/item ${isComplete ? 'bg-zinc-50 dark:bg-zinc-900/10 opacity-60 border-zinc-200 dark:border-zinc-800/40' : 'bg-white dark:bg-black/30 border-zinc-200 dark:border-white/10 shadow-sm hover:border-cyan-500/20'}`}>
                                            <div className="flex flex-col gap-4">
                                                <div className="flex justify-between items-start gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-[11px] font-black uppercase tracking-tight truncate ${isComplete ? 'text-zinc-400 dark:text-zinc-600' : 'text-zinc-900 dark:text-zinc-200'}`}>{formatPOItemDescription(item)}</p>
                                                        <p className="hidden md:block text-[9px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-[0.2em] mt-0.5">
                                                            {jobSkuMap[item.productId || ''] || finalizedSkus[item.productId || ''] || product?.sku || item.sku || 'PENDING'}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col items-end flex-shrink-0">
                                                        {(() => {
                                                            const itemUnit = getSellUnit(item.unit);
                                                            const sizeNum = parseFloat(item.size || '') || 0;
                                                            const isWeightOrVolume = itemUnit.category === 'weight' || itemUnit.category === 'volume';

                                                            if (isWeightOrVolume && sizeNum > 0) {
                                                                // Show as: received/ordered × size+unit  (e.g. 0/30 × 400g)
                                                                const label = itemUnit.shortLabel.toLowerCase();
                                                                return (
                                                                    <span className={`text-lg font-black tabular-nums tracking-tighter ${isComplete ? 'text-zinc-400 dark:text-zinc-600' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                                                        {receivedQty}<span className="text-zinc-400">/{item.quantity}</span>
                                                                        <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 ml-1">× {sizeNum}{label}</span>
                                                                    </span>
                                                                );
                                                            }

                                                            // Count-based: just show raw numbers
                                                            return (
                                                                <span className={`text-lg font-black tabular-nums tracking-tighter ${isComplete ? 'text-zinc-400 dark:text-zinc-600' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                                                    {receivedQty}<span className="text-zinc-400">/{item.quantity}</span>
                                                                </span>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <ProgressBar
                                                        progress={(receivedQty / item.quantity) * 100}
                                                        containerClassName="h-1.5 bg-zinc-200 dark:bg-white/5 rounded-full overflow-hidden"
                                                        fillClassName={`h-full transition-all duration-700 relative ${isComplete ? 'bg-zinc-950 dark:bg-white' : 'bg-cyan-500 dark:bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]'}`}
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
                                                        })} className="w-full h-8 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-300 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
                                                            <Printer size={12} className="text-zinc-900 dark:text-zinc-500" /> Reprint
                                                        </button>
                                                    ) : (
                                                        <Protected permission="RECEIVE_PO">
                                                            <button onClick={() => {
                                                                const now = new Date();
                                                                const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
                                                                const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
                                                                const newBatch = `BN-${dateStr}-${randomStr}`;

                                                                // Look up SKU from product catalog if PO item doesn't have one
                                                                const resolvedSku = item.sku
                                                                    || (item.productId ? (allProducts.find(p => p.id === item.productId)?.sku || '') : '')
                                                                    || allProducts.find(p => p.name === item.productName)?.sku
                                                                    || '';

                                                                // Just use the exact name saved on the PO
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
                                                                    quantity: remainingQty,
                                                                    productId: item.productId,
                                                                    productName: fullName,
                                                                    batchNumber: newBatch
                                                                }]);
                                                                setIsSplitReceiving(true);
                                                            }}
                                                                disabled={isSubmitting}
                                                                className="w-full h-12 md:h-10 bg-zinc-100 dark:bg-cyan-500 text-zinc-950 dark:text-black hover:bg-zinc-200 dark:hover:bg-cyan-400 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-1.5 shadow-sm dark:shadow-cyan-500/20 active:scale-[0.98] transition-all border border-zinc-300 dark:border-cyan-400/30 disabled:opacity-50 disabled:cursor-not-allowed">
                                                                {isSubmitting ? (
                                                                    <Loader2 size={14} className="animate-spin" />
                                                                ) : (
                                                                    <>
                                                                        <Plus size={14} /> Receive Item
                                                                    </>
                                                                )}
                                                            </button>
                                                        </Protected>
                                                    )
                                                }
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {
                                allItemsReceived && (
                                    <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-zinc-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3 md:gap-4 relative z-10">
                                        <div className="flex items-center gap-3 text-zinc-900 dark:text-zinc-300">
                                            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                                                <CheckCircle size={18} className="text-zinc-950 dark:text-zinc-400" />
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Inbound Authenticated</p>
                                        </div>
                                        <button
                                            onClick={() => { setReviewPO(po); setShowReviewModal(true); }}
                                            disabled={isSubmitting}
                                            className="w-full sm:w-auto px-8 py-3 bg-zinc-100 dark:bg-white text-zinc-950 dark:text-black hover:bg-zinc-200 dark:hover:bg-zinc-50 text-xs font-black uppercase tracking-widest rounded-xl shadow-md active:scale-[0.98] transition-all border border-zinc-300 dark:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                                            {isSubmitting ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                'Finalize Manifest'
                                            )}
                                        </button>
                                    </div>
                                )
                            }
                        </div>
                    );
                })}
            </div>
            <Pagination currentPage={receiveCurrentPage} totalPages={receiveOrdersTotalPages} totalItems={filteredReceiveOrdersLength} itemsPerPage={itemsPerPage} onPageChange={setReceiveCurrentPage} itemName="orders" />
        </div>
    );
};
