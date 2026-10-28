import React from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, RefreshCw } from 'lucide-react';
import { useProductApprovalInbox } from '../../hooks/useProductApprovalInbox';
import { productApprovalLink } from '../../utils/approvalInbox';
const labels = { planogram: 'Shelf layout', price: 'Price change', product: 'Product change' };

export function ProductApprovalInboxCard() {
  const query = useProductApprovalInbox();
  if (!query.enabled) return null;
  return <section aria-labelledby="regional-product-approvals-title" className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-4 sm:p-5 space-y-4">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3"><ClipboardCheck aria-hidden="true" className="mt-1 text-[var(--theme-accent)]" size={22} />
        <div><h2 id="regional-product-approvals-title" className="font-semibold text-[var(--theme-text-primary)]">Product approvals awaiting you</h2>
          <p className="text-sm text-[var(--theme-text-secondary)]">Product, price and shelf-layout requests needing your departmental vote.</p>
        </div></div>
      <button type="button" aria-label="Refresh product approval inbox" disabled={query.isFetching} onClick={() => query.refetch()}
        className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl border border-[var(--theme-border)] px-3 focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] disabled:opacity-50"><RefreshCw size={16} /></button>
    </header>
    {query.isLoading && <p role="status" className="text-sm text-[var(--theme-text-secondary)]">Checking requests that need your approval…</p>}
    {query.isError && <div role="alert" className="text-sm text-[var(--theme-status-danger-text)]">The approval inbox could not be loaded. Use Refresh to try again.</div>}
    {!query.isError && query.data && <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-lg font-semibold text-[var(--theme-text-primary)]">{query.data.total} request{query.data.total === 1 ? '' : 's'} awaiting your review</p>
        <Link to={productApprovalLink()} className="min-h-11 inline-flex items-center rounded-xl bg-[var(--theme-accent)] px-4 text-sm font-semibold text-[var(--theme-btn-primary-text)] focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">Open approval queue</Link>
      </div>
      {query.data.total === 0 ? <p className="text-sm text-[var(--theme-text-secondary)]">No product, price or shelf-layout requests are awaiting your vote.</p>
        : <ul className="divide-y divide-[var(--theme-border)]">{query.data.items.map(item => <li key={item.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0"><p className="text-xs font-semibold text-[var(--theme-accent)]">{labels[item.kind]}</p>
            <p className="break-words font-medium text-[var(--theme-text-primary)]">{item.title}</p>
            <p className="text-sm text-[var(--theme-text-secondary)]">{item.siteName} · {item.requester} · {new Date(item.submittedAt).toLocaleDateString()}</p>
          </div>
          <Link to={productApprovalLink(item)} aria-label={'Review ' + item.title} className="min-h-11 inline-flex items-center rounded-xl border border-[var(--theme-border)] px-4 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">Review</Link>
        </li>)}</ul>}
      {query.data.total > query.data.items.length && <p className="text-sm text-[var(--theme-text-secondary)]">Showing the {query.data.items.length} oldest requests. Open the queue to see all.</p>}
      <p className="text-xs text-[var(--theme-text-secondary)]">{query.isFetching ? 'Updating approvals…' : 'Checked ' + new Date(query.dataUpdatedAt).toLocaleTimeString()} · Requests you created or already voted on are excluded. Each shelf revision is counted once.</p>
    </>}
  </section>;
}
