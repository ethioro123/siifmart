import React from 'react';
import { usePOSCommand } from '../POSCommandContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useStore } from '../../../contexts/CentralStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, ShieldCheck, Lock } from 'lucide-react';

// Apple Minimalist Clean Monochrome / High-Contrast Palette
const COLORS = ['var(--theme-text-primary)', 'var(--theme-text-secondary)', 'var(--theme-text-muted)'];

export const POSCommandCharts: React.FC = () => {
    const { t } = useLanguage();
    const { user } = useStore();
    const { hourlyData, paymentChartData } = usePOSCommand();
    const [isMounted, setIsMounted] = React.useState(false);

    const isCentralHQ = [
        'super_admin',
        'ceo',
        'regional_manager',
        'operations_manager',
        'finance_manager',
        'store_manager'
    ].includes(user?.role?.toLowerCase() || '');

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    const cardClass = "bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-xs";

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
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest flex items-center gap-2 select-none">
                        <TrendingUp className="w-4 h-4 text-[var(--theme-text-primary)]" />
                        {t('posCommand.hourlyPerformance')}
                    </h3>
                </div>

                <div className="h-[240px] w-full relative overflow-hidden min-h-[240px] flex items-center justify-center">
                    <ResponsiveContainer width="99%" height={240} minWidth={100} minHeight={200}>
                        <BarChart data={hourlyData} barGap={0} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--theme-border)" opacity={0.6} />
                            <XAxis
                                dataKey="hour"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--theme-text-secondary)', fontSize: 10, fontWeight: 700 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--theme-text-secondary)', fontSize: 10, fontWeight: 700 }}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] p-3 rounded-xl shadow-lg text-[var(--theme-text-primary)] text-xs">
                                                <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-bold tracking-widest mb-1">{payload[0].payload.hour}</p>
                                                <p className="font-bold">{payload[0].value} Transactions</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="count" fill="var(--theme-text-primary)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Payment Methods Chart (Managers Only) / Operational Protection Card (Cashiers) */}
            <div className={`${cardClass} relative overflow-hidden`}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest flex items-center gap-2 select-none">
                        <PieChartIcon className="w-4 h-4 text-[var(--theme-text-primary)]" />
                        {isCentralHQ ? t('posCommand.paymentMethods') : "Shift Integrity & Security"}
                    </h3>
                </div>

                {isCentralHQ ? (
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
                                        paddingAngle={4}
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
                                                    <div className="bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] p-3 rounded-xl shadow-lg text-[var(--theme-text-primary)] text-xs">
                                                        <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-bold tracking-widest mb-1">{payload[0].name}</p>
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
                                const dotColor = COLORS[index % COLORS.length];
                                return (
                                    <div key={entry.name} className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dotColor }} />
                                        <span className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-bold tracking-wider">{entry.name}</span>
                                        <span className="text-[10px] text-[var(--theme-text-primary)] font-bold">{entry.value}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="h-[240px] w-full flex flex-col items-center justify-center p-6 text-center space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-primary)]">
                            <ShieldCheck size={28} />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-bold text-[var(--theme-text-primary)] uppercase tracking-wider">
                                Blind Reconciliation Protocol
                            </h4>
                            <p className="text-xs text-[var(--theme-text-secondary)] max-w-sm leading-relaxed">
                                Payment distribution analytics and tender proportions are concealed to guarantee untampered physical counts during shift closure.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
