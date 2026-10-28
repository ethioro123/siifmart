import React, { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryRequestsService } from '../../../services/inventory-requests.service';
import { useStore } from '../../../contexts/CentralStore';
import type { PendingInventoryChange } from '../../../types';

interface Props {
  request: PendingInventoryChange; country: string; submitting: boolean;
  onClose: () => void; onApprove: () => Promise<void>;
}

export function PlanogramRevisionReview({ request, country, submitting, onClose, onApprove }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { user } = useStore();
  const revision = request.layoutRevisionId || request.layout_revision_id;
  const query = useQuery({
    queryKey: ['planogram_revision_review', country, request.siteId, revision, user?.id],
    queryFn: () => inventoryRequestsService.getMerchandisingRequests(country, {
      siteId: request.siteId, layoutRevisionId: revision, status: 'all', limit: 100
    }),
    enabled: Boolean(revision), staleTime: 0
  });
  useEffect(() => { dialog.current?.showModal(); }, []);
  const rows = query.data?.data || [];
  const ready = rows.length > 0 && !query.data?.hasMore && rows.every(row => row.status === 'pending');
  return <dialog ref={dialog} aria-labelledby="layout-revision-review-title" onCancel={event => {
    event.preventDefault(); if (!submitting) onClose();
  }} className="m-auto w-[calc(100%_-_2rem)] max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-5 text-[var(--theme-text-primary)] backdrop:bg-black/60">
    <h2 id="layout-revision-review-title" className="text-lg font-semibold">Review the complete shelf revision</h2>
    <p className="mt-2 text-sm">Your departmental vote covers every product below. All moves apply together after Operations, Supply Chain and Merchandising approve.</p>
    {query.isLoading && <p role="status" className="mt-4">Loading all moves…</p>}
    {query.error && <div role="alert" className="mt-4">Could not load the complete revision. <button type="button" onClick={() => query.refetch()} className="underline">Retry</button></div>}
    <ul className="my-4 space-y-2">{rows.map(row => <li key={row.id} className="rounded-xl border border-[var(--theme-border)] p-3 text-sm">
      <strong>{row.productName}</strong> · {row.productSku}<br />
      {String(row.proposalBaseline?.shelf_position ?? 'Unassigned')} → {row.proposedChanges?.shelfPosition || 'Unknown placement'} · {row.status}
    </li>)}</ul>
    {query.data && !ready && <p role="alert">This revision is incomplete or no longer fully pending. Refresh the review queue.</p>}
    <div className="mt-4 flex justify-end gap-3">
      <button type="button" disabled={submitting} onClick={onClose} className="min-h-11 rounded-xl border border-[var(--theme-border)] px-4">Cancel</button>
      <button type="button" disabled={submitting || query.isFetching || !ready || Boolean(query.error)} onClick={onApprove} className="min-h-11 rounded-xl bg-[var(--theme-accent)] px-4 text-white disabled:opacity-50">{submitting ? 'Recording approval…' : 'Approve complete revision'}</button>
    </div>
  </dialog>;
}
