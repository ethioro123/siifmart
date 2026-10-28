import { useLanguage } from '../../contexts/LanguageContext';
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ClipboardCheck, X } from 'lucide-react';
import { useApprovalInbox } from '../../hooks/useApprovalInbox';
import { APPROVAL_QUEUES } from '../../utils/unifiedApprovalInbox';

const OPENING_PAGE_ROUTES = new Set([
  '/',
  '/admin',
  '/regional-ops',
  '/pos-dashboard',
  '/wms-dashboard'
]);

export function ApprovalInboxNotice() {
  const { t } = useLanguage();
  const query = useApprovalInbox();
  const location = useLocation();
  const [isDismissed, setIsDismissed] = useState(false);

  // Notice should only appear on opening dashboard landing pages, never on functional/operational pages
  if (!OPENING_PAGE_ROUTES.has(location.pathname)) return null;

  // Do not show on approvals page or if user has dismissed the notice in this session
  if (isDismissed || location.pathname === '/approvals') return null;

  // Reviewer must have approval review capability enabled
  if (!query.enabled) return null;

  // Never show an error banner across the page (errors are handled cleanly in TopBar button)
  if (query.isError) return null;

  // Crucial fix: NEVER render a banner when there are 0 tasks awaiting review!
  if (query.data && query.data.total <= 0) return null;

  // If data is not yet loaded and not loading, don't show
  if (!query.data && !query.isLoading) return null;

  const text = query.data
    ? t('pos.approvals.pending', { count: query.data.total }) + (query.data.unavailable ? ' · ' + t('pos.approvals.partial') : '')
    : t('pos.approvals.checking');

  const areas = [...new Set(query.data?.queues.filter(q => q.status === 'ready' && (q.count || 0) > 0).map(q => APPROVAL_QUEUES[q.key]?.area).filter(Boolean))];

  return (
    <section aria-label={t('pos.approvals.yourApprovals')} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-4 shadow-xs">
      <div className="flex items-start gap-3">
        <ClipboardCheck size={22} aria-hidden="true" className="text-[var(--theme-accent)] shrink-0 mt-0.5" />
        <div>
          <p role="status" className="font-semibold text-[var(--theme-text-primary)]">{text}</p>
          {areas.length > 0 && (
            <p className="text-sm text-[var(--theme-text-secondary)]">
              {areas.map(area => t('pos.approvals.area' + area.replace(/[^a-zA-Z]/g, ''))).join(' · ')}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link to="/approvals" className="min-h-11 inline-flex items-center rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] px-4 text-sm font-semibold text-[var(--theme-text-primary)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">
          {t('pos.approvals.open')}
        </Link>
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          aria-label="Dismiss notice"
          className="p-2 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] rounded-lg transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>
    </section>
  );
}
