import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Warehouse, Building2, ArrowUpRight } from 'lucide-react';
import type { Site } from '../../types';
import type { RegionalOperatingSummaryRow } from '../../hooks/useRegionalOperatingSummary';
import { formatCompactNumber } from '../../utils/formatting';
import { useData } from '../../contexts/DataContext';

interface TerritoryFacilityGridProps {
  sites: Site[];
  summaryRows: RegionalOperatingSummaryRow[];
  currencySymbol: string;
}

export const TerritoryFacilityGrid: React.FC<TerritoryFacilityGridProps> = ({ sites, summaryRows, currencySymbol }) => {
  const navigate = useNavigate();
  const { setActiveSite } = useData();
  if (sites.length === 0) return (
    <div className="p-8 text-center bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)]">
      <Store className="w-10 h-10 mx-auto text-[var(--theme-text-secondary)] mb-3" />
      <h3 className="text-base font-semibold text-[var(--theme-text-primary)]">No territorial facilities found</h3>
    </div>
  );

  return <section className="space-y-4">
    <div>
      <h3 className="text-base font-semibold text-[var(--theme-text-primary)]">Territorial Facility Grid</h3>
      <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">Current country day sales, open tills, and active staff by facility</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {sites.map(site => {
        const row = summaryRows.find(item => item.site_id === site.id);
        const type = (site.type || '').toLowerCase();
        const isWarehouse = type.includes('warehouse') || type.includes('distribution');
        const isAdministration = type.includes('admin');
        return <div key={site.id} className="p-5 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--theme-bg-subtle)] flex items-center justify-center text-[var(--theme-accent)]">
                {isAdministration ? <Building2 size={20} /> : isWarehouse ? <Warehouse size={20} /> : <Store size={20} />}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-[var(--theme-text-primary)] truncate">{site.name}</h4>
                <span className="text-[11px] text-[var(--theme-text-secondary)]">{site.type}</span>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-2 mt-4 text-xs">
              <div className="p-2 rounded-xl bg-[var(--theme-bg-subtle)]"><dt className="text-[var(--theme-text-secondary)]">Today sales</dt><dd className="font-semibold text-[var(--theme-text-primary)]">{formatCompactNumber(row?.today_sales_total ?? 0, { currency: currencySymbol })}</dd></div>
              <div className="p-2 rounded-xl bg-[var(--theme-bg-subtle)]"><dt className="text-[var(--theme-text-secondary)]">Transactions</dt><dd className="font-semibold text-[var(--theme-text-primary)]">{row?.today_sales_count ?? 0}</dd></div>
              <div className="p-2 rounded-xl bg-[var(--theme-bg-subtle)]"><dt className="text-[var(--theme-text-secondary)]">Open tills</dt><dd className="font-semibold text-[var(--theme-text-primary)]">{row?.open_register_count ?? 0}</dd></div>
              <div className="p-2 rounded-xl bg-[var(--theme-bg-subtle)]"><dt className="text-[var(--theme-text-secondary)]">Active staff</dt><dd className="font-semibold text-[var(--theme-text-primary)]">{row?.staff_count ?? 0}</dd></div>
            </dl>
          </div>
          <button type="button" onClick={() => {
            setActiveSite?.(site.id);
            navigate(isAdministration ? '/regional-ops' : isWarehouse ? '/wms-dashboard' : '/pos-dashboard');
          }} className="mt-4 w-full min-h-11 flex items-center justify-center gap-1.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">
            Inspect facility <ArrowUpRight size={14} />
          </button>
        </div>;
      })}
    </div>
  </section>;
};
