import React from 'react';
import {
  Box, AlertTriangle, Thermometer, UserPlus,
  Warehouse as WarehouseIcon
} from 'lucide-react';
import DateRangeSelector, { DateRangeOption } from '../DateRangeSelector';
import type { Site } from '../../types';

interface WMSHeaderBarProps {
  countryProfile: { name: string };
  activeCountry: string;
  refreshing: boolean;
  isCurrentSiteWarehouse: boolean;
  effectiveWarehouse: Partial<Site> | null;
  countryWarehouses: Site[];
  onSelectWarehouse: (id: string) => void;
  activeAlerts: number;
  coldZone?: { name: string; temperature?: string } | null;
  totalZonesCount: number;
  canOnboard: boolean;
  onOpenOnboardModal: () => void;
  dateRange: DateRangeOption;
  onDateRangeChange: (range: DateRangeOption) => void;
}

export const WMSHeaderBar: React.FC<WMSHeaderBarProps> = ({
  countryProfile,
  activeCountry,
  refreshing,
  isCurrentSiteWarehouse,
  effectiveWarehouse,
  countryWarehouses,
  onSelectWarehouse,
  activeAlerts,
  coldZone,
  totalZonesCount,
  canOnboard,
  onOpenOnboardModal,
  dateRange,
  onDateRangeChange,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[var(--theme-border)]">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[#0071E3] dark:text-[#2997FF] rounded-xl flex items-center justify-center shrink-0 shadow-xs">
            <Box size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--theme-text-primary)] tracking-tight">
                Warehouse Operations Center
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF] border border-[#0071E3]/20">
                {countryProfile.name} ({activeCountry})
              </span>
            </div>
            <div className="flex items-center gap-2 text-[var(--theme-text-secondary)] text-xs font-medium mt-1">
              <span className={`w-2 h-2 rounded-full ${refreshing ? 'bg-[#FF9500] animate-pulse' : 'bg-[#34C759]'}`} />
              <span>
                {refreshing
                  ? 'Synchronizing Operational Data...'
                  : isCurrentSiteWarehouse
                    ? `Operational Logistics Node • ${effectiveWarehouse?.name || 'Central Facility'}`
                    : `Regional Logistics Hub • ${effectiveWarehouse?.name || 'Supplying Facility'} (${effectiveWarehouse?.code || 'WH'})`
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Multi-Warehouse Selector for HQ / Admin roles within active sovereign country */}
        {!isCurrentSiteWarehouse && countryWarehouses.length > 1 && (
          <div className="flex items-center gap-1.5 p-1 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl shadow-2xs">
            <WarehouseIcon size={13} className="text-[var(--theme-text-secondary)] ml-1.5" />
            <select
              value={effectiveWarehouse?.id || ''}
              onChange={(e) => onSelectWarehouse(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[var(--theme-text-primary)] focus:outline-hidden cursor-pointer pr-1"
              aria-label="Select Sovereign Warehouse Hub"
            >
              {countryWarehouses.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.code ? `[${w.code}]` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[#FF3B30] dark:text-[#FF453A] text-xs font-medium rounded-xl flex items-center shadow-2xs">
            <AlertTriangle size={13} className="mr-1.5" />
            {activeAlerts} Alerts Active
          </div>

          {/* Dynamic Real Zone Temperature Telemetry */}
          {coldZone ? (
            <div className="px-3 py-1.5 bg-[#0071E3]/10 border border-[#0071E3]/20 text-[#0071E3] dark:text-[#2997FF] text-xs font-medium rounded-xl flex items-center shadow-2xs">
              <Thermometer size={13} className="mr-1.5" />
              {coldZone.name}: {coldZone.temperature || 'Cold Chain'}
            </div>
          ) : (
            <div className="px-3 py-1.5 bg-[#0071E3]/10 border border-[#0071E3]/20 text-[#0071E3] dark:text-[#2997FF] text-xs font-medium rounded-xl flex items-center shadow-2xs">
              <Box size={13} className="mr-1.5" />
              {totalZonesCount} Storage Zones
            </div>
          )}
        </div>

        {canOnboard && (
          <button
            type="button"
            onClick={onOpenOnboardModal}
            className="h-9 px-3.5 bg-[#0071E3] dark:bg-[#2997FF] hover:opacity-90 active:scale-95 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
            title="Onboard warehouse pickers, packers, receivers, drivers & operators"
          >
            <UserPlus size={14} />
            <span>Onboard Talent</span>
          </button>
        )}

        <DateRangeSelector
          value={dateRange}
          onChange={onDateRangeChange}
        />
      </div>
    </div>
  );
};

export default WMSHeaderBar;
