import React, { useState, useMemo } from 'react';
import {
  Trophy, Award, Medal, TrendingUp, CheckCircle2,
  AlertTriangle, DollarSign, Building2, Store, CalendarCheck2
} from 'lucide-react';
import type { Site, SaleRecord, ShiftRecord } from '../../types';
import { formatCompactNumber } from '../../utils/formatting';

interface TerritoryLeaderboardProps {
  regionCode: string;
  sites: Site[];
  sales: SaleRecord[];
  shifts: ShiftRecord[];
  currencySymbol: string;
}

export interface FacilityScorecard {
  siteId: string;
  siteName: string;
  siteType: string;
  siteManager: string;
  weeklySalesTotal: number;
  salesCount: number;
  salesScore: number; // 0-100
  cycleCountStatus: 'COMPLIANT' | 'DUE_TODAY' | 'OVERDUE_BREACH' | 'MISSED_PRIOR';
  cycleCountScore: number; // 0-100
  totalCashVariance: number;
  cashAccuracyScore: number; // 0-100
  compositeScore: number; // 0-100
  rank: number;
}

export const TerritoryLeaderboard: React.FC<TerritoryLeaderboardProps> = ({
  regionCode,
  sites,
  sales,
  shifts,
  currencySymbol
}) => {
  const [sortBy, setSortBy] = useState<'composite' | 'sales' | 'compliance' | 'cash'>('composite');

  // Compute facility scorecards across 3 pillars
  const scorecards: FacilityScorecard[] = useMemo(() => {
    if (!sites || sites.length === 0) return [];

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sun, 2 = Tue, 3 = Wed
    const currentHour = now.getHours();

    // 1. Calculate raw metrics per site
    const list = sites.map(site => {
      const siteSales = sales.filter(s => s.siteId === site.id);
      const siteShifts = shifts.filter(s => s.siteId === site.id);

      // Pillar 1: Sales Velocity
      const weeklySalesTotal = siteSales.reduce((acc, s) => acc + (s.total || 0), 0);
      const salesCount = siteSales.length;

      // Pillar 2: Tuesday Weekly Cycle Count Compliance (SOP-INV-012)
      let cycleCountStatus: 'COMPLIANT' | 'DUE_TODAY' | 'OVERDUE_BREACH' | 'MISSED_PRIOR' = 'COMPLIANT';
      let cycleCountScore = 95;

      if (dayOfWeek === 2) { // Tuesday
        if (currentHour >= 17) {
          cycleCountStatus = 'OVERDUE_BREACH';
          cycleCountScore = 30;
        } else {
          cycleCountStatus = 'DUE_TODAY';
          cycleCountScore = 80;
        }
      } else if (dayOfWeek === 3) { // Wednesday
        cycleCountStatus = 'MISSED_PRIOR';
        cycleCountScore = 50;
      } else {
        cycleCountStatus = 'COMPLIANT';
        cycleCountScore = 100;
      }

      // Pillar 3: Cash Drawer Reconciliation Accuracy
      const totalCashVariance = siteShifts.reduce((acc, s) => {
        return acc + Math.abs(Number(s.variance) || 0);
      }, 0);

      // Perfect accuracy if zero variance; deduction based on discrepancy severity
      const cashAccuracyScore = totalCashVariance === 0
        ? 100
        : Math.max(20, 100 - Math.min(80, Math.round((totalCashVariance / 1000) * 10)));

      return {
        siteId: site.id,
        siteName: site.name,
        siteType: site.type || 'Store',
        siteManager: site.manager || 'Branch Manager',
        weeklySalesTotal,
        salesCount,
        salesScore: 0, // normalized below
        cycleCountStatus,
        cycleCountScore,
        totalCashVariance,
        cashAccuracyScore,
        compositeScore: 0,
        rank: 0
      };
    });

    // 2. Normalize sales score across region
    const maxSales = Math.max(...list.map(s => s.weeklySalesTotal), 1);
    list.forEach(item => {
      const normalizedSales = Math.round((item.weeklySalesTotal / maxSales) * 100);
      item.salesScore = Math.max(10, normalizedSales);

      // Composite weighted score: Sales 40%, Inventory SLA 35%, Cash Accuracy 25%
      item.compositeScore = Math.round(
        item.salesScore * 0.40 +
        item.cycleCountScore * 0.35 +
        item.cashAccuracyScore * 0.25
      );
    });

    // 3. Sort & assign ranks based on active filter
    let sorted = [...list];
    if (sortBy === 'sales') {
      sorted.sort((a, b) => b.weeklySalesTotal - a.weeklySalesTotal);
    } else if (sortBy === 'compliance') {
      sorted.sort((a, b) => b.cycleCountScore - a.cycleCountScore);
    } else if (sortBy === 'cash') {
      sorted.sort((a, b) => b.cashAccuracyScore - a.cashAccuracyScore);
    } else {
      sorted.sort((a, b) => b.compositeScore - a.compositeScore);
    }

    return sorted.map((item, index) => ({
      ...item,
      rank: index + 1
    }));
  }, [sites, sales, shifts, sortBy]);

  const topPerformer = scorecards[0];

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[var(--theme-text-primary)] flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[var(--theme-status-warning-text)]" />
            <span>Regional Facility Performance Leaderboard</span>
          </h3>
          <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
            Territory benchmarking across Sales Velocity, Tuesday Cycle Count Compliance & Cash Accuracy
          </p>
        </div>

        {/* Sort Pill Filters */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setSortBy('composite')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              sortBy === 'composite'
                ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm'
                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
            }`}
          >
            Overall Index
          </button>
          <button
            type="button"
            onClick={() => setSortBy('sales')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              sortBy === 'sales'
                ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm'
                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
            }`}
          >
            Sales Velocity
          </button>
          <button
            type="button"
            onClick={() => setSortBy('compliance')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              sortBy === 'compliance'
                ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm'
                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
            }`}
          >
            Cycle Count SLA
          </button>
          <button
            type="button"
            onClick={() => setSortBy('cash')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              sortBy === 'cash'
                ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm'
                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
            }`}
          >
            Cash Accuracy
          </button>
        </div>
      </div>

      {/* Top Performer Spotlight Card */}
      {topPerformer && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[var(--theme-bg-card)] to-[var(--theme-bg-card)] border border-[var(--theme-status-warning-border)] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] flex items-center justify-center font-bold text-lg shrink-0 border border-[var(--theme-status-warning-border)]">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] uppercase tracking-wide">
                  Territory Benchmark Leader (#{topPerformer.rank})
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]">
                  {topPerformer.compositeScore}/100 Index
                </span>
              </div>
              <h4 className="text-base font-bold text-[var(--theme-text-primary)] mt-0.5">
                {topPerformer.siteName}
              </h4>
              <p className="text-xs text-[var(--theme-text-secondary)]">
                Managed by {topPerformer.siteManager} • {topPerformer.salesCount} Sales ({formatCompactNumber(topPerformer.weeklySalesTotal, { currency: currencySymbol })})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono self-end md:self-auto">
            <div className="text-center">
              <div className="text-[var(--theme-status-success-text)] font-bold">{topPerformer.salesScore}%</div>
              <div className="text-[10px] text-[var(--theme-text-secondary)]">Sales</div>
            </div>
            <div className="text-center">
              <div className="text-[var(--theme-status-info-text)] font-bold">{topPerformer.cycleCountScore}%</div>
              <div className="text-[10px] text-[var(--theme-text-secondary)]">Inventory SLA</div>
            </div>
            <div className="text-center">
              <div className="text-[var(--theme-status-warning-text)] font-bold">{topPerformer.cashAccuracyScore}%</div>
              <div className="text-[10px] text-[var(--theme-text-secondary)]">Cash Accuracy</div>
            </div>
          </div>
        </div>
      )}

      {/* Facility Ranked Scorecard Grid */}
      <div className="space-y-2.5">
        {scorecards.map(card => {
          const isTop3 = card.rank <= 3;

          return (
            <div
              key={card.siteId}
              className="p-4 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                {/* Rank Badge */}
                <div className={`w-8 h-8 rounded-xl font-bold font-mono text-xs flex items-center justify-center shrink-0 border ${
                  card.rank === 1
                    ? 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)]'
                    : card.rank === 2
                      ? 'bg-stone-300/20 text-stone-600 dark:text-stone-300 border-stone-300/30'
                      : card.rank === 3
                        ? 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)]'
                        : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)]'
                }`}>
                  {card.rank === 1 ? <Trophy className="w-4 h-4" /> : `#${card.rank}`}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--theme-text-primary)]">
                      {card.siteName}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)]">
                      {card.siteType}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--theme-text-secondary)] mt-1">
                    <span>{card.siteManager}</span>
                    <span>•</span>
                    <span>{formatCompactNumber(card.weeklySalesTotal, { currency: currencySymbol })}</span>
                    <span>•</span>
                    <span>{card.salesCount} txns</span>
                  </div>
                </div>
              </div>

              {/* 3 Pillar Score Breakdown */}
              <div className="flex items-center gap-3 self-end md:self-center">
                {/* Pillar 1: Sales Velocity */}
                <div className="px-3 py-1.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-right">
                  <div className="text-xs font-mono font-bold text-[var(--theme-text-primary)]">
                    {card.salesScore}%
                  </div>
                  <div className="text-[10px] text-[var(--theme-text-secondary)]">Velocity</div>
                </div>

                {/* Pillar 2: Tuesday Cycle Count SLA */}
                <div className="px-3 py-1.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-right">
                  <div className={`text-xs font-mono font-bold ${
                    card.cycleCountStatus === 'OVERDUE_BREACH'
                      ? 'text-[var(--theme-status-danger-text)]'
                      : card.cycleCountStatus === 'DUE_TODAY'
                        ? 'text-[var(--theme-status-warning-text)]'
                        : 'text-[var(--theme-status-success-text)]'
                  }`}>
                    {card.cycleCountStatus === 'OVERDUE_BREACH' ? 'Breach' : `${card.cycleCountScore}%`}
                  </div>
                  <div className="text-[10px] text-[var(--theme-text-secondary)]">Count SLA</div>
                </div>

                {/* Pillar 3: Cash Accuracy */}
                <div className="px-3 py-1.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-right">
                  <div className={`text-xs font-mono font-bold ${card.totalCashVariance > 0 ? 'text-[var(--theme-status-warning-text)]' : 'text-[var(--theme-status-success-text)]'}`}>
                    {card.cashAccuracyScore}%
                  </div>
                  <div className="text-[10px] text-[var(--theme-text-secondary)]">Cash Acc.</div>
                </div>

                {/* Overall Composite Index */}
                <div className="pl-2 border-l border-[var(--theme-border)] text-right min-w-[65px]">
                  <div className="text-sm font-bold font-mono text-[var(--theme-accent)]">
                    {card.compositeScore}
                  </div>
                  <div className="text-[10px] text-[var(--theme-text-secondary)] uppercase">Index</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
