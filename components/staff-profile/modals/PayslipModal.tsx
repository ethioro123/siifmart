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
                <div className="p-5 rounded-2xl bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-black text-[#1E3F27] dark:text-[#EAE5D9] tracking-tight">
                            SIIFMART ENTERPRISE
                        </h3>
                        <p className="text-xs text-stone-500 font-medium">
                            Official Compensation & Earnings Statement • {siteName}
                        </p>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#2C5E3B] dark:text-[#A9CBA2] block">
                            Payslip ID
                        </span>
                        <span className="font-mono text-xs font-bold text-stone-700 dark:text-stone-300">
                            {payslip.id}
                        </span>
                    </div>
                </div>

                {/* Employee Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-white dark:bg-white/5 border border-[#E2DCCE] dark:border-white/10 text-xs">
                    <div>
                        <span className="text-stone-400 text-[10px] uppercase font-bold block">Employee Name</span>
                        <span className="font-bold text-[#1E3F27] dark:text-[#EAE5D9]">{employee.name}</span>
                    </div>
                    <div>
                        <span className="text-stone-400 text-[10px] uppercase font-bold block">Employee Code</span>
                        <span className="font-mono font-bold text-[#1E3F27] dark:text-[#EAE5D9]">{formatDisplayEmployeeId(employee)}</span>
                    </div>
                    <div>
                        <span className="text-stone-400 text-[10px] uppercase font-bold block">Job Title</span>
                        <span className="font-bold text-[#1E3F27] dark:text-[#EAE5D9]">{getEmployeeJobTitle(employee)}</span>
                    </div>
                    <div>
                        <span className="text-stone-400 text-[10px] uppercase font-bold block">Pay Period</span>
                        <span className="font-bold text-[#2C5E3B] dark:text-[#A9CBA2]">{payslip.period}</span>
                    </div>
                </div>

                {/* Earnings & Deductions Table */}
                <div className="border border-[#E2DCCE] dark:border-white/10 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-[#FAF8F5] dark:bg-white/5 border-b border-[#E2DCCE] dark:border-white/10 font-bold text-stone-600 dark:text-stone-300">
                                <th className="p-3">Earnings Description</th>
                                <th className="p-3 text-right">Amount ({currencySymbol})</th>
                                <th className="p-3">Deductions Description</th>
                                <th className="p-3 text-right">Amount ({currencySymbol})</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2DCCE]/60 dark:divide-white/5 font-medium">
                            <tr>
                                <td className="p-3 font-semibold text-stone-800 dark:text-stone-200">Base Monthly Salary</td>
                                <td className="p-3 text-right font-mono font-bold text-stone-900 dark:text-white">
                                    {payslip.grossSalary.toLocaleString()}
                                </td>
                                <td className="p-3 font-semibold text-stone-800 dark:text-stone-200">Income Tax (PAYE 15%)</td>
                                <td className="p-3 text-right font-mono text-red-600 dark:text-red-400 font-bold">
                                    -{payslip.taxDeduction.toLocaleString()}
                                </td>
                            </tr>
                            <tr>
                                <td className="p-3 text-stone-500">Allowances / Benefits</td>
                                <td className="p-3 text-right font-mono text-stone-500">0</td>
                                <td className="p-3 font-semibold text-stone-800 dark:text-stone-200">Pension Scheme (7%)</td>
                                <td className="p-3 text-right font-mono text-red-600 dark:text-red-400 font-bold">
                                    -{payslip.pensionDeduction.toLocaleString()}
                                </td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr className="bg-emerald-50/70 dark:bg-emerald-950/20 border-t border-emerald-200 dark:border-emerald-800/40 font-bold text-sm">
                                <td className="p-3 text-[#1E3F27] dark:text-[#EAE5D9]">Total Gross Earnings</td>
                                <td className="p-3 text-right font-mono text-[#1E3F27] dark:text-[#EAE5D9]">
                                    {currencySymbol} {payslip.grossSalary.toLocaleString()}
                                </td>
                                <td className="p-3 text-emerald-800 dark:text-emerald-200 font-black">Net Take-Home Pay</td>
                                <td className="p-3 text-right font-mono text-lg font-black text-[#2C5E3B] dark:text-[#A9CBA2]">
                                    {currencySymbol} {payslip.netSalary.toLocaleString()}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Status & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-[#E2DCCE] dark:border-white/10">
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                        <span>Disbursed via Direct Bank Deposit • Released {payslip.releaseDate}</span>
                    </div>

                    <div className="flex items-center justify-end gap-2 print:hidden">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
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
