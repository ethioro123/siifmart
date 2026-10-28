import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ClipboardCheck } from 'lucide-react';
import { useApprovalInbox } from '../../hooks/useApprovalInbox';
import { APPROVAL_QUEUES, approvalSummaryLabel } from '../../utils/unifiedApprovalInbox';
export function ApprovalInboxNotice() {
  const query = useApprovalInbox();
  const location = useLocation();
  if (!query.enabled || location.pathname === '/approvals') return null;
  const text = query.isError ? 'Approval inbox unavailable. Open it to retry.' : query.data
    ? approvalSummaryLabel(query.data.total, query.data.unavailable) : 'Checking requests that need your approval…';
  const areas = [...new Set(query.data?.queues.filter(q => q.status === 'ready' && (q.count || 0)>0).map(q => APPROVAL_QUEUES[q.key]?.area).filter(Boolean))];
  return <section aria-label="Your approvals" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-4">
    <div className="flex items-start gap-3"><ClipboardCheck size={22} aria-hidden="true" className="text-[var(--theme-accent)]" /><div>
      <p role="status" className="font-semibold text-[var(--theme-text-primary)]">{text}</p>
      {!query.isError && areas.length>0 && <p className="text-sm text-[var(--theme-text-secondary)]">{areas.join(' · ')}</p>}
    </div></div>
    <Link to="/approvals" className="min-h-11 inline-flex items-center rounded-xl border border-[var(--theme-border)] px-4 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">Open approval inbox</Link>
  </section>;
}
