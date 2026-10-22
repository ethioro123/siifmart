import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { DollarSign, Download, FileText, CheckCircle2, ChevronRight, Clock, ShieldCheck } from 'lucide-react';
import { CURRENCY_SYMBOL } from '../../../constants';
import { useData } from '../../../contexts/DataContext';
import { Employee, SalaryChangeRequest } from '../../../types';
import { PayslipRecord, generateEmployeePayslips } from '../../../utils/employeeProfileData';
import { salaryRequestsService } from '../../../services/salary-requests.service';

interface PayrollTabProps {
    employee: Employee;
    canManageEmployees: boolean;
    handleEditSalary: () => void;
    handleDownloadPayslip?: (id: number) => void;
    onViewPayslip?: (payslip: PayslipRecord) => void;
}

export default function PayrollTab({
    employee,
    canManageEmployees,
    handleEditSalary,
    handleDownloadPayslip,
    onViewPayslip
}: PayrollTabProps) {
    const { settings, activeSite } = useData();
    const currencySymbol = (employee as any).salaryCurrency || (activeSite as any)?.currency || settings?.currency || CURRENCY_SYMBOL;

    const [pendingRequest, setPendingRequest] = useState<SalaryChangeRequest | null>(null);

    const loadPendingForEmployee = useCallback(async () => {
        try {
            const pendingList = await salaryRequestsService.getPending();
            const match = pendingList.find(r => r.employeeId === employee.id);
            setPendingRequest(match || null);
        } catch {
            // Handled
        }
    }, [employee.id]);

    useEffect(() => {
        loadPendingForEmployee();
        const handleCreated = () => loadPendingForEmployee();
        const handleApproved = () => loadPendingForEmployee();
        const handleRejected = () => loadPendingForEmployee();

        window.addEventListener('salary:request-created', handleCreated);
        window.addEventListener('salary:request-approved', handleApproved);
        window.addEventListener('salary:request-rejected', handleRejected);

        return () => {
            window.removeEventListener('salary:request-created', handleCreated);
            window.removeEventListener('salary:request-approved', handleApproved);
            window.removeEventListener('salary:request-rejected', handleRejected);
        };
    }, [loadPendingForEmployee]);

    const payslips = useMemo(() => {
        return generateEmployeePayslips(employee, currencySymbol);
    }, [employee, currencySymbol]);

    const handleSelectPayslip = (slip: PayslipRecord) => {
        if (onViewPayslip) {
            onViewPayslip(slip);
        } else if (handleDownloadPayslip) {
            handleDownloadPayslip(1);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Summary Card */}
            <div className="bg-[var(--theme-bg-card)] p-6 sm:p-8 rounded-2xl border border-[var(--theme-border)] relative overflow-hidden group shadow-xs">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                    <div className="text-center md:text-left">
                        <p className="text-xs text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider mb-2">
                            Base Monthly Gross Salary
                        </p>
                        <p className="text-3xl md:text-4xl font-bold text-[var(--theme-text-primary)] font-mono tabular-nums tracking-tight">
                            {currencySymbol} {employee.salary?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-2 font-medium">
                            Standard statutory tax (PAYE 15%) and pension (7%) calculated automatically
                        </p>
                    </div>
                    {canManageEmployees && (
                        <button
                            onClick={handleEditSalary}
                            className="h-11 px-5 rounded-xl bg-[var(--theme-accent)] text-white hover:bg-[var(--theme-accent)]/90 text-xs font-semibold uppercase tracking-wider cursor-pointer shrink-0 transition-colors shadow-xs flex items-center justify-center"
                        >
                            Adjust Compensation
                        </button>
                    )}
                </div>
            </div>

            {/* Pending Salary Request Alert */}
            {pendingRequest && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500">
                            <Clock size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-[var(--theme-text-primary)]">
                                Pending Salary Adjustment: <span className="font-mono tabular-nums">{currencySymbol} {Number(pendingRequest.currentSalary).toLocaleString()}</span> → <span className="font-mono tabular-nums text-amber-500">{currencySymbol} {Number(pendingRequest.proposedSalary).toLocaleString()}</span>
                            </p>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">
                                Proposed by {pendingRequest.requestedBy} ({pendingRequest.requestedByRole}) • Awaiting Head of Finance / CEO Authorization
                            </p>
                        </div>
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/25 shrink-0">
                        In Queue
                    </span>
                </div>
            )}

            {/* Recent Payslips */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-bold text-[var(--theme-text-primary)] uppercase tracking-wider flex items-center gap-2">
                            <FileText size={16} className="text-[var(--theme-accent)]" />
                            Official Payroll Statements
                        </h4>
                        <p className="text-xs text-[var(--theme-text-secondary)]">
                            Disbursed salary vouchers, deductions, and tax withholdings
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {payslips.map(slip => (
                        <div
                            key={slip.id}
                            onClick={() => handleSelectPayslip(slip)}
                            className="flex justify-between items-center p-5 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/60 cursor-pointer transition-colors group shadow-xs"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectPayslip(slip); }}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-105 transition-transform shrink-0">
                                    <DollarSign size={20} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm text-[var(--theme-text-primary)] font-bold group-hover:text-[var(--theme-accent)] transition-colors">
                                            {slip.period}
                                        </p>
                                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)]">
                                            {slip.id}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[var(--theme-text-secondary)] font-mono tabular-nums mt-0.5">
                                        Net: <span className="font-bold text-[var(--theme-text-primary)]">{currencySymbol} {slip.netSalary.toLocaleString()}</span> • Released {slip.releaseDate}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-[var(--theme-text-muted)] group-hover:text-[var(--theme-accent)] transition-colors">
                                <span className="text-xs font-semibold hidden sm:inline">View Statement</span>
                                <ChevronRight size={18} className="transform group-hover:translate-x-0.5 transition-transform" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

