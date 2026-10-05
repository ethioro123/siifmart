import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle, Clock, UserCheck, Filter, Loader2 } from 'lucide-react';
import { useFinance } from './FinanceContext';
import { drawerReconciliationService } from '../../services/drawer-reconciliation.service';
import type { DrawerReconciliationRecord } from '../../types';

export const DrawerReconciliationTab: React.FC = () => {
    const { user, currencySymbol, effectiveCountry, activeSite, addNotification } = useFinance();
    const [shifts, setShifts] = useState<DrawerReconciliationRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Reconciled' | 'Flagged'>('All');
    const [onlyFlagged, setOnlyFlagged] = useState(false);
    const [selectedShift, setSelectedShift] = useState<DrawerReconciliationRecord | null>(null);
    const [auditNotes, setAuditNotes] = useState('');
    const [isActionLoading, setIsActionLoading] = useState(false);

    const canSignOff = ['finance_manager', 'super_admin', 'CEO', 'ceo', 'operations_manager', 'admin'].includes(user?.role);

    const loadQueue = async () => {
        setLoading(true);
        try {
            const data = await drawerReconciliationService.getQueue({
                countryCode: effectiveCountry,
                siteId: activeSite?.id,
                status: statusFilter === 'All' ? undefined : statusFilter,
                onlyFlaggedVariances: onlyFlagged
            });
            setShifts(data);
        } catch {
            addNotification('alert', 'Failed to load drawer reconciliation queue');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadQueue();
    }, [effectiveCountry, activeSite?.id, statusFilter, onlyFlagged]);

    const handleSignOff = async (shiftId: string, action: 'Reconciled' | 'Flagged') => {
        setIsActionLoading(true);
        try {
            const updated = await drawerReconciliationService.signOff(
                shiftId,
                { id: user?.id || user?.employeeId || 'FIN-001', name: user?.name || 'Finance Staff', role: user?.role },
                action,
                { hqNotes: auditNotes }
            );
            setShifts(prev => prev.map(s => s.id === shiftId ? updated : s));
            addNotification('success', `Shift #${shiftId.slice(0, 8)} signed off as ${action}`);
            setSelectedShift(null);
            setAuditNotes('');
        } catch {
            addNotification('alert', 'Failed to sign off drawer reconciliation');
        } finally {
            setIsActionLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header & Filter Bar */}
            <div className="bg-white/90 dark:bg-stone-900/60 border border-[#E2DCCE] dark:border-white/5 rounded-2xl p-4 flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h3 className="text-base font-bold text-[#1E3F27] dark:text-white flex items-center gap-2">
                        <ShieldCheck className="text-emerald-600 dark:text-emerald-400" size={18} />
                        Daily Drawer Reconciliation &amp; Supervisory Queue (Rule 18)
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-gray-400 mt-0.5">
                        HQ dual-control verification of cashier cash drawers, mobile tenders, and on-duty supervisor co-attribution.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-stone-100 dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-2.5 py-1.5">
                        <Filter size={14} className="text-stone-400 dark:text-gray-400 mr-2" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="bg-transparent text-xs text-[#1E3F27] dark:text-gray-200 outline-none cursor-pointer"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Pending">Pending Review</option>
                            <option value="Reconciled">Reconciled</option>
                            <option value="Flagged">Flagged Discrepancies</option>
                        </select>
                    </div>

                    <label className="flex items-center gap-2 text-xs text-stone-600 dark:text-gray-300 cursor-pointer bg-stone-100/60 dark:bg-white/5 border border-[#E2DCCE] dark:border-white/10 px-3 py-1.5 rounded-xl hover:bg-stone-200/60 dark:hover:bg-white/10 transition-colors">
                        <input
                            type="checkbox"
                            checked={onlyFlagged}
                            onChange={(e) => setOnlyFlagged(e.target.checked)}
                            className="rounded text-emerald-600 dark:text-emerald-500"
                        />
                        <span>Flagged Variances Only (&gt; 500 {currencySymbol})</span>
                    </label>
                </div>
            </div>

            {/* Shift List Table */}
            <div className="bg-white/90 dark:bg-stone-900/60 border border-[#E2DCCE] dark:border-white/5 rounded-2xl overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-stone-100/80 dark:bg-black/20 border-b border-[#E2DCCE] dark:border-white/5">
                        <tr>
                            <th className="p-4 text-xs text-stone-500 dark:text-gray-500 uppercase">Shift / Date</th>
                            <th className="p-4 text-xs text-stone-500 dark:text-gray-500 uppercase">Site</th>
                            <th className="p-4 text-xs text-stone-500 dark:text-gray-500 uppercase">Cashier</th>
                            <th className="p-4 text-xs text-stone-500 dark:text-gray-500 uppercase text-right">Expected</th>
                            <th className="p-4 text-xs text-stone-500 dark:text-gray-500 uppercase text-right">Actual Count</th>
                            <th className="p-4 text-xs text-stone-500 dark:text-gray-500 uppercase text-right">Variance</th>
                            <th className="p-4 text-xs text-stone-500 dark:text-gray-500 uppercase">Supervisor (Rule 18)</th>
                            <th className="p-4 text-xs text-stone-500 dark:text-gray-500 uppercase text-center">Status</th>
                            <th className="p-4 text-xs text-stone-500 dark:text-gray-500 uppercase text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2DCCE] dark:divide-white/5">
                        {loading ? (
                            <tr>
                                <td colSpan={9} className="p-12 text-center text-stone-400 dark:text-gray-400">
                                    <Loader2 className="animate-spin inline mr-2" size={18} /> Loading shifts...
                                </td>
                            </tr>
                        ) : shifts.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="p-16 text-center text-stone-400 dark:text-gray-400">
                                    <ShieldCheck size={40} className="mx-auto mb-2 text-stone-300 dark:text-gray-600" />
                                    <p className="text-sm">No drawer reconciliation records found matching criteria.</p>
                                </td>
                            </tr>
                        ) : (
                            shifts.map((s) => {
                                const isExcessive = Math.abs(s.variance) > 500;
                                return (
                                    <tr key={s.id} className="hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="font-mono text-xs text-[#1E3F27] dark:text-white font-bold">#{s.shiftNumber}</div>
                                            <div className="text-[10px] text-stone-400 dark:text-gray-500">{new Date(s.startTime).toLocaleDateString()}</div>
                                        </td>
                                        <td className="p-4 text-xs text-stone-600 dark:text-gray-300">{s.siteId}</td>
                                        <td className="p-4 text-xs text-stone-700 dark:text-gray-200">{s.cashierName}</td>
                                        <td className="p-4 text-xs text-right font-mono text-stone-500 dark:text-gray-400">
                                            {currencySymbol} {s.expectedCash.toLocaleString()}
                                        </td>
                                        <td className="p-4 text-xs text-right font-mono text-[#1E3F27] dark:text-white font-bold">
                                            {currencySymbol} {s.actualCash.toLocaleString()}
                                        </td>
                                        <td className="p-4 text-xs text-right font-mono font-bold whitespace-nowrap">
                                            <span className={
                                                s.variance === 0
                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                    : s.variance > 0
                                                        ? 'text-cyan-600 dark:text-cyan-400'
                                                        : isExcessive
                                                            ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-500/30'
                                                            : 'text-amber-600 dark:text-amber-400'
                                            }>
                                                {s.variance > 0 ? '+' : ''}{currencySymbol} {s.variance.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs text-stone-600 dark:text-gray-300">
                                            {s.supervisorName ? (
                                                <div className="flex items-center gap-1.5 text-stone-700 dark:text-gray-200">
                                                    <UserCheck size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                    <span className="truncate max-w-[120px]">{s.supervisorName}</span>
                                                </div>
                                            ) : (
                                                <span className="text-stone-400 dark:text-gray-500 italic">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                                s.reconciliationStatus === 'Reconciled'
                                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                                                    : s.reconciliationStatus === 'Flagged'
                                                        ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                                                        : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                                            }`}>
                                                {s.reconciliationStatus === 'Reconciled' && <CheckCircle size={10} />}
                                                {s.reconciliationStatus === 'Flagged' && <AlertTriangle size={10} />}
                                                {s.reconciliationStatus === 'Pending' && <Clock size={10} />}
                                                {s.reconciliationStatus}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {canSignOff && (
                                                <button
                                                    onClick={() => setSelectedShift(s)}
                                                    className="woody-btn-secondary px-3 py-1 text-xs rounded-lg"
                                                >
                                                    Audit Review
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Review & Dual Sign-Off Modal */}
            {selectedShift && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-stone-900 border border-[#E2DCCE] dark:border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                        <div className="flex justify-between items-center border-b border-[#E2DCCE] dark:border-white/5 pb-3">
                            <h4 className="text-base font-bold text-[#1E3F27] dark:text-white flex items-center gap-2">
                                <ShieldCheck className="text-emerald-600 dark:text-emerald-400" size={18} />
                                HQ Finance Sign-Off (Shift #{selectedShift.shiftNumber})
                            </h4>
                            <button onClick={() => setSelectedShift(null)} className="text-stone-400 dark:text-gray-400 hover:text-[#1E3F27] dark:hover:text-white text-lg leading-none">✕</button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs bg-stone-50 dark:bg-black/30 p-3 rounded-xl border border-[#E2DCCE] dark:border-white/5">
                            <div>
                                <span className="text-stone-400 dark:text-gray-500 block">Cashier</span>
                                <span className="text-[#1E3F27] dark:text-white font-medium">{selectedShift.cashierName}</span>
                            </div>
                            <div>
                                <span className="text-stone-400 dark:text-gray-500 block">On-Duty Supervisor (Rule 18)</span>
                                <span className="text-[#1E3F27] dark:text-white font-medium">{selectedShift.supervisorName || 'Unassigned'}</span>
                            </div>
                            <div>
                                <span className="text-stone-400 dark:text-gray-500 block">Expected Drawer Cash</span>
                                <span className="text-stone-600 dark:text-gray-300 font-mono">{currencySymbol} {selectedShift.expectedCash.toLocaleString()}</span>
                            </div>
                            <div>
                                <span className="text-stone-400 dark:text-gray-500 block">Actual Counted Cash</span>
                                <span className="text-[#1E3F27] dark:text-white font-bold font-mono">{currencySymbol} {selectedShift.actualCash.toLocaleString()}</span>
                            </div>
                            <div className="col-span-2 pt-2 border-t border-[#E2DCCE] dark:border-white/5 flex justify-between">
                                <span className="text-stone-500 dark:text-gray-400 font-bold">Variance</span>
                                <span className={`font-mono font-bold ${selectedShift.variance === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    {selectedShift.variance > 0 ? '+' : ''}{currencySymbol} {selectedShift.variance.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {selectedShift.discrepancyReason && (
                            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-xs">
                                <span className="text-amber-600 dark:text-amber-400 font-bold block mb-0.5">Cashier Reason:</span>
                                <p className="text-amber-700 dark:text-amber-200/90">{selectedShift.discrepancyReason}</p>
                            </div>
                        )}

                        <div>
                            <label className="text-xs text-stone-500 dark:text-gray-400 uppercase font-bold mb-1 block">HQ Finance Audit Notes</label>
                            <textarea
                                value={auditNotes}
                                onChange={(e) => setAuditNotes(e.target.value)}
                                className="woody-input resize-none h-20"
                                placeholder="Enter verification notes or required audit follow-ups..."
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => handleSignOff(selectedShift.id, 'Flagged')}
                                disabled={isActionLoading}
                                className="px-4 py-2 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 rounded-xl text-xs font-bold transition-colors"
                            >
                                Flag Discrepancy
                            </button>
                            <button
                                onClick={() => handleSignOff(selectedShift.id, 'Reconciled')}
                                disabled={isActionLoading}
                                className="woody-btn-primary px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                            >
                                {isActionLoading && <Loader2 className="animate-spin" size={14} />}
                                Sign-off &amp; Reconcile
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DrawerReconciliationTab;
