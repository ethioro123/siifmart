import React from 'react';
import { Product, Site } from '../../../../types';
import { formatTransferStock } from '../transferQuantity';
export interface DistributionRow { productId: string; allocations: { storeId: string; quantity: number }[] }
export function DistributionSummary({ rows, products, sites }: { rows: DistributionRow[]; products: Product[]; sites: Site[] }) {
    const active = rows.filter(row => row.allocations.some(a => a.quantity > 0));
    const destinations = new Set(active.flatMap(row => row.allocations.filter(a => a.quantity > 0).map(a => a.storeId)));
    return <section aria-label="Distribution summary" className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">Distribution summary</h3><span className="text-xs text-[var(--theme-text-secondary)]">{active.length} products · {destinations.size} stores · {destinations.size} transfer requests</span></div>
        {!active.length ? <p className="text-sm text-[var(--theme-text-secondary)]">Choose a product, then enter quantities for the stores you want to supply.</p> : active.map(row => {
            const product = products.find(p => p.id === row.productId);
            const allocated = row.allocations.reduce((sum, a) => sum + a.quantity, 0);
            const excess = allocated > (product?.stock || 0);
            return <div key={row.productId} className="border-t border-[var(--theme-border)] pt-3 min-w-0">
                <p className="text-sm font-medium text-[var(--theme-text-primary)] break-words">{product?.name || 'Product unavailable'}</p>
                <p className={`text-xs mt-1 ${excess ? 'text-[var(--theme-status-error-text)]' : 'text-[var(--theme-text-secondary)]'}`}>{formatTransferStock(allocated, product)} allocated · {formatTransferStock(Math.max(0, (product?.stock || 0) - allocated), product)} remaining{excess ? ' · Exceeds source stock' : ''}</p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--theme-text-secondary)] break-words">{row.allocations.filter(a => a.quantity > 0).map(a => `${sites.find(s => s.id === a.storeId)?.name || 'Unknown store'}: ${formatTransferStock(a.quantity, product)}`).join(' · ')}</p>
            </div>;
        })}
        <p className="text-xs text-[var(--theme-text-secondary)]">Submission creates transfer requests for approval. Stock moves through picking, dispatch and receiving.</p>
    </section>;
}
