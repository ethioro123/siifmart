import React from 'react';
import { usePOSCommand } from '../POSCommandContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useStore } from '../../../contexts/CentralStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, ShieldCheck, Lock } from 'lucide-react';

const COLORS = ['#2C5E3B', '#A9CBA2', '#d97706'];

export const POSCommandCharts: React.FC = () => {
    const { t } = useLanguage();
    const { user } = useStore();
    const { hourlyData, paymentChartData } = usePOSCommand();
    const [isMounted, setIsMounted] = React.useState(false);

    const isManagerOrAdmin = [
        'super_admin',
        'admin',
        'store_manager',
        'operations_manager',
        'ceo'
    ].includes(user?.role?.toLowerCase() || '');

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    const cardClass = "bg-white/85 dark:bg-[#18201B]/60 lg:backdrop-blur-2xl border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[28px] p-6 shadow-[0_4px_24px_-4px_rgba(34,50,38,0.04)] dark:shadow-[0_8px_32px_-4px_rgba(5,8,6,0.5)]";

    if (!isMounted) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`${cardClass} h-[330px] animate-pulse`} />
                <div className={`${cardClass} h-[330px] animate-pulse`} />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly Orders Chart */}
            <div className={`${cardClass} relative overflow-hidden`}>
                {/* Top accent */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-[#2C5E3B]/20 to-transparent" />

                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-black text-[#4D6E56] dark:text-[#7A9E83] uppercase tracking-widest flex items-center gap-2 select-none">
                        <TrendingUp className="w-4 h-4 text-[#2C5E3B] dark:text-[#A9CBA2]" />
                        {t('posCommand.hourlyPerformance')}
                    </h3>
                </div>

                <div className="h-[240px] w-full relative overflow-hidden min-h-[240px] flex items-center justify-center">
                    <ResponsiveContainer width="99%" height={240} minWidth={100} minHeight={200}>
                        <BarChart data={hourlyData} barGap={0} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="barGradientWoody" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#2C5E3B" stopOpacity={0.9} />
                                    <stop offset="100%" stopColor="#A9CBA2" stopOpacity={0.4} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 220, 206, 0.4)" />
                            <XAxis
                                dataKey="hour"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#7A9E83', fontSize: 10, fontWeight: 700 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#7A9E83', fontSize: 10, fontWeight: 700 }}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-white dark:bg-[#18201B] border border-[#E2DCCE] dark:border-emerald-950/30 p-3 rounded-2xl shadow-lg text-[#1E3F27] dark:text-[#EAE5D9] text-xs">
                                                <p className="text-[10px] text-[#4D6E56] dark:text-[#7A9E83] uppercase font-black tracking-widest mb-1">{payload[0].payload.hour}</p>
                                                <p className="font-bold">{payload[0].value} Transactions</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="count" fill="url(#barGradientWoody)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Payment Methods Chart (Managers Only) / Operational Protection Card (Cashiers) */}
            <div className={`${cardClass} relative overflow-hidden`}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-[#A9CBA2]/20 to-transparent" />

                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-black text-[#4D6E56] dark:text-[#7A9E83] uppercase tracking-widest flex items-center gap-2 select-none">
                        <PieChartIcon className="w-4 h-4 text-[#2C5E3B] dark:text-[#A9CBA2]" />
                        {isManagerOrAdmin ? t('posCommand.paymentMethods') : "Shift Integrity & Security"}
                    </h3>
                </div>

                {isManagerOrAdmin ? (
                    <div className="h-[240px] w-full flex flex-col items-center justify-center">
                        <div className="h-[180px] w-full relative overflow-hidden min-h-[180px] flex items-center justify-center">
                            <ResponsiveContainer width="99%" height={180} minWidth={100} minHeight={160}>
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
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-white dark:bg-[#18201B] border border-[#E2DCCE] dark:border-emerald-950/30 p-3 rounded-2xl shadow-lg text-[#1E3F27] dark:text-[#EAE5D9] text-xs">
                                                        <p className="text-[10px] text-[#4D6E56] dark:text-[#7A9E83] uppercase font-black tracking-widest mb-1">{payload[0].name}</p>
                                                        <p className="font-bold">{payload[0].value}%</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Legend */}
                        <div className="flex gap-5 mt-2">
                            {paymentChartData.map((entry, index) => {
                                const bgClasses = ['bg-[#2C5E3B]', 'bg-[#A9CBA2]', 'bg-amber-600'];
                                const bgClass = bgClasses[index % bgClasses.length];
                                return (
                                    <div key={entry.name} className="flex items-center gap-2">
                                        <div className={`w-2.5 h-2.5 rounded-full ${bgClass}`} />
                                        <span className="text-[10px] text-[#4D6E56] dark:text-[#7A9E83] uppercase font-bold tracking-wider">{entry.name}</span>
                                        <span className="text-[10px] text-[#1E3F27] dark:text-[#EAE5D9] font-black">{entry.value}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="h-[240px] w-full flex flex-col items-center justify-center p-6 text-center space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 border border-[#2C5E3B]/20 flex items-center justify-center text-[#2C5E3B] dark:text-[#A9CBA2]">
                            <ShieldCheck size={28} />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-black text-[#1E3F27] dark:text-white uppercase tracking-wider">
                                Blind Reconciliation Protocol
                            </h4>
                            <p className="text-xs text-[#4D6E56] dark:text-stone-400 max-w-sm leading-relaxed">
                                Payment distribution analytics and tender proportions are concealed to guarantee untampered physical counts during shift closure.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
