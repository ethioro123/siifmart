import React, { useState } from 'react';
import { useData } from '../../../contexts/DataContext';
import { useStore } from '../../../contexts/CentralStore';
import { useLanguage } from '../../../contexts/LanguageContext';
import { ShiftRecord } from '../../../types';
import { ShieldCheck, AlertTriangle, CheckCircle, Clock, Search, Printer, X } from 'lucide-react';
import { formatDateTime } from '../../../utils/formatting';
import { generateZReportReceiptHtml } from '../utils/receiptTemplate';

export const ShiftReconciliationTable: React.FC = () => {
    const { shifts, reconcileShift, activeSite, addNotification, effectiveCountry } = useData();
    const { currencySymbol } = useLanguage();
    const currency = currencySymbol || (effectiveCountry === 'KE' ? 'KSh' : 'ETB');
    const { user } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'All' | 'Open' | 'Closed' | 'Audited' | 'Flagged'>('All');
    const [reconcilingId, setReconcilingId] = useState<string | null>(null);

    const isHQOrManager = [
        'super_admin',
        'ceo',
        'finance_manager',
        'regional_manager',
        'operations_manager',
        'admin',
        'store_manager'
    ].includes(user?.role?.toLowerCase() || '');

    // Filter shifts for active store and search term
    const siteShifts = (shifts || []).filter(s => !activeSite?.id || s.siteId === activeSite.id);

    const filteredShifts = siteShifts.filter(s => {
        const matchesStatus = filterStatus === 'All' || s.status === filterStatus;
        const matchesSearch = !searchTerm.trim() ||
            (s.cashierName && s.cashierName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (s.cashierCode && s.cashierCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (s.counterNumber && s.counterNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
            s.id.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const handleReconcile = async (shiftId: string, status: 'Reconciled' | 'Discrepancy_Flagged') => {
        if (!isHQOrManager) return;
        setReconcilingId(shiftId);
        try {
            await reconcileShift(shiftId, user?.name || 'HQ Supervisor', status);
            addNotification('success', `Shift ${shiftId.slice(-6)} marked as ${status.replace('_', ' ')}.`);
        } catch {
            addNotification('alert', 'Failed to update shift reconciliation status.');
        } finally {
            setReconcilingId(null);
        }
    };

    const handlePrintShiftZReport = (shift: ShiftRecord) => {
        const printWindow = window.open('', '_blank', 'width=350,height=600');
        if (printWindow) {
            const html = generateZReportReceiptHtml(
                shift,
                undefined,
                activeSite?.name || 'SIIFMART Store',
                user?.name || shift.cashierName || 'Staff'
            );
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
            }, 300);
        }
    };

    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 lg:p-8 shadow-xs space-y-6 isolate">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--theme-border)] pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-[var(--theme-text-primary)] uppercase tracking-tight">
                            Daily Cash &amp; Shift Reconciliation (HQ Oversight)
                        </h3>
                        <p className="text-xs text-[var(--theme-text-secondary)]">
                            Central drawer audit, multi-tender verification, and 4-eyes dual control
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] border border-[var(--theme-border)] rounded-2xl px-3 py-1.5 focus-within:border-[var(--theme-primary)] focus-within:ring-2 focus-within:ring-[var(--theme-primary)]/15 focus-within:bg-[var(--theme-bg-card)] transition-all group shadow-2xs">
                        <div className="w-5 h-5 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 group-focus-within:bg-blue-500 group-focus-within:text-white transition-all">
                            <Search size={12} />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search cashier or ID..."
                            className="bg-transparent border-none ml-2 text-xs text-[var(--theme-text-primary)] font-mono outline-none placeholder-[var(--theme-text-muted)] w-36 sm:w-48"
                        />
                        {searchTerm ? (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                className="w-4 h-4 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] flex items-center justify-center transition-all cursor-pointer active:scale-90"
                                aria-label="Clear search"
                            >
                                <X size={10} />
                            </button>
                        ) : null}
                    </div>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] border border-[var(--theme-border)] rounded-2xl px-3 py-1.5 text-xs text-[var(--theme-text-primary)] font-semibold outline-none cursor-pointer transition-colors shadow-2xs"
                    >
                        <option value="All">All Shifts</option>
                        <option value="Open">Active (Open)</option>
                        <option value="Closed">Awaiting Audit (Closed)</option>
                        <option value="Audited">Audited (Signed Off)</option>
                        <option value="Flagged">Discrepancy Flagged</option>
                    </select>
                </div>
            </div>

            {/* Shift List Table */}
            <div className="overflow-x-auto border border-[var(--theme-border)] rounded-2xl isolate">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="border-b border-[var(--theme-border)] text-[10px] uppercase font-semibold tracking-wider text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)]/70">
                            <th className="py-3.5 px-4">Status</th>
                            <th className="py-3.5 px-4">Cashier &amp; Counter</th>
                            <th className="py-3.5 px-4">Start Time</th>
                            <th className="py-3.5 px-4 text-right">Float</th>
                            <th className="py-3.5 px-4 text-right">Cash Sales</th>
                            <th className="py-3.5 px-4 text-right">Expected</th>
                            <th className="py-3.5 px-4 text-right">Actual Count</th>
                            <th className="py-3.5 px-4 text-right">Variance</th>
                            <th className="py-3.5 px-4 text-center">HQ Audit Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--theme-border)] font-mono">
                        {filteredShifts.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="py-8 text-center text-[var(--theme-text-muted)] font-sans text-xs">
                                    No shifts matching the selected criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredShifts.map((shift: ShiftRecord) => {
                                const hasVariance = Math.abs(shift.variance || 0) > 0.01;
                                return (
                                    <tr key={shift.id} className="hover:bg-[var(--theme-bg-subtle)]/50 transition-colors">
                                        {/* Status Badge */}
                                        <td className="py-3 px-4 font-sans">
                                            {shift.status === 'Open' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                                    <Clock size={10} /> Open
                                                </span>
                                            ) : shift.status === 'Audited' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                    <CheckCircle size={10} /> Audited
                                                </span>
                                            ) : shift.status === 'Flagged' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                                    <AlertTriangle size={10} /> Flagged
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                    <Clock size={10} /> Awaiting HQ
                                                </span>
                                            )}
                                        </td>

                                        {/* Cashier & Counter */}
                                        <td className="py-3 px-4 font-sans">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                                                    {shift.cashierCode || shift.cashier_code || 'STAFF'}
                                                </span>
                                                <span className="font-semibold text-[var(--theme-text-primary)] truncate max-w-[140px]">{shift.cashierName}</span>
                                            </div>
                                            <div className="text-[10px] text-[var(--theme-text-secondary)] font-mono mt-0.5 font-medium">
                                                {shift.counterNumber || shift.counter_number || 'Counter 1'}
                                            </div>
                                        </td>

                                        {/* Start Time */}
                                        <td className="py-3 px-4 text-[11px] text-[var(--theme-text-secondary)]">
                                            {shift.startTime ? formatDateTime(shift.startTime) : 'N/A'}
                                        </td>

                                        {/* Opening Float */}
                                        <td className="py-3 px-4 text-right text-[var(--theme-text-secondary)]">
                                            {currency} {(shift.openingFloat || 0).toLocaleString()}
                                        </td>

                                        {/* Cash Sales */}
                                        <td className="py-3 px-4 text-right text-[var(--theme-text-primary)] font-bold">
                                            {currency} {(shift.cashSales || 0).toLocaleString()}
                                        </td>

                                        {/* Expected Cash */}
                                        <td className="py-3 px-4 text-right font-semibold text-[var(--theme-text-secondary)]">
                                            {currency} {(shift.expectedCash || 0).toLocaleString()}
                                        </td>

                                        {/* Actual Counted */}
                                        <td className="py-3 px-4 text-right font-bold text-[var(--theme-text-primary)]">
                                            {shift.status === 'Open' ? 'Active...' : `${currency} ${(shift.actualCash || 0).toLocaleString()}`}
                                        </td>

                                        {/* Variance */}
                                        <td className={`py-3 px-4 text-right font-bold ${
                                            hasVariance ? 'text-rose-500' : 'text-[var(--theme-text-primary)]'
                                        }`}>
                                            {shift.status === 'Open' ? '-' : (
                                                <>
                                                    {(shift.variance || 0) > 0 ? '+' : ''}
                                                    {(shift.variance || 0).toLocaleString()}
                                                </>
                                            )}
                                        </td>

                                        {/* HQ Action */}
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5 font-sans">
                                                {shift.status !== 'Open' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handlePrintShiftZReport(shift)}
                                                        className="px-2.5 py-1 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] rounded-xl transition-all flex items-center gap-1 text-[10px] font-semibold cursor-pointer active:scale-95 shadow-2xs"
                                                        title="Print Z-Report Slip"
                                                    >
                                                        <Printer size={11} className="text-purple-500" />
                                                        <span>Z-Report</span>
                                                    </button>
                                                )}

                                                {shift.status === 'Closed' && isHQOrManager ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleReconcile(shift.id, 'Reconciled')}
                                                            disabled={reconcilingId === shift.id}
                                                            className="px-2.5 py-1 bg-[var(--theme-primary)] hover:opacity-90 text-[var(--theme-primary-text)] text-[10px] font-semibold rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
                                                        >
                                                            Sign-Off
                                                        </button>
                                                        <button
                                                            onClick={() => handleReconcile(shift.id, 'Discrepancy_Flagged')}
                                                            disabled={reconcilingId === shift.id}
                                                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-semibold rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
                                                        >
                                                            Flag
                                                        </button>
                                                    </>
                                                ) : shift.reconciledBy ? (
                                                    <span className="text-[10px] text-[var(--theme-text-muted)] font-sans inline-flex items-center gap-1" title={`Reconciled at ${shift.reconciledAt}`}>
                                                        <CheckCircle size={10} className="text-emerald-500 shrink-0" />
                                                        <span>{shift.reconciledBy}</span>
                                                    </span>
                                                ) : shift.status === 'Open' ? (
                                                    <span className="text-[var(--theme-text-muted)]">-</span>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
