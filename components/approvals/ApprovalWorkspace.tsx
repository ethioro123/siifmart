import { ProposalReviewModal } from '../merchandising/components/ProposalReviewModal';
import { ProposalDiffView } from '../merchandising/components/ProposalDiffView';
import { ScopedPriceTargets } from '../merchandising/components/ScopedPriceTargets';
import { ProductEditApprovalProgress } from '../inventory/ProductEditApprovalProgress';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApprovalWorkspace, type WorkspaceQueue } from '../../hooks/useApprovalWorkspace';
import { proposalApprovalBlock } from '../../utils/proposalReviewPolicy';

export function ApprovalWorkspace({ initialQueue = 'product', initialOpen = false }: { initialQueue?: WorkspaceQueue; initialOpen?: boolean } = {}) {
  const [open, setOpen] = useState(initialOpen);
  const [queue, setQueue] = useState<WorkspaceQueue>(initialQueue);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState('');
  const [reason, setReason] = useState('');
  const [result, setResult] = useState('');
  const [scopeReview, setScopeReview] = useState(false);
  const { records, decision, user, site, country, employees } = useApprovalWorkspace(queue, page, open);
  const selected = records.data?.data.find(row => row.id === selectedId);
  const product = records.data?.kind === 'product' ? records.data.data.find(row => row.id === selectedId) : undefined;
  const barcode = records.data?.kind === 'barcode' ? records.data.data.find(row => row.id === selectedId) : undefined;
  const inventory = records.data?.kind === 'inventory' ? records.data.data.find(row => row.id === selectedId) : undefined;
  const block = product ? proposalApprovalBlock(product, user) : barcode && barcode.createdBy === user?.id ? 'You cannot review your own request.' : undefined;
  const barcodeReviewer = ['group_ceo','country_managing_director','store_manager','warehouse_manager','country_operations_director','regional_operations_manager'].includes(user?.role || '');
  const canDecide = !!selected && !block && (queue === 'product' ? true : queue === 'barcode' && barcodeReviewer);
  const changeQueue = (value: WorkspaceQueue) => { setQueue(value); setPage(1); setSelectedId(''); setReason(''); setResult(''); decision.reset(); };
  const decide = async (action: 'approve' | 'reject' | 'finance') => {
    if (!selected || !(canDecide || (action === 'finance' && product?.priceApprovalRoute?.canFinance)) || (action === 'reject' && !reason.trim())) return;
    setResult('');
    try {
      const saved = await decision.mutateAsync({ id: selected.id, action, reason: reason.trim() });
      setResult(action === 'finance' ? 'Finance clearance recorded.' : action === 'reject' ? 'Rejection saved.' : saved?.applied ? 'Approval saved and change applied.' : 'Approval recorded. Additional sign-offs may still be required.');
      setSelectedId(''); setReason(''); setScopeReview(false);
    } catch { /* The mutation error remains visible; keep entered evidence. */ }
  };
  return <section aria-labelledby="workspace-title" className="space-y-4 border-t border-[var(--theme-border)] pt-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="workspace-title" className="text-lg font-semibold">Review requests here</h2>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="min-h-11 rounded-[10px] border border-[var(--theme-border)] px-4">{open ? 'Close request workspace' : 'Open request workspace'}</button></div>
    {open && <>
      <p className="text-sm text-[var(--theme-text-secondary)]">Requests for the active site. Product and price decisions use their existing approval rules. Inventory and complete shelf revisions open their dedicated review.</p>
      <label className="block text-sm">Request type<select aria-label="Request type" disabled={decision.isPending} value={queue} onChange={e => changeQueue(e.target.value as WorkspaceQueue)} className="ml-3 min-h-11 rounded-[10px] border border-[var(--theme-border)] bg-[var(--theme-bg-card)] px-3">
        <option value="product">Product and price</option><option value="inventory">Inventory</option><option value="barcode">Barcode</option></select></label>
      {!site && <p role="status">An active site is required to load request evidence.</p>}
      {records.isLoading && <p role="status">Loading requests…</p>}
      {records.isError && <p role="alert">Requests could not be loaded. <button type="button" className="min-h-11 underline" onClick={() => records.refetch()}>Retry</button></p>}
      {result && <p role="status">{result}</p>}
      {decision.isError && <p role="alert" className="text-[var(--theme-status-danger-text)]">{decision.error.message}</p>}
      {!records.isError && records.data && <div className="grid gap-4 lg:grid-cols-2">
        <div><ul aria-label="Requests" className="divide-y divide-[var(--theme-border)]">{records.data.data.map(row => {
          const label = 'barcode' in row ? row.barcode : row.productName;
          const requester = 'createdBy' in row ? row.createdBy : row.requestedBy;
          const actorLabel = requester && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(requester) ? employees?.find(employee => employee.id === requester)?.name || 'Employee name unavailable' : requester;
          const date = 'createdAt' in row ? row.createdAt : row.requestedAt;
          return <li key={row.id}><button type="button" disabled={decision.isPending} aria-pressed={selectedId === row.id} onClick={() => { setSelectedId(row.id); setReason(''); setResult(''); decision.reset(); }} className={`w-full min-h-14 p-3 text-left rounded-[10px] focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${selectedId === row.id ? 'bg-[var(--theme-bg-subtle)] font-semibold' : ''}`}>
            <span className="block break-words">{label || 'Product request'}</span><span className="block text-sm text-[var(--theme-text-secondary)] break-words">{actorLabel || 'Requester not recorded'} · {date ? new Date(date).toLocaleDateString() : 'Date not recorded'}</span>
          </button></li>;
        })}</ul>{records.data.data.length === 0 && <p role="status">No pending requests in this result page.</p>}
        <div className="flex items-center gap-3 py-3"><button type="button" disabled={page === 1 || decision.isPending} onClick={() => { setPage(page - 1); setSelectedId(''); }} className="min-h-11 px-3 border rounded-[10px]">Previous</button><span>Page {page}</span><button type="button" disabled={(records.data.kind === 'product' ? !records.data.hasMore : records.data.data.length < 25) || decision.isPending} onClick={() => { setPage(page + 1); setSelectedId(''); }} className="min-h-11 px-3 border rounded-[10px]">Next</button></div>
        </div>
        <section aria-label="Request details" className="rounded-[14px] border border-[var(--theme-border)] p-4 space-y-3">
          {!selected ? <p>Select a request to review its evidence.</p> : <>
            <h3 className="font-semibold">{barcode ? 'Barcode mapping request' : product?.productName || inventory?.productName}</h3>
            {barcode && <><p className="break-all">Barcode: {barcode.barcode}</p><p>Product: {barcode.product?.name || 'Name not recorded'}</p><p>SKU: {barcode.product?.sku || 'Not recorded'}</p>{barcode.image_url && <a href={barcode.image_url} target="_blank" rel="noreferrer" className="min-h-11 inline-flex items-center underline">Open evidence photo</a>}</>}
            {product && <><p>{product.adjustmentReason || 'Reason not recorded'}</p>{product.priceApprovalRoute?.targetCount ? <ScopedPriceTargets request={product} country={country} currency={country === 'KE' ? 'KES' : 'ETB'} /> : <ProposalDiffView request={product} currentProduct={product.currentProduct} currencySymbol={country === 'KE' ? 'KES' : 'ETB'} />}<ProductEditApprovalProgress request={product} />{(product.layoutRevisionId || product.layout_revision_id) && <button type="button" className="min-h-11 px-4 border rounded-[10px]" onClick={() => setScopeReview(true)}>Review complete shelf revision</button>}{product.priceApprovalRoute?.canFinance && <button type="button" disabled={decision.isPending || records.isFetching} className="min-h-11 px-4 border rounded-[10px]" onClick={() => decide('finance')}>Record Finance clearance</button>}</>}
            {inventory && <><p>{inventory.adjustmentReason || 'Reason not recorded'}</p><p>Requested quantity: {inventory.adjustmentQty ?? 'Not recorded'}</p></>}
            {block && <p role="status">{block}</p>}
            {canDecide ? <><label className="block text-sm">Rejection reason<textarea value={reason} onChange={e => setReason(e.target.value)} disabled={decision.isPending} className="mt-2 w-full min-h-24 border border-[var(--theme-border)] rounded-[10px] bg-[var(--theme-bg-card)] p-3 text-base" /></label>
              <div className="flex flex-wrap gap-3"><button type="button" disabled={decision.isPending || records.isFetching} onClick={() => product ? setScopeReview(true) : decide('approve')} className="min-h-11 px-4 rounded-[10px] bg-[var(--theme-primary)] text-[var(--theme-primary-text)]">{decision.isPending ? 'Saving…' : 'Approve'}</button><button type="button" disabled={decision.isPending || !reason.trim() || records.isFetching} onClick={() => decide('reject')} className="min-h-11 px-4 border border-[var(--theme-status-danger-border)] text-[var(--theme-status-danger-text)] rounded-[10px]">Reject</button></div></> : <p className="text-sm">Complete the remaining review in the dedicated workflow.</p>}
            <Link className="min-h-11 inline-flex items-center underline text-sm" to={queue === 'barcode' ? '/inventory?tab=barcode_audit' : queue === 'inventory' ? '/inventory?tab=pending' : '/pricing?tab=reviews&requestId=' + selected.id}>Open full review</Link>
          </>}
        </section>
      </div>}
      {scopeReview && product && <ProposalReviewModal request={product} currentProduct={product.currentProduct} country={country} currencySymbol={country === 'KE' ? 'KES' : 'ETB'} submitting={decision.isPending} onClose={() => setScopeReview(false)} onApprove={async () => { await decision.mutateAsync({ id: product.id, action: 'approve', reason: '' }); setResult('Approval recorded. Check the updated request for remaining stages.'); setScopeReview(false); setSelectedId(''); }} />}
    </>}
  </section>;
}
