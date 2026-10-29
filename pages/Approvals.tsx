import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, RefreshCw, Search, ArrowRight } from 'lucide-react';
import { useApprovalInbox } from '../hooks/useApprovalInbox';
import { APPROVAL_QUEUES, approvalSummaryLabel } from '../utils/unifiedApprovalInbox';
import type { ApprovalReviewType } from '../types/unifiedApprovalInbox';
import { ApprovalWorkspace } from '../components/approvals/ApprovalWorkspace';

export default function Approvals() {
  const query = useApprovalInbox(true);
  const [filter, setFilter] = useState<'all' | ApprovalReviewType>('all');
  const [search, setSearch] = useState('');
  const [area, setArea] = useState('all');
  const [showEmpty, setShowEmpty] = useState(false);
  const queues = query.data?.queues || [];
  const areas = [...new Set(queues.map(q => APPROVAL_QUEUES[q.key]?.area).filter(Boolean))].sort();
  const groups = useMemo(() => {
    const result = new Map<string, typeof queues>();
    for (const queue of queues) {
      const config = APPROVAL_QUEUES[queue.key];
      if (!config || (filter !== 'all' && config.reviewType !== filter)) continue;
      if (area !== 'all' && config.area !== area) continue;
      if (!showEmpty && queue.status === 'ready' && queue.count === 0) continue;
      if (!`${config.label} ${config.area}`.toLowerCase().includes(search.trim().toLowerCase())) continue;
      const group = result.get(config.area) || [];
      group.push(queue);
      result.set(config.area, group);
    }
    return [...result].sort(([a], [b]) => a.localeCompare(b)).map(([name, items]) => ({ name,
      items: items.sort((a, b) => (b.count || 0) - (a.count || 0)) }));
  }, [queues, filter, area, showEmpty, search]);
  return <main className="mx-auto max-w-6xl space-y-6 pb-8">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="text-2xl font-semibold text-[var(--theme-text-primary)] flex items-center gap-2">
        <ClipboardCheck aria-hidden="true" size={24} /> Approvals</h1>
        <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">Review work across departments within your authorized country and site scope.</p></div>
      <button type="button" disabled={query.isFetching || !query.enabled} onClick={() => query.refetch()}
        className="min-h-11 inline-flex items-center gap-2 rounded-[10px] border border-[var(--theme-border)] px-4 text-sm focus-visible:outline-2 focus-visible:outline-[var(--theme-accent)]">
        <RefreshCw size={18} aria-hidden="true" className={query.isFetching ? 'animate-spin motion-reduce:animate-none' : ''} />Refresh</button>
    </header>
    {!query.enabled && <p>No approval queues are assigned to your role.</p>}
    {query.isLoading && query.enabled && <p role="status">Checking your approval queues…</p>}
    {query.isError && <p role="alert" className="text-[var(--theme-status-danger-text)]">Approval queues could not be loaded. Refresh to retry; pending totals are unavailable.</p>}
    {!query.isError && query.data && <>
      <p role="status" className="text-lg font-semibold">{approvalSummaryLabel(query.data.total, query.data.unavailable)}</p>
      <section aria-label="Filter approval queues" className="flex flex-wrap gap-3 items-center">
        <label className="flex flex-1 min-w-48 items-center gap-2 rounded-[10px] border border-[var(--theme-border)] px-3">
          <Search size={18} aria-hidden="true" /><span className="sr-only">Search approval types</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search approval types" className="w-full min-h-11 bg-transparent text-base outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]" /></label>
        <label><span className="sr-only">Department</span><select value={area} onChange={e => setArea(e.target.value)} className="min-h-11 rounded-[10px] bg-[var(--theme-bg-card)] border border-[var(--theme-border)] px-3 text-sm">
          <option value="all">All departments</option>{areas.map(name => <option key={name}>{name}</option>)}</select></label>
        <label><span className="sr-only">Decision stage</span><select value={filter} onChange={e => setFilter(e.target.value as typeof filter)} className="min-h-11 rounded-[10px] bg-[var(--theme-bg-card)] border border-[var(--theme-border)] px-3 text-sm">
          <option value="all">All decision stages</option><option value="specialist_clearance">Specialist clearance</option><option value="final_line_approval">Final approval</option></select></label>
        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={showEmpty} onChange={e => setShowEmpty(e.target.checked)} />Include empty queues</label>
      </section>
      {query.data.unavailable > 0 && <p role="alert" className="text-sm text-[var(--theme-status-warning-text)]">Some queues are unavailable. The total includes only verified queues.</p>}
      {groups.length === 0 && <p role="status" className="py-8 text-[var(--theme-text-secondary)]">No approval queues match these filters.</p>}
      <div className="space-y-6">{groups.map(group => <section key={group.name} aria-label={group.name}>
        <h2 className="mb-2 text-base font-semibold">{group.name}</h2>
        <ul className="divide-y divide-[var(--theme-border)] rounded-[14px] border border-[var(--theme-border)] bg-[var(--theme-bg-card)]">{group.items.map(q => {
          const config = APPROVAL_QUEUES[q.key];
          return <li key={q.key} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1"><h3 className="text-sm font-semibold">{config.label}</h3>
              <p className="text-sm text-[var(--theme-text-secondary)]">{config.reviewType === 'specialist_clearance' ? 'Specialist clearance' : 'Final approval'}</p></div>
            {q.status === 'unavailable' ? <span role="status" className="text-sm">Count unavailable</span> : <span className="text-sm tabular-nums">{q.count} awaiting review</span>}
            <Link to={config.href} aria-label={'Review ' + config.label} className="min-h-11 inline-flex items-center gap-2 rounded-[10px] border border-[var(--theme-border)] px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-[var(--theme-accent)]">Review<ArrowRight size={18} aria-hidden="true" /></Link>
          </li>;
        })}</ul></section>)}</div>
      <p className="text-xs text-[var(--theme-text-secondary)]">{query.isFetching ? 'Updating…' : 'Checked ' + new Date(query.data.checkedAt).toLocaleTimeString()} · Counts represent decision stages. A request can require more than one independent sign-off.</p>
      <ApprovalWorkspace />
      <section aria-label="Additional review workflows" className="border-t border-[var(--theme-border)] pt-4 space-y-2">
        <h2 className="text-base font-semibold">Additional review workflows</h2>
        <p className="text-sm text-[var(--theme-text-secondary)]">These workflows are not included in the inbox total. Access is checked by the destination.</p>
        <div className="flex flex-wrap gap-3"><Link className="min-h-11 inline-flex items-center underline text-sm" to="/inventory?tab=barcode_audit">Barcode requests and evidence</Link>
          <Link className="min-h-11 inline-flex items-center underline text-sm" to="/employees">Employee photo reviews</Link></div>
      </section>
    </>}
  </main>;
}
