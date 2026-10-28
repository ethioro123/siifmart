import { useEffect, useState } from 'react';
import type { Product } from '../../../types';
import { usePriceManagerCatalog } from '../../../hooks/usePriceManagerCatalog';
import { useMerchandising } from '../MerchandisingContext';
import { useData } from '../../../contexts/DataContext';
import { LocationPriceEditor } from './LocationPriceEditor';
import { effectivePrice } from '../../../utils/pricingGovernance';
import { productSiteName } from '../../../utils/priceManager';

/** Location records are fetched only when a product is expanded. */
export function PriceGroupLocations({ product }: { product: Product }) {
    const { effectiveCountry } = useData();
    const { filters, sites, currencySymbol, openProductControl } = useMerchandising();
    const [page, setPage] = useState(1);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    useEffect(() => { setPage(1); setEditingProduct(null); }, [product.sku, filters]);
    const query = usePriceManagerCatalog({ country: effectiveCountry || '', grouped: false,
        filters: { ...filters, sku: product.sku }, page, pageSize: 25, sort: { key: 'siteId', direction: 'asc' } }, Boolean(product.sku));
    const rows = product.sku ? query.data?.data || [] : [product];
    const count = product.sku ? query.data?.count || 0 : 1;
    return <div className="p-4 sm:p-5 space-y-3 bg-[var(--theme-bg-subtle)]" aria-label={`Locations for ${product.name}`}>
        <p className="text-xs text-[var(--theme-text-secondary)]">Matching locations and lot records. Open a location to review its product details and price approval scope.</p>
        {product.sku && query.isLoading && <p role="status">Loading locations…</p>}
        {query.isError && <p role="alert">Locations could not be loaded. <button type="button" onClick={() => void query.refetch()} className="underline min-h-11">Retry</button></p>}
        {!query.isError && rows.map(record => <div key={record.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-3">
            <div className="text-sm text-[var(--theme-text-primary)]"><p className="font-medium">{productSiteName(record, sites)}</p>
                <p className="text-xs text-[var(--theme-text-secondary)]">{record.batchNumber ? `Lot ${record.batchNumber}` : 'Location record'} · {record.stock.toLocaleString()} {record.unit || 'units'} in stock</p></div>
            <div className="flex items-center gap-4"><span className="text-sm tabular-nums text-[var(--theme-text-primary)]">{currencySymbol} {Math.round(effectivePrice(record) ?? 0).toLocaleString()}</span>
                <button type="button" onClick={() => setEditingProduct(record)} className="min-h-11 px-3 rounded-lg border border-[var(--theme-border)] text-sm text-[var(--theme-text-primary)]">Propose price</button>
                <button type="button" onClick={() => openProductControl(record)} className="min-h-11 px-3 rounded-lg border border-[var(--theme-border)] text-sm text-[var(--theme-text-primary)] focus-visible:outline focus-visible:outline-2">Review location</button></div>
        </div>)}
        {editingProduct && <LocationPriceEditor key={editingProduct.id} product={editingProduct} onClose={() => setEditingProduct(null)} />}
        {!query.isFetching && !query.isError && !rows.length && <p>No matching location records.</p>}
        {count > 25 && <nav aria-label="Product location pages" className="flex items-center gap-4 text-sm text-[var(--theme-text-primary)]"><button type="button" disabled={page === 1 || query.isFetching} onClick={() => setPage(page - 1)} className="min-h-11 disabled:opacity-50">Previous locations</button><span>{page} of {Math.ceil(count / 25)}</span><button type="button" disabled={page * 25 >= count || query.isFetching} onClick={() => setPage(page + 1)} className="min-h-11 disabled:opacity-50">Next locations</button></nav>}
    </div>;
}
