import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { useRequisitionReviewWorkspace } from '../../hooks/useRequisitionReviewWorkspace';
import { PURCHASE_REQUEST_REVIEWERS } from '../../utils/procurementScope';

export function RequisitionReviewWorkspace() {
  const { user } = useStore();
  const { effectiveCountry, activeSite } = useData();
  if (!user?.id || !effectiveCountry || !activeSite?.id || !PURCHASE_REQUEST_REVIEWERS.includes(user.role)) return null;
  const scope = { actor: user.id, country: effectiveCountry, site: activeSite.id };
  return <RequisitionPanel key={`${scope.actor}:${user.role}:${scope.country}:${scope.site}`} scope={scope} siteName={activeSite.name} />;
}
function RequisitionPanel({ scope, siteName }: { scope: { actor: string; country: string; site: string }; siteName: string }) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [id, setId] = useState('');
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState('');
  const { list, detail, decision } = useRequisitionReviewWorkspace(scope, page, id, open);
  const request = !detail.isError ? detail.data : undefined;
  const own = request?.requester_employee_id === scope.actor;
  const busy = decision.isPending;
  const select = (next: string) => { setId(next); setReason(''); setNotice(''); decision.reset(); };
  const review = async (value: 'Approved' | 'Rejected') => {
    setNotice('');
    try {
      const saved = await decision.mutateAsync({ decision: value, reason });
      setNotice(`${saved.request_number}: ${saved.status.toLowerCase()}.`);
      setId(''); setReason('');
    } catch { /* Retain the entered reason and show the mutation error. */ }
  };
  return <section aria-labelledby="requisition-review-title" className="border-t border-[var(--theme-border)] pt-4 space-y-4">
    <header className="flex flex-wrap justify-between items-center gap-3"><div><h2 id="requisition-review-title" className="text-lg font-semibold">Purchase request reviews</h2><p className="text-sm text-[var(--theme-text-secondary)]">{siteName} · Review sourcing requests and item evidence.</p></div>
      <button type="button" disabled={busy} aria-expanded={open} onClick={() => setOpen(!open)} className="min-h-11 border border-[var(--theme-border)] rounded-[10px] px-4">{open ? 'Close purchase requests' : 'Open purchase requests'}</button></header>
    {open && <>
      {notice && <p role="status">{notice}</p>}
      {decision.isError && <p role="alert" className="text-[var(--theme-status-danger-text)]">{decision.error.message}</p>}
      {list.isLoading && <p role="status">Loading purchase requests…</p>}
      {list.isError && <p role="alert">Purchase requests could not be loaded. <button type="button" className="min-h-11 underline" onClick={() => list.refetch()}>Retry</button></p>}
      {!list.isError && list.data && <div className="grid lg:grid-cols-2 gap-4">
        <div><ul aria-label="Purchase requests" className="divide-y divide-[var(--theme-border)]">{list.data.map(row => <li key={row.id}><button type="button" disabled={busy} aria-pressed={id === row.id} onClick={() => select(row.id)} className={`w-full text-left p-3 min-h-14 rounded-[10px] focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${id === row.id ? 'bg-[var(--theme-bg-subtle)]' : ''}`}>
          <span className="block font-semibold break-words">{row.request_number} · {row.title}</span><span className="block text-sm text-[var(--theme-text-secondary)]">{row.requester_name} · {new Date(row.created_at).toLocaleDateString()}</span></button></li>)}</ul>
          {list.data.length === 0 && <p role="status">No pending purchase requests on this page.</p>}
          <nav aria-label="Purchase request pages" className="flex gap-3 items-center py-3"><button type="button" disabled={page === 1 || busy} onClick={() => { setPage(page - 1); select(''); }} className="min-h-11 border rounded-[10px] px-3">Previous</button><span>Page {page}</span><button type="button" disabled={list.data.length < 25 || busy} onClick={() => { setPage(page + 1); select(''); }} className="min-h-11 border rounded-[10px] px-3">Next</button></nav>
        </div>
        <section aria-label="Purchase request evidence" className="border border-[var(--theme-border)] rounded-[14px] p-4 space-y-3">
          {!id && <p>Select a purchase request to review its items.</p>}
          {id && detail.isFetching && <p role="status">Checking current evidence…</p>}
          {id && detail.isError && <p role="alert">Evidence could not be loaded. <button type="button" className="min-h-11 underline" onClick={() => detail.refetch()}>Retry evidence</button></p>}
          {id && request && <><h3 className="font-semibold">{request.request_number} · {request.title}</h3><p className="text-sm">{request.business_reason}</p><p className="text-sm">Status: {request.status}</p>
            <ul aria-label="Requested items" className="divide-y divide-[var(--theme-border)]">{request.items.map((item, index) => <li key={index} className="py-2 text-sm break-words"><span className="font-semibold">{item.product_name}</span> · {item.sku || 'SKU not recorded'}<br />Quantity: {item.quantity}{item.unit_cost !== undefined && <> · Unit cost: {request.currency} {item.unit_cost.toLocaleString()}</>}</li>)}</ul>
            <p className="text-sm font-semibold">Estimated total: {request.currency} {request.estimated_total.toLocaleString()}</p>
            {own && <p role="status">You cannot review your own request.</p>}
            {!own && request.status === 'Submitted' && <><label className="block text-sm">Decision reason<textarea disabled={busy} value={reason} onChange={e => setReason(e.target.value)} className="block mt-2 w-full min-h-24 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-[10px] p-3 text-base" /></label>
              <p className="text-sm text-[var(--theme-text-secondary)]">A reason is required when rejecting.</p><div className="flex flex-wrap gap-3"><button type="button" disabled={busy || detail.isFetching} onClick={() => review('Approved')} className="min-h-11 px-4 rounded-[10px] bg-[var(--theme-primary)] text-[var(--theme-primary-text)]">{busy ? 'Saving…' : 'Approve purchase request'}</button><button type="button" disabled={busy || detail.isFetching || !reason.trim()} onClick={() => review('Rejected')} className="min-h-11 px-4 border border-[var(--theme-status-danger-border)] text-[var(--theme-status-danger-text)] rounded-[10px]">Reject purchase request</button></div></>}
          </>}
        </section>
      </div>}
    </>}
  </section>;
}
