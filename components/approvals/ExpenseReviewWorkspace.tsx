import React, { useState } from 'react';
import { useStore } from '../../contexts/CentralStore';
import { useData } from '../../contexts/DataContext';
import { useExpenseReviewWorkspace } from '../../hooks/useExpenseReviewWorkspace';
export function ExpenseReviewWorkspace({ initialOpen = false }: { initialOpen?: boolean } = {}) {
  const { user } = useStore();
  const { effectiveCountry, activeSite } = useData();
  if (!user?.id || !user.name || !effectiveCountry || !activeSite?.id) return null;
  return <ExpensePanel key={`${user.id}:${user.role}:${effectiveCountry}:${activeSite.id}`} initialOpen={initialOpen} scope={{ actor: user.id, name: user.name, role: user.role, country: effectiveCountry, site: activeSite.id }} siteName={activeSite.name} />;
}
function ExpensePanel({ scope, siteName, initialOpen }: { scope: { actor: string; name: string; role: string; country: string; site: string }; siteName: string; initialOpen: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  const [page, setPage] = useState(1);
  const [id, setId] = useState('');
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState('');
  const { list, decision } = useExpenseReviewWorkspace(scope, page, open);
  const selected = !list.isError && list.data?.data.find(row => row.id === id);
  const own = selected && (selected.createdById === scope.actor || selected.createdByName?.trim().toLowerCase() === scope.name.trim().toLowerCase());
  const button = 'min-h-11 px-4 border border-[var(--theme-border)] rounded-[10px] text-sm focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]';
  const select = (value: string) => { setId(value); setReason(''); setNotice(''); decision.reset(); };
  const decide = async (action: 'approve' | 'reject') => {
    try { const saved = await decision.mutateAsync({ id, action, reason }); setNotice(`Expense ${saved.status.toLowerCase()}.`); setId(''); setReason(''); }
    catch { /* Preserve entered reason on failure. */ }
  };
  return <section aria-labelledby="expense-review-title" className="border-t border-[var(--theme-border)] pt-4 space-y-4">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="expense-review-title" className="text-lg font-semibold">Expense reviews</h2><p className="text-sm text-[var(--theme-text-secondary)]">{siteName} · Pending operating expenses. Server authority determines which decisions you may record.</p></div>
      <button type="button" disabled={decision.isPending} className={button} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Close expenses' : 'Open expense reviews'}</button></header>
    {open && <>
      <button type="button" className={button} disabled={list.isFetching || decision.isPending} onClick={() => list.refetch()}>Refresh expenses</button>
      {list.isPending && <p role="status">Loading expenses…</p>}
      {list.isError && <p role="alert">Expenses could not be loaded. Refresh to retry.</p>}
      {notice && <p role="status">{notice}</p>}
      {decision.isError && <p role="alert" className="text-[var(--theme-status-danger-text)]">{decision.error.message}</p>}
      {!list.isError && list.data && <div className="grid gap-4 lg:grid-cols-2"><div>
        <ul aria-label="Pending expenses" className="divide-y divide-[var(--theme-border)]">{list.data.data.map(expense => <li key={expense.id}><button type="button" disabled={decision.isPending} aria-pressed={id === expense.id} onClick={() => select(expense.id)} className={`w-full min-h-14 p-3 text-left rounded-[10px] focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${id === expense.id ? 'bg-[var(--theme-bg-subtle)]' : ''}`}><span className="block font-semibold break-words">{expense.description}</span><span className="text-sm">{scope.country === 'KE' ? 'KES' : 'ETB'} {expense.amount.toLocaleString()} · {expense.date}</span></button></li>)}</ul>
        {!list.data.data.length && <p role="status">No pending expenses on this page.</p>}
        <nav aria-label="Expense pages" className="flex items-center gap-3 py-3"><button type="button" className={button} disabled={page === 1 || decision.isPending || list.isFetching} onClick={() => { setPage(page - 1); select(''); }}>Previous</button><span>Page {page}</span><button type="button" className={button} disabled={page * 25 >= list.data.count || decision.isPending || list.isFetching} onClick={() => { setPage(page + 1); select(''); }}>Next</button></nav>
        </div><section aria-label="Expense evidence" className="border border-[var(--theme-border)] rounded-[14px] p-4 space-y-3">
          {!selected ? <p>Select an expense to inspect its evidence.</p> : <><h3 className="font-semibold break-words">{selected.description}</h3><p>Category: {selected.category}</p><p>Recorded by: {selected.createdByName || 'Not recorded'}</p><p>Amount: {scope.country === 'KE' ? 'KES' : 'ETB'} {selected.amount.toLocaleString()}</p><p>Status: {selected.status}</p>
            {own ? <p role="status">You cannot review your own expense.</p> : <><label className="block text-sm">Expense decision reason<textarea value={reason} disabled={decision.isPending} onChange={e => setReason(e.target.value)} className="mt-2 w-full min-h-24 p-3 rounded-[10px] border border-[var(--theme-border)] bg-[var(--theme-bg-card)] text-base" /></label>
              <div className="flex flex-wrap gap-3"><button type="button" className={button} disabled={!reason.trim() || decision.isPending || list.isFetching} onClick={() => decide('approve')}>{decision.isPending ? 'Saving…' : 'Approve expense'}</button><button type="button" className={button} disabled={!reason.trim() || decision.isPending || list.isFetching} onClick={() => decide('reject')}>Reject expense</button></div></>}
          </>}
        </section></div>}
    </>}
  </section>;
}
