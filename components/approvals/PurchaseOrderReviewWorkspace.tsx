import React, { useState } from 'react';
import { useStore } from '../../contexts/CentralStore';
import { useData } from '../../contexts/DataContext';
import { usePurchaseOrderReviewWorkspace } from '../../hooks/usePurchaseOrderReviewWorkspace';
import { ViewPOModal } from '../procurement/ViewPOModal';
import POFinanceApprovalsTab from '../financials/POFinanceApprovalsTab';
import { formatPONumber } from '../../utils/jobIdFormatter';
import { getPoApprovalPolicy } from '../../utils/poApprovalPolicy';
import { Link } from 'react-router-dom';

export function PurchaseOrderReviewWorkspace({ initialMode }: { initialMode?: 'orders' | 'finance' } = {}) {
  const { user } = useStore();
  const { effectiveCountry, activeSite } = useData();
  if (!user?.id || !effectiveCountry || !activeSite?.id) return null;
  return <OrderPanel key={`${user.id}:${user.role}:${effectiveCountry}:${activeSite.id}`} initialMode={initialMode} scope={{ actor: user.id, country: effectiveCountry, site: activeSite.id }} />;
}
function OrderPanel({ scope, initialMode }: { scope: { actor: string; country: string; site: string }; initialMode?: 'orders' | 'finance' }) {
  const { user } = useStore();
  const { regions = [], sites, activeSite } = useData();
  const [open, setOpen] = useState(initialMode === 'orders');
  const [financeOpen, setFinanceOpen] = useState(initialMode === 'finance');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const { list, detail, refresh } = usePurchaseOrderReviewWorkspace(scope, page, selected, open);
  const financeRole = ['country_finance_director', 'head_of_finance', 'group_cfo'].includes(user?.role || '');
  const actionStyle = 'min-h-11 px-4 rounded-[10px] border border-[var(--theme-border)] text-sm focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] disabled:opacity-50';
  return <section aria-labelledby="order-workspace-title" className="border-t border-[var(--theme-border)] pt-4 space-y-4">
    <header className="flex flex-wrap gap-3 items-center justify-between"><div><h2 id="order-workspace-title" className="text-lg font-semibold">Purchase order reviews</h2>
      <p className="text-sm text-[var(--theme-text-secondary)]">{activeSite?.name} · Pending orders. Finance clearance and final approval remain separate decisions.</p></div>
      <button type="button" className={actionStyle} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Close purchase orders' : 'Open purchase orders'}</button></header>
    {open && <>
      <button type="button" className={actionStyle} disabled={list.isFetching} onClick={() => refresh()}>Refresh purchase orders</button>
      {list.isPending && <p role="status">Loading purchase orders…</p>}
      {list.isError && <p role="alert">Purchase orders could not be loaded. Refresh to retry.</p>}
      {!list.isError && list.data && <><p className="text-sm">{list.data.count} pending orders in this site. Review availability depends on the order’s current approval stage.</p>
        <ul className="divide-y divide-[var(--theme-border)]">{list.data.data.map(po => {
          const policy = getPoApprovalPolicy({ po, role: user?.role, actorName: user?.name, actorCountryCode: scope.country, actorRegionCode: user?.regionCode || user?.region_code, regions, sites });
          return <li key={po.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div className="min-w-0"><h3 className="font-semibold break-words">{formatPONumber(po)} · {po.supplierName}</h3>
            <p className="text-sm tabular-nums">{po.currency} {po.totalAmount.toLocaleString()}</p><p className="text-sm text-[var(--theme-text-secondary)]">{policy.isCreator ? 'Independent reviewer required.' : policy.statusMessage}</p></div>
            <button type="button" className={actionStyle} onClick={() => setSelected(po.id)} aria-label={'Review purchase order ' + formatPONumber(po)}>Review order</button></li>;
        })}</ul>
        {list.data.data.length === 0 && <p role="status">No pending purchase orders on this page.</p>}
        <nav aria-label="Purchase order pages" className="flex items-center gap-3"><button type="button" className={actionStyle} disabled={page === 1 || list.isFetching} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page}</span><button type="button" className={actionStyle} disabled={page * 25 >= list.data.count || list.isFetching} onClick={() => setPage(page + 1)}>Next</button></nav>
      </>}
      {selected && detail.isFetching && <p role="status">Checking current order evidence…</p>}
      {selected && detail.isError && <p role="alert">Order evidence could not be loaded. <button type="button" className={actionStyle} onClick={() => detail.refetch()}>Retry order evidence</button></p>}
      {selected && detail.data && !detail.isError && !detail.isFetching && <ViewPOModal reviewOnly isOpen po={detail.data} onClose={() => setSelected(null)} onEdit={() => setSelected(null)} onSuccess={() => { setSelected(null); void refresh(); }} />}
      <Link to="/procurement?tab=orders" className="min-h-11 inline-flex items-center text-sm underline">Open full procurement workflow</Link>
    </>}
    {financeRole && <div className="space-y-3"><button type="button" className={actionStyle} aria-expanded={financeOpen} onClick={() => setFinanceOpen(!financeOpen)}>{financeOpen ? 'Close finance clearance queue' : 'Open finance clearance queue'}</button>
      {financeOpen && <POFinanceApprovalsTab />}</div>}
  </section>;
}
