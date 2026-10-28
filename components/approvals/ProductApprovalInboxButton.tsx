import React from 'react';
import { ClipboardCheck, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProductApprovalInbox } from '../../hooks/useProductApprovalInbox';
import { productApprovalLink } from '../../utils/approvalInbox';

export function ProductApprovalInboxButton() {
  const query = useProductApprovalInbox(true);
  const navigate = useNavigate();
  if (!query.enabled) return null;
  const count = query.data?.total;
  const label = query.isError ? 'Product approval inbox unavailable. Retry.'
    : count === undefined ? 'Checking product approvals'
    : count + ' product approval request' + (count === 1 ? '' : 's') + ' awaiting your review';
  return <button type="button" aria-label={label} title={label + (query.live ? ' Live updates connected.' : ' Refresh available in the approval queue.')}
    onClick={() => { if (query.isError) void query.refetch(); else navigate(productApprovalLink()); }}
    className="min-h-11 min-w-11 inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] px-3 text-[var(--theme-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">
    {query.isError ? <AlertCircle size={18} aria-hidden="true" /> : <ClipboardCheck size={18} aria-hidden="true" />}
    <span className="hidden lg:inline text-xs font-semibold">Product approvals</span>
    <span aria-live="polite" className="rounded-full bg-[var(--theme-accent)] px-2 py-0.5 text-xs font-semibold text-[var(--theme-btn-primary-text)]">
      {query.isError ? '!' : count ?? '…'}
    </span>
  </button>;
}
