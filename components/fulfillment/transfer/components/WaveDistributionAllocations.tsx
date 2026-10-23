import React, { useState } from 'react';
import { Product, Site, User } from '../../../../types';
import { eligibleDistributionStores } from '../../../../utils/distributionStores';
import { formatTransferStock, getTransferQuantityConfig, normalizeTransferEntry } from '../transferQuantity';
interface Row { productId: string; allocations: { storeId: string; quantity: number }[] }
interface Props {
    isSearchingProduct: boolean; setIsSearchingProduct: (searching: boolean) => void;
    allProducts: Product[]; products?: Product[]; bulkDistributionSourceSite: string; activeSite: Site | null;
    sites: Site[]; settings: { enforceRegionalZoning?: boolean }; user: User | null; sourceSiteObj: Site | undefined;
    waveProducts: Row[]; setWaveProducts: (rows: Row[]) => void;
}
export function WaveDistributionAllocations({ allProducts, products = [], bulkDistributionSourceSite, activeSite, sites, settings, user, sourceSiteObj, waveProducts, setWaveProducts }: Props) {
    const [productSearch, setProductSearch] = useState('');
    const [storeSearch, setStoreSearch] = useState('');
    const [chosenProducts, setChosenProducts] = useState<string[]>([]);
    const [extraStores, setExtraStores] = useState<string[]>([]);
    const source = bulkDistributionSourceSite || activeSite?.id;
    const available = [...new Map([...allProducts, ...products].filter(p => (p.siteId || p.site_id) === source && p.stock > 0).map(p => [p.id, p])).values()];
    const eligible = eligibleDistributionStores(sites, sourceSiteObj, !!settings.enforceRegionalZoning, user?.role);
    const selectedIds = new Set([...extraStores, ...waveProducts.flatMap(row => row.allocations.map(a => a.storeId))]);
    const columns = eligible.filter(store => selectedIds.has(store.id));
    const remaining = available.filter(p => !waveProducts.some(row => row.productId === p.id) && `${p.name} ${p.sku}`.toLowerCase().includes(productSearch.toLowerCase()));
    const chooseStore = (storeId: string, selected: boolean) => {
        setExtraStores(selected ? [...extraStores.filter(id => id !== storeId), storeId] : extraStores.filter(id => id !== storeId));
        setWaveProducts(waveProducts.map(row => ({ ...row, allocations: selected ? [...row.allocations.filter(a => a.storeId !== storeId), { storeId, quantity: row.allocations.find(a => a.storeId === storeId)?.quantity || 0 }] : row.allocations.filter(a => a.storeId !== storeId) })));
    };
    return <section aria-label="Distribution allocation grid" className="space-y-3 min-w-0">
        <div className="flex flex-wrap gap-2 items-start">
            <details className="group rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-2 min-w-[170px] flex-1">
                <summary className="cursor-pointer min-h-[44px] flex items-center text-sm font-semibold text-[var(--theme-text-primary)]">Add products ({waveProducts.length})</summary>
                <input aria-label="Find distribution products" value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Search name or SKU" className="w-full min-h-[44px] border border-[var(--theme-border)] rounded-lg bg-[var(--theme-bg-app)] px-3 text-sm text-[var(--theme-text-primary)]" />
                <div className="max-h-48 overflow-y-auto">{remaining.map(p => <label key={p.id} className="min-h-[44px] flex items-center gap-2 text-sm text-[var(--theme-text-primary)]"><input type="checkbox" checked={chosenProducts.includes(p.id)} onChange={e => setChosenProducts(e.target.checked ? [...chosenProducts, p.id] : chosenProducts.filter(id => id !== p.id))} /><span className="break-words">{p.name} <span className="text-xs text-[var(--theme-text-secondary)]">{p.sku}</span></span></label>)}{!remaining.length && <p className="py-3 text-xs text-[var(--theme-text-secondary)]">No more matching stocked products.</p>}</div>
                <button type="button" disabled={!chosenProducts.length} onClick={e => {
                    const additions = available.filter(p => chosenProducts.includes(p.id) && !waveProducts.some(row => row.productId === p.id));
                    setWaveProducts([...waveProducts, ...additions.map(p => ({ productId: p.id, allocations: columns.map(store => ({ storeId: store.id, quantity: 0 })) }))]);
                    setChosenProducts([]); e.currentTarget.closest('details')?.removeAttribute('open');
                }} className="min-h-[44px] mt-2 px-3 rounded-lg bg-[var(--theme-btn-primary-bg)] text-[var(--theme-btn-primary-text)] disabled:opacity-50 text-sm">Add selected products</button>
            </details>
            <details className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-2 min-w-[170px] flex-1">
                <summary className="cursor-pointer min-h-[44px] flex items-center text-sm font-semibold text-[var(--theme-text-primary)]">Choose stores ({columns.length})</summary>
                <input aria-label="Find distribution stores" value={storeSearch} onChange={e => setStoreSearch(e.target.value)} placeholder="Search stores" className="w-full min-h-[44px] border border-[var(--theme-border)] rounded-lg bg-[var(--theme-bg-app)] px-3 text-sm text-[var(--theme-text-primary)]" />
                <div className="max-h-48 overflow-y-auto">{eligible.filter(store => `${store.name} ${store.code || ''}`.toLowerCase().includes(storeSearch.toLowerCase())).map(store => <label key={store.id} className="min-h-[44px] flex items-center gap-2 text-sm text-[var(--theme-text-primary)]"><input type="checkbox" aria-label={`Supply ${store.name}`} checked={selectedIds.has(store.id)} onChange={e => chooseStore(store.id, e.target.checked)} /><span className="break-words">{store.name}</span></label>)}</div>
            </details>
        </div>
        <p className="text-xs text-[var(--theme-text-secondary)]">Enter quantities across the grid. Blank or zero means this store receives none of that product. Scroll sideways for more stores.</p>
        {!waveProducts.length ? <p className="p-6 text-sm text-[var(--theme-text-secondary)] rounded-xl border border-dashed border-[var(--theme-border)]">Add several products together, choose stores once, then allocate in the grid.</p> : <div className="max-w-full overflow-auto rounded-xl border border-[var(--theme-border)] max-h-[55vh]" tabIndex={0} aria-label="Scrollable product and store quantities">
            <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 z-20 bg-[var(--theme-bg-subtle)]"><tr><th scope="col" className="sticky left-0 z-30 bg-[var(--theme-bg-subtle)] p-3 min-w-[160px] text-left text-[var(--theme-text-primary)]">Product / available</th>{columns.map(store => <th scope="col" key={store.id} className="p-2 min-w-[130px] max-w-[170px] text-xs text-left text-[var(--theme-text-primary)] break-words">{store.name}</th>)}<th scope="col" className="p-3 min-w-[110px] text-right text-[var(--theme-text-primary)]">Remaining</th><th scope="col" className="p-2"><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>{waveProducts.map(row => {
                    const product = available.find(p => p.id === row.productId);
                    const allocated = row.allocations.reduce((sum, a) => sum + a.quantity, 0);
                    const left = (product?.stock || 0) - allocated;
                    return <tr key={row.productId} className="border-t border-[var(--theme-border)]">
                        <th scope="row" className="sticky left-0 z-10 bg-[var(--theme-bg-card)] p-3 text-left max-w-[200px] text-[var(--theme-text-primary)]"><span className="block text-sm font-semibold break-words">{product?.name || 'Unavailable product'}</span><span className="block text-xs font-normal text-[var(--theme-text-secondary)]">{product?.sku} · {formatTransferStock(product?.stock || 0, product)}</span></th>
                        {columns.map(store => <td key={store.id} className="p-2"><input type="number" inputMode="decimal" min={0} step={getTransferQuantityConfig(product).step} aria-label={`Quantity for ${product?.name} to ${store.name}`} value={row.allocations.find(a => a.storeId === store.id)?.quantity || ''} placeholder="—" onChange={e => {
                            const quantity = normalizeTransferEntry(e.target.value, product);
                            setWaveProducts(waveProducts.map(r => r.productId === row.productId ? { ...r, allocations: [...r.allocations.filter(a => a.storeId !== store.id), { storeId: store.id, quantity }] } : r));
                        }} className="min-h-[44px] w-24 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card)] px-3 text-right tabular-nums text-[var(--theme-text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]" /></td>)}
                        <td className={`p-3 text-right text-xs tabular-nums ${left < 0 ? 'text-[var(--theme-status-error-text)]' : 'text-[var(--theme-text-primary)]'}`}>{formatTransferStock(left, product)}{left < 0 && <span className="block">Over allocated</span>}</td>
                        <td className="p-2"><button type="button" aria-label={`Remove ${product?.name} from wave`} onClick={() => setWaveProducts(waveProducts.filter(r => r.productId !== row.productId))} className="min-h-[44px] min-w-[44px] rounded-lg text-[var(--theme-text-secondary)]">×</button></td>
                    </tr>;
                })}</tbody>
            </table>
        </div>}
    </section>;
}
