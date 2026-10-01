import React, { useState } from 'react';
import { useData } from '../../../contexts/DataContext';
import { useStore } from '../../../contexts/CentralStore';
import { CURRENCY_SYMBOL } from '../../../constants';
import { ShiftRecord } from '../../../types';
import { ShieldCheck, AlertTriangle, CheckCircle, Clock, Search, FileText, Printer } from 'lucide-react';
import { formatDateTime } from '../../../utils/formatting';
import { generateZReportReceiptHtml } from '../utils/receiptTemplate';

export const ShiftReconciliationTable: React.FC = () => {
    const { shifts, reconcileShift, activeSite } = useData();
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
        setReconcilingId(shiftId);
        try {
            await reconcileShift(shiftId, user?.name || 'HQ Auditor', status);
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
        <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[32px] p-6 lg:p-8 shadow-sm space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2DCCE]/60 dark:border-white/5 pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 text-[#2C5E3B] dark:text-[#A9CBA2] flex items-center justify-center border border-[#2C5E3B]/20">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-[#1E3F27] dark:text-white uppercase tracking-tight">
                            Daily Cash & Shift Reconciliation (HQ Oversight)
                        </h3>
                        <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83]">
                            Central drawer audit, multi-tender verification, and 4-eyes dual control
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search cashier or ID..."
                            className="pl-8 pr-3 py-1.5 bg-[#FAF8F5] dark:bg-black/20 border border-[#E2DCCE] dark:border-white/10 rounded-xl text-xs text-[#1E3F27] dark:text-white font-mono outline-none focus:border-[#2C5E3B]"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="bg-[#FAF8F5] dark:bg-black/20 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-[#1E3F27] dark:text-white font-bold outline-none cursor-pointer"
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
                        <tr className="border-b border-[#E2DCCE]/60 dark:border-white/5 text-[10px] uppercase font-black tracking-wider text-[#4D6E56] dark:text-[#7A9E83]">
                            <th className="pb-3 px-3">Status</th>
                            <th className="pb-3 px-3">Cashier</th>
                            <th className="pb-3 px-3">Start Time</th>
                            <th className="pb-3 px-3 text-right">Float</th>
                            <th className="pb-3 px-3 text-right">Cash Sales</th>
                            <th className="pb-3 px-3 text-right">Expected</th>
                            <th className="pb-3 px-3 text-right">Actual Count</th>
                            <th className="pb-3 px-3 text-right">Variance</th>
                            <th className="pb-3 px-3 text-center">HQ Audit Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2DCCE]/40 dark:divide-white/5 font-mono">
                        {filteredShifts.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="py-8 text-center text-stone-400 font-sans text-xs">
                                    No shifts matching the selected criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredShifts.map((shift: ShiftRecord) => {
                                const hasVariance = Math.abs(shift.variance || 0) > 0.01;
                                return (
                                    <tr key={shift.id} className="hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">
                                        {/* Status Badge */}
                                        <td className="py-3 px-3">
                                            {shift.status === 'Open' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200">
                                                    <Clock size={10} /> Open
                                                </span>
                                            ) : shift.status === 'Audited' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] border border-emerald-200">
                                                    <CheckCircle size={10} /> Audited
                                                </span>
                                            ) : shift.status === 'Flagged' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200">
                                                    <AlertTriangle size={10} /> Flagged
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200">
                                                    <Clock size={10} /> Awaiting HQ
                                                </span>
                                            )}
                                        </td>

                                        {/* Cashier */}
                                        <td className="py-3 px-3 font-sans font-bold text-[#1E3F27] dark:text-white">
                                            {shift.cashierName}
                                        </td>

                                        {/* Start Time */}
                                        <td className="py-3 px-3 text-[11px] text-stone-500">
                                            {shift.startTime ? formatDateTime(shift.startTime) : 'N/A'}
                                        </td>

                                        {/* Opening Float */}
                                        <td className="py-3 px-3 text-right">
                                            {CURRENCY_SYMBOL} {(shift.openingFloat || 0).toLocaleString()}
                                        </td>

                                        {/* Cash Sales */}
                                        <td className="py-3 px-3 text-right text-[#2C5E3B] dark:text-[#A9CBA2] font-bold">
                                            {CURRENCY_SYMBOL} {(shift.cashSales || 0).toLocaleString()}
                                        </td>

                                        {/* Expected Cash */}
                                        <td className="py-3 px-3 text-right font-bold">
                                            {CURRENCY_SYMBOL} {(shift.expectedCash || 0).toLocaleString()}
                                        </td>

                                        {/* Actual Counted */}
                                        <td className="py-3 px-3 text-right font-bold text-[#1E3F27] dark:text-white">
                                            {shift.status === 'Open' ? 'Active...' : `${CURRENCY_SYMBOL} ${(shift.actualCash || 0).toLocaleString()}`}
                                        </td>

                                        {/* Variance */}
                                        <td className={`py-3 px-3 text-right font-bold ${
                                            hasVariance ? 'text-red-600 dark:text-red-400' : 'text-[#2C5E3B] dark:text-[#A9CBA2]'
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
                                                        className="px-2 py-1 bg-stone-100 hover:bg-[#2C5E3B]/10 dark:bg-white/5 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#E2DCCE] dark:border-white/10 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer"
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
                                                            className="px-2.5 py-1 bg-[#2C5E3B] hover:opacity-90 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50"
                                                        >
                                                            Sign-Off
                                                        </button>
                                                        <button
                                                            onClick={() => handleReconcile(shift.id, 'Discrepancy_Flagged')}
                                                            disabled={reconcilingId === shift.id}
                                                            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50"
                                                        >
                                                            Flag
                                                        </button>
                                                    </>
                                                ) : shift.reconciledBy ? (
                                                    <span className="text-[10px] text-stone-400 font-sans block" title={`Reconciled at ${shift.reconciledAt}`}>
                                                        ✓ {shift.reconciledBy}
                                                    </span>
                                                ) : shift.status === 'Open' ? (
                                                    <span className="text-stone-300 dark:text-stone-700">-</span>
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
