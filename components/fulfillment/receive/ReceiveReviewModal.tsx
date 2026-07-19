import React, { useMemo } from 'react';
import { X, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { PurchaseOrder, WMSJob } from '../../../types';
import { useFulfillment } from '../../fulfillment/FulfillmentContext';

interface ReceiveReviewModalProps {
    po: PurchaseOrder;
    jobs: WMSJob[];
    onClose: () => void;
    onFinalize: () => void;
    isSubmitting: boolean;
    t: (key: string) => string;
}

export const ReceiveReviewModal: React.FC<ReceiveReviewModalProps> = ({
    po,
    jobs,
    onClose,
    onFinalize,
    isSubmitting,
    t
}) => {
    const { allProducts } = useFulfillment();

    // Calculate stats
    const stats = useMemo(() => {
        const poJobs = jobs.filter(j => (j.orderRef === po.id || (po.po_number && j.orderRef === po.po_number) || (po.poNumber && j.orderRef === po.poNumber)) && j.type === 'PUTAWAY');
        const receivedMap: Record<string, number> = {};

        poJobs.forEach(job => {
            job.lineItems.forEach(item => {
                if (item.productId) {
                    receivedMap[item.productId] = (receivedMap[item.productId] || 0) + (item.expectedQty || item.receivedQty || 0);
                }
                if (item.sku) {
                    receivedMap[item.sku] = (receivedMap[item.sku] || 0) + (item.expectedQty || item.receivedQty || 0);
                }
            });
        });

        let totalExpected = 0;
        let totalReceived = 0;
        const details = (po.lineItems || []).map(item => {
            const product = allProducts.find(p => p.id === item.productId || (item.sku && p.sku === item.sku));
            const candidateKeys = [
                item.productId,
                item.sku,
                product?.id,
                product?.sku
            ].filter(Boolean) as string[];
            
            const received = candidateKeys.length > 0 
                ? candidateKeys.reduce((max, k) => Math.max(max, receivedMap[k] || 0), 0)
                : 0;

            totalExpected += item.quantity;
            totalReceived += received;
            return {
                ...item,
                received,
                status: received >= item.quantity ? 'Complete' : received > 0 ? 'Partial' : 'Pending'
            };
        });

        return { totalExpected, totalReceived, details };
    }, [po, jobs, allProducts]);

    const isFullyReceived = stats.totalReceived >= stats.totalExpected;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-2 sm:p-4 z-50 overflow-x-hidden animate-in fade-in duration-200">
            <div className="glass-panel rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] relative">
                {/* 🌟 Modal Ambient Glow — hidden on mobile */}
                <div className="hidden md:block absolute -top-24 -right-24 w-64 h-64 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/5 blur-[100px] rounded-full pointer-events-none" />
                <div className="hidden md:block absolute -bottom-24 -left-24 w-64 h-64 bg-amber-600/10 dark:bg-amber-700/5 blur-[100px] rounded-full pointer-events-none" />

                {/* Header */}
                <div className="p-4 md:p-6 border-b border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] flex justify-between items-start bg-[#FAF8F5] dark:bg-[#1C2620]">
                    <div>
                        <h3 className="text-base md:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 md:gap-3 uppercase tracking-tight">
                            <FileText className="text-[#2C5E3B] dark:text-[#A9CBA2]" size={20} />
                            {t('warehouse.finalizeManifest')}
                        </h3>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-black uppercase tracking-widest mt-1.5 font-mono">
                            Manifest #{po.poNumber} • <span className="text-[#2C5E3B] dark:text-[#A9CBA2]">{po.supplierName}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" aria-label="Close">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 custom-scrollbar bg-[#FAF8F5]/30 dark:bg-[#18201B]/30">

                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <div className="p-3 md:p-5 glass-panel-pushed text-center shadow-sm">
                            <p className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-black tracking-widest mb-1.5">{t('warehouse.totalOrdered')}</p>
                            <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tabular-nums font-mono leading-none">{stats.totalExpected}</p>
                        </div>
                        <div className={`p-3 md:p-5 rounded-xl md:rounded-2xl border text-center transition-all shadow-sm ${isFullyReceived ? 'bg-[#2C5E3B] dark:bg-[#EAE5D9] border-[#2C5E3B] dark:border-[#EAE5D9]' : 'glass-panel-pushed'}`}>
                            <p className={`text-[10px] uppercase font-black tracking-widest mb-1.5 ${isFullyReceived ? 'text-[#FAF8F5]/80 dark:text-[#1E3B24]/80' : 'text-slate-400 dark:text-zinc-500'}`}>{t('warehouse.totalReceived')}</p>
                            <p className={`text-xl md:text-2xl font-black tabular-nums font-mono leading-none ${isFullyReceived ? 'text-[#FAF8F5] dark:text-[#1E3B24] drop-shadow-sm' : 'text-slate-900 dark:text-white'}`}>{stats.totalReceived}</p>
                        </div>
                    </div>

                    {!isFullyReceived && (
                        <div className="p-4 md:p-5 bg-amber-50 dark:bg-amber-500/5 border border-amber-200/50 dark:border-amber-500/20 rounded-2xl flex gap-3 shadow-sm border-l-4 border-l-amber-500">
                            <AlertTriangle className="text-amber-600 dark:text-amber-400 shrink-0" size={20} />
                            <div>
                                <h4 className="text-sm font-black text-amber-900 dark:text-amber-200 uppercase tracking-tight">{t('warehouse.discrepancyDetected')}</h4>
                                <p className="text-[10px] text-amber-700/80 dark:text-amber-500/80 mt-1 uppercase tracking-widest font-black leading-relaxed">
                                    Finalizing with {stats.totalExpected - stats.totalReceived} {t('warehouse.missingItems')}.
                                    Marked as <span className="text-amber-900 dark:text-amber-100 underline decoration-amber-500/30">{t('warehouse.partialReceipt')}</span>.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="rounded-xl md:rounded-2xl border border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] overflow-hidden bg-white/40 dark:bg-[#1C2620]/30 shadow-sm relative">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[#FAF8F5]/80 dark:bg-[#1C2620]/60 text-[#2C5E3B]/60 dark:text-[#A9CBA2]/60 font-black uppercase tracking-[0.2em] text-[8px]">
                                <tr>
                                    <th className="p-3 md:p-4">{t('warehouse.productAttributes')}</th>
                                    <th className="p-3 md:p-4 text-center">{t('warehouse.req')}</th>
                                    <th className="p-3 md:p-4 text-center">{t('warehouse.rec')}</th>
                                    <th className="p-3 md:p-4 text-right">{t('warehouse.status')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2DCCE]/30 dark:divide-[#A9CBA2]/[0.04]">
                                {stats.details.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="p-2.5 md:p-4">
                                            <p className="text-slate-900 dark:text-white font-black uppercase tracking-tight truncate max-w-[120px] md:max-w-[180px] text-[10px] md:text-xs">{item.productName}</p>
                                            <p className="text-[9px] text-slate-400 dark:text-zinc-600 font-black tracking-widest uppercase mt-1 font-mono">{item.sku}</p>
                                        </td>
                                        <td className="p-2.5 md:p-4 text-center text-slate-500 dark:text-zinc-500 font-black tabular-nums text-xs">{item.quantity}</td>
                                        <td className="p-2.5 md:p-4 text-center font-black text-[#2C5E3B] dark:text-[#A9CBA2] tabular-nums text-xs">{item.received}</td>
                                        <td className="p-2.5 md:p-4 text-right">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${item.status === 'Complete' ? 'bg-[#2C5E3B] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] border-[#2C5E3B] dark:border-[#EAE5D9] shadow-sm' :
                                                item.status === 'Partial' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' :
                                                    'bg-[#FAF8F5]/50 dark:bg-white/5 text-[#2C4D35]/40 dark:text-zinc-700 border-[#E2DCCE]/50 dark:border-white/5 opacity-50'
                                                }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 md:p-6 border-t border-[#E2DCCE]/50 dark:border-emerald-950/20 bg-[#FAF8F5] dark:bg-[#1C2620] flex flex-col md:flex-row gap-3 justify-end shrink-0">
                    <button
                        onClick={onClose}
                        className="woody-btn-secondary w-full md:w-auto px-10 py-3.5 text-[10px] uppercase tracking-widest font-black order-2 md:order-1"
                        disabled={isSubmitting}
                    >
                        {t('warehouse.dismiss')}
                    </button>
                    <button
                        onClick={onFinalize}
                        disabled={isSubmitting}
                        className="woody-btn-primary w-full md:w-auto px-10 py-3.5 text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 order-1 md:order-2"
                    >
                        {isSubmitting ? `${t('warehouse.processingStatus')}...` : (
                            <>
                                <CheckCircle size={14} />
                                {isFullyReceived ? t('warehouse.finalizeManifest') : t('warehouse.confirmPartialReceipt')}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
