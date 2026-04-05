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
}

export const ReceiveReviewModal: React.FC<ReceiveReviewModalProps> = ({
    po,
    jobs,
    onClose,
    onFinalize,
    isSubmitting
}) => {
    // Calculate stats
    const stats = useMemo(() => {
        const poJobs = jobs.filter(j => j.orderRef === po.id);
        const receivedMap: Record<string, number> = {};

        poJobs.forEach(job => {
            job.lineItems.forEach(item => {
                if (item.productId) {
                    receivedMap[item.productId] = (receivedMap[item.productId] || 0) + (item.receivedQty || 0);
                }
            });
        });

        let totalExpected = 0;
        let totalReceived = 0;
        const details = (po.lineItems || []).map(item => {
            const received = (item.productId ? receivedMap[item.productId] : 0) || 0;
            totalExpected += item.quantity;
            totalReceived += received;
            return {
                ...item,
                received,
                status: received >= item.quantity ? 'Complete' : received > 0 ? 'Partial' : 'Pending'
            };
        });

        return { totalExpected, totalReceived, details };
    }, [po, jobs]);

    const isFullyReceived = stats.totalReceived >= stats.totalExpected;

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-black border-t-2 md:border-2 border-slate-200 dark:border-white/10 rounded-t-2xl md:rounded-3xl w-full md:max-w-2xl shadow-2xl flex flex-col max-h-[95vh] md:max-h-[90vh] overflow-hidden relative">
                {/* 🌟 Modal Ambient Glow — hidden on mobile */}
                <div className="hidden md:block absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/5 dark:bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="hidden md:block absolute -bottom-24 -left-24 w-64 h-64 bg-violet-500/5 dark:bg-violet-500/10 blur-[100px] rounded-full pointer-events-none" />

                {/* Header */}
                <div className="p-4 md:p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-start bg-slate-50/80 dark:bg-zinc-950/50 backdrop-blur-sm">
                    <div>
                        <h3 className="text-base md:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 md:gap-3 uppercase tracking-tight">
                            <FileText className="text-cyan-600 dark:text-cyan-400" size={20} />
                            Finalize Manifest
                        </h3>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-black uppercase tracking-widest mt-1.5 font-mono">
                            Manifest #{po.poNumber} • <span className="text-slate-900 dark:text-violet-400">{po.supplierName}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" aria-label="Close">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 custom-scrollbar bg-slate-50/30 dark:bg-black/50">

                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <div className="p-3 md:p-5 bg-white dark:bg-zinc-950/40 rounded-xl md:rounded-2xl border border-slate-200 dark:border-white/10 text-center shadow-sm">
                            <p className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-black tracking-widest mb-1.5">Total Ordered</p>
                            <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tabular-nums font-mono leading-none">{stats.totalExpected}</p>
                        </div>
                        <div className={`p-3 md:p-5 rounded-xl md:rounded-2xl border-2 text-center transition-all shadow-sm ${isFullyReceived ? 'bg-slate-900 dark:bg-zinc-100 border-slate-900 dark:border-zinc-200' : 'bg-white dark:bg-zinc-900/40 border-slate-100 dark:border-zinc-800'}`}>
                            <p className={`text-[10px] uppercase font-black tracking-widest mb-1.5 ${isFullyReceived ? 'text-slate-400 dark:text-cyan-900' : 'text-slate-400 dark:text-zinc-500'}`}>Total Received</p>
                            <p className={`text-xl md:text-2xl font-black tabular-nums font-mono leading-none ${isFullyReceived ? 'text-white dark:text-cyan-600 drop-shadow-sm' : 'text-slate-900 dark:text-white'}`}>{stats.totalReceived}</p>
                        </div>
                    </div>

                    {!isFullyReceived && (
                        <div className="p-4 md:p-5 bg-amber-50 dark:bg-amber-500/5 border border-amber-200/50 dark:border-amber-500/20 rounded-2xl flex gap-3 shadow-sm border-l-4 border-l-amber-500">
                            <AlertTriangle className="text-amber-600 dark:text-amber-400 shrink-0" size={20} />
                            <div>
                                <h4 className="text-sm font-black text-amber-900 dark:text-amber-200 uppercase tracking-tight">Discrepancy Detected</h4>
                                <p className="text-[10px] text-amber-700/80 dark:text-amber-500/80 mt-1 uppercase tracking-widest font-black leading-relaxed">
                                    Finalizing with {stats.totalExpected - stats.totalReceived} missing items.
                                    Marked as <span className="text-amber-900 dark:text-amber-100 underline decoration-amber-500/30">Partial Receipt</span>.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="rounded-xl md:rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-zinc-950/20 shadow-sm relative">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-zinc-500 font-black uppercase tracking-[0.2em] text-[8px]">
                                <tr>
                                    <th className="p-3 md:p-4">Product Attributes</th>
                                    <th className="p-3 md:p-4 text-center">Req</th>
                                    <th className="p-3 md:p-4 text-center">Rec</th>
                                    <th className="p-3 md:p-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {stats.details.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="p-2.5 md:p-4">
                                            <p className="text-slate-900 dark:text-white font-black uppercase tracking-tight truncate max-w-[120px] md:max-w-[180px] text-[10px] md:text-xs">{item.productName}</p>
                                            <p className="text-[9px] text-slate-400 dark:text-zinc-600 font-black tracking-widest uppercase mt-1 font-mono">{item.sku}</p>
                                        </td>
                                        <td className="p-2.5 md:p-4 text-center text-slate-500 dark:text-zinc-500 font-black tabular-nums text-xs">{item.quantity}</td>
                                        <td className="p-2.5 md:p-4 text-center font-black text-slate-900 dark:text-cyan-500 tabular-nums text-xs">{item.received}</td>
                                        <td className="p-2.5 md:p-4 text-right">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${item.status === 'Complete' ? 'bg-slate-900 dark:bg-white text-white dark:text-black border-slate-900 dark:border-white shadow-md' :
                                                item.status === 'Partial' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' :
                                                    'bg-slate-50 dark:bg-white/5 text-slate-300 dark:text-zinc-700 border-slate-100 dark:border-white/5 opacity-50'
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
                <div className="p-4 md:p-6 border-t border-slate-200 dark:border-zinc-900 bg-slate-50 dark:bg-zinc-950/40 flex flex-col md:flex-row gap-3 justify-end shrink-0 backdrop-blur-md">
                    <button
                        onClick={onClose}
                        className="w-full md:w-auto px-10 py-3.5 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-500 dark:text-zinc-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-200 dark:border-white/10 order-2 md:order-1 active:scale-[0.98]"
                        disabled={isSubmitting}
                    >
                        Dismiss
                    </button>
                    <button
                        onClick={onFinalize}
                        disabled={isSubmitting}
                        className="w-full md:w-auto px-10 py-3.5 bg-cyan-500 dark:bg-cyan-500 hover:bg-cyan-600 dark:hover:bg-cyan-400 text-white dark:text-black text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg dark:shadow-cyan-500/20 active:scale-[0.98] border border-cyan-400 dark:border-cyan-400/30 order-1 md:order-2"
                    >
                        {isSubmitting ? 'Processing...' : (
                            <>
                                <CheckCircle size={14} />
                                {isFullyReceived ? 'Finalize Manifest' : 'Confirm Partial Receipt'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
