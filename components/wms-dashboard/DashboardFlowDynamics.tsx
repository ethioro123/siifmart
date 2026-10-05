import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardFlowDynamicsProps {
    data: any[];
    chartStroke: string;
    chartText: string;
    theme: string;
    inboundColor: string;
    outboundColor: string;
    t: (key: string) => string;
}

export const DashboardFlowDynamics: React.FC<DashboardFlowDynamicsProps> = ({
    data,
    chartStroke,
    chartText,
    theme,
    inboundColor,
    outboundColor,
    t
}) => {
    return (
        <div className="lg:col-span-2 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-8 relative">
                <div>
                    <h3 className="text-sm font-bold text-[var(--theme-text-primary)] uppercase tracking-wider">
                        Flow Dynamics
                    </h3>
                    <p className="text-[var(--theme-text-secondary)] text-[10px] mt-1 font-bold uppercase tracking-widest">Daily item movement velocity</p>
                </div>
                <div className="flex items-center gap-4 p-2 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl">
                    <div className="flex items-center gap-2 px-2.5 py-1">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: inboundColor }} />
                        <span className="text-[10px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest">Inbound</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: outboundColor }} />
                        <span className="text-[10px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest">Outbound</span>
                    </div>
                </div>
            </div>
            
            <div className="h-[340px] w-full relative touch-pan-y">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={data} barGap={12}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" opacity={0.6} vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="var(--theme-text-secondary)"
                            fontSize={10}
                            fontWeight={700}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="var(--theme-text-secondary)"
                            fontSize={10}
                            fontWeight={700}
                            tickLine={false}
                            axisLine={false}
                            dx={-10}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(128,128,128,0.05)' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="p-3 rounded-xl shadow-xl border bg-[var(--theme-bg-panel)] border-[var(--theme-border)]">
                                            <p className="text-[10px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest mb-2">{payload[0].payload.date}</p>
                                            <div className="space-y-1.5">
                                                {payload.map((entry: any, i: number) => (
                                                    <div key={i} className="flex items-center justify-between gap-6">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.name === 'Inbound' ? inboundColor : outboundColor }} />
                                                            <span className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-tight">{entry.name}</span>
                                                        </div>
                                                        <span className="text-sm font-bold text-[var(--theme-text-primary)]">{entry.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar name="Inbound" dataKey="inbound" fill={inboundColor} radius={[4, 4, 0, 0]} />
                        <Bar name="Outbound" dataKey="outbound" fill={outboundColor} radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
export default DashboardFlowDynamics;
