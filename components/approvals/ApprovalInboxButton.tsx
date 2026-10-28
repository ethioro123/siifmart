import React from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, AlertCircle } from 'lucide-react';
import { useApprovalInbox } from '../../hooks/useApprovalInbox';
import { approvalSummaryLabel } from '../../utils/unifiedApprovalInbox';
export function ApprovalInboxButton() {
  const query = useApprovalInbox(true);
  if (!query.enabled) return null;
  const label = query.isError ? 'Approval inbox unavailable' : query.data
    ? approvalSummaryLabel(query.data.total, query.data.unavailable) : 'Checking approvals';
  return <Link to="/approvals" aria-label={label} title={label}
    className="min-h-11 min-w-11 inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] px-3 text-[var(--theme-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">
    {query.isError ? <AlertCircle size={18} aria-hidden="true" /> : <ClipboardCheck size={18} aria-hidden="true" />}
    <span className="hidden lg:inline text-xs font-semibold">Approvals</span>
    <span aria-live="polite" className="rounded-full bg-[var(--theme-accent)] px-2 py-0.5 text-xs font-semibold text-[var(--theme-btn-primary-text)]">
      {query.isError ? '!' : query.data ? `${query.data.total}${query.data.unavailable ? '+' : ''}` : '…'}
    </span>
  </Link>;
}
