import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, PieChart as PieIcon } from 'lucide-react';
import { useFinance } from './FinanceContext';
import { formatCompactNumber } from '../../utils/formatting';
import { CURRENCY_SYMBOL } from '../../constants';

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
        COLORS
    } = useFinance();

    const getColorClass = (index: number) => {
        const classes = [
            'bg-cyber-primary',
            'bg-blue-500',
            'bg-amber-500',
            'bg-red-500',
            'bg-purple-500',
            'bg-pink-500'
        ];
        return classes[index % classes.length];
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Top Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-cyber-gray border border-white/5 rounded-2xl p-5 flex flex-col justify-between min-h-[120px]">
                    <div>
                        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Total Revenue</p>
                        <h3 className="text-2xl font-mono font-bold text-white mt-1">{formatCompactNumber(totalRevenue, { currency: CURRENCY_SYMBOL })}</h3>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                        <Activity size={12} className="text-cyber-primary" />
                        <span className="text-[10px] text-gray-500 font-bold">Base metric</span>
                    </div>
                </div>

                <div className="bg-cyber-gray border border-white/5 rounded-2xl p-5 flex flex-col justify-between min-h-[120px]">
                    <div>
                        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Total Expenses</p>
                        <h3 className="text-2xl font-mono font-bold text-white mt-1">{formatCompactNumber(totalExpenses, { currency: CURRENCY_SYMBOL })}</h3>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                        <Activity size={12} className="text-red-500" />
                        <span className="text-[10px] text-gray-500 font-bold">Operational costs</span>
                    </div>
                </div>

                <div className="bg-cyber-gray border border-white/5 rounded-2xl p-5 flex flex-col justify-between min-h-[120px]">
                    <div>
                        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Total Refunds</p>
                        <h3 className="text-2xl font-mono font-bold text-white mt-1">{formatCompactNumber(totalRefunds, { currency: CURRENCY_SYMBOL })}</h3>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                        <Activity size={12} className="text-yellow-500" />
                        <span className="text-[10px] text-gray-500 font-bold">Returns value</span>
                    </div>
                </div>

                <div className="bg-cyber-gray border border-white/5 rounded-2xl p-5 flex flex-col justify-between min-h-[120px]">
                    <div>
                        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Inventory Asset Value</p>
                        <h3 className="text-2xl font-mono font-bold text-white mt-1">{formatCompactNumber(totalInventoryValue, { currency: CURRENCY_SYMBOL })}</h3>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                        <Activity size={12} className="text-blue-500" />
                        <span className="text-[10px] text-gray-500 font-bold">Stock valuation</span>
                    </div>
                </div>

                <div className="bg-cyber-gray border border-white/5 rounded-2xl p-5 flex flex-col justify-between min-h-[120px]">
                    <div>
                        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Net Profit</p>
                        <h3 className={`text-2xl font-mono font-bold mt-1 ${netProfit >= 0 ? 'text-cyber-primary' : 'text-red-500'}`}>
                            {formatCompactNumber(netProfit, { currency: CURRENCY_SYMBOL })}
                        </h3>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                        <Activity size={12} className={netProfit >= 0 ? 'text-cyber-primary' : 'text-red-500'} />
                        <span className="text-[10px] text-gray-500 font-bold">Bottom-line earnings</span>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cashflow Trend */}
                <div className="bg-cyber-gray border border-white/5 rounded-3xl p-6 lg:col-span-2">
                    <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-6">Cashflow Trend</h4>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={cashflowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={accentColor} stopOpacity={0.2} />
                                        <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} />
                                <YAxis stroke="#666" fontSize={10} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke={accentColor} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" strokeWidth={2} />
                                <Area type="monotone" dataKey="expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpenses)" name="Expenses" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Expense Breakdown */}
                <div className="bg-cyber-gray border border-white/5 rounded-3xl p-6 flex flex-col justify-between">
                    <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Expense Breakdown</h4>
                    {expenseBreakdownData.length > 0 ? (
                        <>
                            <div className="h-[200px] flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
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
                                            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                                            itemStyle={{ color: '#fff', fontSize: '12px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-2 mt-4 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                                {expenseBreakdownData.map((item: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${getColorClass(i)}`}></div>
                                            <span className="text-gray-300 text-xs">{item.name}</span>
                                        </div>
                                        <span className="font-mono text-white text-xs">{item.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center py-10 opacity-50">
                            <PieIcon size={48} className="text-gray-600 mb-2" />
                            <p className="text-xs text-gray-500 italic">No breakdown available</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default OverviewTab;
