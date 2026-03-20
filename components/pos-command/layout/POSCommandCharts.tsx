import React from 'react';
import { usePOSCommand } from '../POSCommandContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, PieChart as PieChartIcon } from 'lucide-react';

const COLORS = ['#00ff9d', '#3b82f6', '#a855f7'];

export const POSCommandCharts: React.FC = () => {
    const { t } = useLanguage();
    const { hourlyData, paymentChartData } = usePOSCommand();
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-black/60 backdrop-blur-2xl border border-white/5 rounded-2xl p-6 shadow-xl h-[330px] animate-pulse" />
                <div className="bg-black/60 backdrop-blur-2xl border border-white/5 rounded-2xl p-6 shadow-xl h-[330px] animate-pulse" />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly Sales Chart */}
            <div className="bg-black/60 backdrop-blur-2xl border border-white/5 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-cyber-primary" />
                        {t('posCommand.hourlyPerformance')}
                    </h3>
                </div>
                <div className="h-[240px] w-full relative overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={hourlyData} barGap={0} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#00ff9d" stopOpacity={0.8} />
                                    <stop offset="100%" stopColor="#00ff9d" stopOpacity={0.3} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis
                                dataKey="time" // Assuming 'time' is the new dataKey for XAxis based on tooltip
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6b7280', fontSize: 10 }}
                                dy={10}
                            />
                            <YAxis hide domain={[0, 'auto']} />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-[#111] border border-white/10 p-3 rounded-xl shadow-2xl">
                                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">{payload[0].payload.time}</p>
                                                <p className="text-white font-bold">{payload[0].value} Transactions</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="count" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Payment Methods Chart */}
            <div className="bg-black/60 backdrop-blur-2xl border border-white/5 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <PieChartIcon className="w-4 h-4 text-siif-blue" />
                        {t('posCommand.paymentMethods')}
                    </h3>
                </div>
                <div className="h-[240px] w-full flex flex-col items-center justify-center">
                    <div className="h-[180px] w-full relative overflow-hidden">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={paymentChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {paymentChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#111',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        fontSize: '12px'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex gap-4 mt-2">
                        {paymentChartData.map((entry, index) => (
                            <div key={entry.name} className="flex items-center gap-2">
                                <div
                                    className="w-2 h-2 rounded-full"
                                    ref={(el) => { if (el) el.style.backgroundColor = COLORS[index % COLORS.length]; }}
                                ></div>
                                <span className="text-[10px] text-gray-400 uppercase font-medium">{entry.name}</span>
                                <span className="text-[10px] text-white font-bold">{entry.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
