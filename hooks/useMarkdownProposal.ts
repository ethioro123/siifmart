import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Product } from '../types';
import { useProductChanges } from './useProductChanges';
import { markdownPlanningService, type ServerMarkdownPlan } from '../services/markdown-planning.service';

/** Server evidence owns live-product validation, protected cost, expiry and idempotent persistence. */
export function useMarkdownProposal(product:Product|null,country:string,scope:string) {
    const cache=useQueryClient();
    const {pending}=useProductChanges(product,country,1,false);
    const lock=useRef(false),alive=useRef(true);
    useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
    const fingerprint=JSON.stringify(product);
    const current=useRef({fingerprint,scope});current.current={fingerprint,scope};
    const [busy,setBusy]=useState(false);
    const [result,setResult]=useState<{key:string;message:string;saved:boolean}|null>(null);
    const key=`${scope}:${product?.id || ''}`;
    const feedback=result?.key===key ? result : null;
    const send=async(plan:ServerMarkdownPlan,stageIndex:number)=>{
        if(!product || lock.current || feedback?.saved)return;
        lock.current=true;setBusy(true);setResult(null);
        try {
            if(!plan.stages[stageIndex])throw new Error('Select a valid price stage.');
            const check=await pending.refetch();
            if(check.error || !check.data)throw new Error('Pending approvals could not be checked. Try again before submitting.');
            if(!alive.current || current.current.scope!==scope)return;
            if(current.current.fingerprint!==fingerprint)throw new Error('Product changed after planning. Refresh and generate a fresh plan.');
            if(check.data.data.length)throw new Error('This product already has a pending edit. Review it before submitting another.');
            await markdownPlanningService.submit(plan.token,stageIndex);
            if(alive.current)setResult({key,saved:true,message:'Price proposal saved for approval. No schedule has been activated.'});
            cache.invalidateQueries({queryKey:['product_pending_changes',country,product.siteId || product.site_id]});
        }catch(e){if(alive.current)setResult({key,saved:false,message:e && typeof e==='object' && 'message' in e ? String(e.message) : 'Proposal could not be submitted.'});}
        finally{lock.current=false;if(alive.current)setBusy(false);}
    };
    const refresh=async()=>{const check=await pending.refetch();if(!check.error && check.data && !check.data.data.length)setResult(null);};
    return {send,busy,pending,feedback,refresh};
}
