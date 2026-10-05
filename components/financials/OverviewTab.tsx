import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, PieChart as PieIcon } from 'lucide-react';
import { useFinance } from './FinanceContext';
import { formatCompactNumber } from '../../utils/formatting';

export const OverviewTab: React.FC = () => {
    const {
        totalRevenue,
        totalExpenses,
        totalRefunds,
        totalInventoryValue,
        netProfit,
        cashflowData,
        expenseBreakdownData,
        accentColor,
        COLORS,
        currencySymbol
    } = useFinance();

    const getColorClass = (index: number) => {
        const classes = [
            'bg-emerald-600 dark:bg-emerald-400',
            'bg-blue-500',
            'bg-amber-500',
            'bg-rose-500',
            'bg-purple-500',
            'bg-emerald-500'
        ];
        return classes[index % classes.length];
    };

    const cardBase = "bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 flex flex-col justify-between min-h-[120px]";

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Top Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className={cardBase}>
                    <div>
                        <p className="text-[var(--theme-text-secondary)] text-[10px] uppercase font-bold tracking-wider">Total Revenue</p>
                        <h3 className="text-2xl font-mono font-bold text-[var(--theme-text-primary)] mt-1">{formatCompactNumber(totalRevenue, { currency: currencySymbol })}</h3>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                        <Activity size={12} className="text-emerald-500" />
                        <span className="text-[10px] text-[var(--theme-text-muted)] font-bold">Base metric</span>
                    </div>
                </div>

                <div className={cardBase}>
                    <div>
                        <p className="text-[var(--theme-text-secondary)] text-[10px] uppercase font-bold tracking-wider">Total Expenses</p>
                        <h3 className="text-2xl font-mono font-bold text-rose-500 mt-1">{formatCompactNumber(totalExpenses, { currency: currencySymbol })}</h3>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                        <Activity size={12} className="text-rose-500" />
                        <span className="text-[10px] text-[var(--theme-text-muted)] font-bold">Operational costs</span>
                    </div>
                </div>

                <div className={cardBase}>
                    <div>
                        <p className="text-[var(--theme-text-secondary)] text-[10px] uppercase font-bold tracking-wider">Total Refunds</p>
                        <h3 className="text-2xl font-mono font-bold text-amber-500 mt-1">{formatCompactNumber(totalRefunds, { currency: currencySymbol })}</h3>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                        <Activity size={12} className="text-amber-500" />
                        <span className="text-[10px] text-[var(--theme-text-muted)] font-bold">Returns value</span>
                    </div>
                </div>

                <div className={cardBase}>
                    <div>
                        <p className="text-[var(--theme-text-secondary)] text-[10px] uppercase font-bold tracking-wider">Inventory Asset Value</p>
                        <h3 className="text-2xl font-mono font-bold text-[var(--theme-text-primary)] mt-1">{formatCompactNumber(totalInventoryValue, { currency: currencySymbol })}</h3>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                        <Activity size={12} className="text-blue-500" />
                        <span className="text-[10px] text-[var(--theme-text-muted)] font-bold">Stock valuation</span>
                    </div>
                </div>

                <div className={cardBase}>
                    <div>
                        <p className="text-[var(--theme-text-secondary)] text-[10px] uppercase font-bold tracking-wider">Net Profit</p>
                        <h3 className={`text-2xl font-mono font-bold mt-1 ${netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {formatCompactNumber(netProfit, { currency: currencySymbol })}
                        </h3>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                        <Activity size={12} className={netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'} />
                        <span className="text-[10px] text-[var(--theme-text-muted)] font-bold">Bottom-line earnings</span>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cashflow Trend */}
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 lg:col-span-2">
                    <h4 className="text-[var(--theme-text-primary)] font-bold text-sm uppercase tracking-wider mb-6">Cashflow Trend</h4>
                    <div className="h-[300px] w-full min-w-0 relative">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <AreaChart data={cashflowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" opacity={0.6} />
                                <XAxis dataKey="name" stroke="var(--theme-text-secondary)" fontSize={10} tickLine={false} />
                                <YAxis stroke="var(--theme-text-secondary)" fontSize={10} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--theme-bg-panel)', border: '1px solid var(--theme-border)', borderRadius: '12px' }}
                                    itemStyle={{ color: 'var(--theme-text-primary)', fontSize: '12px' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke={accentColor} fillOpacity={0.08} fill={accentColor} name="Revenue" strokeWidth={2} />
                                <Area type="monotone" dataKey="expenses" stroke="#ef4444" fillOpacity={0.08} fill="#ef4444" name="Expenses" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Expense Breakdown */}
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 flex flex-col justify-between">
                    <h4 className="text-[var(--theme-text-primary)] font-bold text-sm uppercase tracking-wider mb-4">Expense Breakdown</h4>
                    {expenseBreakdownData.length > 0 ? (
                        <>
                            <div className="h-[200px] w-full min-w-0 relative flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                    <PieChart>
                                        <Pie
                                            data={expenseBreakdownData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {expenseBreakdownData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'var(--theme-bg-panel)', border: '1px solid var(--theme-border)', borderRadius: '12px' }}
                                            itemStyle={{ color: 'var(--theme-text-primary)', fontSize: '12px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-2 mt-4 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                                {expenseBreakdownData.map((item: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center text-sm border-b border-[var(--theme-border)] pb-2 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${getColorClass(i)}`}></div>
                                            <span className="text-[var(--theme-text-secondary)] text-xs">{item.name}</span>
                                        </div>
                                        <span className="font-mono text-[var(--theme-text-primary)] font-semibold text-xs">{item.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center py-10 opacity-50">
                            <PieIcon size={48} className="text-[var(--theme-text-muted)] mb-2" />
                            <p className="text-xs text-[var(--theme-text-muted)] italic">No breakdown available</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default OverviewTab;
