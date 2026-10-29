import React from 'react';
import {
    DollarSign, Tag, Percent, TrendingDown, TrendingUp, Lock
} from 'lucide-react';
import { formatPriceValue } from '../../../utils/formatting';

interface EditableFinancialsCardProps {
    register: any;
    watch: any;
    showCostPrice: boolean;
    currencySymbol: string;
}

export const EditableFinancialsCard: React.FC<EditableFinancialsCardProps> = ({
    register,
    watch,
    showCostPrice,
    currencySymbol
}) => {
    const price = Number(watch('price')) || 0;
    const salePrice = Number(watch('salePrice')) || 0;
    const competitorPrice = Number(watch('competitorPrice')) || 0;
    const costPrice = Number(watch('costPrice')) || 0;

    const grossProfit = price - costPrice;
    const marginPct = price > 0 ? (grossProfit / price) * 100 : 0;
    const markupPct = costPrice > 0 ? (grossProfit / costPrice) * 100 : 0;
    const compDiff = competitorPrice > 0 ? price - competitorPrice : 0;
    const discountAmt = price - salePrice;
    const discountPct = price > 0 && salePrice > 0 ? (discountAmt / price) * 100 : 0;

    return (
        <div className="bg-[var(--theme-bg-card)] p-5 rounded-2xl border border-[var(--theme-border)] space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-[var(--theme-border)] pb-2.5">
                <DollarSign size={14} className="text-[var(--theme-text-secondary)]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-primary)]">
                    Financial & Pricing Details
                </h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* 1. Retail Price */}
                <div className="p-3 rounded-xl flex items-start gap-3 border bg-[var(--theme-bg-subtle)] border-[var(--theme-border)]">
                    <DollarSign size={14} className="mt-1 flex-shrink-0 text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]" />
                    <div className="space-y-1 min-w-0 flex-1">
                        <label className="text-[11px] text-[var(--theme-text-muted)] font-medium uppercase tracking-wider block">
                            Retail Price *
                        </label>
                        <div className="flex items-center gap-1">
                            <span className="text-xs font-mono font-bold text-[var(--theme-text-muted)]">{currencySymbol}</span>
                            <input
                                type="number"
                                step="0.01"
                                {...register('price', { valueAsNumber: true })}
                                placeholder="0.00"
                                className="w-full bg-transparent border-0 p-0 text-xs font-mono font-bold text-[var(--theme-text-primary)] focus:outline-none focus:ring-0"
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Promo / Sale Price */}
                <div className={`p-3 rounded-xl flex items-start gap-3 border ${
                    salePrice > 0
                        ? 'bg-[var(--theme-status-warning-bg)] border-[var(--theme-status-warning-border)] bg-[var(--theme-status-warning-bg)] border-[var(--theme-status-warning-border)]'
                        : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)]'
                }`}>
                    <Tag size={14} className="mt-1 flex-shrink-0 text-[var(--theme-status-warning-text)]" />
                    <div className="space-y-1 min-w-0 flex-1">
                        <label className="text-[11px] text-[var(--theme-text-muted)] font-medium uppercase tracking-wider block">
                            Promo Price
                        </label>
                        <div className="flex items-center gap-1">
                            <span className="text-xs font-mono font-bold text-[var(--theme-text-muted)]">{currencySymbol}</span>
                            <input
                                type="number"
                                step="0.01"
                                {...register('salePrice', { valueAsNumber: true })}
                                placeholder="0.00"
                                className="w-full bg-transparent border-0 p-0 text-xs font-mono font-bold text-[var(--theme-text-primary)] focus:outline-none focus:ring-0"
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Discount Percentage */}
                <div className={`p-3 rounded-xl flex items-start gap-3 border ${
                    salePrice > 0 && discountPct > 0
                        ? 'bg-[var(--theme-status-warning-bg)] border-[var(--theme-status-warning-border)] bg-[var(--theme-status-warning-bg)] border-[var(--theme-status-warning-border)]'
                        : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)]'
                }`}>
                    <Percent size={14} className="mt-1 flex-shrink-0 text-[var(--theme-status-warning-text)]" />
                    <div className="space-y-0.5 min-w-0 flex-1">
                        <span className="text-[11px] text-[var(--theme-text-muted)] font-medium uppercase tracking-wider block">Discount</span>
                        <div className="text-xs font-mono font-bold text-[var(--theme-text-primary)] leading-tight pt-1">
                            {salePrice > 0 && discountPct > 0 ? `${discountPct.toFixed(1)}%` : <span className="text-[var(--theme-text-muted)] font-medium">—</span>}
                        </div>
                    </div>
                </div>

                {/* 4. Competitor Price */}
                <div className="p-3 rounded-xl flex items-start gap-3 border bg-[var(--theme-bg-subtle)] border-[var(--theme-border)]">
                    {compDiff > 0 ? (
                        <TrendingDown size={14} className="mt-1 flex-shrink-0 text-[var(--theme-status-danger-text)]" />
                    ) : (
                        <TrendingUp size={14} className="mt-1 flex-shrink-0 text-[var(--theme-status-success-text)]" />
                    )}
                    <div className="space-y-1 min-w-0 flex-1">
                        <label className="text-[11px] text-[var(--theme-text-muted)] font-medium uppercase tracking-wider block">
                            Competitor Price
                        </label>
                        <div className="flex items-center gap-1">
                            <span className="text-xs font-mono font-bold text-[var(--theme-text-muted)]">{currencySymbol}</span>
                            <input
                                type="number"
                                step="0.01"
                                {...register('competitorPrice', { valueAsNumber: true })}
                                placeholder="0.00"
                                className="w-full bg-transparent border-0 p-0 text-xs font-mono font-bold text-[var(--theme-text-primary)] focus:outline-none focus:ring-0"
                            />
                        </div>
                    </div>
                </div>

                {/* Privileged COGS and Financial Metrics */}
                {showCostPrice && (
                    <>
                        {/* 5. Cost Price (COGS) */}
                        <div className="p-3 rounded-xl flex items-start gap-3 border bg-[var(--theme-bg-subtle)] border-[var(--theme-border)]">
                            <Lock size={14} className="mt-1 flex-shrink-0 text-[var(--theme-text-muted)]" />
                            <div className="space-y-1 min-w-0 flex-1">
                                <label className="text-[11px] text-[var(--theme-text-muted)] font-medium uppercase tracking-wider block">
                                    Cost Price (COGS)
                                </label>
                                <div className="flex items-center gap-1">
                                    <span className="text-xs font-mono font-bold text-[var(--theme-text-muted)]">{currencySymbol}</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        {...register('costPrice', { valueAsNumber: true })}
                                        placeholder="0.00"
                                        className="w-full bg-transparent border-0 p-0 text-xs font-mono font-bold text-[var(--theme-text-primary)] focus:outline-none focus:ring-0"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 6. Gross Profit */}
                        <div className="p-3 rounded-xl flex items-start gap-3 border bg-[var(--theme-bg-subtle)] border-[var(--theme-border)]">
                            <TrendingUp size={14} className="mt-1 flex-shrink-0 text-[var(--theme-status-success-text)]" />
                            <div className="space-y-0.5 min-w-0 flex-1">
                                <span className="text-[11px] text-[var(--theme-text-muted)] font-medium uppercase tracking-wider block">Gross Profit</span>
                                <div className="text-xs font-mono font-bold text-[var(--theme-text-primary)] leading-tight pt-1">
                                    {grossProfit > 0 ? `${currencySymbol} ${grossProfit.toFixed(2)}` : <span className="text-[var(--theme-text-muted)] font-medium">—</span>}
                                </div>
                            </div>
                        </div>

                        {/* 7. Gross Margin */}
                        <div className="p-3 rounded-xl flex items-start gap-3 border bg-[var(--theme-bg-subtle)] border-[var(--theme-border)]">
                            <Percent size={14} className="mt-1 flex-shrink-0 text-[var(--theme-status-success-text)]" />
                            <div className="space-y-0.5 min-w-0 flex-1">
                                <span className="text-[11px] text-[var(--theme-text-muted)] font-medium uppercase tracking-wider block">Gross Margin</span>
                                <div className="text-xs font-mono font-bold text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] leading-tight pt-1">
                                    {marginPct > 0 ? `${marginPct.toFixed(1)}%` : <span className="text-[var(--theme-text-muted)] font-medium">—</span>}
                                </div>
                            </div>
                        </div>

                        {/* 8. Markup Rate */}
                        <div className="p-3 rounded-xl flex items-start gap-3 border bg-[var(--theme-bg-subtle)] border-[var(--theme-border)]">
                            <Percent size={14} className="mt-1 flex-shrink-0 text-[var(--theme-text-secondary)]" />
                            <div className="space-y-0.5 min-w-0 flex-1">
                                <span className="text-[11px] text-[var(--theme-text-muted)] font-medium uppercase tracking-wider block">Markup Rate</span>
                                <div className="text-xs font-mono font-bold text-[var(--theme-text-primary)] leading-tight pt-1">
                                    {markupPct > 0 ? `${markupPct.toFixed(1)}%` : <span className="text-[var(--theme-text-muted)] font-medium">—</span>}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
