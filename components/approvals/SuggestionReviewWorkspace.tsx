import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { useSuggestionReviewWorkspace } from '../../hooks/useSuggestionReviewWorkspace';
import type { ProductSuggestionStatus } from '../../types/productSuggestion';
export default function SuggestionReviewWorkspace() {
 const { user } = useStore(); const { effectiveCountry, activeSite } = useData();
 if (!user?.id || !effectiveCountry || !activeSite?.id) return null;
 return <Panel key={`${user.id}:${user.role}:${effectiveCountry}:${activeSite.id}`} scope={{ actor: user.id, country: effectiveCountry, site: activeSite.id }} />;
}
function Panel({ scope }: { scope: { actor: string; country: string; site: string } }) {
 const [page, setPage] = useState(1); const [id, setId] = useState(''); const [note, setNote] = useState(''); const [status, setStatus] = useState<ProductSuggestionStatus>('Under Review'); const [notice, setNotice] = useState('');
 const { list, decision } = useSuggestionReviewWorkspace(scope, page); const request = !list.isError ? list.data?.find(row => row.id === id) : undefined;
 const button = 'min-h-11 px-4 border border-[var(--theme-border)] rounded-[10px] text-sm focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]';
 const save = async () => { try { const result = await decision.mutateAsync({ id, status, note }); setNotice(`Suggestion: ${result.status}.`); setId(''); setNote(''); } catch { /* retain decision notes */ } };
 return <section aria-label="Product suggestion review" className="space-y-4">
  <p className="text-sm text-[var(--theme-text-secondary)]">Review sourcing suggestions for the active site. Acceptance does not create or activate a catalog product.</p>
  {notice && <p role="status">{notice}</p>}{decision.isError && <p role="alert">{decision.error.message}</p>}
  {list.isPending && <p role="status">Loading suggestions…</p>}{list.isError && <p role="alert">Suggestions unavailable. <button type="button" className={button} onClick={() => list.refetch()}>Retry</button></p>}
  {!list.isError && list.data && <div className="grid gap-4 lg:grid-cols-2"><div><ul aria-label="Sourcing suggestions" className="divide-y divide-[var(--theme-border)]">{list.data.map(row => <li key={row.id}><button type="button" disabled={decision.isPending} aria-pressed={row.id === id} className={`w-full text-left min-h-14 p-3 rounded-[10px] ${row.id === id ? 'bg-[var(--theme-bg-subtle)]' : ''}`} onClick={() => { setId(row.id); setNote(''); setStatus('Under Review'); setNotice(''); decision.reset(); }}><span className="block font-semibold">{row.product_name}</span><span className="text-sm">{row.status} · {new Date(row.created_at).toLocaleDateString()}</span></button></li>)}</ul>
   {!list.data.length && <p role="status">No pending suggestions on this page.</p>}
   <nav className="flex gap-3 items-center py-3" aria-label="Suggestion pages"><button type="button" className={button} disabled={page === 1 || decision.isPending || list.isFetching} onClick={() => { setPage(page - 1); setId(''); }}>Previous</button><span>Page {page}</span><button type="button" className={button} disabled={list.data.length < 25 || decision.isPending || list.isFetching} onClick={() => { setPage(page + 1); setId(''); }}>Next</button></nav>
  </div><section aria-label="Suggestion evidence" className="space-y-3 p-4 border border-[var(--theme-border)] rounded-[14px]">
   {!request ? <p>Select a sourcing suggestion.</p> : <><h3 className="font-semibold">{request.product_name}</h3><p>Category: {request.category || 'Not recorded'}</p><p>Brand/example: {request.brand_or_example || 'Not recorded'}</p><p className="break-words">{request.product_details}</p><p>Demand: {request.demand_signal}</p><p>Customer request count: {request.customer_request_count ?? 'Not recorded'}</p>
    {request.submitter_employee_id === scope.actor ? <p role="status">An independent reviewer is required.</p> : <>
     <label className="block text-sm">Decision<select value={status} disabled={decision.isPending} onChange={e => setStatus(e.target.value as ProductSuggestionStatus)} className="block mt-2 min-h-11 border border-[var(--theme-border)] rounded-[10px] bg-[var(--theme-bg-card)] px-3">{(['Under Review','Accepted for Sourcing','Duplicate','Declined'] as const).map(value => <option key={value}>{value}</option>)}</select></label>
     <label className="block text-sm">Decision note<textarea disabled={decision.isPending} className="block w-full mt-2 min-h-24 p-3 border border-[var(--theme-border)] rounded-[10px] bg-[var(--theme-bg-card)] text-base" value={note} onChange={e => setNote(e.target.value)} /></label>
     <button type="button" className={button} disabled={decision.isPending || list.isFetching || (['Declined','Duplicate'].includes(status) && note.trim().length < 3)} onClick={save}>{decision.isPending ? 'Saving…' : 'Save sourcing decision'}</button>
    </>}
   </>}
  </section></div>}
 </section>;
}
