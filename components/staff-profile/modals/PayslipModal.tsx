import React from 'react';
import Modal from '../../Modal';
import { Printer, Download, Building, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Employee } from '../../../types';
import { PayslipRecord } from '../../../utils/employeeProfileData';
import { getEmployeeJobTitle } from '../../../utils/roles';
import { formatDisplayEmployeeId } from '../../../utils/employeeIdGenerator';

interface PayslipModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Employee;
    payslip: PayslipRecord | null;
    siteName?: string;
    currencySymbol?: string;
}

export const PayslipModal: React.FC<PayslipModalProps> = ({
    isOpen,
    onClose,
    employee,
    payslip,
    siteName = 'Headquarters',
    currencySymbol = 'ETB'
}) => {
    if (!payslip) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Payslip Statement: ${payslip.period}`}
            size="lg"
        >
            <div className="space-y-6 print:m-0 print:p-0">
                {/* Header Statement */}
                <div className="p-5 rounded-2xl bg-[var(--theme-bg-app)] bg-[color-mix(in_srgb,var(--theme-overlay)_30%,transparent)] border border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-black text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)] tracking-tight">
                            SIIFMART ENTERPRISE
                        </h3>
                        <p className="text-xs text-[var(--theme-text-secondary)] font-medium">
                            Official Compensation & Earnings Statement • {siteName}
                        </p>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)] block">
                            Payslip ID
                        </span>
                        <span className="font-mono text-xs font-bold text-[var(--theme-text-primary)] text-[var(--theme-text-muted)]">
                            {payslip.id}
                        </span>
                    </div>
                </div>

                {/* Employee Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[var(--theme-bg-card)] bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)] border border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] text-xs">
                    <div>
                        <span className="text-[var(--theme-text-muted)] text-[10px] uppercase font-bold block">Employee Name</span>
                        <span className="font-bold text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)]">{employee.name}</span>
                    </div>
                    <div>
                        <span className="text-[var(--theme-text-muted)] text-[10px] uppercase font-bold block">Employee Code</span>
                        <span className="font-mono font-bold text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)]">{formatDisplayEmployeeId(employee)}</span>
                    </div>
                    <div>
                        <span className="text-[var(--theme-text-muted)] text-[10px] uppercase font-bold block">Job Title</span>
                        <span className="font-bold text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)]">{getEmployeeJobTitle(employee)}</span>
                    </div>
                    <div>
                        <span className="text-[var(--theme-text-muted)] text-[10px] uppercase font-bold block">Pay Period</span>
                        <span className="font-bold text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)]">{payslip.period}</span>
                    </div>
                </div>

                {/* Earnings & Deductions Table */}
                <div className="border border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-[var(--theme-bg-app)] bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)] border-b border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] font-bold text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)]">
                                <th className="p-3">Earnings Description</th>
                                <th className="p-3 text-right">Amount ({currencySymbol})</th>
                                <th className="p-3">Deductions Description</th>
                                <th className="p-3 text-right">Amount ({currencySymbol})</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[color-mix(in_srgb,var(--theme-border)_60%,transparent)] font-medium">
                            <tr>
                                <td className="p-3 font-semibold text-[var(--theme-text-primary)] text-[var(--theme-text-muted)]">Base Monthly Salary</td>
                                <td className="p-3 text-right font-mono font-bold text-[var(--theme-text-primary)] text-[var(--theme-text-primary)]">
                                    {payslip.grossSalary.toLocaleString()}
                                </td>
                                <td className="p-3 font-semibold text-[var(--theme-text-primary)] text-[var(--theme-text-muted)]">Income Tax (PAYE 15%)</td>
                                <td className="p-3 text-right font-mono text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] font-bold">
                                    -{payslip.taxDeduction.toLocaleString()}
                                </td>
                            </tr>
                            <tr>
                                <td className="p-3 text-[var(--theme-text-secondary)]">Allowances / Benefits</td>
                                <td className="p-3 text-right font-mono text-[var(--theme-text-secondary)]">0</td>
                                <td className="p-3 font-semibold text-[var(--theme-text-primary)] text-[var(--theme-text-muted)]">Pension Scheme (7%)</td>
                                <td className="p-3 text-right font-mono text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] font-bold">
                                    -{payslip.pensionDeduction.toLocaleString()}
                                </td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr className="bg-[var(--theme-status-success-bg)] bg-[var(--theme-status-success-bg)] border-t border-[var(--theme-status-success-border)] border-[var(--theme-status-success-border)] font-bold text-sm">
                                <td className="p-3 text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)]">Total Gross Earnings</td>
                                <td className="p-3 text-right font-mono text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)]">
                                    {currencySymbol} {payslip.grossSalary.toLocaleString()}
                                </td>
                                <td className="p-3 text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] font-black">Net Take-Home Pay</td>
                                <td className="p-3 text-right font-mono text-lg font-black text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)]">
                                    {currencySymbol} {payslip.netSalary.toLocaleString()}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Status & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)]">
                    <div className="flex items-center gap-2 text-xs text-[var(--theme-text-secondary)]">
                        <CheckCircle2 size={16} className="text-[var(--theme-status-success-text)]" />
                        <span>Disbursed via Direct Bank Deposit • Released {payslip.releaseDate}</span>
                    </div>

                    <div className="flex items-center justify-end gap-2 print:hidden">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)] hover:bg-[var(--theme-bg-subtle)] hover:bg-[color-mix(in_srgb,var(--theme-bg-card)_10%,transparent)] transition-colors cursor-pointer"
                        >
                            Close
                        </button>
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="woody-btn-primary px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                        >
                            <Printer size={15} />
                            <span>Print / Save PDF</span>
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
