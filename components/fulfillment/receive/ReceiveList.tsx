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
            <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center space-y-4 bg-white dark:bg-black rounded-2xl md:rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10 shadow-sm transition-all">
                <div className="p-6 md:p-8 bg-slate-50 dark:bg-white/[0.05] rounded-full border border-slate-100 dark:border-white/5 shadow-inner">
                    <Package size={48} className="text-slate-300 dark:text-zinc-700" />
                </div>
                <div>
                    <p className="text-slate-900 dark:text-white font-black uppercase tracking-[0.2em] text-sm">{t('warehouse.noApprovedManifests') || 'No Active Manifests'}</p>
                    <p className="text-slate-500 dark:text-zinc-500 font-black uppercase tracking-widest text-[9px] mt-2">{t('warehouse.approvedManifestsWillAppear') || 'Approved manifests will appear here in real-time'}</p>
                </div>
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
                    const allItemsReceived = po.lineItems?.every(item => {
                        const dbReceived = item.receivedQty || 0;
                        const mapReceived = item.productId ? (receivedMap[item.productId] || 0) : 0;
                        return Math.max(dbReceived, mapReceived) >= item.quantity;
                    }) || false;

                    return (
                        <div key={po.id} className={`group bg-white dark:bg-black/40 backdrop-blur-sm border-2 rounded-xl md:rounded-2xl p-4 md:p-6 transition-all relative overflow-hidden shadow-sm hover:shadow-cyan-500/10 active:scale-[0.995] ${allItemsReceived ? 'border-slate-900 dark:border-white/10' : 'border-slate-200 dark:border-white/5 hover:border-cyan-500/30 dark:hover:border-cyan-400/30'}`}>
                            {/* 🌟 Card Ambient Glow — hidden on mobile */}
                            <div className="hidden md:block absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/5 dark:bg-cyan-500/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 md:gap-4 mb-4 md:mb-6 relative z-10">
                                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                                    <div className={`hidden md:flex p-3.5 rounded-2xl flex-shrink-0 transition-all duration-500 ${allItemsReceived ? 'bg-slate-900 dark:bg-white scale-110 shadow-lg' : 'bg-slate-50 dark:bg-white/5 group-hover:bg-cyan-500/10 border border-slate-100 dark:border-white/5'}`}>
                                        <Layers size={20} className={allItemsReceived ? 'text-white dark:text-black' : 'text-slate-400 dark:text-zinc-600 group-hover:text-cyan-400'} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-base md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight truncate drop-shadow-sm">{po.supplierName}</h3>
                                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                            <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-black uppercase tracking-widest font-mono">#{po.po_number || po.id.slice(0, 8)}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-zinc-800" />
                                            <span className="text-[10px] text-slate-900 dark:text-zinc-300 font-black uppercase tracking-widest">{po.lineItems?.length || 0} Line Items</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm transition-all ${allItemsReceived ? 'text-slate-900 dark:text-white border-slate-900 dark:border-white/20 bg-white dark:bg-white/10' : 'text-slate-400 dark:text-zinc-500 border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20 group-hover:border-cyan-500/50'}`}>
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
                                        <div key={item.productId || idx} className={`p-4 md:p-5 rounded-xl border transition-all group/item ${isComplete ? 'bg-slate-50 dark:bg-zinc-900/10 opacity-60 border-slate-200 dark:border-zinc-800/40 shadow-inner' : 'bg-white dark:bg-black/30 border-slate-200 dark:border-white/10 shadow-sm hover:border-cyan-500/30 active:scale-[0.99] cursor-pointer'}`}>
                                            <div className="flex flex-col gap-5">
                                                <div className="flex justify-between items-start gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-[11px] md:text-xs font-black uppercase tracking-tight truncate ${isComplete ? 'text-slate-400 dark:text-zinc-600' : 'text-slate-900 dark:text-white'}`}>{formatPOItemDescription(item)}</p>
                                                        <p className="text-[9px] text-slate-400 dark:text-zinc-500 font-black uppercase tracking-[0.2em] mt-1.5 font-mono">
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
                                                                    <span className={`text-lg font-black tabular-nums tracking-tighter leading-none ${isComplete ? 'text-slate-400 dark:text-zinc-600' : 'text-slate-900 dark:text-white'}`}>
                                                                        {receivedQty}<span className="text-slate-400 dark:text-zinc-700">/{item.quantity}</span>
                                                                        <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 ml-1 uppercase">× {sizeNum}{label}</span>
                                                                    </span>
                                                                );
                                                            }

                                                            return (
                                                                <span className={`text-xl font-black tabular-nums tracking-tighter leading-none ${isComplete ? 'text-slate-400 dark:text-zinc-600' : 'text-slate-900 dark:text-cyan-400'}`}>
                                                                    {receivedQty}<span className="text-slate-400 dark:text-zinc-700">/{item.quantity}</span>
                                                                </span>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center px-1">
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Inbound Velocity</span>
                                                        <span className={`text-[8px] font-black uppercase tracking-widest ${isComplete ? 'text-slate-400' : 'text-cyan-500'}`}>{isComplete ? '100% COMPLETE' : `${Math.round((receivedQty / item.quantity) * 100)}% RECEIVED`}</span>
                                                    </div>
                                                    <ProgressBar
                                                        progress={(receivedQty / item.quantity) * 100}
                                                        containerClassName="h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden"
                                                        fillClassName={`h-full transition-all duration-700 relative ${isComplete ? 'bg-slate-900 dark:bg-white' : 'bg-cyan-500 dark:bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]'}`}
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
                                                        })} className="w-full h-10 bg-slate-100 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-200 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-all shadow-sm">
                                                            <Printer size={14} className="text-slate-600 dark:text-zinc-500" /> Reprint Label
                                                        </button>
                                                    ) : (
                                                        <Protected permission="RECEIVE_PO">
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
                                                                className="w-full h-12 md:h-11 bg-cyan-500 dark:bg-cyan-500 text-white dark:text-black hover:bg-cyan-600 dark:hover:bg-cyan-400 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-md dark:shadow-cyan-500/20 active:scale-[0.98] transition-all border border-cyan-400 dark:border-cyan-400/30 disabled:opacity-50 disabled:cursor-not-allowed">
                                                                {isSubmitting ? (
                                                                    <Loader2 size={16} className="animate-spin" />
                                                                ) : (
                                                                    <>
                                                                        <Plus size={16} /> Receive Item
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
                                    <div className="mt-4 md:mt-8 pt-4 md:pt-8 border-t-2 border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 md:gap-6 relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-slate-900 dark:bg-zinc-800 rounded-xl shadow-lg border border-slate-800 dark:border-zinc-700">
                                                <CheckCircle size={20} className="text-white dark:text-cyan-400" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] leading-none mb-1">Inbound Verified</p>
                                                <p className="text-[9px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest">Awaiting final manifest authentication</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { setReviewPO(po); setShowReviewModal(true); }}
                                            disabled={isSubmitting}
                                            className="w-full sm:w-auto px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-gray-100 text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl active:scale-[0.98] transition-all border border-slate-800 dark:border-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3">
                                            {isSubmitting ? (
                                                <Loader2 size={18} className="animate-spin" />
                                            ) : (
                                                <>
                                                    Authenticate Manifest
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
