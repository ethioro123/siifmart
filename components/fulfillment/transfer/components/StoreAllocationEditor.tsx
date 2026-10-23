import React, { useState } from 'react';
import type { Product, Site } from '../../../../types';
import { StoreAllocation, toggleDistributionStore } from '../../../../utils/distributionStores';
import { getTransferQuantityConfig, normalizeTransferEntry } from '../transferQuantity';
interface Props {
    stores: Site[]; allocations: StoreAllocation[]; product?: Product;
    onChange: (allocations: StoreAllocation[]) => void;
}
export function StoreAllocationEditor({ stores, allocations, product, onChange }: Props) {
    const [search, setSearch] = useState('');
    const config = getTransferQuantityConfig(product);
    const visible = stores.filter(store => `${store.name} ${store.code || ''}`.toLowerCase().includes(search.trim().toLowerCase()));
    const selected = new Set(allocations.map(a => a.storeId));
    return <section aria-label={`Destination stores for ${product?.name || 'product'}`} className="space-y-3 p-3.5">
        <p className="text-sm text-[var(--theme-text-secondary)]">Select the stores that should receive this product. Unselected stores receive nothing.</p>
        <div className="flex flex-wrap items-center gap-2">
            <label className="basis-full sm:basis-auto flex-1 min-w-0 text-xs text-[var(--theme-text-secondary)]">Find stores<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Store name or code" className="mt-1 min-h-[44px] w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] px-3 text-sm text-[var(--theme-text-primary)]" /></label>
            <button type="button" disabled={!visible.length} onClick={() => { let next = allocations; visible.forEach(store => { next = toggleDistributionStore(next, store.id, true); }); onChange(next); }} className="min-h-[44px] rounded-xl border border-[var(--theme-border)] px-3 text-xs text-[var(--theme-text-primary)] disabled:opacity-50">Select shown stores</button>
            <button type="button" disabled={!allocations.length} onClick={() => onChange([])} className="min-h-[44px] rounded-xl border border-[var(--theme-border)] px-3 text-xs text-[var(--theme-text-primary)] disabled:opacity-50">Clear selection</button>
        </div>
        <p className="text-xs text-[var(--theme-text-secondary)]">{allocations.length} selected · {stores.length} eligible stores</p>
        {!stores.length ? <p className="text-sm text-[var(--theme-text-secondary)]">No eligible stores for this source and distribution policy.</p> : !visible.length ? <p className="text-sm text-[var(--theme-text-secondary)]">No stores match your search. Existing selections are kept.</p> : <div className="max-h-[340px] overflow-y-auto space-y-2">
            {visible.map(store => {
                const allocation = allocations.find(a => a.storeId === store.id);
                return <div key={store.id} className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 ${selected.has(store.id) ? 'border-[var(--theme-accent)] bg-[var(--theme-bg-card)]' : 'border-[var(--theme-border)]'}`}>
                    <label className="flex flex-1 min-w-[130px] min-h-[44px] items-center gap-3 text-sm text-[var(--theme-text-primary)]"><input type="checkbox" checked={selected.has(store.id)} onChange={e => onChange(toggleDistributionStore(allocations, store.id, e.target.checked))} className="h-5 w-5 shrink-0 accent-[var(--theme-accent)]" aria-label={`Supply ${store.name}`} /><span className="break-words">{store.name}<span className="block text-xs text-[var(--theme-text-secondary)]">{store.code}</span></span></label>
                    {allocation ? <label className="text-xs text-[var(--theme-text-secondary)]">Quantity ({config.quantityLabel})<input type="number" inputMode="decimal" min="0" step={config.step} value={allocation.quantity} aria-label={`Quantity in ${config.quantityLabel} for ${store.name}`} onChange={e => onChange(allocations.map(a => a.storeId === store.id ? { ...a, quantity: normalizeTransferEntry(e.target.value, product) } : a))} className="ml-2 w-24 min-h-[44px] rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] px-3 text-right tabular-nums text-sm text-[var(--theme-text-primary)]" /></label> : <span className="text-xs text-[var(--theme-text-secondary)]">Not receiving</span>}
                </div>;
            })}
        </div>}
    </section>;
}
