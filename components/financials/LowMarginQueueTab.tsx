import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, X, ArrowDownRight, Loader2 } from 'lucide-react';
import { useFinance } from './FinanceContext';
import { marginApprovalService } from '../../services/margin-approval.service';
import type { MarginApprovalRequest } from '../../types';

export const LowMarginQueueTab: React.FC = () => {
    const { user, currencySymbol, effectiveCountry, addNotification } = useFinance();
    const [requests, setRequests] = useState<MarginApprovalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('Pending');
    const [isActionLoading, setIsActionLoading] = useState(false);

    const canApproveMargin = ['finance_manager', 'super_admin', 'CEO', 'ceo'].includes(user?.role);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await marginApprovalService.getRequests(effectiveCountry, statusFilter === 'All' ? undefined : statusFilter);
            setRequests(data);
        } catch {
            addNotification('alert', 'Failed to load margin approval queue');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [effectiveCountry, statusFilter]);

    const handleSignOff = async (id: string, action: 'Approved' | 'Rejected') => {
        setIsActionLoading(true);
        try {
            await marginApprovalService.signOff(
                id,
                action,
                { id: user?.id || 'FIN-001', name: user?.name || 'Finance Staff' }
            );
            addNotification('success', `Margin approval request #${id.slice(0, 8)} ${action.toLowerCase()}.`);
            loadData();
        } catch {
            addNotification('alert', 'Failed to sign off margin approval');
        } finally {
            setIsActionLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header */}
            <div className="bg-white/90 dark:bg-stone-900/60 border border-[#E2DCCE] dark:border-white/5 rounded-2xl p-4 flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h3 className="text-base font-bold text-[#1E3F27] dark:text-white flex items-center gap-2">
                        <AlertTriangle className="text-amber-500 dark:text-amber-400" size={18} />
                        Low-Margin &amp; Landed COGS Protection Queue (Rule 2)
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-gray-400 mt-0.5">
                        Finance sign-off queue for retail price cuts or promotional markdowns violating gross margin policy.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-stone-100 dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-[#1E3F27] dark:text-gray-200 outline-none cursor-pointer"
                    >
                        <option value="All">All Statuses</option>
                        <option value="Pending">Pending Review</option>
                        <option value="Approved">Approved Exceptions</option>
                        <option value="Rejected">Rejected Price Cuts</option>
                    </select>
                </div>
            </div>

            {/* Requests Table */}
            <div className="bg-white/90 dark:bg-stone-900/60 border border-[#E2DCCE] dark:border-white/5 rounded-2xl overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-stone-100/80 dark:bg-black/20 border-b border-[#E2DCCE] dark:border-white/5 uppercase text-stone-500 dark:text-gray-500 font-sans">
                        <tr>
                            <th className="p-4">SKU / Item</th>
                            <th className="p-4 text-right">Landed Cost</th>
                            <th className="p-4 text-right">Proposed Price</th>
                            <th className="p-4 text-right">Proposed Margin</th>
                            <th className="p-4 text-right">Target Margin</th>
                            <th className="p-4 text-center">Variance</th>
                            <th className="p-4">Justification</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2DCCE] dark:divide-white/5">
                        {loading ? (
                            <tr>
                                <td colSpan={9} className="p-12 text-center text-stone-400 dark:text-gray-400 font-sans">
                                    <Loader2 className="animate-spin inline mr-2" size={18} /> Loading margin queue...
                                </td>
                            </tr>
                        ) : requests.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="p-12 text-center text-stone-400 dark:text-gray-500 font-sans">
                                    No low-margin price exceptions in queue. All items comply with target margin policy.
                                </td>
                            </tr>
                        ) : (
                            requests.map((r) => (
                                <tr key={r.id} className="hover:bg-stone-50 dark:hover:bg-white/5">
                                    <td className="p-4 whitespace-nowrap font-sans">
                                        <div className="text-[#1E3F27] dark:text-white font-bold">{r.productName}</div>
                                        <div className="text-[10px] text-stone-400 dark:text-gray-500 font-mono">{r.sku}</div>
                                    </td>
                                    <td className="p-4 text-right text-stone-500 dark:text-gray-400">{currencySymbol} {r.costPrice.toLocaleString()}</td>
                                    <td className="p-4 text-right text-[#1E3F27] dark:text-white font-bold">{currencySymbol} {r.proposedRetailPrice.toLocaleString()}</td>
                                    <td className="p-4 text-right font-bold text-rose-600 dark:text-rose-400">{r.proposedMarginPct.toFixed(1)}%</td>
                                    <td className="p-4 text-right text-stone-500 dark:text-gray-400">{r.targetMarginPct.toFixed(1)}%</td>
                                    <td className="p-4 text-center">
                                        <span className="inline-flex items-center gap-0.5 text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-500/20">
                                            <ArrowDownRight size={12} /> {r.marginVariancePct.toFixed(1)}%
                                        </span>
                                    </td>
                                    <td className="p-4 text-stone-600 dark:text-gray-300 font-sans text-xs truncate max-w-[200px]" title={r.reason}>
                                        {r.reason}
                                    </td>
                                    <td className="p-4 text-center font-sans">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                            r.status === 'Approved'
                                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                                                : r.status === 'Rejected'
                                                    ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                                                    : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                                        }`}>
                                            {r.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-sans">
                                        {r.status === 'Pending' && canApproveMargin && (
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => handleSignOff(r.id, 'Approved')}
                                                    disabled={isActionLoading}
                                                    className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                                                    title="Approve Exception"
                                                >
                                                    <CheckCircle size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleSignOff(r.id, 'Rejected')}
                                                    disabled={isActionLoading}
                                                    className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20"
                                                    title="Reject Low-Margin Price"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LowMarginQueueTab;
