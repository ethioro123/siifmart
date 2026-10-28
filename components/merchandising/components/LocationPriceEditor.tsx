import { useState } from 'react';
import type { Product } from '../../../types';
import { normalizePriceProposal } from '../../../utils/priceManager';
import { useMerchandising } from '../MerchandisingContext';

export function LocationPriceEditor({ product, onClose }: { product: Product; onClose: () => void }) {
    const { previewLocationPrice } = useMerchandising();
    const [price, setPrice] = useState(String(product.price));
    const [salePrice, setSalePrice] = useState(String(product.salePrice || ''));
    const [onSale, setOnSale] = useState(Boolean(product.isOnSale));
    const [error, setError] = useState('');
    return <form onSubmit={event => {
        event.preventDefault();
        try {
            const proposal = normalizePriceProposal({ price: Number(price), costPrice: product.costPrice,
                isOnSale: onSale, salePrice: salePrice === '' ? undefined : Number(salePrice) });
            previewLocationPrice({ product, proposal }); onClose();
        } catch (failure) { setError((failure as Error).message); }
    }} className="p-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] space-y-3 text-sm text-[var(--theme-text-primary)]">
        <p className="font-semibold">Propose a price for this location record</p>
        <p className="text-xs text-[var(--theme-text-secondary)]">Recorded buying cost stays unchanged. The next step shows the exact location and required approval route.</p>
        <div className="flex flex-wrap items-end gap-3">
            <label className="space-y-1">Regular price<input aria-label="Location regular price" required type="number" min="1" step="1" value={price} onChange={event => setPrice(event.target.value)} className="block w-32 min-h-11 rounded-lg p-2 border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)]" /></label>
            <label className="flex gap-2 items-center min-h-11"><input type="checkbox" checked={onSale} onChange={event => setOnSale(event.target.checked)} />On sale</label>
            {onSale && <label className="space-y-1">Sale price<input aria-label="Location sale price" required type="number" min="1" step="1" value={salePrice} onChange={event => setSalePrice(event.target.value)} className="block w-32 min-h-11 rounded-lg p-2 border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)]" /></label>}
            <button type="submit" className="min-h-11 rounded-lg px-3 bg-[var(--theme-accent)] text-white">Preview price proposal</button>
            <button type="button" onClick={onClose} className="min-h-11 px-3">Cancel edit</button>
        </div>
        {error && <p role="alert">{error}</p>}
    </form>;
}
