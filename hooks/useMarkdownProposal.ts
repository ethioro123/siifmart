import { useEffect, useRef, useState } from 'react';
import type { Product } from '../types';
import { useProductChanges } from './useProductChanges';
import { useSubmitPriceChanges } from './useSubmitPriceChanges';
import { validateTargetExitDate } from '../utils/markdownGlidePath';

/** The existing request mutation owns persistence and server approval enforcement. */
export function useMarkdownProposal(product: Product | null, country: string, scope: string) {
    const { submit } = useSubmitPriceChanges(country);
    // Only pending requests are needed; defer audit and price history until explicitly opened elsewhere.
    const { pending } = useProductChanges(product, country, 1, false);
    const lock = useRef(false);
    const alive = useRef(true);
    useEffect(()=>{alive.current=true;return ()=>{alive.current=false;};},[]);
    const current = useRef({ id: product?.id, scope });
    current.current = { id: product?.id, scope };
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState<{key:string; message:string; saved:boolean} | null>(null);
    const key = `${scope}:${product?.id || ''}`;
    const feedback = result?.key === key ? result : null;
    const send = async (price: number, deadline: string) => {
        if (!product || lock.current || feedback?.saved) return;
        lock.current = true; setBusy(true); setResult(null);
        const selectedKey = key;
        try {
            if (!validateTargetExitDate(deadline).isValid) throw new Error('The deadline is no longer valid. Generate a new plan.');
            if (!Number.isInteger(price) || price <= 0 || price >= (product.isOnSale ? product.salePrice || product.price : product.price)) throw new Error('Choose a stage below the current selling price.');
            const check = await pending.refetch();
            if (check.error || !check.data) throw new Error('Pending approvals could not be checked. Try again before submitting.');
            if (!alive.current || current.current.id !== product.id || current.current.scope !== scope) return;
            if (check.data.data.length) throw new Error('This product already has a pending edit. Review it before submitting another.');
            const response = await submit([{product,proposal:{price:product.price,costPrice:product.costPrice,isOnSale:true,salePrice:price}}],
                `Clearance proposal: price ${price}; planning deadline ${deadline}. Only this price is proposed; later stages are not scheduled.`);
            const saved = response.submitted === 1;
            setResult({key:selectedKey,saved,message:saved ? 'Price proposal saved for approval. No schedule has been activated.' : response.failures[0]?.message || 'Proposal was not saved. Try again.'});
        } catch (error) {
            setResult({key:selectedKey,saved:false,message:error instanceof Error ? error.message : 'Proposal could not be submitted.'});
        } finally { lock.current=false; setBusy(false); }
    };
    return {send,busy,pending,feedback};
}
