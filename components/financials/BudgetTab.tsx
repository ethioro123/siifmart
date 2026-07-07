import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Target, AlertCircle, Clock } from 'lucide-react';
import { useFinance } from './FinanceContext';
import { CURRENCY_SYMBOL } from '../../constants';

export const BudgetTab: React.FC = () => {
    const {
        cashflowData,
        forecastData,
        netTaxPayable
    } = useFinance();

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Actual vs Budget Chart */}
                <div className="lg:col-span-2 bg-cyber-gray border border-white/5 rounded-2xl p-6">
                    <h3 className="font-bold text-white mb-6">Budget Variance Analysis (YTD)</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                            <ComposedChart data={cashflowData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="name" stroke="#666" fontSize={12} />
                                <YAxis stroke="#666" fontSize={12} />
                                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                                <Legend />
                                <Bar dataKey="income" fill="#3b82f6" barSize={20} name="Revenue" />
                                <Line type="monotone" dataKey="expense" stroke="#f59e0b" strokeWidth={2} name="Actual Spend" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Department Budgets */}
                <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6 flex flex-col">
                    <h3 className="font-bold text-white mb-4">Department Utilization</h3>
                    <div className="flex-1 flex flex-col items-center justify-center py-10">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <Target size={32} className="text-gray-600" />
                        </div>
                        <p className="text-sm text-gray-400 font-medium">Coming Soon</p>
                        <p className="text-[10px] text-gray-500 text-center px-6 mt-1 italic">
                            Live department tracking is being integrated with your new organizational schema.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cash Forecasting */}
                <div className="lg:col-span-2 bg-cyber-gray border border-white/5 rounded-2xl p-6">
                    <h3 className="font-bold text-white mb-2">Q3 Cash Flow Forecast (AI Projected)</h3>
                    <p className="text-xs text-gray-400 mb-6">Based on trailing 6-month revenue trends and seasonality factors.</p>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                            <AreaChart data={forecastData}>
                                <defs>
                                    <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="month" stroke="#666" fontSize={12} />
                                <YAxis stroke="#666" fontSize={12} domain={['dataMin', 'dataMax']} />
                                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                                <Area type="monotone" dataKey="projection" stroke="#a855f7" fill="url(#colorProj)" strokeDasharray="5 5" name="Projected Cash" />
                                <Area type="monotone" dataKey="low" stackId="1" stroke="none" fill="transparent" />
                                <Area type="monotone" dataKey="high" stackId="1" stroke="none" fill="#a855f7" fillOpacity={0.1} name="Confidence Interval" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* AP Aging Widget */}
                <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6">
                    <h3 className="font-bold text-white mb-4">Accounts Payable Aging</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-green-500/5 border border-green-500/20 rounded-xl">
                            <span className="text-xs text-gray-400 uppercase font-bold">Current</span>
                            <span className="text-green-400 font-mono font-bold">{CURRENCY_SYMBOL} 120,000</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                            <span className="text-xs text-gray-400 uppercase font-bold">1-30 Days</span>
                            <span className="text-blue-400 font-mono font-bold">{CURRENCY_SYMBOL} 45,000</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                            <span className="text-xs text-gray-400 uppercase font-bold">31-60 Days</span>
                            <span className="text-yellow-400 font-mono font-bold">{CURRENCY_SYMBOL} 12,500</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
                            <span className="text-xs text-gray-400 uppercase font-bold">60+ Days</span>
                            <span className="text-red-400 font-mono font-bold">{CURRENCY_SYMBOL} 8,000</span>
                        </div>
                        <div className="pt-4 border-t border-white/5 mt-2">
                            <div className="flex justify-between text-sm font-bold text-white">
                                <span>Total Outstanding</span>
                                <span>{CURRENCY_SYMBOL} 185,500</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default BudgetTab;
