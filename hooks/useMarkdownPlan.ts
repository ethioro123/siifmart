import { useEffect, useRef, useState } from 'react';
import { markdownPlanningService, type ServerMarkdownPlan } from '../services/markdown-planning.service';
export function useMarkdownPlan(signature:string) {
    const current=useRef(signature);current.current=signature;
    const mounted=useRef(true);useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
    const [state,setState]=useState<{signature:string;plan:ServerMarkdownPlan}|null>(null);
    const [busy,setBusy]=useState(false),[error,setError]=useState('');
    const lock=useRef(false);
    const generate=async(productId:string,country:string,deadline:string)=>{
        if(lock.current)return null;
        lock.current=true;setBusy(true);setError('');setState(null);
        const selected=signature;
        try {
            const plan=await markdownPlanningService.generate(productId,country,deadline);
            if(!mounted.current || current.current!==selected)return null;
            setState({signature:selected,plan});return plan;
        }catch(e){if(mounted.current && current.current===selected)setError(e && typeof e==='object' && 'message' in e ? String(e.message) : 'Plan could not be generated.');return null;}
        finally{lock.current=false;if(mounted.current)setBusy(false);}
    };
    return {plan:state?.signature===signature ? state.plan : null,busy,error,generate,clear:()=>{setState(null);setError('');}};
}
