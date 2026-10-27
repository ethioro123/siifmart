import React from 'react';
import { Sparkles, AlertTriangle, Truck, CheckCircle2 } from 'lucide-react';
import type { ReplenishmentRecommendation } from '../../../utils/merchandisingForecast';

interface ForecastInsightsSectionProps {
    recommendations: ReplenishmentRecommendation[];
    confidencePct: number | null;
    confidenceLabel: string;
    totalProductsEvaluated: number;
}

export const ForecastInsightsSection: React.FC<ForecastInsightsSectionProps> = ({
    recommendations,
    confidencePct,
    confidenceLabel,
    totalProductsEvaluated
}) => {
    const criticalItems = recommendations.filter(r => r.urgency === 'high');
    const itemsWithPipeline = recommendations.filter(r => r.onOrder > 0 || r.inTransit > 0);
    const unhedgedDeficits = recommendations.filter(r => r.onOrder === 0 && r.inTransit === 0);

    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                        <Sparkles size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">
                            Replenishment Insights
                        </h3>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                            Demand velocity and pipeline coverage analysis
                        </p>
                    </div>
                </div>

                <div className="space-y-3 mt-4">
                    <div className="p-3.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <AlertTriangle size={12} className="text-rose-500" />
                            <p className="text-[10px] text-rose-500 font-semibold uppercase tracking-wider">
                                Inventory Deficits
                            </p>
                        </div>
                        <p className="text-xs text-[var(--theme-text-primary)] font-semibold">
                            {criticalItems.length} Priority Recommendations
                        </p>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-1 leading-relaxed">
                            {criticalItems.length > 0
                                ? `${criticalItems.length} products have a recorded stock or demand deficit and need replenishment review.`
                                : `No critical recommendations in the evaluated dataset.`}
                        </p>
                    </div>

                    <div className="p-3.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <Truck size={12} className="text-[var(--theme-accent)]" />
                            <p className="text-[10px] text-[var(--theme-accent)] font-semibold uppercase tracking-wider">
                                Pipeline Status
                            </p>
                        </div>
                        <p className="text-xs text-[var(--theme-text-primary)] font-semibold">
                            {itemsWithPipeline.length} Recommendations With Incoming Stock
                        </p>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-1 leading-relaxed">
                            {unhedgedDeficits.length > 0
                                ? `${unhedgedDeficits.length} items have stock deficits without incoming POs or transfer orders.`
                                : `No uncovered deficits in the recommendation list.`}
                        </p>
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-[var(--theme-border)] flex items-center justify-between text-xs text-[var(--theme-text-secondary)] font-medium mt-4">
                <span>Forecast validation</span>
                {confidencePct !== null ? (
                    <span className="font-mono text-xs text-[var(--theme-accent)] font-semibold tabular-nums">
                        {confidenceLabel}
                    </span>
                ) : (
                    <span className="text-xs text-[var(--theme-text-tertiary)] italic">
                        Accuracy not measured
                    </span>
                )}
            </div>
        </div>
    );
};
