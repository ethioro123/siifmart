import React, { useMemo, useState, useEffect } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Users, CheckCircle, AlertTriangle, Plus, ShieldCheck } from 'lucide-react';
import { useFinance } from './FinanceContext';
import { budgetReconciliationService } from '../../services/budget-reconciliation.service';
import TenderReconciliationModal from './TenderReconciliationModal';
import type { TenderReconciliationRecord, DepartmentBudgetRecord } from '../../types';

export const BudgetTab: React.FC = () => {
    const {
        cashflowData,
        forecastData,
        currencySymbol,
        apAging,
        employees,
        effectiveCountry,
        activeSite
    } = useFinance();

    const [isReconciliationModalOpen, setIsReconciliationModalOpen] = useState(false);
    const [tenderRecords, setTenderRecords] = useState<TenderReconciliationRecord[]>([]);
    const [budgets, setBudgets] = useState<DepartmentBudgetRecord[]>([]);

    const loadReconciliations = async () => {
        const [tData, bData] = await Promise.all([
            budgetReconciliationService.getTenderReconciliations(effectiveCountry, activeSite?.id),
            budgetReconciliationService.getBudgets(effectiveCountry, activeSite?.id)
        ]);
        setTenderRecords(tData);
        setBudgets(bData);
    };

    useEffect(() => {
        loadReconciliations();
    }, [effectiveCountry, activeSite?.id]);

    const deptUtilization = useMemo(() => {
        const deptMap = new Map<string, { totalSalary: number; headcount: number }>();
        let grandTotal = 0;

        employees.forEach(emp => {
            const status = emp.status || 'Active';
            if (status !== 'Terminated') {
                const dept = emp.department || 'Operations';
                const salary = Number(emp.salary) || 0;
                const existing = deptMap.get(dept) || { totalSalary: 0, headcount: 0 };
                deptMap.set(dept, {
                    totalSalary: existing.totalSalary + salary,
                    headcount: existing.headcount + 1
                });
                grandTotal += salary;
            }
        });

        const palette = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

        return Array.from(deptMap.entries())
            .map(([dept, data], idx) => ({
                department: dept,
                headcount: data.headcount,
                totalSalary: data.totalSalary,
                percentage: grandTotal > 0 ? Math.round((data.totalSalary / grandTotal) * 100) : 0,
                color: palette[idx % palette.length]
            }))
            .sort((a, b) => b.totalSalary - a.totalSalary);
    }, [employees]);

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Top Row: Budget Variance Chart + Department Payroll */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white/90 dark:bg-stone-900/60 border border-[#E2DCCE] dark:border-white/5 rounded-2xl p-6">
                    <h3 className="font-bold text-[#1E3F27] dark:text-white mb-6">Budget Variance Analysis (YTD Cashflow)</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                            <ComposedChart data={cashflowData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" vertical={false} />
                                <XAxis dataKey="name" stroke="#888" fontSize={12} />
                                <YAxis stroke="#888" fontSize={12} />
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 40, 32, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                <Legend />
                                <Bar dataKey="income" fill="#3b82f6" barSize={20} name="Revenue" />
                                <Line type="monotone" dataKey="expense" stroke="#f59e0b" strokeWidth={2} name="Actual Spend" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white/90 dark:bg-stone-900/60 border border-[#E2DCCE] dark:border-white/5 rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-[#1E3F27] dark:text-white flex items-center gap-2">
                                <Users size={16} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                Department Utilization
                            </h3>
                            <span className="text-[11px] text-stone-500 dark:text-gray-400 font-mono">
                                {employees.filter(e => (e.status || 'Active') !== 'Terminated').length} Staff
                            </span>
                        </div>
                        <p className="text-xs text-stone-500 dark:text-gray-400 mb-3">
                            Operational payroll distribution across active enterprise departments.
                        </p>
                    </div>

                    <div className="space-y-3 my-2 overflow-y-auto max-h-[220px] pr-1">
                        {deptUtilization.map(dept => (
                            <div key={dept.department} className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span className="font-medium text-stone-700 dark:text-gray-300 truncate max-w-[130px]">{dept.department}</span>
                                    <span className="text-stone-500 dark:text-gray-400 font-mono">
                                        {currencySymbol} {dept.totalSalary.toLocaleString()} ({dept.percentage}%)
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-stone-200 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ width: `${Math.max(dept.percentage, 3)}%`, backgroundColor: dept.color }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-3 border-t border-[#E2DCCE] dark:border-white/5 text-[11px] text-stone-500 dark:text-gray-400 flex justify-between items-center mt-2">
                        <span>Total Monthly Payroll</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {currencySymbol} {deptUtilization.reduce((sum, d) => sum + d.totalSalary, 0).toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Middle Section: Tender Reconciliations (Telebirr/CBE Birr/M-Pesa) */}
            <div className="bg-white/90 dark:bg-stone-900/60 border border-[#E2DCCE] dark:border-white/5 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h3 className="font-bold text-[#1E3F27] dark:text-white flex items-center gap-2">
                            <ShieldCheck className="text-emerald-600 dark:text-emerald-400" size={18} />
                            Mobile Money &amp; Bank Settlement Reconciliation
                        </h3>
                        <p className="text-xs text-stone-500 dark:text-gray-400 mt-0.5">
                            Audit matching between register-reported electronic tenders and external gateway settlements.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsReconciliationModalOpen(true)}
                        className="woody-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                        <Plus size={14} /> Reconcile Gateway Tender
                    </button>
                </div>

                <div className="overflow-x-auto border border-[#E2DCCE] dark:border-white/5 rounded-xl">
                    <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-stone-100/80 dark:bg-black/30 font-sans uppercase text-stone-500 dark:text-gray-500 border-b border-[#E2DCCE] dark:border-white/5">
                            <tr>
                                <th className="p-3">Date</th>
                                <th className="p-3">Tender Gateway</th>
                                <th className="p-3 text-right">POS Reported</th>
                                <th className="p-3 text-right">Statement Amount</th>
                                <th className="p-3 text-right">Fees Deducted</th>
                                <th className="p-3 text-right">Variance</th>
                                <th className="p-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2DCCE] dark:divide-white/5">
                            {tenderRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-stone-400 dark:text-gray-500 font-sans">
                                        No gateway settlements recorded for this period. Click "Reconcile Gateway Tender" to log verification.
                                    </td>
                                </tr>
                            ) : (
                                tenderRecords.map(t => (
                                    <tr key={t.id} className="hover:bg-stone-50 dark:hover:bg-white/5">
                                        <td className="p-3 text-stone-600 dark:text-gray-300 font-sans">{t.reconciliationDate}</td>
                                        <td className="p-3 text-[#1E3F27] dark:text-white font-sans font-bold">{t.tenderType}</td>
                                        <td className="p-3 text-right text-stone-600 dark:text-gray-300">{currencySymbol} {t.posReportedAmount.toLocaleString()}</td>
                                        <td className="p-3 text-right text-[#1E3F27] dark:text-white font-bold">{currencySymbol} {t.statementAmount.toLocaleString()}</td>
                                        <td className="p-3 text-right text-stone-500 dark:text-gray-400">{currencySymbol} {t.feeDeductions.toLocaleString()}</td>
                                        <td className={`p-3 text-right font-bold ${t.variance === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                            {t.variance > 0 ? '+' : ''}{currencySymbol} {t.variance.toLocaleString()}
                                        </td>
                                        <td className="p-3 text-center font-sans">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                                t.status === 'Reconciled' || t.status === 'Matched'
                                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                                                    : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30'
                                            }`}>
                                                {t.status === 'Reconciled' || t.status === 'Matched' ? <CheckCircle size={10} /> : <AlertTriangle size={10} />}
                                                {t.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bottom Row: Cash Forecasting & AP Aging */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6">
                    <h3 className="font-bold text-[var(--theme-text-primary)] mb-2">Quarterly Cash Flow Forecast (AI Projected)</h3>
                    <p className="text-xs text-[var(--theme-text-secondary)] mb-6">Based on trailing 6-month revenue trends and seasonality factors.</p>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                            <AreaChart data={forecastData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" opacity={0.6} vertical={false} />
                                <XAxis dataKey="name" stroke="var(--theme-text-secondary)" fontSize={12} />
                                <YAxis stroke="var(--theme-text-secondary)" fontSize={12} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--theme-bg-panel)', border: '1px solid var(--theme-border)', borderRadius: '12px', color: 'var(--theme-text-primary)' }} />
                                <Area type="monotone" dataKey="projectedRevenue" stroke="#a855f7" fillOpacity={0.08} fill="#a855f7" name="Projected Cash" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6">
                    <h3 className="font-bold text-[var(--theme-text-primary)] mb-4">Accounts Payable Aging</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-xl">
                            <span className="text-xs text-stone-500 dark:text-gray-400 uppercase font-bold">Current (&le;30 Days)</span>
                            <span className="text-emerald-700 dark:text-emerald-400 font-mono font-bold">{currencySymbol} {apAging.current.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 rounded-xl">
                            <span className="text-xs text-stone-500 dark:text-gray-400 uppercase font-bold">1-30 Days Overdue</span>
                            <span className="text-blue-700 dark:text-blue-400 font-mono font-bold">{currencySymbol} {apAging.days1to30.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-xl">
                            <span className="text-xs text-stone-500 dark:text-gray-400 uppercase font-bold">31-60 Days Overdue</span>
                            <span className="text-amber-700 dark:text-amber-400 font-mono font-bold">{currencySymbol} {apAging.days31to60.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20 rounded-xl">
                            <span className="text-xs text-stone-500 dark:text-gray-400 uppercase font-bold">60+ Days Overdue</span>
                            <span className="text-rose-700 dark:text-rose-400 font-mono font-bold">{currencySymbol} {apAging.days60Plus.toLocaleString()}</span>
                        </div>
                        <div className="pt-4 border-t border-[#E2DCCE] dark:border-white/5 mt-2">
                            <div className="flex justify-between text-sm font-bold text-[#1E3F27] dark:text-white">
                                <span>Total Outstanding</span>
                                <span className="font-mono text-[#2C5E3B] dark:text-[#A9CBA2]">{currencySymbol} {apAging.totalOutstanding.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <TenderReconciliationModal
                isOpen={isReconciliationModalOpen}
                onClose={() => setIsReconciliationModalOpen(false)}
                onSuccess={loadReconciliations}
            />
        </div>
    );
};

export default BudgetTab;
