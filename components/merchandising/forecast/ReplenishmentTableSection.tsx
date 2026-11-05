import React, { useState } from 'react';
import type { Product } from '../../../types';
import type { ReplenishmentRecommendation } from '../../../utils/merchandisingForecast';
import { ProductWorkspace } from '../../products/ProductWorkspace';

interface Props {
    recommendations: ReplenishmentRecommendation[];
    isLoading: boolean;
    totalProductsEvaluated: number;
    canCreatePO?: boolean;
    canRequestInternal?: boolean;
    requestPending?: boolean;
    onRequestInternal?: (recommendation: ReplenishmentRecommendation) => void;
    onInitiatePO: (recommendation: ReplenishmentRecommendation) => void;
}

export function ReplenishmentTableSection({ recommendations, isLoading, totalProductsEvaluated, canCreatePO = false, canRequestInternal = false, requestPending = false, onRequestInternal, onInitiatePO }: Props) {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [product, setProduct] = useState<Product | null>(null);
    const matches = recommendations.filter(item => `${item.product.name} ${item.sku}`.toLowerCase().includes(search.trim().toLowerCase()));
    const pages = Math.max(1, Math.ceil(matches.length / 10));
    const current = Math.min(page, pages);
    const rows = matches.slice((current - 1) * 10, current * 10);
    return <section className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-3.5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-3 items-stretch sm:items-center">
            <div><h3 className="font-semibold text-[var(--theme-text-primary)]">Replenishment review</h3><p className="text-xs sm:text-sm text-[var(--theme-text-secondary)]">{recommendations.length} recommendations · {totalProductsEvaluated} location/SKU positions evaluated</p></div>
            <input aria-label="Search replenishment recommendations" placeholder="Search product or SKU" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} className="w-full sm:w-auto h-11 sm:h-9 rounded-xl px-3 border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs sm:text-sm text-[var(--theme-text-primary)]" />
        </div>
        {!canCreatePO && <p className="text-xs sm:text-sm text-[var(--theme-text-secondary)]">Purchase drafts require a procurement role and a warehouse or distribution centre destination. Store requirements can be submitted as internal replenishment requests for source approval.</p>}
        {isLoading ? <p role="status">Loading analysis…</p> : rows.length === 0 ? <p className="text-sm text-[var(--theme-text-secondary)]">{search ? 'No matching recommendations.' : 'No recommendations from recorded sales and stock policy. Missing evidence does not establish sufficient stock.'}</p> : rows.map(rec => <article key={`${rec.siteId}:${rec.sku}`} className="rounded-xl border border-[var(--theme-border)] p-3.5 sm:p-4 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div><button type="button" onClick={() => setProduct(rec.product)} className="font-semibold text-left text-[var(--theme-text-primary)] hover:underline">{rec.product.name}</button><p className="text-xs text-[var(--theme-text-secondary)]">{rec.sku} · Selling unit: {rec.product.unit || 'Unit'}</p></div>
                <span className="text-sm font-semibold text-[var(--theme-text-primary)]">Need {rec.suggestedBuySellable} selling units</span>
            </div>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm text-[var(--theme-text-secondary)]">
                <div><dt>On hand</dt><dd className="font-semibold text-[var(--theme-text-primary)]">{rec.onHand}</dd></div>
                <div><dt>Approved on order</dt><dd>{rec.onOrder}</dd></div>
                <div><dt>In transit</dt><dd>{rec.inTransit}</dd></div>
                <div><dt>30-day observed sales</dt><dd>{rec.predictedDemand30d}</dd></div>
            </dl>
            <details className="text-sm text-[var(--theme-text-secondary)]"><summary className="cursor-pointer min-h-11 flex items-center">Calculation and ordering details</summary><div className="mt-2 space-y-1">
                <p>{rec.reason}</p><p>Net stock {rec.effectiveStock} · Recorded reservations {rec.reserved} · Minimum {rec.minThreshold}</p>
                <p>Recorded lead time {rec.leadTimeDays ? `${rec.leadTimeDays} days` : 'not configured; no lead-time buffer added'}.</p>
                <p>{rec.suggestedBuyPacks} supplier order units × {rec.packSize} selling units = {rec.effectiveOrderedUnits} selling units after pack rounding.</p>
                <p>{rec.costUnrecorded ? 'Verified cost required before creating a draft.' : `Cost per supplier order unit (rounded): ${rec.orderUnitCost}. Draft line total: ${rec.totalCost}.`}</p>
                {rec.blockedReason && <p role="status">{rec.blockedReason}</p>}
            </div></details>
            {canRequestInternal ? <button type="button" disabled={requestPending || Boolean(rec.blockedReason) || rec.suggestedBuySellable < 1} onClick={() => onRequestInternal?.(rec)} className="w-full sm:w-auto min-h-11 rounded-xl px-4 py-2 bg-[var(--theme-accent)] text-[var(--theme-text-primary)] text-xs sm:text-sm font-semibold disabled:opacity-50">{requestPending ? 'Submitting…' : 'Request internal replenishment'}</button> : <button type="button" disabled={!canCreatePO || rec.costUnrecorded || Boolean(rec.blockedReason)} onClick={() => onInitiatePO(rec)} className="w-full sm:w-auto min-h-11 rounded-xl px-4 py-2 bg-[var(--theme-accent)] text-[var(--theme-text-primary)] text-xs sm:text-sm font-semibold disabled:opacity-50 focus-visible:outline focus-visible:outline-2">{rec.costUnrecorded ? 'Cost required' : rec.blockedReason ? 'Review stock policy' : 'Review purchase draft'}</button>}
        </article>)}
        {pages > 1 && <nav aria-label="Replenishment pages" className="flex flex-wrap gap-3 items-center justify-between text-xs sm:text-sm text-[var(--theme-text-primary)]"><button type="button" disabled={current === 1} onClick={() => setPage(current - 1)} className="min-h-11 px-3 rounded-lg border border-[var(--theme-border)] disabled:opacity-50">Previous</button><span>Page {current} of {pages} · {matches.length} matches</span><button type="button" disabled={current === pages} onClick={() => setPage(current + 1)} className="min-h-11 px-3 rounded-lg border border-[var(--theme-border)] disabled:opacity-50">Next</button></nav>}
        <ProductWorkspace product={product} isOpen={Boolean(product)} onClose={() => setProduct(null)} readOnly />
    </section>;
}
