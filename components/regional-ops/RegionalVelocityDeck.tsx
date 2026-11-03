import React from 'react';
import { Store } from 'lucide-react';
import { formatCompactNumber } from '../../utils/formatting';
import type { RegionalSitePerformance } from '../../hooks/useRegionalOperationsData';

interface RegionalVelocityDeckProps {
  sitePerformance: RegionalSitePerformance[];
  currencySymbol: string;
}

export const RegionalVelocityDeck: React.FC<RegionalVelocityDeckProps> = ({ sitePerformance, currencySymbol }) => {
  const maxRevenue = Math.max(1, ...sitePerformance.map(site => site.revenue));
  return <section className="p-5 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)]">
    <h3 className="text-sm font-bold text-[var(--theme-text-primary)] flex items-center gap-2"><Store size={16} className="text-[var(--theme-accent)]" />Monthly Facility Sales</h3>
    <p className="text-xs text-[var(--theme-text-secondary)] mt-1 mb-4">Ranked by completed sales in the current country month. Transactions are for today.</p>
    <div className="space-y-2.5">
      {sitePerformance.map((site, index) => <div key={site.id} className="p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
        <div className="flex items-center justify-between gap-3 text-xs mb-2">
          <span className="font-semibold text-[var(--theme-text-primary)]">{index + 1}. {site.name}</span>
          <span className="font-mono text-[var(--theme-text-primary)]">{formatCompactNumber(site.revenue, { currency: currencySymbol })} · {site.transactionCount} today</span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--theme-bg-card)] overflow-hidden"><div className="h-full bg-[var(--theme-accent)]" style={{ width: `${Math.round(site.revenue / maxRevenue * 100)}%` }} /></div>
      </div>)}
      {sitePerformance.length === 0 && <p className="text-xs text-[var(--theme-text-secondary)]">No facilities in this region.</p>}
    </div>
  </section>;
};
