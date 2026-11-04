import { useState,useRef,useEffect } from 'react';
import { useCounterReview } from '../../../hooks/useCounterControl';
import { useData } from '../../../contexts/DataContext';
import { useStore } from '../../../contexts/CentralStore';
import { useLanguage } from '../../../contexts/LanguageContext';
export function CounterReviewPanel({onBusyChange}:{onBusyChange?:(busy:boolean)=>void}={}) {
    const { activeSite, effectiveCountry } = useData(); const { user } = useStore(); const { t, currencySymbol } = useLanguage();
    const [notes, setNotes] = useState<Record<string, string>>({});
    const allowed = ['store_manager','assistant_store_manager','head_cashier','shift_supervisor','regional_operations_manager','area_operations_manager','country_operations_director'].includes(user?.role || '');
    const { query, mutation } = useCounterReview(activeSite?.id || '', effectiveCountry || '', user?.id || '', allowed);
    const lock=useRef(false);const [saved,setSaved]=useState<string[]>([]);
    useEffect(()=>{onBusyChange?.(mutation.isPending);},[mutation.isPending,onBusyChange]);
    const decide=async(input:{id:string;type:'shift'|'drop';notes:string})=>{
        if(lock.current||mutation.isPending||saved.includes(input.id))return;
        lock.current=true;
        try{await mutation.mutateAsync(input);setSaved(previous=>[...previous,input.id]);setNotes(previous=>({...previous,[input.id]:''}));}catch{/* Mutation error is shown below. */}finally{lock.current=false;}
    };
    if (!allowed) return null;
    const shifts = (query.data?.shifts || []).filter(row => row.cashier_id !== user?.id);
    const drops = (query.data?.drops || []).filter(row => row.cashier_id !== user?.id);
    return <section className="p-4 border border-[var(--theme-border)] rounded-xl space-y-3 text-[var(--theme-text-primary)]">
        <div className="flex justify-between gap-3"><h2 className="font-semibold">{t('pos.counterReview')}</h2><button type="button" onClick={() => void query.refetch()} className="min-h-11 px-3">{t('pos.counterRefresh')}</button></div>
        {query.isLoading && <p role="status">{t('pos.counterSaving')}</p>}{(query.isError || mutation.isError) && <p role="alert">{t('pos.counterReviewFailed')}</p>}
        {!query.isLoading && !query.isError && !shifts.length && !drops.length && <p>{t('pos.counterReviewEmpty')}</p>}
        {shifts.map(row => <article key={row.id} className="p-3 rounded-lg bg-[var(--theme-bg-subtle)] space-y-2"><p>{row.counter_number} · {row.cashier_name} · {currencySymbol} {Number(row.variance).toLocaleString()}</p>
            {row.ledger_version === 0 && <p role="status">{t('pos.counterLegacyReview')}</p>}<label className="block text-sm">{t('pos.counterReviewNotes')}<textarea maxLength={2000} value={notes[row.id] || ''} onChange={event => setNotes({ ...notes, [row.id]: event.target.value })} className="block w-full p-2 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-lg" /></label>
            <button type="button" disabled={mutation.isPending || saved.includes(row.id) || (notes[row.id] || '').trim().length < 5} onClick={() => void decide({ id: row.id, type: 'shift', notes: notes[row.id] })} className="min-h-11 px-3 rounded-lg bg-[var(--theme-primary)] text-[var(--theme-primary-text)] disabled:opacity-50">{t('pos.counterReviewSubmit')}</button></article>)}
        {drops.map(row => <article key={row.id} className="p-3 rounded-lg bg-[var(--theme-bg-subtle)]"><p>{row.cashier_name} · {row.currency} {Number(row.amount).toLocaleString()} · {row.safe_bag_number}</p><button type="button" disabled={mutation.isPending||saved.includes(row.id)} onClick={() => void decide({ id: row.id, type: 'drop', notes: '' })} className="min-h-11 px-3 rounded-lg border border-[var(--theme-border)]">{t('pos.counterDropApprove')}</button></article>)}
    </section>;
}
