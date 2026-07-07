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
        <div className="lg:col-span-2 bg-white/80 dark:bg-[#18201B]/70 border border-[#E2DCCE] dark:border-emerald-950/20 lg:backdrop-blur-2xl rounded-3xl p-4 sm:p-6 md:p-8 relative overflow-hidden shadow-sm transition-all duration-500">
            <div className="hidden lg:block absolute top-0 right-0 w-64 h-64 bg-[#2C5E3B]/5 dark:bg-[#1E3F27]/3 rounded-full blur-[100px] -mr-32 -mt-32" />
            <div className="flex items-center justify-between mb-10 relative">
                <div>
                    <h3 className="text-lg font-extrabold text-[#1E3F27] dark:text-[#EAE5D9] flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-[#2C5E3B] rounded-full shadow-[0_0_10px_rgba(44,94,59,0.3)]" />
                        Flow Dynamics
                    </h3>
                    <p className="text-[#4D6E56] dark:text-[#7A9E83] text-[10px] mt-1 font-bold uppercase tracking-widest opacity-60">Daily item movement velocity</p>
                </div>
                <div className="flex items-center gap-6 p-2 bg-white/50 dark:bg-black/10 border border-[#E2DCCE]/60 dark:border-emerald-950/20 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-xl">
                        <div className="w-2.5 h-2.5 bg-[#2C5E3B] dark:bg-[#A9CBA2] rounded-sm opacity-80" />
                        <span className="text-[10px] font-bold text-[#4D6E56] dark:text-[#7A9E83] uppercase tracking-widest">Inbound</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-xl">
                        <div className="w-2.5 h-2.5 bg-[#8C6239] dark:bg-[#E2C899] rounded-sm opacity-80" />
                        <span className="text-[10px] font-bold text-[#4D6E56] dark:text-[#7A9E83] uppercase tracking-widest">Outbound</span>
                    </div>
                </div>
            </div>
            
            <div className="h-[340px] w-full relative touch-pan-y">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={data} barGap={12}>
                        <defs>
                            <linearGradient id="inboundGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={inboundColor} stopOpacity={1} />
                                <stop offset="100%" stopColor={inboundColor} stopOpacity={0.3} />
                            </linearGradient>
                            <linearGradient id="outboundGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={outboundColor} stopOpacity={1} />
                                <stop offset="100%" stopColor={outboundColor} stopOpacity={0.3} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="0" stroke={chartStroke} vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke={chartText}
                            fontSize={10}
                            fontWeight={800}
                            tickLine={false}
                            axisLine={false}
                            dy={15}
                        />
                        <YAxis
                            stroke={chartText}
                            fontSize={10}
                            fontWeight={800}
                            tickLine={false}
                            axisLine={false}
                            dx={-10}
                        />
                        <Tooltip
                            cursor={{ fill: theme === 'dark' ? 'rgba(169,203,162,0.02)' : 'rgba(44,94,59,0.02)' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="lg:backdrop-blur-2xl p-4 rounded-2xl shadow-2xl border bg-[#FAF8F5]/95 dark:bg-[#18201B]/95 border-[#E2DCCE] dark:border-emerald-950/20">
                                            <p className="text-[10px] font-black text-[#4D6E56] dark:text-[#A9CBA2] uppercase tracking-[0.2em] mb-3">{payload[0].payload.date}</p>
                                            <div className="space-y-2">
                                                {payload.map((entry: any, i: number) => (
                                                    <div key={i} className="flex items-center justify-between gap-8">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${entry.fill === 'url(#inboundGradient)' ? 'bg-[#2C5E3B] dark:bg-[#A9CBA2]' : 'bg-[#8C6239] dark:bg-[#E2C899]'}`} />
                                                            <span className="text-xs font-bold text-[#1E3F27] dark:text-[#EAE5D9] uppercase tracking-tight">{entry.name}</span>
                                                        </div>
                                                        <span className="text-sm font-black text-[#1E3F27] dark:text-[#EAE5D9]">{entry.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar name="Inbound" dataKey="inbound" fill="url(#inboundGradient)" radius={[6, 6, 0, 0]} />
                        <Bar name="Outbound" dataKey="outbound" fill="url(#outboundGradient)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
export default DashboardFlowDynamics;
