import { useEffect, useState } from 'react';
import type { Product } from '../types';
import { discountedProposal, type PriceBatch, type PriceBatchResult, type PriceChangeInput } from '../utils/priceManager';

interface Input {
    products: Product[]; selectedIds: Set<string>; setSelectedIds: (ids: Set<string>) => void;
    scopeKey: string; submit: (changes: PriceChangeInput[], source: string) => Promise<PriceBatchResult>;
    setIsSubmitting: (value: boolean) => void;
}
export function usePriceManagerBatch({ products, selectedIds, setSelectedIds, scopeKey, submit, setIsSubmitting }: Input) {
    const [priceBatch, setPriceBatch] = useState<PriceBatch | null>(null);
    const [batchFailures, setBatchFailures] = useState<PriceBatchResult['failures']>([]);
    useEffect(() => { setSelectedIds(new Set()); setPriceBatch(null); setBatchFailures([]); }, [scopeKey]);
    const stagePriceBatch = (changes: PriceChangeInput[], source: string) => {
        if (!changes.length) throw new Error('No products need this price change in the current page or selection.');
        setBatchFailures([]); setPriceBatch({ changes, source });
    };
    const stageDiscount = (percent: number) => stagePriceBatch(products.filter(p => selectedIds.has(p.id)).map(product => ({
        product, proposal: discountedProposal(product, percent),
    })), `Bulk ${percent}% discount`);
    const stageEnding = (target: '5' | '0') => {
        const targetProducts = selectedIds.size ? products.filter(p => selectedIds.has(p.id)) : products;
        const changes = targetProducts.flatMap(product => {
            const current = Math.round(product.price);
            const price = target === '5' ? (current % 10 === 5 ? current : Math.floor((current - 1) / 10) * 10 + 5) : Math.floor((current - 1) / 10) * 10;
            return price > 0 && price !== current ? [{ product, proposal: { price, costPrice: product.costPrice, salePrice: product.salePrice, isOnSale: product.isOnSale } }] : [];
        });
        stagePriceBatch(changes, `Prices ending in ${target}`);
    };
    const confirmPriceBatch = async () => {
        if (!priceBatch) return;
        setIsSubmitting(true);
        try {
            const result = await submit(priceBatch.changes, priceBatch.source);
            setSelectedIds(new Set([...selectedIds].filter(id => !result.submittedIds.includes(id))));
            setBatchFailures(result.failures);
            setPriceBatch(result.failures.length ? { ...priceBatch, changes: priceBatch.changes.filter(change => result.failures.some(failure => failure.productId === change.product.id)) } : null);
        } finally { setIsSubmitting(false); }
    };
    return { priceBatch, batchFailures, stagePriceBatch, stageDiscount, stageEnding, confirmPriceBatch, cancelPriceBatch: () => setPriceBatch(null) };
}
