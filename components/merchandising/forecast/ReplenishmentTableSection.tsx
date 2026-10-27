import React, { useState } from 'react';
import { ShoppingCart, Package, AlertTriangle, Zap, ArrowUpRight, ChevronLeft, ChevronRight, Truck } from 'lucide-react';
import type { ReplenishmentRecommendation } from '../../../utils/merchandisingForecast';

interface ReplenishmentTableSectionProps {
    recommendations: ReplenishmentRecommendation[];
    isLoading: boolean;
    totalProductsEvaluated: number;
    onInitiatePO: (rec: ReplenishmentRecommendation) => void;
}

export const ReplenishmentTableSection: React.FC<ReplenishmentTableSectionProps> = ({
    recommendations,
    isLoading,
    totalProductsEvaluated,
    onInitiatePO
}) => {
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const totalCount = recommendations.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const safePage = Math.min(page, totalPages);

    const startIndex = (safePage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalCount);
    const paginatedItems = recommendations.slice(startIndex, endIndex);

    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl p-5 sm:p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-[var(--theme-border)]">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                        <ShoppingCart size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">
                            Recommended Replenishment Orders
                        </h3>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                            Actionable purchase recommendations accounting for stock, open POs, transfers, and lead time
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] px-3 py-1 rounded-full font-medium font-mono tabular-nums">
                        {totalCount} {totalCount === 1 ? 'Product' : 'Products'} Need Replenishment
                    </span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                        <tr className="bg-[var(--theme-bg-subtle)] border-b border-[var(--theme-border)] text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">
                            <th className="p-3.5 pl-5">Product</th>
                            <th className="p-3.5 text-center">Net Inventory Position</th>
                            <th className="p-3.5 text-center">30d Demand</th>
                            <th className="p-3.5 text-center">Suggested Order</th>
                            <th className="p-3.5">Replenishment Logic</th>
                            <th className="p-3.5 pr-5 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--theme-border-subtle)]">
                        {isLoading && (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-xs text-[var(--theme-text-secondary)]">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-[var(--theme-accent)] border-t-transparent rounded-full animate-spin" />
                                        <span>Evaluating inventory stock, sales run-rates, and open pipeline orders...</span>
                                    </div>
                                </td>
                            </tr>
                        )}

                        {!isLoading && paginatedItems.map((rec) => {
                            const { product, onHand, onOrder, inTransit, predictedDemand30d, suggestedBuySellable, packSize, suggestedBuyPacks, reason, urgency } = rec;
                            return (
                                <tr key={product.id} className="hover:bg-[var(--theme-bg-subtle)] transition-colors">
                                    <td className="p-3.5 pl-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center shrink-0 overflow-hidden">
                                                {product.image && !product.image.includes('placeholder.com') ? (
                                                    <img
                                                        src={product.image}
                                                        className="w-full h-full object-cover"
                                                        alt=""
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                        }}
                                                    />
                                                ) : (
                                                    <Package size={16} className="text-[var(--theme-text-secondary)]" />
                                                )}
                                            </div>
                                            <div>
                                                <span className="font-semibold text-xs text-[var(--theme-text-primary)] block leading-tight">
                                                    {product.name}
                                                </span>
                                                <span className="text-[10px] text-[var(--theme-text-secondary)] font-mono">
                                                    {product.sku || product.category}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3.5 text-center">
                                        <div className="text-xs font-mono font-medium text-[var(--theme-text-primary)] tabular-nums">
                                            {onHand} on-hand
                                        </div>
                                        {(onOrder > 0 || inTransit > 0) && (
                                            <div className="flex items-center justify-center gap-1.5 mt-0.5 flex-wrap">
                                                {onOrder > 0 && (
                                                    <span className="text-[10px] font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-1.5 py-0.2 rounded-md font-semibold">
                                                        +{onOrder} PO
                                                    </span>
                                                )}
                                                {inTransit > 0 && (
                                                    <span className="text-[10px] font-mono bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-1.5 py-0.2 rounded-md font-semibold flex items-center gap-0.5">
                                                        <Truck size={10} /> +{inTransit}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-3.5 text-center text-xs text-[var(--theme-text-primary)] font-mono font-semibold tabular-nums">
                                        {predictedDemand30d}
                                    </td>
                                    <td className="p-3.5 text-center">
                                        <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono tabular-nums inline-block">
                                            +{suggestedBuySellable} units
                                        </div>
                                        {packSize > 1 && (
                                            <div className="text-[10px] text-[var(--theme-text-secondary)] font-mono font-medium mt-0.5">
                                                ({suggestedBuyPacks} {suggestedBuyPacks === 1 ? 'pack' : 'packs'} of {packSize})
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-3.5">
                                        <div className="flex items-center gap-1.5 text-xs font-medium">
                                            {urgency === 'high' ? (
                                                <AlertTriangle size={13} className="text-rose-500 shrink-0" />
                                            ) : (
                                                <Zap size={13} className="text-amber-500 shrink-0" />
                                            )}
                                            <span className={urgency === 'high' ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-[var(--theme-text-secondary)]'}>
                                                {reason}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-3.5 pr-5 text-right">
                                        <button
                                            type="button"
                                            onClick={() => onInitiatePO(rec)}
                                            className="h-8 px-3.5 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 text-white text-xs font-semibold flex items-center gap-1.5 ml-auto transition-colors shadow-sm cursor-pointer"
                                        >
                                            <span>Create PO</span>
                                            <ArrowUpRight size={13} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}

                        {!isLoading && recommendations.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-10 text-center text-[var(--theme-text-tertiary)] text-xs font-medium">
                                    {totalProductsEvaluated === 0
                                        ? 'No inventory items found for this location scope. Verify active store selection.'
                                        : `All ${totalProductsEvaluated} evaluated inventory items have sufficient stock coverage based on current thresholds and pipeline orders.`}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Bounded Pagination Controls (Gap 10) */}
            {!isLoading && totalCount > pageSize && (
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-[var(--theme-border)] text-xs text-[var(--theme-text-secondary)]">
                    <div>
                        Showing <span className="font-semibold text-[var(--theme-text-primary)] font-mono">{startIndex + 1}</span> to <span className="font-semibold text-[var(--theme-text-primary)] font-mono">{endIndex}</span> of <span className="font-semibold text-[var(--theme-text-primary)] font-mono">{totalCount}</span> items
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={safePage <= 1}
                            className="p-1.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            aria-label="Previous page"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="font-mono text-xs font-semibold px-2">
                            Page {safePage} of {totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={safePage >= totalPages}
                            className="p-1.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            aria-label="Next page"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
