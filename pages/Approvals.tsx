import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, RefreshCw, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useApprovalInbox } from '../hooks/useApprovalInbox';
import { APPROVAL_QUEUES, approvalSummaryLabel } from '../utils/unifiedApprovalInbox';
import type { ApprovalReviewType } from '../types/unifiedApprovalInbox';

export default function Approvals() {
  const query = useApprovalInbox();
  const [filter, setFilter] = useState<'all' | ApprovalReviewType>('all');

  const queues = useMemo(() => {
    return [...(query.data?.queues || [])].sort((a, b) => (b.count || 0) - (a.count || 0));
  }, [query.data?.queues]);

  const filteredQueues = useMemo(() => {
    if (filter === 'all') return queues;
    return queues.filter(q => {
      const config = APPROVAL_QUEUES[q.key];
      return config && config.reviewType === filter;
    });
  }, [queues, filter]);

  const clearanceCount = useMemo(() => {
    return queues.filter(q => APPROVAL_QUEUES[q.key]?.reviewType === 'specialist_clearance' && (q.count || 0) > 0).length;
  }, [queues]);

  const lineApprovalCount = useMemo(() => {
    return queues.filter(q => APPROVAL_QUEUES[q.key]?.reviewType === 'final_line_approval' && (q.count || 0) > 0).length;
  }, [queues]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--theme-text-primary)] flex items-center gap-2.5">
            <ClipboardCheck aria-hidden="true" className="text-[var(--theme-accent)]" size={26} />
            Your approval inbox
          </h1>
          <p className="text-sm text-[var(--theme-text-secondary)] mt-1">
            Your next review steps across departments, within your authorized country and region.
          </p>
        </div>
        <button
          type="button"
          onClick={() => query.refetch()}
          disabled={query.isFetching || !query.enabled}
          className="min-h-11 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] px-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={query.isFetching ? 'animate-spin' : ''} aria-hidden="true" />
          Refresh
        </button>
      </header>

      {!query.enabled && (
        <p className="text-sm text-[var(--theme-text-secondary)]">No approval queues are assigned to your role.</p>
      )}

      {query.isLoading && query.enabled && (
        <p role="status" className="text-sm text-[var(--theme-text-secondary)]">Checking your approval queues…</p>
      )}

      {query.isError && (
        <div role="alert" className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
          The inbox could not be loaded. Refresh to retry. Pending totals are unavailable.
        </div>
      )}

      {!query.isError && query.data && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--theme-border)] pb-4">
            <div>
              <p role="status" className="text-lg font-semibold text-[var(--theme-text-primary)]">
                {approvalSummaryLabel(query.data.total, query.data.unavailable)}
              </p>
              <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                5-tier risk-calibrated authority (Regional ≤10M/≤2M · Country ≤100M/≤20M · Group HQ)
              </p>
            </div>

            <div className="inline-flex rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`rounded-lg px-3 py-1.5 transition-colors ${
                  filter === 'all'
                    ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm font-semibold'
                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                }`}
              >
                All reviews
              </button>
              <button
                type="button"
                onClick={() => setFilter('specialist_clearance')}
                className={`rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1.5 ${
                  filter === 'specialist_clearance'
                    ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm font-semibold'
                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                }`}
              >
                Specialist Clearances
                {clearanceCount > 0 && (
                  <span className="rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 text-[10px] font-bold">
                    {clearanceCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setFilter('final_line_approval')}
                className={`rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1.5 ${
                  filter === 'final_line_approval'
                    ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm font-semibold'
                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                }`}
              >
                Final Line Approvals
                {lineApprovalCount > 0 && (
                  <span className="rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 text-[10px] font-bold">
                    {lineApprovalCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {query.data.unavailable > 0 && (
            <p role="alert" className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] p-3 text-sm text-[var(--theme-text-secondary)]">
              Some workflows could not be checked. The total covers available queues only; unavailable queues are listed below.
            </p>
          )}

          <ul className="grid gap-3.5 sm:grid-cols-2">
            {filteredQueues.map(q => {
              const config = APPROVAL_QUEUES[q.key];
              if (!config) return null;
              const isSpecialist = config.reviewType === 'specialist_clearance';

              return (
                <li
                  key={q.key}
                  className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-4 flex flex-col justify-between space-y-3 transition-shadow hover:shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                        {config.area}
                      </span>
                      {isSpecialist ? (
                        <span
                          data-testid={`badge-${q.key}`}
                          className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300"
                        >
                          <ShieldAlert size={12} aria-hidden="true" />
                          {config.clearanceBadge}
                        </span>
                      ) : (
                        <span
                          data-testid={`badge-${q.key}`}
                          className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300"
                        >
                          <CheckCircle2 size={12} aria-hidden="true" />
                          Final Line Approval
                        </span>
                      )}
                    </div>

                    <div>
                      <h2 className="text-base font-semibold text-[var(--theme-text-primary)]">
                        {config.label}
                      </h2>
                      <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                        {config.governanceScope}
                      </p>
                    </div>
                  </div>

                  {q.status === 'unavailable' ? (
                    <p className="text-sm text-[var(--theme-text-secondary)]" role="status">
                      Unavailable in this environment or for this account. Pending count could not be verified.
                    </p>
                  ) : (
                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-[var(--theme-border)]">
                      <p className="text-sm font-medium text-[var(--theme-text-primary)]">
                        {q.count} awaiting review
                      </p>
                      <Link
                        to={config.href}
                        className="min-h-11 inline-flex items-center justify-center rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-hover)] px-4 text-sm font-semibold text-[var(--theme-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] transition-colors"
                        aria-label={'Review ' + config.label}
                      >
                        Review
                      </Link>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <footer className="text-xs text-[var(--theme-text-secondary)] space-y-1 pt-2">
            <p>
              {query.isFetching
                ? 'Updating…'
                : 'Checked ' + new Date(query.data.checkedAt).toLocaleTimeString()} · Counts reflect review steps.
              A request may need separate departmental decisions; each shelf-layout revision counts once per department.
            </p>
            <p>
              Specialist clearances (Finance margin/budget validation, HR credential verification) must precede final line sign-off.
            </p>
          </footer>
        </>
      )}
    </div>
  );
}
