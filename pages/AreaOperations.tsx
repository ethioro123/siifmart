import { Building2, CreditCard, Users, Truck } from 'lucide-react';
import type { RegionalOperationsData } from '../hooks/useRegionalOperationsData';
import { formatCompactNumber } from '../utils/formatting';
import { RegionalTransferDesk } from '../components/regional-ops/RegionalTransferDesk';

interface Props {
  data: RegionalOperationsData;
}

export default function AreaOperations({ data }: Props) {
  const { regionalSites, regionalEmployees, sitePerformance, metrics, currencySymbol } = data;

  if (data.areaMetricsUnavailable) {
    return <div className="p-6 text-[var(--theme-text-primary)]" role="status">
      Assigned store metrics are loading or unavailable. Refresh to try again.
    </div>;
  }

  return <main className="space-y-6 p-3 sm:p-6 pb-24 text-[var(--theme-text-primary)]">
    <header>
      <h1 className="text-2xl font-bold">Area operations</h1>
      <p className="text-sm text-[var(--theme-text-secondary)]">
        Assigned stores in {data.currentRegion?.name || data.regionCode}
      </p>
    </header>

    <section aria-label="Assigned store summary" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-4">
        <Building2 aria-hidden="true" className="w-5 h-5 text-[var(--theme-accent)]" />
        <div className="text-2xl font-bold mt-2">{regionalSites.length}</div>
        <div className="text-sm text-[var(--theme-text-secondary)]">Assigned stores</div>
      </div>
      <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-4">
        <CreditCard aria-hidden="true" className="w-5 h-5 text-[var(--theme-accent)]" />
        <div className="text-2xl font-bold mt-2">{formatCompactNumber(metrics.todaySalesTotal, { currency: currencySymbol })}</div>
        <div className="text-sm text-[var(--theme-text-secondary)]">Today’s completed sales · {metrics.todaySalesCount} transactions</div>
      </div>
      <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-4">
        <Users aria-hidden="true" className="w-5 h-5 text-[var(--theme-accent)]" />
        <div className="text-2xl font-bold mt-2">{sitePerformance.reduce((sum, site) => sum + site.staffCount, 0)}</div>
        <div className="text-sm text-[var(--theme-text-secondary)]">Active store staff</div>
      </div>
    </section>

    <section aria-label="Store performance">
      <h2 className="text-lg font-semibold mb-3">Store performance this month</h2>
      {sitePerformance.length === 0 ? <p className="rounded-xl border border-[var(--theme-border)] p-4 text-sm">
        No stores are assigned to your area. Regional operations leadership can assign stores in Locations.
      </p> : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {sitePerformance.map(site => <article key={site.id} className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-4">
          <h3 className="font-semibold">{site.name}</h3>
          <p className="mt-2 text-xl font-bold">{formatCompactNumber(site.revenue, { currency: currencySymbol })}</p>
          <p className="text-sm text-[var(--theme-text-secondary)]">Monthly completed sales · {site.transactionCount} today</p>
          <p className="text-sm text-[var(--theme-text-secondary)]">{site.staffCount} active staff</p>
        </article>)}
      </div>}
    </section>

    {regionalSites.length > 0 && <section aria-label="Store stock coordination">
      <div className="flex items-center gap-2 mb-3"><Truck aria-hidden="true" className="w-5 h-5" /><h2 className="text-lg font-semibold">Store stock coordination</h2></div>
      <RegionalTransferDesk regionCode={data.regionCode} regionalSites={regionalSites}
        regionalEmployees={regionalEmployees} currencySymbol={currencySymbol} />
    </section>}
  </main>;
}
