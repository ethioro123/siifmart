import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getScopedPriceTargets } from '../../../services/scoped-price-proposals.service';
import { useStore } from '../../../contexts/CentralStore';
import type { PendingInventoryChange } from '../../../types';
export function ScopedPriceTargets({ request, country, currency }: { request: PendingInventoryChange; country: string; currency: string }) {
  const [page, setPage] = useState(0);
  const count = request.priceApprovalRoute?.targetCount || 0;
  const { user } = useStore();
  const query = useQuery({ queryKey: ['scoped-price-targets', country, user?.id, user?.role, request.id, page],
    queryFn: () => getScopedPriceTargets(request.id, page * 25), staleTime: 15_000 });
  return <section aria-label="Scoped price proposal locations" className="mt-4 space-y-3">
    <p className="text-sm font-semibold">{request.priceApprovalRoute?.scopeLabel} · {count} locations · One approval applies the complete proposal.</p>
    {query.isLoading && <p role="status">Loading location prices…</p>}
    {query.isError && <div role="alert">Location prices could not be loaded. <button type="button" onClick={() => void query.refetch()} className="min-h-11 underline">Retry</button></div>}
    {!query.isError && query.data && <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>
      <th className="p-2">Location</th><th className="p-2">Current price</th><th className="p-2">Proposed price</th><th className="p-2">Recorded cost</th><th className="p-2">Margin</th>
    </tr></thead><tbody>{query.data.map(target => {
      const current = target.baseline.is_on_sale && target.baseline.sale_price ? Number(target.baseline.sale_price) : Number(target.baseline.price);
      const onSale = target.proposal.isOnSale ?? target.baseline.is_on_sale;
      const sale = target.proposal.salePrice ?? target.baseline.sale_price;
      const price = onSale && sale ? Number(sale) : Number(target.proposal.price);
      const margin = price > 0 ? Math.round((price - Number(target.baseline.cost_price)) * 100 / price) : null;
      return <tr key={target.productId} className="border-t border-[var(--theme-border)]">
        <td className="p-2">{target.siteName}<p className="text-xs text-[var(--theme-text-secondary)]">{target.siteCode} · {target.regionCode}</p></td>
        <td className="p-2">{currency} {current.toLocaleString()}</td><td className="p-2">{currency} {price.toLocaleString()}</td>
        <td className="p-2">{currency} {Number(target.baseline.cost_price).toLocaleString()}</td><td className="p-2">{margin === null ? 'Unavailable' : `${margin}%`}</td>
      </tr>;
    })}</tbody></table></div>}
    <div className="flex items-center gap-3"><button type="button" disabled={!page || query.isFetching} onClick={() => setPage(page - 1)} className="min-h-11 px-3 disabled:opacity-50">Previous locations</button>
      <span>Page {page + 1} of {Math.max(1, Math.ceil(count / 25))}</span>
      <button type="button" disabled={(page + 1) * 25 >= count || query.isFetching} onClick={() => setPage(page + 1)} className="min-h-11 px-3 disabled:opacity-50">Next locations</button></div>
  </section>;
}
