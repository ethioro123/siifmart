import { useLanguage } from '../../contexts/LanguageContext';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ClipboardCheck } from 'lucide-react';
import { useApprovalInbox } from '../../hooks/useApprovalInbox';
import { APPROVAL_QUEUES } from '../../utils/unifiedApprovalInbox';
export function ApprovalInboxNotice() {
  const { t } = useLanguage();
  const query = useApprovalInbox();
  const location = useLocation();
  if (!query.enabled || location.pathname === '/approvals') return null;
  const text = query.isError ? t('pos.approvals.unavailable') : query.data
    ? t('pos.approvals.pending', { count: query.data.total }) + (query.data.unavailable ? ' · ' + t('pos.approvals.partial') : '') : t('pos.approvals.checking');
  const areas = [...new Set(query.data?.queues.filter(q => q.status === 'ready' && (q.count || 0)>0).map(q => APPROVAL_QUEUES[q.key]?.area).filter(Boolean))];
  return <section aria-label={t('pos.approvals.yourApprovals')} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-4">
    <div className="flex items-start gap-3"><ClipboardCheck size={22} aria-hidden="true" className="text-[var(--theme-accent)]" /><div>
      <p role="status" className="font-semibold text-[var(--theme-text-primary)]">{text}</p>
      {!query.isError && areas.length>0 && <p className="text-sm text-[var(--theme-text-secondary)]">{areas.map(area => t('pos.approvals.area' + area.replace(/[^a-zA-Z]/g, ''))).join(' · ')}</p>}
    </div></div>
    <Link to="/approvals" className="min-h-11 inline-flex items-center rounded-xl border border-[var(--theme-border)] px-4 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">{t('pos.approvals.open')}</Link>
  </section>;
}
