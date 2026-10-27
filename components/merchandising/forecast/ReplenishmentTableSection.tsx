import React, { useState } from 'react';
import type { Product } from '../../../types';
import type { ReplenishmentRecommendation } from '../../../utils/merchandisingForecast';
import { ProductWorkspace } from '../../products/ProductWorkspace';

interface Props {
    recommendations: ReplenishmentRecommendation[];
    isLoading: boolean;
    totalProductsEvaluated: number;
    canCreatePO?: boolean;
    onInitiatePO: (recommendation: ReplenishmentRecommendation) => void;
}

export function ReplenishmentTableSection({ recommendations, isLoading, totalProductsEvaluated, canCreatePO = false, onInitiatePO }: Props) {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [product, setProduct] = useState<Product | null>(null);
    const matches = recommendations.filter(item => `${item.product.name} ${item.sku}`.toLowerCase().includes(search.trim().toLowerCase()));
    const pages = Math.max(1, Math.ceil(matches.length / 10));
    const current = Math.min(page, pages);
    const rows = matches.slice((current - 1) * 10, current * 10);
    return <section className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap justify-between gap-3 items-center">
            <div><h3 className="font-semibold text-[var(--theme-text-primary)]">Replenishment review</h3><p className="text-sm text-[var(--theme-text-secondary)]">{recommendations.length} recommendations · {totalProductsEvaluated} location/SKU positions evaluated</p></div>
            <input aria-label="Search replenishment recommendations" placeholder="Search product or SKU" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} className="rounded-lg p-2 border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)]" />
        </div>
        {!canCreatePO && <p className="text-sm text-[var(--theme-text-secondary)]">Purchase drafts require a procurement role and a warehouse or distribution centre destination. Store requirements should be reviewed for internal replenishment.</p>}
        {isLoading ? <p role="status">Loading analysis…</p> : rows.length === 0 ? <p className="text-sm text-[var(--theme-text-secondary)]">{search ? 'No matching recommendations.' : 'No recommendations from recorded sales and stock policy. Missing evidence does not establish sufficient stock.'}</p> : rows.map(rec => <article key={`${rec.siteId}:${rec.sku}`} className="rounded-xl border border-[var(--theme-border)] p-4 space-y-3">
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
            <details className="text-sm text-[var(--theme-text-secondary)]"><summary className="cursor-pointer">Calculation and ordering details</summary><div className="mt-2 space-y-1">
                <p>{rec.reason}</p><p>Net stock {rec.effectiveStock} · Recorded reservations {rec.reserved} · Minimum {rec.minThreshold}</p>
                <p>Recorded lead time {rec.leadTimeDays ? `${rec.leadTimeDays} days` : 'not configured; no lead-time buffer added'}.</p>
                <p>{rec.suggestedBuyPacks} supplier order units × {rec.packSize} selling units = {rec.effectiveOrderedUnits} selling units after pack rounding.</p>
                <p>{rec.costUnrecorded ? 'Verified cost required before creating a draft.' : `Recorded cost per supplier order unit: ${rec.orderUnitCost.toFixed(2)}. Draft line total: ${rec.totalCost.toFixed(2)}.`}</p>
                {rec.blockedReason && <p role="status">{rec.blockedReason}</p>}
            </div></details>
            <button type="button" disabled={!canCreatePO || rec.costUnrecorded || Boolean(rec.blockedReason)} onClick={() => onInitiatePO(rec)} className="rounded-lg px-3 py-2 bg-[var(--theme-accent)] text-white text-sm disabled:opacity-50 focus-visible:outline focus-visible:outline-2">{rec.costUnrecorded ? 'Cost required' : rec.blockedReason ? 'Review stock policy' : 'Review purchase draft'}</button>
        </article>)}
        {pages > 1 && <nav aria-label="Replenishment pages" className="flex gap-4 items-center text-sm text-[var(--theme-text-primary)]"><button type="button" disabled={current === 1} onClick={() => setPage(current - 1)}>Previous</button><span>Page {current} of {pages} · {matches.length} matches</span><button type="button" disabled={current === pages} onClick={() => setPage(current + 1)}>Next</button></nav>}
        <ProductWorkspace product={product} isOpen={Boolean(product)} onClose={() => setProduct(null)} readOnly />
    </section>;
}
