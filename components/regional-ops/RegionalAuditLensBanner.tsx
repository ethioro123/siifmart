import React from 'react';
import { ArrowLeft } from 'lucide-react';
import type { Region } from '../../types';

interface RegionalAuditLensBannerProps {
  isAuditInspection: boolean;
  sovereignRegions: Region[];
  regionCode: string;
  regionName: string;
  navigate: (path: string) => void;
}

export function RegionalAuditLensBanner({
  isAuditInspection,
  sovereignRegions,
  regionCode,
  regionName,
  navigate,
}: RegionalAuditLensBannerProps) {
  if (!isAuditInspection) return null;

  return (
    <div className="p-3.5 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="w-2 h-2 rounded-full bg-[var(--theme-status-warning)] shrink-0" />
        <span className="text-xs text-[var(--theme-text-primary)] font-medium">
          Corporate HQ Audit Lens:
        </span>
        {sovereignRegions.length > 1 ? (
          <select
            value={regionCode}
            onChange={(e) => navigate(`/regional-ops?regionCode=${e.target.value}`)}
            aria-label="Select Region to Audit"
            className="min-h-11 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs text-[var(--theme-text-primary)] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
          >
            {sovereignRegions.map(r => (
              <option key={r.code} value={r.code}>
                {r.name} ({r.code})
              </option>
            ))}
          </select>
        ) : (
          <strong className="text-xs text-[var(--theme-text-primary)]">{regionName}</strong>
        )}
      </div>
      <button
        type="button"
        onClick={() => navigate('/admin')}
        className="min-h-11 flex items-center gap-1.5 px-3 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-text-primary)] hover:border-[var(--theme-accent)] transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Central Operations</span>
      </button>
    </div>
  );
}
