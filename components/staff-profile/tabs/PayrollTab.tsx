import React from 'react';
import { DollarSign, Download } from 'lucide-react';
import { CURRENCY_SYMBOL } from '../../../constants';
import { Employee } from '../../../types';

interface PayrollTabProps {
    employee: Employee;
    canManageEmployees: boolean;
    handleEditSalary: () => void;
    handleDownloadPayslip: (id: number) => void;
}

export default function PayrollTab({
    employee,
    canManageEmployees,
    handleEditSalary,
    handleDownloadPayslip
}: PayrollTabProps) {
    return (
        <div className="space-y-8 animate-in fade-in">
            {/* Summary Card */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-black/40 dark:to-cyber-gray/40 p-8 rounded-3xl border border-gray-800 dark:border-white/10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                    <div className="text-center md:text-left">
                        <p className="text-xs text-gray-400 uppercase font-black tracking-[0.2em] mb-3">Base Monthly Salary</p>
                        <p className="text-5xl font-black text-white font-mono tracking-tighter">
                            {CURRENCY_SYMBOL} {employee.salary?.toLocaleString() || '0'}
                        </p>
                    </div>
                    {canManageEmployees && (
                        <button
                            onClick={handleEditSalary}
                            className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-2xl text-xs font-black uppercase tracking-widest text-white transition-all shadow-xl"
                        >
                            Adjust Compensation
                        </button>
                    )}
                </div>
            </div>

            {/* Recent Payslips */}
            <div>
                <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Download size={16} className="text-cyber-primary" /> Recent Payslips
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div
                            key={i}
                            onClick={() => handleDownloadPayslip(202400 + i)}
                            className="flex justify-between items-center p-5 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 hover:border-cyber-primary/50 dark:hover:border-cyber-primary/30 cursor-pointer transition-all group"
                            role="button"
                            tabIndex={0}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-500/10 flex items-center justify-center text-green-600 dark:text-green-500 group-hover:bg-green-200 dark:group-hover:bg-green-500/20 transition-all">
                                    <DollarSign size={20} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-900 dark:text-white font-bold group-hover:text-cyber-primary transition-colors">Payslip #{202400 + i}</p>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Released: Mar {30 - i * 7}, 2024</p>
                                </div>
                            </div>
                            <Download size={18} className="text-gray-400 dark:text-gray-600 group-hover:text-gray-900 dark:group-hover:text-white transition-all transform group-hover:translate-y-0.5" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
