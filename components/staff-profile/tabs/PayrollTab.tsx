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
            <div className="bg-[#FAF8F5] dark:bg-black/40 p-8 rounded-3xl border border-[#E2DCCE] dark:border-white/10 relative overflow-hidden group shadow-xs">
                <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                    <div className="text-center md:text-left">
                        <p className="text-xs text-stone-500 font-black uppercase tracking-[0.15em] mb-2">
                            Base Monthly Gross Salary
                        </p>
                        <p className="text-4xl md:text-5xl font-black text-[#1E3F27] dark:text-[#EAE5D9] font-mono tracking-tighter">
                            {currencySymbol} {employee.salary?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-stone-400 mt-2 font-medium">
                            Standard statutory tax (PAYE 15%) and pension (7%) calculated automatically
                        </p>
                    </div>
                    {canManageEmployees && (
                        <button
                            onClick={handleEditSalary}
                            className="woody-btn-primary px-6 py-3 text-xs font-black uppercase tracking-widest rounded-2xl cursor-pointer shrink-0 shadow-md"
                        >
                            Adjust Compensation
                        </button>
                    )}
                </div>
            </div>

            {/* Pending Salary Request Alert */}
            {pendingRequest && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 flex items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">
                            <Clock size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-amber-900 dark:text-amber-300">
                                Pending Salary Adjustment: {currencySymbol} {Number(pendingRequest.currentSalary).toLocaleString()} → {currencySymbol} {Number(pendingRequest.proposedSalary).toLocaleString()}
                            </p>
                            <p className="text-[11px] text-amber-700 dark:text-amber-400/80 mt-0.5">
                                Proposed by {pendingRequest.requestedBy} ({pendingRequest.requestedByRole}) • Awaiting Finance Manager / CEO Authorization
                            </p>
                        </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-200/80 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 shrink-0">
                        In Queue
                    </span>
                </div>
            )}

            {/* Recent Payslips */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-black text-[#1E3F27] dark:text-[#EAE5D9] uppercase tracking-wider flex items-center gap-2">
                            <FileText size={16} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                            Official Payroll Statements
                        </h4>
                        <p className="text-xs text-stone-500">
                            Disbursed salary vouchers, deductions, and tax withholdings
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {payslips.map(slip => (
                        <div
                            key={slip.id}
                            onClick={() => handleSelectPayslip(slip)}
                            className="flex justify-between items-center p-5 bg-[#FAF8F5] dark:bg-black/30 rounded-2xl border border-[#E2DCCE] dark:border-white/10 hover:border-[#2C5E3B]/60 dark:hover:border-emerald-500/40 cursor-pointer transition-all group shadow-xs hover:shadow-md"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectPayslip(slip); }}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center text-[#2C5E3B] dark:text-[#A9CBA2] group-hover:scale-105 transition-transform shrink-0">
                                    <DollarSign size={22} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm text-[#1E3F27] dark:text-[#EAE5D9] font-bold group-hover:text-[#2C5E3B] dark:group-hover:text-emerald-400 transition-colors">
                                            {slip.period}
                                        </p>
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-300">
                                            {slip.id}
                                        </span>
                                    </div>
                                    <p className="text-xs text-stone-500 font-mono mt-0.5">
                                        Net: <span className="font-bold text-[#2C5E3B] dark:text-[#A9CBA2]">{currencySymbol} {slip.netSalary.toLocaleString()}</span> • Released {slip.releaseDate}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-stone-400 group-hover:text-[#2C5E3B] dark:group-hover:text-[#EAE5D9] transition-colors">
                                <span className="text-xs font-bold hidden sm:inline">View Statement</span>
                                <ChevronRight size={18} className="transform group-hover:translate-x-0.5 transition-transform" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

