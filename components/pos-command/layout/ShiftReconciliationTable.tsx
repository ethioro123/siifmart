import React, { useState } from 'react';
import { useData } from '../../../contexts/DataContext';
import { useStore } from '../../../contexts/CentralStore';
import { CURRENCY_SYMBOL } from '../../../constants';
import { ShiftRecord } from '../../../types';
import { ShieldCheck, AlertTriangle, CheckCircle, Clock, Search, FileText, Printer } from 'lucide-react';
import { formatDateTime } from '../../../utils/formatting';
import { generateZReportReceiptHtml } from '../utils/receiptTemplate';

export const ShiftReconciliationTable: React.FC = () => {
    const { shifts, reconcileShift, activeSite, addNotification } = useData();
    const { user } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'All' | 'Open' | 'Closed' | 'Audited' | 'Flagged'>('All');
    const [reconcilingId, setReconcilingId] = useState<string | null>(null);

    const isHQOrManager = [
        'super_admin',
        'ceo',
        'finance_manager',
        'auditor',
        'operations_manager',
        'regional_manager',
        'store_manager'
    ].includes(user?.role?.toLowerCase() || '');

    const filteredShifts = (shifts || []).filter(s => {
        const matchesSearch =
            (s.cashierName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.discrepancyReason || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'All' || s.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const handleReconcile = async (shiftId: string, status: 'Reconciled' | 'Discrepancy_Flagged') => {
        const targetShift = (shifts || []).find(s => s.id === shiftId);
        // 4-Eyes Maker-Checker Enforcement: Reconciler cannot sign off on their own shift
        if (targetShift && (targetShift.cashierId === user?.id || (user?.code && targetShift.cashierId === user.code) || targetShift.cashierName === user?.name)) {
            addNotification?.('alert', '4-Eyes Violation: You cannot reconcile or sign off on your own cashier shift. A secondary manager or HQ auditor must sign.');
            return;
        }

        setReconcilingId(shiftId);
        try {
            await reconcileShift(shiftId, user?.name || 'HQ Auditor', status);
            addNotification?.('success', `Shift ${status === 'Reconciled' ? 'reconciled and signed off' : 'flagged for discrepancy audit'}.`);
        } finally {
            setReconcilingId(null);
        }
    };

    const handlePrintShiftZReport = (shift: ShiftRecord) => {
        const html = generateZReportReceiptHtml(
            shift,
            {
                cash: shift.cashSales,
                card: shift.cardSales,
                mobile: shift.mobileSales,
                expected: shift.expectedCash
            },
            activeSite?.name || 'SIIFMART Branch',
            shift.reconciledBy || user?.name
        );
        const printWindow = window.open('', '_blank', 'width=350,height=600');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
            }, 300);
        }
    };

    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 lg:p-8 shadow-xs space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--theme-border)] pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] flex items-center justify-center border border-[var(--theme-border)]">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-[var(--theme-text-primary)] uppercase tracking-tight">
                            Daily Cash & Shift Reconciliation (HQ Oversight)
                        </h3>
                        <p className="text-xs text-[var(--theme-text-secondary)]">
                            Central drawer audit, multi-tender verification, and 4-eyes dual control
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)]" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search cashier or ID..."
                            className="pl-8 pr-3 py-1.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-xs text-[var(--theme-text-primary)] font-mono outline-none focus:border-[var(--theme-border-focus)]"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 py-1.5 text-xs text-[var(--theme-text-primary)] font-bold outline-none cursor-pointer"
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
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="border-b border-[var(--theme-border)] text-[10px] uppercase font-bold tracking-wider text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)]">
                            <th className="py-3 px-3">Status</th>
                            <th className="py-3 px-3">Cashier</th>
                            <th className="py-3 px-3">Start Time</th>
                            <th className="py-3 px-3 text-right">Float</th>
                            <th className="py-3 px-3 text-right">Cash Sales</th>
                            <th className="py-3 px-3 text-right">Expected</th>
                            <th className="py-3 px-3 text-right">Actual Count</th>
                            <th className="py-3 px-3 text-right">Variance</th>
                            <th className="py-3 px-3 text-center">HQ Audit Action</th>
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
                                    <tr key={shift.id} className="hover:bg-[var(--theme-bg-card-hover)] transition-colors">
                                        {/* Status Badge */}
                                        <td className="py-3 px-3">
                                            {shift.status === 'Open' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                                    <Clock size={10} /> Open
                                                </span>
                                            ) : shift.status === 'Audited' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                    <CheckCircle size={10} /> Audited
                                                </span>
                                            ) : shift.status === 'Flagged' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                                    <AlertTriangle size={10} /> Flagged
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                    <Clock size={10} /> Awaiting HQ
                                                </span>
                                            )}
                                        </td>

                                        {/* Cashier */}
                                        <td className="py-3 px-3 font-sans font-bold text-[var(--theme-text-primary)]">
                                            {shift.cashierName}
                                        </td>

                                        {/* Start Time */}
                                        <td className="py-3 px-3 text-[11px] text-[var(--theme-text-secondary)]">
                                            {shift.startTime ? formatDateTime(shift.startTime) : 'N/A'}
                                        </td>

                                        {/* Opening Float */}
                                        <td className="py-3 px-3 text-right text-[var(--theme-text-secondary)]">
                                            {CURRENCY_SYMBOL} {(shift.openingFloat || 0).toLocaleString()}
                                        </td>

                                        {/* Cash Sales */}
                                        <td className="py-3 px-3 text-right text-[var(--theme-text-primary)] font-bold">
                                            {CURRENCY_SYMBOL} {(shift.cashSales || 0).toLocaleString()}
                                        </td>

                                        {/* Expected Cash */}
                                        <td className="py-3 px-3 text-right font-bold text-[var(--theme-text-secondary)]">
                                            {CURRENCY_SYMBOL} {(shift.expectedCash || 0).toLocaleString()}
                                        </td>

                                        {/* Actual Counted */}
                                        <td className="py-3 px-3 text-right font-bold text-[var(--theme-text-primary)]">
                                            {shift.status === 'Open' ? 'Active...' : `${CURRENCY_SYMBOL} ${(shift.actualCash || 0).toLocaleString()}`}
                                        </td>

                                        {/* Variance */}
                                        <td className={`py-3 px-3 text-right font-bold ${
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
                                        <td className="py-3 px-3 text-center">
                                            <div className="flex items-center justify-center gap-1.5 font-sans">
                                                {shift.status !== 'Open' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handlePrintShiftZReport(shift)}
                                                        className="px-2 py-1 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                                                        title="Print Z-Report Slip"
                                                    >
                                                        <Printer size={11} />
                                                        <span>Z-Report</span>
                                                    </button>
                                                )}

                                                {shift.status === 'Closed' && isHQOrManager ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleReconcile(shift.id, 'Reconciled')}
                                                            disabled={reconcilingId === shift.id}
                                                            className="px-2.5 py-1 bg-[var(--theme-primary)] hover:opacity-90 text-[var(--theme-primary-text)] text-[10px] font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50"
                                                        >
                                                            Sign-Off
                                                        </button>
                                                        <button
                                                            onClick={() => handleReconcile(shift.id, 'Discrepancy_Flagged')}
                                                            disabled={reconcilingId === shift.id}
                                                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50"
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
