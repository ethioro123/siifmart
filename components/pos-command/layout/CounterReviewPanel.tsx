import { useState } from 'react';
import { useCounterReview } from '../../../hooks/useCounterControl';
import { useData } from '../../../contexts/DataContext';
import { useStore } from '../../../contexts/CentralStore';
import { useLanguage } from '../../../contexts/LanguageContext';
export function CounterReviewPanel() {
    const { activeSite, effectiveCountry } = useData(); const { user } = useStore(); const { t, currencySymbol } = useLanguage();
    const [notes, setNotes] = useState<Record<string, string>>({});
    const allowed = ['store_manager','assistant_store_manager','head_cashier','shift_supervisor','regional_operations_manager','area_operations_manager','country_operations_director'].includes(user?.role || '');
    const { query, mutation } = useCounterReview(activeSite?.id || '', effectiveCountry || '', user?.id || '', allowed);
    if (!allowed) return null;
    const shifts = (query.data?.shifts || []).filter(row => row.cashier_id !== user?.id);
    const drops = (query.data?.drops || []).filter(row => row.cashier_id !== user?.id);
    return <section className="p-4 border border-[var(--theme-border)] rounded-xl space-y-3 text-[var(--theme-text-primary)]">
        <div className="flex justify-between gap-3"><h2 className="font-semibold">{t('pos.counterReview')}</h2><button type="button" onClick={() => void query.refetch()} className="min-h-11 px-3">{t('pos.counterRefresh')}</button></div>
        {query.isLoading && <p role="status">{t('pos.counterSaving')}</p>}{(query.isError || mutation.isError) && <p role="alert">{t('pos.counterReviewFailed')}</p>}
        {!query.isLoading && !query.isError && !shifts.length && !drops.length && <p>{t('pos.counterReviewEmpty')}</p>}
        {shifts.map(row => <article key={row.id} className="p-3 rounded-lg bg-[var(--theme-bg-subtle)] space-y-2"><p>{row.counter_number} · {row.cashier_name} · {currencySymbol} {Number(row.variance).toLocaleString()}</p>
            <label className="block text-sm">{t('pos.counterReviewNotes')}<textarea maxLength={2000} value={notes[row.id] || ''} onChange={event => setNotes({ ...notes, [row.id]: event.target.value })} className="block w-full p-2 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-lg" /></label>
            <button type="button" disabled={mutation.isPending || (notes[row.id] || '').trim().length < 5} onClick={() => mutation.mutate({ id: row.id, type: 'shift', notes: notes[row.id] })} className="min-h-11 px-3 rounded-lg bg-[var(--theme-primary)] text-[var(--theme-primary-text)] disabled:opacity-50">{t('pos.counterReviewSubmit')}</button></article>)}
        {drops.map(row => <article key={row.id} className="p-3 rounded-lg bg-[var(--theme-bg-subtle)]"><p>{row.cashier_name} · {row.currency} {Number(row.amount).toLocaleString()} · {row.safe_bag_number}</p><button type="button" disabled={mutation.isPending} onClick={() => mutation.mutate({ id: row.id, type: 'drop', notes: '' })} className="min-h-11 px-3 rounded-lg border border-[var(--theme-border)]">{t('pos.counterDropApprove')}</button></article>)}
    </section>;
}
