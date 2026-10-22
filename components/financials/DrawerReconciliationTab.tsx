import React, { useState, useEffect, useMemo } from 'react';
import {
    ShieldCheck,
    AlertTriangle,
    CheckCircle2,
    Clock,
    UserCheck,
    Filter,
    Loader2,
    Search,
    Check,
    ChevronRight,
    Scale,
    Building2
} from 'lucide-react';
import { useFinance } from './FinanceContext';
import { drawerReconciliationService } from '../../services/drawer-reconciliation.service';
import type { DrawerReconciliationRecord } from '../../types';
import { DrawerSignOffModal } from './DrawerSignOffModal';
import { formatCompactNumber } from '../../utils/formatting';

export const DrawerReconciliationTab: React.FC = () => {
    const { user, currencySymbol, effectiveCountry, activeSite, addNotification } = useFinance();
    const [shifts, setShifts] = useState<DrawerReconciliationRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Reconciled' | 'Flagged'>('All');
    const [onlyFlagged, setOnlyFlagged] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedShift, setSelectedShift] = useState<DrawerReconciliationRecord | null>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const userRole = user?.role?.toLowerCase() || '';
    const canSignOff = [
        'head_of_finance',
        'regional_finance_manager',
        'head_of_operations',
        'regional_operations_manager',
        'country_managing_director', 'managing_director',
        'admin', 'super_admin', 'CEO', 'ceo'
    ].includes(userRole);

    const isRegionalStaff = Boolean(userRole && [
        'regional_finance_manager',
        'regional_operations_manager',
    ].includes(userRole));

    const loadQueue = async () => {
        setLoading(true);
        try {
            const data = await drawerReconciliationService.getQueue({
                countryCode: effectiveCountry,
                siteId: isRegionalStaff ? undefined : activeSite?.id,
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

    const handleSignOff = async (shiftId: string, action: 'Reconciled' | 'Flagged', notes: string) => {
        setIsActionLoading(true);
        try {
            const updated = await drawerReconciliationService.signOff(
                shiftId,
                { id: user?.id || user?.employeeId || 'FIN-001', name: user?.name || 'Finance Staff', role: user?.role },
                action,
                { hqNotes: notes }
            );
            setShifts(prev => prev.map(s => s.id === shiftId ? updated : s));
            addNotification('success', `Shift #${shiftId.slice(0, 8)} signed off as ${action}`);
            setSelectedShift(null);
        } catch {
            addNotification('alert', 'Failed to sign off drawer reconciliation');
        } finally {
            setIsActionLoading(false);
        }
    };

    // Calculate executive KPIs
    const stats = useMemo(() => {
        let totalCount = shifts.length;
        let pendingCount = 0;
        let reconciledCount = 0;
        let flaggedCount = 0;
        let netVariance = 0;

        for (const s of shifts) {
            netVariance += s.variance || 0;
            if (s.reconciliationStatus === 'Pending') pendingCount++;
            else if (s.reconciliationStatus === 'Reconciled') reconciledCount++;
            else if (s.reconciliationStatus === 'Flagged') flaggedCount++;
        }

        return { totalCount, pendingCount, reconciledCount, flaggedCount, netVariance };
    }, [shifts]);

    const filteredShifts = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return shifts;
        return shifts.filter(s =>
            (s.shiftNumber && s.shiftNumber.toString().toLowerCase().includes(query)) ||
            (s.cashierName && s.cashierName.toLowerCase().includes(query)) ||
            (s.supervisorName && s.supervisorName.toLowerCase().includes(query)) ||
            (s.siteId && s.siteId.toLowerCase().includes(query))
        );
    }, [shifts, searchQuery]);

    return (
        <div className="space-y-4">
            {/* Executive KPI Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-[var(--theme-text-secondary)] font-medium">
                            Pending Review
                        </span>
                        <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <Clock size={13} />
                        </div>
                    </div>
                    <h4 className="text-xl font-semibold tracking-tight text-amber-600 dark:text-amber-400 font-mono tabular-nums mt-1">
                        {stats.pendingCount}
                    </h4>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1">
                        Awaiting supervisory sign-off
                    </p>
                </div>

                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-[var(--theme-text-secondary)] font-medium">
                            Reconciled Shifts
                        </span>
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 size={13} />
                        </div>
                    </div>
                    <h4 className="text-xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-1">
                        {stats.reconciledCount}
                    </h4>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1">
                        Verified POS cash drawer closeouts
                    </p>
                </div>

                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-[var(--theme-text-secondary)] font-medium">
                            Flagged Variances
                        </span>
                        <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                            <AlertTriangle size={13} />
                        </div>
                    </div>
                    <h4 className="text-xl font-semibold tracking-tight text-rose-600 dark:text-rose-400 font-mono tabular-nums mt-1">
                        {stats.flaggedCount}
                    </h4>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1">
                        Co-attributed under Rule 18
                    </p>
                </div>

                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-[var(--theme-text-secondary)] font-medium">
                            Net Cash Variance
                        </span>
                        <div className="w-6 h-6 rounded-lg bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] flex items-center justify-center">
                            <Scale size={13} />
                        </div>
                    </div>
                    <h4 className={`text-xl font-semibold tracking-tight font-mono tabular-nums mt-1 ${
                        stats.netVariance === 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : stats.netVariance < 0
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-cyan-600 dark:text-cyan-400'
                    }`}>
                        {stats.netVariance > 0 ? '+' : ''}{currencySymbol} {stats.netVariance.toLocaleString()}
                    </h4>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1">
                        Cumulative drawer drift
                    </p>
                </div>
            </div>

            {/* Shift List Card */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl overflow-hidden shadow-xs">
                {/* Header & Filter Toolbar */}
                <div className="p-4 border-b border-[var(--theme-border)] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[var(--theme-bg-card)]">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">
                                Daily Drawer Reconciliation Queue
                            </h3>
                            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                                <ShieldCheck size={12} />
                                <span>Rule 18 Co-Attribution</span>
                            </div>
                        </div>

                        {/* Search Input */}
                        <div className="flex items-center bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-2.5 py-1.5 h-9 w-52">
                            <Search size={14} className="text-[var(--theme-text-secondary)] mr-2 shrink-0" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search cashier, shift..."
                                className="bg-transparent text-xs text-[var(--theme-text-primary)] outline-none w-full placeholder:text-[var(--theme-text-secondary)]/60"
                                aria-label="Search shifts"
                            />
                        </div>

                        {/* Status Filter Dropdown */}
                        <div className="flex items-center bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-2.5 py-1.5 h-9">
                            <Filter size={13} className="text-[var(--theme-text-secondary)] mr-2 shrink-0" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="bg-transparent text-xs text-[var(--theme-text-primary)] outline-none cursor-pointer pr-1"
                                aria-label="Filter shifts by status"
                            >
                                <option value="All">All Statuses</option>
                                <option value="Pending">Pending Review</option>
                                <option value="Reconciled">Reconciled</option>
                                <option value="Flagged">Flagged Discrepancies</option>
                            </select>
                        </div>
                    </div>

                    <label className="flex items-center gap-2 text-xs text-[var(--theme-text-secondary)] cursor-pointer bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] px-3 py-1.5 rounded-xl hover:bg-[var(--theme-bg-subtle)]/80 transition-colors shrink-0">
                        <input
                            type="checkbox"
                            checked={onlyFlagged}
                            onChange={(e) => setOnlyFlagged(e.target.checked)}
                            className="rounded text-[#0071E3] dark:text-[#2997FF] focus:ring-0"
                        />
                        <span className="font-medium text-[var(--theme-text-primary)]">
                            Flagged Variances Only (&gt; 500 {currencySymbol})
                        </span>
                    </label>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[var(--theme-bg-subtle)]/75 border-b border-[var(--theme-border)]">
                            <tr>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Shift / Date</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Site</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Cashier</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-right">Expected</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-right">Actual Count</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-right">Variance</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Supervisor (Rule 18)</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-center">Status</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--theme-border)]">
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="py-16 text-center text-[var(--theme-text-secondary)]">
                                        <Loader2 className="animate-spin inline mr-2 text-[#0071E3] dark:text-[#2997FF]" size={18} />
                                        <span className="text-xs">Loading drawer reconciliation records...</span>
                                    </td>
                                </tr>
                            ) : filteredShifts.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-16 text-center">
                                        <div className="flex flex-col items-center justify-center text-[var(--theme-text-secondary)]">
                                            <div className="w-12 h-12 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center mb-3">
                                                <ShieldCheck size={22} />
                                            </div>
                                            <p className="text-xs font-semibold text-[var(--theme-text-primary)]">
                                                No drawer reconciliation records found
                                            </p>
                                            <p className="text-[11px] mt-0.5">
                                                No cashier shifts match the selected filters or criteria.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredShifts.map((s) => {
                                    const isExcessive = Math.abs(s.variance) > 500;
                                    return (
                                        <tr key={s.id} className="hover:bg-[var(--theme-bg-subtle)]/40 transition-colors">
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <div className="font-mono text-xs text-[var(--theme-text-primary)] font-semibold">
                                                    #{s.shiftNumber}
                                                </div>
                                                <div className="text-[11px] font-mono text-[var(--theme-text-secondary)]">
                                                    {new Date(s.startTime).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 text-xs font-mono text-[var(--theme-text-secondary)] whitespace-nowrap">
                                                {s.siteId}
                                            </td>
                                            <td className="py-3.5 px-4 text-xs font-medium text-[var(--theme-text-primary)] whitespace-nowrap">
                                                {s.cashierName}
                                            </td>
                                            <td className="py-3.5 px-4 text-xs text-right font-mono text-[var(--theme-text-secondary)] tabular-nums whitespace-nowrap">
                                                {currencySymbol} {s.expectedCash.toLocaleString()}
                                            </td>
                                            <td className="py-3.5 px-4 text-xs text-right font-mono font-semibold text-[var(--theme-text-primary)] tabular-nums whitespace-nowrap">
                                                {currencySymbol} {s.actualCash.toLocaleString()}
                                            </td>
                                            <td className="py-3.5 px-4 text-xs text-right font-mono font-semibold whitespace-nowrap tabular-nums">
                                                <span className={
                                                    s.variance === 0
                                                        ? 'text-emerald-600 dark:text-emerald-400'
                                                        : s.variance > 0
                                                            ? 'text-cyan-600 dark:text-cyan-400'
                                                            : isExcessive
                                                                ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/20'
                                                                : 'text-amber-600 dark:text-amber-400'
                                                }>
                                                    {s.variance > 0 ? '+' : ''}{currencySymbol} {s.variance.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                                                {s.supervisorName ? (
                                                    <div className="flex items-center gap-1.5 text-[var(--theme-text-primary)]">
                                                        <UserCheck size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                        <span className="truncate max-w-[120px] font-medium">{s.supervisorName}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[var(--theme-text-secondary)] italic">Unassigned</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                                                    s.reconciliationStatus === 'Reconciled'
                                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                        : s.reconciliationStatus === 'Flagged'
                                                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                                }`}>
                                                    {s.reconciliationStatus === 'Reconciled' && <CheckCircle2 size={11} />}
                                                    {s.reconciliationStatus === 'Flagged' && <AlertTriangle size={11} />}
                                                    {s.reconciliationStatus === 'Pending' && <Clock size={11} />}
                                                    <span>{s.reconciliationStatus}</span>
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                {canSignOff && (
                                                    <button
                                                        onClick={() => setSelectedShift(s)}
                                                        className="px-3 py-1.5 bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] text-xs font-semibold rounded-lg transition-colors shadow-xs"
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

                {/* Footer Count */}
                <div className="p-3.5 border-t border-[var(--theme-border)] bg-[var(--theme-bg-subtle)]/40 text-xs text-[var(--theme-text-secondary)] flex justify-between items-center">
                    <span>
                        Loaded <span className="font-mono tabular-nums font-semibold text-[var(--theme-text-primary)]">{filteredShifts.length}</span> shifts in queue
                    </span>
                    <span className="text-[11px]">
                        Zero-Trust POS Register Telemetry
                    </span>
                </div>
            </div>

            {/* Modular Drawer Sign-Off Modal */}
            <DrawerSignOffModal
                shift={selectedShift}
                isOpen={Boolean(selectedShift)}
                onClose={() => setSelectedShift(null)}
                onSignOff={handleSignOff}
                isActionLoading={isActionLoading}
                currencySymbol={currencySymbol}
            />
        </div>
    );
};

export default DrawerReconciliationTab;
