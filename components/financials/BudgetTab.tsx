import React, { useMemo, useState, useEffect } from 'react';
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import {
    Users,
    CheckCircle2,
    AlertTriangle,
    Plus,
    ShieldCheck,
    CreditCard,
    TrendingUp,
    Clock,
    Scale
} from 'lucide-react';
import { useFinance } from './FinanceContext';
import { budgetReconciliationService } from '../../services/budget-reconciliation.service';
import TenderReconciliationModal from './TenderReconciliationModal';
import type { TenderReconciliationRecord, DepartmentBudgetRecord } from '../../types';
import { isAdminSite } from '../../utils/countryAdmin';

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
            budgetReconciliationService.getTenderReconciliations(effectiveCountry, isAdminSite(activeSite) ? undefined : activeSite?.id),
            budgetReconciliationService.getBudgets(effectiveCountry, isAdminSite(activeSite) ? undefined : activeSite?.id)
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

        const palette = [
            'var(--theme-chart-1)', 'var(--theme-chart-2)', 'var(--theme-chart-3)',
            'var(--theme-chart-4)', 'var(--theme-chart-5)', 'var(--theme-chart-6)'
        ];

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
        <div className="space-y-4">
            {/* Top Row: Budget Variance Chart + Department Payroll */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 shadow-xs">
                    <div className="flex justify-between items-center mb-5">
                        <div>
                            <h3 className="font-semibold text-sm text-[var(--theme-text-primary)]">
                                Budget Variance Analysis (YTD Cashflow)
                            </h3>
                            <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                                Revenue performance tracked against actual operational outlays.
                            </p>
                        </div>
                    </div>

                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                            <ComposedChart data={cashflowData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" opacity={0.5} vertical={false} />
                                <XAxis dataKey="name" stroke="var(--theme-text-secondary)" fontSize={11} tickLine={false} />
                                <YAxis stroke="var(--theme-text-secondary)" fontSize={11} tickLine={false} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--theme-bg-card)',
                                        border: '1px solid var(--theme-border)',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        color: 'var(--theme-text-primary)'
                                    }}
                                />
                                <Legend
                                    wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                                />
                                <Bar dataKey="income" fill="var(--theme-chart-1)" radius={[4, 4, 0, 0]} barSize={20} name="Revenue" />
                                <Line type="monotone" dataKey="expense" stroke="var(--theme-chart-3)" strokeWidth={2} dot={{ r: 3 }} name="Actual Spend" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-sm text-[var(--theme-text-primary)] flex items-center gap-2">
                                <Users size={16} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" />
                                Department Utilization
                            </h3>
                            <span className="text-xs text-[var(--theme-text-secondary)] font-mono tabular-nums">
                                {employees.filter(e => (e.status || 'Active') !== 'Terminated').length} Staff
                            </span>
                        </div>
                        <p className="text-xs text-[var(--theme-text-secondary)] mb-3">
                            Operational payroll distribution across active enterprise departments.
                        </p>
                    </div>

                    <div className="space-y-3 my-2 overflow-y-auto max-h-[200px] pr-1">
                        {deptUtilization.map(dept => (
                            <div key={dept.department} className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span className="font-medium text-[var(--theme-text-primary)] truncate max-w-[130px]">
                                        {dept.department}
                                    </span>
                                    <span className="text-[var(--theme-text-secondary)] font-mono tabular-nums">
                                        {currencySymbol} {dept.totalSalary.toLocaleString()} ({dept.percentage}%)
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-[var(--theme-bg-subtle)] rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ width: `${Math.max(dept.percentage, 3)}%`, backgroundColor: dept.color }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-3 border-t border-[var(--theme-border)] text-xs text-[var(--theme-text-secondary)] flex justify-between items-center mt-2">
                        <span>Total Monthly Payroll</span>
                        <span className="font-mono font-semibold text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] tabular-nums">
                            {currencySymbol} {deptUtilization.reduce((sum, d) => sum + d.totalSalary, 0).toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Middle Section: Tender Reconciliations (Telebirr/CBE Birr/M-Pesa) */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl overflow-hidden shadow-xs">
                <div className="p-4 border-b border-[var(--theme-border)] flex justify-between items-center flex-wrap gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm text-[var(--theme-text-primary)]">
                                Electronic Tender &amp; Gateway Reconciliation
                            </h3>
                            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)] text-xs font-medium">
                                <ShieldCheck size={12} />
                                <span>External Bank / Telco Match</span>
                            </div>
                        </div>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                            Audit matching between register-reported electronic tenders and external gateway settlements.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsReconciliationModalOpen(true)}
                        className="bg-[var(--theme-accent)] text-[var(--theme-accent-contrast)] hover:opacity-95 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                    >
                        <Plus size={14} />
                        <span>Reconcile Gateway Tender</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono">
                        <thead className="bg-[var(--theme-bg-subtle)]/75 font-sans border-b border-[var(--theme-border)]">
                            <tr>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Date</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Tender Gateway</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-right">POS Reported</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-right">Statement Amount</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-right">Fees Deducted</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-right">Variance</th>
                                <th className="py-3 px-4 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--theme-border)]">
                            {tenderRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-[var(--theme-text-secondary)] font-sans">
                                        <p className="text-xs">No gateway settlements recorded for this period.</p>
                                        <p className="text-[11px] mt-0.5">Click "Reconcile Gateway Tender" to log bank or wallet verification.</p>
                                    </td>
                                </tr>
                            ) : (
                                tenderRecords.map(t => (
                                    <tr key={t.id} className="hover:bg-[var(--theme-bg-subtle)]/40 transition-colors">
                                        <td className="py-3.5 px-4 text-xs text-[var(--theme-text-secondary)] font-sans whitespace-nowrap">
                                            {t.reconciliationDate}
                                        </td>
                                        <td className="py-3.5 px-4 text-xs font-sans font-medium text-[var(--theme-text-primary)] whitespace-nowrap">
                                            {t.tenderType}
                                        </td>
                                        <td className="py-3.5 px-4 text-xs text-right text-[var(--theme-text-secondary)] tabular-nums whitespace-nowrap">
                                            {currencySymbol} {t.posReportedAmount.toLocaleString()}
                                        </td>
                                        <td className="py-3.5 px-4 text-xs text-right font-semibold text-[var(--theme-text-primary)] tabular-nums whitespace-nowrap">
                                            {currencySymbol} {t.statementAmount.toLocaleString()}
                                        </td>
                                        <td className="py-3.5 px-4 text-xs text-right text-[var(--theme-text-secondary)] tabular-nums whitespace-nowrap">
                                            {currencySymbol} {t.feeDeductions.toLocaleString()}
                                        </td>
                                        <td className={`py-3.5 px-4 text-xs text-right font-semibold tabular-nums whitespace-nowrap ${
                                            t.variance === 0 ? 'text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]' : 'text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)]'
                                        }`}>
                                            {t.variance > 0 ? '+' : ''}{currencySymbol} {t.variance.toLocaleString()}
                                        </td>
                                        <td className="py-3.5 px-4 text-center whitespace-nowrap font-sans">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                                                t.status === 'Reconciled' || t.status === 'Matched'
                                                    ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]'
                                                    : 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] border-[var(--theme-status-danger-border)]'
                                            }`}>
                                                {t.status === 'Reconciled' || t.status === 'Matched' ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                                                <span>{t.status.replace(/_/g, ' ')}</span>
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 shadow-xs">
                    <h3 className="font-semibold text-sm text-[var(--theme-text-primary)] mb-1">
                        Quarterly Cash Flow Forecast (AI Projected)
                    </h3>
                    <p className="text-xs text-[var(--theme-text-secondary)] mb-5">
                        Based on trailing 6-month revenue trends and seasonality factors.
                    </p>
                    <div className="h-[240px]">
                        <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                            <AreaChart data={forecastData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" opacity={0.5} vertical={false} />
                                <XAxis dataKey="name" stroke="var(--theme-text-secondary)" fontSize={11} tickLine={false} />
                                <YAxis stroke="var(--theme-text-secondary)" fontSize={11} tickLine={false} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--theme-bg-card)',
                                        border: '1px solid var(--theme-border)',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        color: 'var(--theme-text-primary)'
                                    }}
                                />
                                <Area type="monotone" dataKey="projectedRevenue" stroke="var(--theme-chart-4)" fillOpacity={0.12} fill="var(--theme-chart-4)" name="Projected Cash" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                    <div>
                        <h3 className="font-semibold text-sm text-[var(--theme-text-primary)] mb-1">
                            Accounts Payable Aging
                        </h3>
                        <p className="text-xs text-[var(--theme-text-secondary)] mb-4">
                            Commercial supplier liabilities categorized by maturity.
                        </p>
                    </div>

                    <div className="space-y-2.5">
                        <div className="flex justify-between items-center p-2.5 bg-[var(--theme-status-success-bg)] border border-[var(--theme-status-success-border)] rounded-xl">
                            <span className="text-xs text-[var(--theme-text-secondary)] font-medium">Current (&le;30 Days)</span>
                            <span className="text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] font-mono font-semibold text-xs tabular-nums">
                                {currencySymbol} {apAging.current.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-2.5 bg-[var(--theme-status-info-bg)] border border-[var(--theme-status-info-border)] rounded-xl">
                            <span className="text-xs text-[var(--theme-text-secondary)] font-medium">1-30 Days Overdue</span>
                            <span className="text-[var(--theme-status-info-text)] text-[var(--theme-status-info-text)] font-mono font-semibold text-xs tabular-nums">
                                {currencySymbol} {apAging.days1to30.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-2.5 bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] rounded-xl">
                            <span className="text-xs text-[var(--theme-text-secondary)] font-medium">31-60 Days Overdue</span>
                            <span className="text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] font-mono font-semibold text-xs tabular-nums">
                                {currencySymbol} {apAging.days31to60.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-2.5 bg-[var(--theme-status-danger-bg)] border border-[var(--theme-status-danger-border)] rounded-xl">
                            <span className="text-xs text-[var(--theme-text-secondary)] font-medium">60+ Days Overdue</span>
                            <span className="text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] font-mono font-semibold text-xs tabular-nums">
                                {currencySymbol} {apAging.days60Plus.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-[var(--theme-border)] mt-3">
                        <div className="flex justify-between text-xs font-semibold text-[var(--theme-text-primary)]">
                            <span>Total Outstanding</span>
                            <span className="font-mono text-[var(--theme-text-primary)] tabular-nums">
                                {currencySymbol} {apAging.totalOutstanding.toLocaleString()}
                            </span>
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
