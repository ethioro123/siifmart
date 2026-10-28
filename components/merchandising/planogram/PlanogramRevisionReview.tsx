import React, { useState } from 'react';
import Modal from '../../Modal';
import { useQuery } from '@tanstack/react-query';
import { inventoryRequestsService } from '../../../services/inventory-requests.service';
import { useStore } from '../../../contexts/CentralStore';
import type { PendingInventoryChange } from '../../../types';

interface Props {
  request: PendingInventoryChange; country: string; submitting: boolean;
  approvalBlock?: string; onClose: () => void; onApprove: () => Promise<void>;
}

export function PlanogramRevisionReview({ request, country, submitting, approvalBlock, onClose, onApprove }: Props) {
  const [error,setError] = useState('');
  const { user } = useStore();
  const revision = request.layoutRevisionId || request.layout_revision_id;
  const query = useQuery({
    queryKey: ['planogram_revision_review', country, request.siteId, revision, user?.id],
    queryFn: () => inventoryRequestsService.getMerchandisingRequests(country, {
      siteId: request.siteId, layoutRevisionId: revision, status: 'all', limit: 100
    }),
    enabled: Boolean(revision), staleTime: 0
  });
  const rows = query.data?.data || [];
  const ready = rows.length > 0 && !query.data?.hasMore && rows.every(row => row.status === 'pending');
  const confirm = async () => { if (approvalBlock || submitting || !ready || query.isFetching || query.error) return; setError(''); try { await onApprove(); } catch(error) { setError(error instanceof Error ? error.message : 'Approval could not be recorded. Please retry.'); } };
  return <Modal isOpen title="Review the complete shelf revision" onClose={onClose} size="xl" closeOnEscape={!submitting} closeOnClickOutside={!submitting}>
    <p className="mt-2 text-sm">Your departmental vote covers every product below. All moves apply together after Operations, Supply Chain and Merchandising approve.</p>
    {query.isLoading && <p role="status" className="mt-4">Loading all moves…</p>}
    {query.error && <div role="alert" className="mt-4">Could not load the complete revision. <button type="button" onClick={() => query.refetch()} className="underline">Retry</button></div>}
    <ul className="my-4 space-y-2">{rows.map(row => <li key={row.id} className="rounded-xl border border-[var(--theme-border)] p-3 text-sm">
      <strong>{row.productName}</strong> · {row.productSku}<br />
      {String(row.proposalBaseline?.shelf_position ?? 'Unassigned')} → {row.proposedChanges?.shelfPosition || 'Unknown placement'} · {row.status}
    </li>)}</ul>
    {query.data && !ready && <p role="alert">This revision is incomplete or no longer fully pending. Refresh the review queue.</p>}
    {approvalBlock && <p role="status" className="mt-4 text-sm">{approvalBlock}</p>}
    {error && <p role="alert" className="mt-4 text-sm text-[var(--theme-status-danger-text)]">{error}</p>}
    <div className="mt-4 flex justify-end gap-3">
      <button type="button" disabled={submitting} onClick={onClose} className="min-h-11 rounded-xl border border-[var(--theme-border)] px-4">Cancel</button>
      <button type="button" disabled={Boolean(approvalBlock) || submitting || query.isFetching || !ready || Boolean(query.error)} onClick={() => void confirm()} className="min-h-11 rounded-xl bg-[var(--theme-accent)] px-4 text-white disabled:opacity-50">{submitting ? 'Recording approval…' : 'Approve complete revision'}</button>
    </div>
  </Modal>;
}
