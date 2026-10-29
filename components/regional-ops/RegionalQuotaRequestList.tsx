import React from 'react';
import { Clock, CheckCircle2, XCircle, TrendingUp, Building2, User, FileText } from 'lucide-react';
import type { HeadcountQuotaRequest } from '../../types/employee';
import { formatRole } from '../../utils/formatting';

interface RegionalQuotaRequestListProps {
  requests: HeadcountQuotaRequest[];
}

export const RegionalQuotaRequestList: React.FC<RegionalQuotaRequestListProps> = ({ requests }) => {
  if (requests.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-[var(--theme-text-primary)] flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[var(--theme-accent)]" />
          <span>Regional Headcount Quota Surge Requests</span>
        </h4>
        <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)]">
          {requests.length} Total
        </span>
      </div>

      <div className="space-y-2.5">
        {requests.map(req => {
          const isPending = req.status === 'PENDING';
          const isApproved = req.status === 'APPROVED';
          const isRejected = req.status === 'REJECTED';

          return (
            <div
              key={req.id}
              className="p-4 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-[var(--theme-text-primary)]">
                    {formatRole(req.role)}
                  </span>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)]">
                    {req.siteName || req.siteId}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] text-[var(--theme-status-info-text)] border border-[var(--theme-status-info-border)]">
                    {req.requestType === 'TEMPORARY_SURGE' ? 'Temporary Surge' : 'Permanent Expansion'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-[var(--theme-text-secondary)] flex-wrap">
                  <span>Quota: <strong className="text-[var(--theme-text-primary)]">{req.currentQuota} &rarr; {req.requestedQuota}</strong></span>
                  <span className="text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] font-semibold">(+{req.increaseAmount} Slots)</span>
                  <span>• Submitted by {req.requestedBy}</span>
                  {req.requestedAt && (
                    <span>({new Date(req.requestedAt).toLocaleDateString()})</span>
                  )}
                </div>

                <p className="text-[11px] text-[var(--theme-text-secondary)] italic bg-[var(--theme-bg-subtle)] p-2 rounded-lg border border-[var(--theme-border)]/60 line-clamp-2">
                  &ldquo;{req.reason}&rdquo;
                </p>

                {req.reviewNotes && (
                  <p className="text-[11px] text-[var(--theme-text-primary)] font-medium">
                    Corporate HQ Note: {req.reviewNotes} {req.reviewedBy ? `— ${req.reviewedBy}` : ''}
                  </p>
                )}
              </div>

              <div className="shrink-0 self-start md:self-center">
                {isPending && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)] font-semibold text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Awaiting HQ Authorization</span>
                  </div>
                )}
                {isApproved && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)] font-semibold text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approved by HQ</span>
                  </div>
                )}
                {isRejected && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)] font-semibold text-xs">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Declined by HQ</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
