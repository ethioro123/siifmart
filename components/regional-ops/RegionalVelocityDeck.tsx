import React from 'react';
import { Store, TrendingUp, DollarSign, Package } from 'lucide-react';
import { formatCompactNumber } from '../../utils/formatting';
import type { RegionalSitePerformance } from '../../hooks/useRegionalOperationsData';

interface RegionalVelocityDeckProps {
  sitePerformance: RegionalSitePerformance[];
  topProducts: { name: string; sales: number; count: number }[];
  currencySymbol: string;
}

export const RegionalVelocityDeck: React.FC<RegionalVelocityDeckProps> = ({
  sitePerformance,
  topProducts,
  currencySymbol
}) => {
  const topSite = sitePerformance[0];
  const maxSiteRevenue = topSite ? Math.max(topSite.revenue, 1) : 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* 1. Territorial Facilities Ranked by Revenue (7 cols) */}
      <div className="lg:col-span-7 p-5 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[var(--theme-text-primary)] flex items-center gap-2">
              <Store size={16} className="text-[var(--theme-accent)]" />
              <span>Territorial Facility Sales Velocity</span>
            </h3>
            <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
              Ranked revenue generation and customer transactions across branches in this region
            </p>
          </div>
          <span className="text-[11px] font-mono text-[var(--theme-text-secondary)] font-medium">
            {sitePerformance.length} Nodes
          </span>
        </div>

        <div className="space-y-2.5">
          {sitePerformance.slice(0, 5).map((site, index) => {
            const percent = Math.min(100, Math.round((site.revenue / maxSiteRevenue) * 100));
            return (
              <div
                key={site.id}
                className="p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${
                      index === 0
                        ? 'bg-[var(--theme-accent)] text-[var(--theme-text-primary)] shadow-xs'
                        : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="font-bold text-[var(--theme-text-primary)]">{site.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]">
                      {site.type}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-[var(--theme-text-primary)]">
                      {formatCompactNumber(site.revenue, { currency: currencySymbol })}
                    </span>
                    <span className="text-[11px] text-[var(--theme-text-secondary)] ml-1.5">
                      ({site.transactionCount} tx)
                    </span>
                  </div>
                </div>

                {/* Relative Volume Progress Track */}
                <div className="w-full bg-[var(--theme-bg-card)] h-1.5 rounded-full overflow-hidden border border-[var(--theme-border)]/50">
                  <div
                    style={{ width: `${percent}%` }}
                    className="h-full bg-[var(--theme-accent)] rounded-full transition-all duration-300"
                  />
                </div>
              </div>
            );
          })}

          {sitePerformance.length === 0 && (
            <div className="py-6 text-center text-xs text-[var(--theme-text-secondary)]">
              No sales transactions registered for this territory yet.
            </div>
          )}
        </div>
      </div>

      {/* 2. Top Fast-Moving SKUs in Territory (5 cols) */}
      <div className="lg:col-span-5 p-5 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--theme-text-primary)] flex items-center gap-2">
                <TrendingUp size={16} className="text-[var(--theme-status-success-text)]" />
                <span>Fast-Moving SKUs in Territory</span>
              </h3>
              <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                Top selling products by gross demand and volume
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {topProducts.map((p, i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <div className="w-6 h-6 rounded-lg bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center justify-center shrink-0 text-[var(--theme-text-secondary)]">
                    <Package size={12} />
                  </div>
                  <span className="font-medium text-[var(--theme-text-primary)] truncate" title={p.name}>
                    {p.name}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-[var(--theme-text-primary)]">
                    {formatCompactNumber(p.sales, { currency: currencySymbol })}
                  </span>
                  <span className="text-[10px] text-[var(--theme-text-secondary)] block font-mono">
                    {p.count} units
                  </span>
                </div>
              </div>
            ))}

            {topProducts.length === 0 && (
              <div className="py-6 text-center text-xs text-[var(--theme-text-secondary)]">
                No SKU volume recorded in this region for the active period.
              </div>
            )}
          </div>
        </div>

        <p className="text-[11px] text-[var(--theme-text-secondary)] mt-4 pt-3 border-t border-[var(--theme-border)]">
          Fast-moving inventory velocity informs autonomous reorder batch sizes and replenishment buffer allocations.
        </p>
      </div>
    </div>
  );
};
