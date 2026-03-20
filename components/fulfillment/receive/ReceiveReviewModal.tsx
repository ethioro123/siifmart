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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-black border-t-2 md:border-2 border-zinc-900 dark:border-white/10 rounded-t-2xl md:rounded-3xl w-full md:max-w-2xl shadow-2xl flex flex-col max-h-[95vh] md:max-h-[90vh] overflow-hidden relative">
                {/* 🌟 Modal Ambient Glow — hidden on mobile */}
                <div className="hidden md:block absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/5 dark:bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="hidden md:block absolute -bottom-24 -left-24 w-64 h-64 bg-violet-500/5 dark:bg-violet-500/10 blur-[100px] rounded-full pointer-events-none" />

                {/* Header */}
                <div className="p-4 md:p-6 border-b border-zinc-200 dark:border-white/10 flex justify-between items-start bg-zinc-50/80 dark:bg-zinc-950/50 backdrop-blur-sm">
                    <div>
                        <h3 className="text-base md:text-xl font-black text-zinc-950 dark:text-zinc-100 flex items-center gap-2 md:gap-3 uppercase tracking-tight">
                            <FileText className="text-zinc-950 dark:text-cyan-400" size={20} />
                            Finalize Manifest
                        </h3>
                        <p className="text-[10px] text-zinc-600 dark:text-zinc-500 font-black uppercase tracking-widest mt-1 font-mono">
                            PO #{po.poNumber} • <span className="text-zinc-900 dark:text-violet-400">{po.supplierName}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-lg text-zinc-500 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors" aria-label="Close">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 custom-scrollbar">

                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <div className="p-3 md:p-4 bg-white dark:bg-zinc-950/40 rounded-xl md:rounded-2xl border border-zinc-200 dark:border-white/10 text-center shadow-sm">
                            <p className="text-[10px] text-zinc-600 dark:text-zinc-400 uppercase font-black tracking-widest mb-1">Total Ordered</p>
                            <p className="text-xl md:text-2xl font-black text-zinc-950 dark:text-zinc-200 uppercase tabular-nums font-mono">{stats.totalExpected}</p>
                        </div>
                        <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl border-2 text-center transition-all ${isFullyReceived ? 'bg-zinc-900 dark:bg-zinc-100 border-zinc-950 dark:border-zinc-200 shadow-xl' : 'bg-zinc-50 dark:bg-zinc-900/40 border-zinc-100 dark:border-zinc-800'}`}>
                            <p className={`text-[10px] uppercase font-black tracking-widest mb-1 ${isFullyReceived ? 'text-zinc-400 dark:text-cyan-900' : 'text-zinc-500 dark:text-zinc-400'}`}>Total Received</p>
                            <p className={`text-xl md:text-2xl font-black tabular-nums font-mono ${isFullyReceived ? 'text-white dark:text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]' : 'text-zinc-950 dark:text-zinc-100'}`}>{stats.totalReceived}</p>
                        </div>
                    </div>

                    {!isFullyReceived && (
                        <div className="p-4 bg-zinc-100 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/10 rounded-2xl flex gap-3 shadow-sm">
                            <AlertTriangle className="text-amber-600 dark:text-zinc-400 shrink-0" size={20} />
                            <div>
                                <h4 className="text-sm font-black text-zinc-950 dark:text-zinc-200 uppercase tracking-tight">Discrepancy Detected</h4>
                                <p className="text-[10px] text-zinc-600 dark:text-zinc-500 mt-1 uppercase tracking-widest font-black leading-relaxed">
                                    Finalizing with {stats.totalExpected - stats.totalReceived} missing items.
                                    Marked as <span className="text-zinc-900 dark:text-zinc-100 underline decoration-zinc-500">Partial</span>.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="rounded-xl md:rounded-2xl border border-zinc-200 dark:border-white/10 overflow-hidden bg-white dark:bg-zinc-950/20 shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-500 font-black uppercase tracking-[0.2em] text-[8px]">
                                <tr>
                                    <th className="p-3 md:p-4">Product</th>
                                    <th className="p-3 md:p-4 text-center">Ord</th>
                                    <th className="p-3 md:p-4 text-center">Rec</th>
                                    <th className="p-3 md:p-4 text-right">State</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
                                {stats.details.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors border-t border-zinc-50 dark:border-white/5">
                                        <td className="p-2.5 md:p-4">
                                            <p className="text-zinc-900 dark:text-zinc-200 font-black uppercase tracking-tight truncate max-w-[120px] md:max-w-[180px] text-[10px] md:text-xs">{item.productName}</p>
                                            <p className="hidden md:block text-[9px] text-zinc-400 dark:text-zinc-600 font-black tracking-widest uppercase mt-0.5">{item.sku}</p>
                                        </td>
                                        <td className="p-2.5 md:p-4 text-center text-zinc-600 dark:text-zinc-500 font-black tabular-nums text-xs">{item.quantity}</td>
                                        <td className="p-2.5 md:p-4 text-center font-black text-zinc-900 dark:text-zinc-100 tabular-nums text-xs">{item.received}</td>
                                        <td className="p-2.5 md:p-4 text-right">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${item.status === 'Complete' ? 'bg-zinc-900 dark:bg-zinc-200 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-200 shadow-lg shadow-zinc-900/10' :
                                                item.status === 'Partial' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700' :
                                                    'bg-zinc-50 dark:bg-white/5 text-zinc-300 dark:text-zinc-700 border-zinc-100 dark:border-white/5 opacity-50'
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
                <div className="p-4 md:p-6 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/40 flex flex-col md:flex-row gap-3 justify-end shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full md:w-auto px-8 py-3 bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/20 text-zinc-500 dark:text-zinc-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-zinc-200 dark:border-white/5 order-2 md:order-1"
                        disabled={isSubmitting}
                    >
                        Dismiss
                    </button>
                    <button
                        onClick={onFinalize}
                        disabled={isSubmitting}
                        className="w-full md:w-auto px-10 py-3 bg-zinc-100 dark:bg-cyan-500 hover:bg-zinc-200 dark:hover:bg-cyan-400 text-zinc-950 dark:text-black text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-3 transition-all shadow-md dark:shadow-cyan-500/20 active:scale-[0.98] border border-zinc-300 dark:border-cyan-400/30 order-1 md:order-2"
                    >
                        {isSubmitting ? 'Processing...' : (
                            <>
                                <CheckCircle size={14} />
                                {isFullyReceived ? 'Confirm & Close PO' : 'Finalize Partial'}
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};
