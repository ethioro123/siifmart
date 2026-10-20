import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store, Warehouse, ShieldAlert, CheckCircle2, Clock,
  ArrowUpRight, Users, CreditCard, CalendarCheck2, AlertTriangle
} from 'lucide-react';
import type { Site, ShiftRecord, SaleRecord } from '../../types';
import { formatCompactNumber } from '../../utils/formatting';

interface TerritoryFacilityGridProps {
  sites: Site[];
  shifts: ShiftRecord[];
  sales: SaleRecord[];
  currencySymbol: string;
}

export const TerritoryFacilityGrid: React.FC<TerritoryFacilityGridProps> = ({
  sites,
  shifts,
  sales,
  currencySymbol
}) => {
  const navigate = useNavigate();

  // Aggregate metrics per facility
  const todayPrefix = useMemo(() => new Date().toISOString().split('T')[0], []);
  const dayOfWeek = useMemo(() => new Date().getDay(), []); // 2 = Tuesday

  const facilityStats = useMemo(() => {
    return sites.map(site => {
      const siteShifts = shifts.filter(s => s.siteId === site.id);
      const openRegisters = siteShifts.filter(s => s.status === 'Open').length;

      const siteSales = sales.filter(s => s.siteId === site.id && (s.date || '').startsWith(todayPrefix));
      const todayRevenue = siteSales.reduce((acc, curr) => acc + (curr.total || 0), 0);
      const todayOrderCount = siteSales.length;

      const type = (site.type || '').toLowerCase();
      const isWarehouse = type.includes('warehouse') || type.includes('distribution') || type.includes('wms');
      const isDarkStore = type.includes('dark');

      // Tuesday weekly cycle count status check (SOP-INV-012 Enforcement)
      const isTuesday = dayOfWeek === 2;
      const isWednesday = dayOfWeek === 3;
      const isPastFivePM = new Date().getHours() >= 17;

      let cycleCountStatus: 'COMPLIANT' | 'DUE_TODAY' | 'OVERDUE_BREACH' | 'MISSED_PRIOR' = 'COMPLIANT';
      if (isTuesday) {
        cycleCountStatus = isPastFivePM ? 'OVERDUE_BREACH' : 'DUE_TODAY';
      } else if (isWednesday) {
        cycleCountStatus = 'MISSED_PRIOR';
      }

      return {
        site,
        isWarehouse,
        isDarkStore,
        openRegisters,
        todayRevenue,
        todayOrderCount,
        cycleCountStatus
      };
    });
  }, [sites, shifts, sales, todayPrefix, dayOfWeek]);

  if (sites.length === 0) {
    return (
      <div className="p-8 text-center bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)]">
        <Store className="w-10 h-10 mx-auto text-[var(--theme-text-secondary)] opacity-40 mb-3" />
        <h3 className="text-base font-semibold text-[var(--theme-text-primary)]">No Territorial Facilities Found</h3>
        <p className="text-sm text-[var(--theme-text-secondary)] mt-1">
          No stores or distribution centers are currently registered in this operational region.
        </p>
      </div>
    );
  }

  const overdueFacilities = facilityStats.filter(f => f.cycleCountStatus === 'OVERDUE_BREACH' || f.cycleCountStatus === 'MISSED_PRIOR');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-[var(--theme-text-primary)]">
            Territorial Facility Grid
          </h3>
          <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
            Real-time branch operational pulse, active registers, and Tuesday cycle audit tracking
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full font-mono bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)]">
          {sites.length} Active Nodes
        </span>
      </div>

      {/* Tuesday Cycle Count SLA Enforcement Banner */}
      {overdueFacilities.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="text-[var(--theme-text-primary)] font-medium">
              <strong>Tuesday Audit Enforcement:</strong> {overdueFacilities.length} facility node(s) have missed the 5:00 PM Tuesday blind cycle count deadline (SOP-INV-012).
            </span>
          </div>
          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0 self-end sm:self-auto">
            Operational SLA Breached
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
        {facilityStats.map(({ site, isWarehouse, isDarkStore, openRegisters, todayRevenue, todayOrderCount, cycleCountStatus }) => (
          <div
            key={site.id}
            className="p-5 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] hover:border-[var(--theme-accent)] transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              {/* Header: Name & Type Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-accent)]">
                    {isWarehouse ? <Warehouse className="w-5 h-5" /> : <Store className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--theme-text-primary)] line-clamp-1">
                      {site.name}
                    </h4>
                    <span className="text-[11px] font-mono text-[var(--theme-text-secondary)]">
                      {site.code || site.id.slice(0, 8)}
                    </span>
                  </div>
                </div>

                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                  isDarkStore
                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                    : isWarehouse
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                }`}>
                  {isDarkStore ? 'Dark Store' : isWarehouse ? 'Distribution' : 'Retail Store'}
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-[var(--theme-border)]/60 text-xs">
                <div className="p-2.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]/50">
                  <div className="flex items-center gap-1.5 text-[var(--theme-text-secondary)] text-[11px]">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Open Tills</span>
                  </div>
                  <div className="text-sm font-bold font-mono text-[var(--theme-text-primary)] mt-1">
                    {openRegisters} Active
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]/50">
                  <div className="flex items-center gap-1.5 text-[var(--theme-text-secondary)] text-[11px]">
                    <Users className="w-3.5 h-3.5" />
                    <span>Today Sales</span>
                  </div>
                  <div className="text-sm font-bold font-mono text-[var(--theme-text-primary)] mt-1 truncate">
                    {formatCompactNumber(todayRevenue, { currency: currencySymbol })}
                  </div>
                </div>
              </div>

              {/* Tuesday Cycle Count Status */}
              <div className="mt-3 flex items-center justify-between text-xs px-2.5 py-1.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]/50">
                <div className="flex items-center gap-1.5 text-[var(--theme-text-secondary)] text-[11px]">
                  <CalendarCheck2 className="w-3.5 h-3.5" />
                  <span>Tuesday Audit</span>
                </div>
                {cycleCountStatus === 'COMPLIANT' && (
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Audit Compliant
                  </span>
                )}
                {cycleCountStatus === 'DUE_TODAY' && (
                  <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Due Today (Before 5PM)
                  </span>
                )}
                {cycleCountStatus === 'OVERDUE_BREACH' && (
                  <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    Overdue (Past 5PM)
                  </span>
                )}
                {cycleCountStatus === 'MISSED_PRIOR' && (
                  <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Prior Tuesday Missed
                  </span>
                )}
              </div>
            </div>

            {/* Launchpad Button */}
            <button
              type="button"
              onClick={() => navigate(isWarehouse ? '/wms-dashboard' : '/pos-dashboard')}
              className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-accent)] hover:text-white border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-text-primary)] transition-all duration-200"
            >
              <span>{isWarehouse ? 'Inspect WMS Hub' : 'Inspect POS Command'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
