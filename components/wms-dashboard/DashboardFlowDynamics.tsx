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
    const resolvedInbound = inboundColor || (theme === 'dark' ? '#2997FF' : '#0071E3');
    const resolvedOutbound = outboundColor || (theme === 'dark' ? '#FF9F0A' : '#FF9500');

    return (
        <div className="lg:col-span-2 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-6 relative">
                <div>
                    <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">
                        Flow Dynamics
                    </h3>
                    <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">Daily item movement velocity</p>
                </div>
                <div className="flex items-center gap-1.5 p-1 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl">
                    <div className="flex items-center gap-1.5 px-2.5 py-1">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: resolvedInbound }} />
                        <span className="text-[11px] font-medium text-[var(--theme-text-secondary)]">Inbound</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: resolvedOutbound }} />
                        <span className="text-[11px] font-medium text-[var(--theme-text-secondary)]">Outbound</span>
                    </div>
                </div>
            </div>
            
            <div className="h-[340px] w-full relative touch-pan-y">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={data} barGap={10}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" opacity={0.5} vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="var(--theme-text-secondary)"
                            fontSize={11}
                            fontWeight={500}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="var(--theme-text-secondary)"
                            fontSize={11}
                            fontWeight={500}
                            tickLine={false}
                            axisLine={false}
                            dx={-10}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(128,128,128,0.06)' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="p-3 rounded-xl shadow-lg border bg-[var(--theme-bg-card)] border-[var(--theme-border)]">
                                            <p className="text-[11px] font-semibold text-[var(--theme-text-secondary)] mb-2">{payload[0].payload.date}</p>
                                            <div className="space-y-1.5">
                                                {payload.map((entry: any, i: number) => (
                                                    <div key={i} className="flex items-center justify-between gap-6">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.name === 'Inbound' ? resolvedInbound : resolvedOutbound }} />
                                                            <span className="text-xs font-medium text-[var(--theme-text-secondary)]">{entry.name}</span>
                                                        </div>
                                                        <span className="text-xs font-semibold font-mono text-[var(--theme-text-primary)]">{entry.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar name="Inbound" dataKey="inbound" fill={resolvedInbound} radius={[6, 6, 0, 0]} />
                        <Bar name="Outbound" dataKey="outbound" fill={resolvedOutbound} radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
export default DashboardFlowDynamics;
