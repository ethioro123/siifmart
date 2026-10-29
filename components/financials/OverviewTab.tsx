import React, { useState } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    TrendingUp,
    Receipt,
    RotateCcw,
    Boxes,
    CircleDollarSign,
    PieChart as PieIcon,
    Layers,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { useFinance } from './FinanceContext';
import { formatCompactNumber } from '../../utils/formatting';
import { PnLWaterfallCard } from './PnLWaterfallCard';

const CHART_COLORS = [
    'var(--theme-chart-1)', 'var(--theme-chart-2)', 'var(--theme-chart-3)',
    'var(--theme-chart-6)', 'var(--theme-chart-4)', 'var(--theme-chart-5)',
    'var(--theme-chart-7)'
];

export const OverviewTab: React.FC = () => {
    const {
        totalRevenue,
        totalExpenses,
        totalRefunds,
        totalInventoryValue,
        netProfit,
        profitMargin,
        totalSalaries,
        totalOpEx,
        estimatedTaxLiability,
        cashflowData,
        expenseBreakdownData,
        currencySymbol,
        currentTaxConfig
    } = useFinance();

    const [chartMode, setChartMode] = useState<'all' | 'revenue' | 'expenses'>('all');

    const cardBase = "bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 flex flex-col justify-between shadow-xs transition-all";

    return (
        <div className="space-y-6">
            {/* Top Executive P&L KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Gross Revenue */}
                <div className={cardBase}>
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <span className="text-xs font-medium text-[var(--theme-text-secondary)]">
                                Gross Revenue
                            </span>
                            <h3 className="text-2xl font-semibold tracking-tight text-[var(--theme-text-primary)] font-mono tabular-nums mt-1">
                                {formatCompactNumber(totalRevenue, { currency: currencySymbol })}
                            </h3>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-[var(--theme-status-info-bg)] text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                            <TrendingUp size={16} />
                        </div>
                    </div>
                    <div className="mt-4 pt-2.5 border-t border-[var(--theme-border)] flex items-center justify-between text-[11px] text-[var(--theme-text-secondary)]">
                        <span>Sales turnover</span>
                        <span className="font-mono text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] font-medium">Inflows</span>
                    </div>
                </div>

                {/* Operating Expenses */}
                <div className={cardBase}>
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <span className="text-xs font-medium text-[var(--theme-text-secondary)]">
                                Total Expenses
                            </span>
                            <h3 className="text-2xl font-semibold tracking-tight text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] font-mono tabular-nums mt-1">
                                {formatCompactNumber(totalExpenses, { currency: currencySymbol })}
                            </h3>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] flex items-center justify-center shrink-0">
                            <Receipt size={16} />
                        </div>
                    </div>
                    <div className="mt-4 pt-2.5 border-t border-[var(--theme-border)] flex items-center justify-between text-[11px] text-[var(--theme-text-secondary)]">
                        <span>OpEx & payroll</span>
                        <span className="font-mono text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] font-medium">Outlays</span>
                    </div>
                </div>

                {/* Customer Refunds */}
                <div className={cardBase}>
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <span className="text-xs font-medium text-[var(--theme-text-secondary)]">
                                Customer Refunds
                            </span>
                            <h3 className="text-2xl font-semibold tracking-tight text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] font-mono tabular-nums mt-1">
                                {formatCompactNumber(totalRefunds, { currency: currencySymbol })}
                            </h3>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] flex items-center justify-center shrink-0">
                            <RotateCcw size={16} />
                        </div>
                    </div>
                    <div className="mt-4 pt-2.5 border-t border-[var(--theme-border)] flex items-center justify-between text-[11px] text-[var(--theme-text-secondary)]">
                        <span>Credit notes & RMA</span>
                        <span className="font-mono text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] font-medium">Reversals</span>
                    </div>
                </div>

                {/* Inventory Value */}
                <div className={cardBase}>
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <span className="text-xs font-medium text-[var(--theme-text-secondary)]">
                                Inventory Assets
                            </span>
                            <h3 className="text-2xl font-semibold tracking-tight text-[var(--theme-text-primary)] font-mono tabular-nums mt-1">
                                {formatCompactNumber(totalInventoryValue, { currency: currencySymbol })}
                            </h3>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                            <Boxes size={16} />
                        </div>
                    </div>
                    <div className="mt-4 pt-2.5 border-t border-[var(--theme-border)] flex items-center justify-between text-[11px] text-[var(--theme-text-secondary)]">
                        <span>Stock valuation</span>
                        <span className="font-mono text-[var(--theme-text-primary)] font-medium">Carrying</span>
                    </div>
                </div>

                {/* Net Operating Profit */}
                <div className={cardBase}>
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <span className="text-xs font-medium text-[var(--theme-text-secondary)]">
                                Net Operating Profit
                            </span>
                            <h3 className={`text-2xl font-semibold tracking-tight font-mono tabular-nums mt-1 ${
                                netProfit >= 0 ? 'text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]' : 'text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)]'
                            }`}>
                                {formatCompactNumber(netProfit, { currency: currencySymbol })}
                            </h3>
                        </div>
                        <div className={`w-8 h-8 rounded-xl ${
                            netProfit >= 0 ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]' : 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)]'
                        } flex items-center justify-center shrink-0`}>
                            <CircleDollarSign size={16} />
                        </div>
                    </div>
                    <div className="mt-4 pt-2.5 border-t border-[var(--theme-border)] flex items-center justify-between text-[11px]">
                        <span className="text-[var(--theme-text-secondary)]">Bottom line</span>
                        <span className={`px-2 py-0.5 rounded-full font-semibold ${
                            netProfit >= 0
                                ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)]'
                                : 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)]'
                        }`}>
                            {netProfit >= 0 ? '+' : ''}{profitMargin.toFixed(1)}% Margin
                        </span>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cashflow Trajectory Chart */}
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 lg:col-span-2 isolate overflow-hidden shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                        <div>
                            <h4 className="text-sm font-semibold text-[var(--theme-text-primary)] tracking-tight">
                                Cashflow Trajectory
                            </h4>
                            <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5 font-normal">
                                Revenue intake versus operational disbursements across reporting period.
                            </p>
                        </div>

                        {/* Apple Segmented Filter Control */}
                        <div className="p-1 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl flex items-center gap-1 select-none w-fit">
                            <button
                                type="button"
                                onClick={() => setChartMode('all')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                    chartMode === 'all'
                                        ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs font-semibold'
                                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                                }`}
                            >
                                Combined
                            </button>
                            <button
                                type="button"
                                onClick={() => setChartMode('revenue')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                    chartMode === 'revenue'
                                        ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs font-semibold'
                                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                                }`}
                            >
                                Revenue
                            </button>
                            <button
                                type="button"
                                onClick={() => setChartMode('expenses')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                    chartMode === 'expenses'
                                        ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs font-semibold'
                                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                                }`}
                            >
                                Outlays
                            </button>
                        </div>
                    </div>

                    <div className="h-[280px] w-full min-w-0 relative">
                        <ResponsiveContainer width="100%" height={280} minWidth={0} minHeight={280}>
                            <AreaChart data={cashflowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" opacity={0.4} />
                                <XAxis
                                    dataKey="name"
                                    stroke="var(--theme-text-secondary)"
                                    fontSize={11}
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke="var(--theme-text-secondary)"
                                    fontSize={11}
                                    tickLine={false}
                                    tickFormatter={(val) => formatCompactNumber(val, { compact: true })}
                                />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl p-3 shadow-lg text-xs space-y-1.5 backdrop-blur-md">
                                                    <p className="font-semibold text-[var(--theme-text-primary)]">{label}</p>
                                                    {payload.map((entry: any, index: number) => (
                                                        <div key={`item-${index}`} className="flex items-center justify-between gap-4">
                                                            <span className="text-[var(--theme-text-secondary)] flex items-center gap-1.5">
                                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                                                {entry.name}:
                                                            </span>
                                                            <span className="font-mono font-semibold text-[var(--theme-text-primary)] tabular-nums">
                                                                {formatCompactNumber(entry.value, { currency: currencySymbol })}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                {(chartMode === 'all' || chartMode === 'revenue') && (
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="var(--theme-chart-1)"
                                        fill="var(--theme-chart-1)"
                                        fillOpacity={0.08}
                                        name="Gross Revenue"
                                        strokeWidth={2}
                                    />
                                )}
                                {(chartMode === 'all' || chartMode === 'expenses') && (
                                    <Area
                                        type="monotone"
                                        dataKey="expenses"
                                        stroke="var(--theme-chart-6)"
                                        fill="var(--theme-chart-6)"
                                        fillOpacity={0.08}
                                        name="Disbursements"
                                        strokeWidth={2}
                                    />
                                )}
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Chart Legend */}
                    <div className="flex items-center justify-end gap-5 mt-3 pt-3 border-t border-[var(--theme-border)] text-xs text-[var(--theme-text-secondary)]">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[var(--theme-accent)]" />
                            <span>Gross Revenue</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#FF3B30]" />
                            <span>Operational Outlays</span>
                        </div>
                    </div>
                </div>

                {/* Expense Allocation Breakdown Donut */}
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 flex flex-col justify-between isolate overflow-hidden shadow-xs">
                    <div>
                        <h4 className="text-sm font-semibold text-[var(--theme-text-primary)] tracking-tight">
                            Expense Allocation
                        </h4>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5 font-normal">
                            Share of disbursements by operational category.
                        </p>
                    </div>

                    {expenseBreakdownData.length > 0 ? (
                        <>
                            <div className="h-[190px] w-full min-w-0 relative flex items-center justify-center my-3">
                                <ResponsiveContainer width="100%" height={190} minWidth={0} minHeight={190}>
                                    <PieChart>
                                        <Pie
                                            data={expenseBreakdownData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={58}
                                            outerRadius={78}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {expenseBreakdownData.map((_entry: any, index: number) => (
                                                <Cell
                                                    key={`donut-cell-${index}`}
                                                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                                                    stroke="var(--theme-bg-card)"
                                                    strokeWidth={2}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const item = payload[0];
                                                    return (
                                                        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl p-2.5 shadow-lg text-xs backdrop-blur-md">
                                                            <p className="font-semibold text-[var(--theme-text-primary)]">{item.name}</p>
                                                            <p className="font-mono text-[var(--theme-text-secondary)] mt-0.5">{item.value}% allocation</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>

                                {/* Centered readout inside Donut */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-[11px] font-medium text-[var(--theme-text-secondary)]">Total OpEx</span>
                                    <span className="font-mono font-bold text-sm text-[var(--theme-text-primary)] mt-0.5">
                                        {formatCompactNumber(totalExpenses, { currency: currencySymbol })}
                                    </span>
                                </div>
                            </div>

                            {/* Category List */}
                            <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                                {expenseBreakdownData.map((item: any, i: number) => (
                                    <div
                                        key={`exp-cat-${i}`}
                                        className="flex justify-between items-center text-xs py-1.5 border-b border-[var(--theme-border)] last:border-0"
                                    >
                                        <div className="flex items-center gap-2 min-w-0 pr-2">
                                            <span
                                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                                style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                                            />
                                            <span className="text-[var(--theme-text-primary)] font-medium truncate">
                                                {item.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)]">
                                                {item.value}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center py-10 opacity-60">
                            <PieIcon size={40} className="text-[var(--theme-text-muted)] mb-2" />
                            <p className="text-xs text-[var(--theme-text-muted)]">No category allocations recorded</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Income Statement Summary Waterfall Card */}
            <PnLWaterfallCard
                totalRevenue={totalRevenue}
                totalRefunds={totalRefunds}
                totalOpEx={totalOpEx}
                totalSalaries={totalSalaries}
                estimatedTaxLiability={estimatedTaxLiability}
                netProfit={netProfit}
                currencySymbol={currencySymbol}
                taxName={currentTaxConfig.taxName}
            />
        </div>
    );
};

export default OverviewTab;
