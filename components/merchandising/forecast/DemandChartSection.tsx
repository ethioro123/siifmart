import React from 'react';
import { BrainCircuit, Info } from 'lucide-react';
import {
    ComposedChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import type { ForecastDemandPoint } from '../../../utils/merchandisingForecast';

interface DemandChartSectionProps {
    chartData: ForecastDemandPoint[];
    confidencePct: number | null;
    hasSalesData: boolean;
    totalSales: number;
}

export const DemandChartSection: React.FC<DemandChartSectionProps> = ({
    chartData,
    confidencePct,
    hasSalesData,
    totalSales
}) => {
    return (
        <div className="lg:col-span-2 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl p-5 sm:p-6 shadow-sm">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                        <BrainCircuit size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">
                            Demand Forecast & Sales Trend
                        </h3>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                            {hasSalesData
                                ? `4-week observed POS demand (${totalSales} units sold) and weekly average baseline`
                                : 'Awaiting 30-day POS sales data for this location'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 text-xs bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] px-3 py-1.5 rounded-full text-[var(--theme-text-secondary)] font-medium">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-[var(--theme-accent)] rounded-full"></span> Observed Sales
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-[var(--theme-status-warning-bg)] rounded-full"></span> Average Baseline
                    </span>
                </div>
            </div>

            {!hasSalesData && (
                <div className="mb-4 flex items-center gap-2 p-3 bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] rounded-2xl text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] text-xs">
                    <Info size={15} className="shrink-0" />
                    <span>No completed POS sales recorded for this store in the last 30 days. Historical sales show zero.</span>
                </div>
            )}

            <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                    <ComposedChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" vertical={false} opacity={0.6} />
                        <XAxis dataKey="period" stroke="var(--theme-text-secondary)" fontSize={11} tickLine={false} />
                        <YAxis stroke="var(--theme-text-secondary)" fontSize={11} tickLine={false} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--theme-bg-card)',
                                border: '1px solid var(--theme-border)',
                                borderRadius: '14px',
                                fontSize: '12px',
                                fontWeight: 500,
                                color: 'var(--theme-text-primary)',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.12)'
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="actual"
                            stroke="var(--theme-accent)"
                            strokeWidth={2.5}
                            dot={{ r: 3.5, fill: 'var(--theme-accent)' }}
                            name="Actual Sales"
                            connectNulls={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="predicted"
                            stroke="var(--theme-status-warning)"
                            strokeDasharray="4 4"
                            strokeWidth={2}
                            dot={false}
                            name="Forecast"
                            connectNulls={true}
                        />

                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
