import React from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, RefreshCw } from 'lucide-react';
import { useApprovalInbox } from '../hooks/useApprovalInbox';
import { APPROVAL_QUEUES, approvalSummaryLabel } from '../utils/unifiedApprovalInbox';
export default function Approvals() {
  const query = useApprovalInbox();
  const queues = [...(query.data?.queues || [])].sort((a,b) => (b.count || 0)-(a.count || 0));
  return <div className="space-y-5 max-w-5xl mx-auto">
    <header className="flex flex-wrap items-center justify-between gap-3"><div>
      <h1 className="text-2xl font-semibold text-[var(--theme-text-primary)] flex items-center gap-2"><ClipboardCheck aria-hidden="true" />Your approval inbox</h1>
      <p className="text-sm text-[var(--theme-text-secondary)] mt-1">Your next review steps across departments, within your authorized country and region.</p>
    </div><button type="button" onClick={() => query.refetch()} disabled={query.isFetching || !query.enabled} className="min-h-11 rounded-xl border border-[var(--theme-border)] px-4 inline-flex items-center gap-2 disabled:opacity-50"><RefreshCw size={16} />Refresh</button></header>
    {!query.enabled && <p>No approval queues are assigned to your role.</p>}
    {query.isLoading && query.enabled && <p role="status">Checking your approval queues…</p>}
    {query.isError && <p role="alert">The inbox could not be loaded. Refresh to retry. Pending totals are unavailable.</p>}
    {!query.isError && query.data && <>
      <p role="status" className="text-lg font-semibold">{approvalSummaryLabel(query.data.total,query.data.unavailable)}</p>
      {query.data.unavailable>0 && <p role="alert" className="rounded-xl border border-[var(--theme-border)] p-3 text-sm">Some workflows could not be checked. The total covers available queues only; unavailable queues are listed below.</p>}
      <ul className="grid gap-3 sm:grid-cols-2">{queues.map(q => {
        const config = APPROVAL_QUEUES[q.key];
        if (!config) return null;
        return <li key={q.key} className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-4 space-y-2">
          <p className="text-xs font-semibold text-[var(--theme-text-secondary)]">{config.area}</p>
          <h2 className="font-semibold text-[var(--theme-text-primary)]">{config.label}</h2>
          {q.status === 'unavailable' ? <p className="text-sm" role="status">Unavailable in this environment or for this account. Pending count could not be verified.</p> : <div className="flex items-center justify-between gap-3">
            <p className="text-sm">{q.count} awaiting review</p>
            <Link to={config.href} className="min-h-11 inline-flex items-center rounded-xl border border-[var(--theme-border)] px-4 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]" aria-label={'Review ' + config.label}>Review</Link>
          </div>}
        </li>;
      })}</ul>
      <p className="text-xs text-[var(--theme-text-secondary)]">{query.isFetching ? 'Updating…' : 'Checked ' + new Date(query.data.checkedAt).toLocaleTimeString()} · Counts reflect review steps. A request may need separate departmental decisions; each shelf-layout revision counts once per department.</p>
    </>}
  </div>;
}
