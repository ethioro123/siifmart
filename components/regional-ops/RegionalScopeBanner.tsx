import React from 'react';
import { MapPin, Globe } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';

interface RegionalScopeBannerProps {
  moduleName?: string;
  subtitle?: string;
  guardrailBadge?: React.ReactNode;
}

export function RegionalScopeBanner({ moduleName: _moduleName, subtitle, guardrailBadge }: RegionalScopeBannerProps) {
  const { user } = useStore();
  const {
    regions = [],
    activeRegionCode,
    setActiveRegionCode,
    canSwitchRegion,
    isRegionalUser,
    effectiveCountry
  } = useData();

  const isRegionalStaff = isRegionalUser || user?.scopeLevel === 'REGIONAL' || (user as any)?.scope_level === 'REGIONAL';
  const activeRegion = regions.find(r => r.code === activeRegionCode);
  const territoryTitle = activeRegion ? activeRegion.name : 'All Territories';

  return (
    <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
          isRegionalStaff
            ? 'bg-[var(--theme-status-info-bg)] border-[var(--theme-status-info-border)] text-[var(--theme-accent)] dark:text-[var(--theme-accent)]'
            : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-primary)]'
        }`}>
          {isRegionalStaff ? <MapPin size={18} /> : <Globe size={18} />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--theme-text-primary)]">
              {isRegionalStaff ? `${territoryTitle} (Regional Scope)` : `Territory Scope: ${territoryTitle}`}
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
              isRegionalStaff
                ? 'bg-[var(--theme-status-info-bg)] text-[var(--theme-accent)] dark:text-[var(--theme-accent)] border-[var(--theme-status-info-border)]'
                : 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]'
            }`}>
              {isRegionalStaff ? 'Autonomous Regional Ops' : 'HQ Governance Deck'}
            </span>
          </div>
          <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5 font-normal">
            {subtitle || (isRegionalStaff
              ? `Operational workflows automatically focused on ${territoryTitle} facilities.`
              : 'Viewing consolidated performance. Select a territory lens to inspect regional operations.')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {guardrailBadge}
        {canSwitchRegion && !isRegionalStaff && regions.length > 0 && (
          <div className="flex items-center gap-1.5">
            <select
              value={activeRegionCode || 'ALL'}
              onChange={(e) => setActiveRegionCode(e.target.value === 'ALL' ? null : e.target.value)}
              aria-label="Select territory lens"
              className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 py-1.5 text-xs font-semibold text-[var(--theme-text-primary)] outline-none focus:border-[var(--theme-accent)] transition-colors cursor-pointer"
            >
              <option value="ALL">All Territories ({effectiveCountry})</option>
              {regions.map(r => (
                <option key={r.code} value={r.code}>{r.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
