import React, { useState, useMemo } from 'react';
import { usePOSCommand } from '../POSCommandContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useStore } from '../../../contexts/CentralStore';
import { TrendingUp, PieChart as PieChartIcon, ShieldCheck } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    PieChart, Pie, Cell
} from 'recharts';

export const POSCommandCharts: React.FC = () => {
    const { t } = useLanguage();
    const { user } = useStore();
    const { hourlyData, paymentChartData = [] } = usePOSCommand();
    const [isMounted, setIsMounted] = useState(false);

    const isCentralHQ = ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'country_operations_director', 'country_finance_director'].includes(user?.role?.toLowerCase() || '');

    const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    const cardClass = "bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-xs isolate";

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
                    <h3 className="text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider flex items-center gap-2.5 select-none">
                        <div className="w-7 h-7 rounded-lg bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                            <TrendingUp size={14} />
                        </div>
                        <span>{t('posCommand.hourlyPerformance')}</span>
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
                                            <div className="bg-[var(--theme-bg-card)]/95 backdrop-blur-xl border border-[var(--theme-border)] p-3 rounded-2xl shadow-xl text-[var(--theme-text-primary)] text-xs">
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
                    <h3 className="text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider flex items-center gap-2.5 select-none">
                        <div className="w-7 h-7 rounded-lg bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                            <PieChartIcon size={14} />
                        </div>
                        <span>{isCentralHQ ? t('posCommand.paymentMethods') : t('posCommand.shiftIntegrityAndSecurity')}</span>
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
                                        {paymentChartData.map((entry: { name: string; value: number }, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-[var(--theme-bg-card)]/95 backdrop-blur-xl border border-[var(--theme-border)] p-3 rounded-2xl shadow-xl text-[var(--theme-text-primary)] text-xs">
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
                            {paymentChartData.map((entry: { name: string; value: number }, index: number) => {
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
                            <ShieldCheck size={28} className="text-[var(--theme-status-success)]" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-bold text-[var(--theme-text-primary)] uppercase tracking-wider">
                                {t('posCommand.blindReconciliationProtocol')}
                            </h4>
                            <p className="text-xs text-[var(--theme-text-secondary)] max-w-sm leading-relaxed">
                                {t('posCommand.blindReconciliationDesc')}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
