import React, { useState, useEffect, useCallback } from 'react';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ArrowUp,
    ArrowDown,
    Briefcase
} from 'lucide-react';
import { useFinance } from './FinanceContext';
import { salaryRequestsService } from '../../services/salary-requests.service';
import { payrollRunsService } from '../../services/payroll-runs.service';
import type { PayrollRun } from '../../types';
import SalaryApprovalQueueModal from '../employees/SalaryApprovalQueueModal';
import { PayrollSummaryCard } from './payroll/PayrollSummaryCard';
import { getEmployeeJobTitle } from '../../utils/roles';

export const PayrollTab: React.FC = () => {
    const {
        employees,
        payrollSearch,
        setPayrollSearch,
        payrollRoleFilter,
        setPayrollRoleFilter,
        payrollSort,
        setPayrollSort,
        payrollSortDir,
        setPayrollSortDir,
        payrollPage,
        setPayrollPage,
        payrollPerPage,
        setPayrollPerPage,
        filteredEmployees,
        payrollTotalPages,
        payrollStartIndex,
        payrollEndIndex,
        paginatedEmployees,
        getPayrollPageNumbers,
        uniqueRoles,
        totalSalaries,
        totalBonuses,
        calculateEmployeeBonus,
        handleProcessPayroll,
        handleDownloadBankFile,
        isSubmitting,
        currencySymbol,
        effectiveCountry,
        activeSite
    } = useFinance();

    const [isSalaryQueueOpen, setIsSalaryQueueOpen] = useState(false);
    const [pendingSalaryCount, setPendingSalaryCount] = useState(0);
    const [latestRun, setLatestRun] = useState<PayrollRun | null>(null);

    const refreshPayrollState = useCallback(async () => {
        try {
            const [pendingSalaries, run] = await Promise.all([
                salaryRequestsService.getPending(activeSite?.id, effectiveCountry),
                payrollRunsService.getLatestRun(activeSite?.id, effectiveCountry)
            ]);
            setPendingSalaryCount(pendingSalaries.length);
            setLatestRun(run);
        } catch {
            // Handled gracefully
        }
    }, [activeSite?.id, effectiveCountry]);

    useEffect(() => {
        refreshPayrollState();
        const handleSalaryCreated = () => refreshPayrollState();
        const handleSalaryApproved = () => refreshPayrollState();
        const handleSalaryRejected = () => refreshPayrollState();
        const handlePayrollUpdated = () => refreshPayrollState();
        const handlePayrollDisbursed = () => refreshPayrollState();

        window.addEventListener('salary:request-created', handleSalaryCreated);
        window.addEventListener('salary:request-approved', handleSalaryApproved);
        window.addEventListener('salary:request-rejected', handleSalaryRejected);
        window.addEventListener('payroll:updated', handlePayrollUpdated);
        window.addEventListener('payroll:disbursed', handlePayrollDisbursed);

        return () => {
            window.removeEventListener('salary:request-created', handleSalaryCreated);
            window.removeEventListener('salary:request-approved', handleSalaryApproved);
            window.removeEventListener('salary:request-rejected', handleSalaryRejected);
            window.removeEventListener('payroll:updated', handlePayrollUpdated);
            window.removeEventListener('payroll:disbursed', handlePayrollDisbursed);
        };
    }, [refreshPayrollState]);

    const PAYROLL_PER_PAGE_OPTIONS = [10, 25, 50, 100];

    const toggleSort = (column: 'name' | 'department' | 'salary') => {
        if (payrollSort === column) {
            setPayrollSortDir(payrollSortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setPayrollSort(column);
            setPayrollSortDir('asc');
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
            {/* Left 2 Cols: Payroll Registry Table */}
            <div className="lg:col-span-2 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
                <div>
                    {/* Header */}
                    <div className="p-5 border-b border-[var(--theme-border)] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF] flex items-center justify-center shrink-0">
                                <Briefcase size={18} />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-[var(--theme-text-primary)] tracking-tight">
                                    Payroll Registry
                                </h3>
                                <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                                    Monthly compensation breakdown based on verified active personnel roster.
                                </p>
                            </div>
                        </div>

                        <span className="text-[11px] font-mono text-[var(--theme-text-secondary)] tabular-nums">
                            {filteredEmployees.length} Personnel
                        </span>
                    </div>

                    {/* Registry Controls */}
                    <div className="p-4 border-b border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)]" size={14} />
                            <input
                                type="text"
                                placeholder="Search employees by name or role..."
                                value={payrollSearch}
                                onChange={(e) => setPayrollSearch(e.target.value)}
                                className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[var(--theme-text-primary)] placeholder-[var(--theme-text-secondary)] outline-none focus:ring-1 focus:ring-[var(--theme-accent)] transition-all"
                                aria-label="Search employees"
                            />
                        </div>
                        <select
                            value={payrollRoleFilter}
                            onChange={(e) => setPayrollRoleFilter(e.target.value)}
                            className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 py-1.5 text-xs text-[var(--theme-text-primary)] outline-none focus:ring-1 focus:ring-[var(--theme-accent)] cursor-pointer"
                            aria-label="Filter by role"
                        >
                            {uniqueRoles.map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-[var(--theme-bg-subtle)] border-b border-[var(--theme-border)] uppercase text-[11px] font-medium text-[var(--theme-text-secondary)] tracking-wider">
                                <tr>
                                    <th
                                        className="p-4 cursor-pointer hover:text-[var(--theme-text-primary)] transition-colors select-none"
                                        onClick={() => toggleSort('name')}
                                    >
                                        <div className="flex items-center gap-1">
                                            <span>Employee</span>
                                            {payrollSort === 'name' && (
                                                payrollSortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                                            )}
                                        </div>
                                    </th>
                                    <th className="p-4">Role</th>
                                    <th
                                        className="p-4 cursor-pointer hover:text-[var(--theme-text-primary)] transition-colors select-none"
                                        onClick={() => toggleSort('department')}
                                    >
                                        <div className="flex items-center gap-1">
                                            <span>Department</span>
                                            {payrollSort === 'department' && (
                                                payrollSortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="p-4 text-right cursor-pointer hover:text-[var(--theme-text-primary)] transition-colors select-none"
                                        onClick={() => toggleSort('salary')}
                                    >
                                        <div className="flex items-center justify-end gap-1">
                                            <span>Salary</span>
                                            {payrollSort === 'salary' && (
                                                payrollSortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                                            )}
                                        </div>
                                    </th>
                                    <th className="p-4 text-right">Bonus</th>
                                    <th className="p-4 text-right">Total Payout</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--theme-border)]">
                                {paginatedEmployees.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-[var(--theme-text-secondary)]">
                                            No personnel matching the current filters.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedEmployees.map(emp => {
                                        const bonus = calculateEmployeeBonus(emp);
                                        const total = (Number(emp.salary) || 0) + bonus;

                                        return (
                                            <tr key={emp.id} className="hover:bg-[var(--theme-bg-subtle)] transition-colors">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-7 h-7 rounded-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] overflow-hidden shrink-0 flex items-center justify-center">
                                                            {emp.avatar ? (
                                                                <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-[10px] font-semibold text-[var(--theme-text-primary)]">
                                                                    {emp.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs font-semibold text-[var(--theme-text-primary)] truncate">
                                                            {emp.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]">
                                                        {getEmployeeJobTitle(emp)}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-[11px] text-[var(--theme-text-secondary)]">
                                                    {emp.department}
                                                </td>
                                                <td className="p-4 text-right font-mono tabular-nums text-[var(--theme-text-primary)] font-semibold">
                                                    {currencySymbol} {(Number(emp.salary) || 0).toLocaleString()}
                                                </td>
                                                <td className="p-4 text-right font-mono tabular-nums">
                                                    {bonus > 0 ? (
                                                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                                            +{currencySymbol} {bonus.toLocaleString()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[var(--theme-text-secondary)] opacity-50">—</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                                                    {currencySymbol} {total.toLocaleString()}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Payroll Pagination Controls */}
                {filteredEmployees.length > 0 && (
                    <div className="p-4 border-t border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-[var(--theme-text-secondary)]">
                                Showing <span className="font-semibold text-[var(--theme-text-primary)] font-mono tabular-nums">{payrollStartIndex + 1}</span>–<span className="font-semibold text-[var(--theme-text-primary)] font-mono tabular-nums">{Math.min(payrollEndIndex, filteredEmployees.length)}</span> of <span className="font-semibold text-[var(--theme-text-primary)] font-mono tabular-nums">{filteredEmployees.length}</span>
                            </span>
                            <select
                                value={payrollPerPage}
                                onChange={(e) => {
                                    setPayrollPerPage(Number(e.target.value));
                                    setPayrollPage(1);
                                }}
                                className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-lg px-2 py-1 text-[11px] text-[var(--theme-text-primary)] outline-none cursor-pointer"
                                aria-label="Items per page"
                            >
                                {PAYROLL_PER_PAGE_OPTIONS.map(n => (
                                    <option key={n} value={n}>{n} / page</option>
                                ))}
                            </select>
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setPayrollPage(1)}
                                disabled={payrollPage === 1}
                                className="p-1 rounded-lg text-xs text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                title="First Page"
                            >
                                <ChevronsLeft size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setPayrollPage(Math.max(1, payrollPage - 1))}
                                disabled={payrollPage === 1}
                                className="p-1 rounded-lg text-xs text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                title="Previous Page"
                            >
                                <ChevronLeft size={14} />
                            </button>

                            <div className="flex items-center gap-1 mx-1.5">
                                {getPayrollPageNumbers().map((page, idx) => (
                                    typeof page === 'number' ? (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setPayrollPage(page)}
                                            className={`w-6 h-6 rounded-lg text-xs font-semibold transition-all ${
                                                payrollPage === page
                                                    ? 'bg-[#0071E3] text-white shadow-xs'
                                                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)]'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    ) : (
                                        <span key={idx} className="text-[var(--theme-text-secondary)] px-1 text-xs">...</span>
                                    )
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={() => setPayrollPage(Math.min(payrollTotalPages, payrollPage + 1))}
                                disabled={payrollPage === payrollTotalPages}
                                className="p-1 rounded-lg text-xs text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                title="Next Page"
                            >
                                <ChevronRight size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setPayrollPage(payrollTotalPages)}
                                disabled={payrollPage === payrollTotalPages}
                                className="p-1 rounded-lg text-xs text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                title="Last Page"
                            >
                                <ChevronsRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Right 1 Col: Summary & Actions Component */}
            <PayrollSummaryCard
                totalSalaries={totalSalaries}
                totalBonuses={totalBonuses}
                employeeCount={employees.length}
                currencySymbol={currencySymbol}
                latestRun={latestRun}
                pendingSalaryCount={pendingSalaryCount}
                isSubmitting={isSubmitting}
                onProcessPayroll={handleProcessPayroll}
                onOpenSalaryQueue={() => setIsSalaryQueueOpen(true)}
                onDownloadBankFile={handleDownloadBankFile}
            />

            {/* Salary Approval Queue Modal */}
            {isSalaryQueueOpen && (
                <SalaryApprovalQueueModal
                    isOpen={isSalaryQueueOpen}
                    onClose={() => setIsSalaryQueueOpen(false)}
                    onRequestsUpdated={refreshPayrollState}
                />
            )}
        </div>
    );
};

export default PayrollTab;
