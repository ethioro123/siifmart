import React, { useMemo, useState } from 'react';
import { Check, ClipboardList, Plus, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useStore } from '../contexts/CentralStore';
import { CreatePOModal } from '../components/procurement/CreatePOModal';
import { usePurchaseRequisitions } from '../hooks/usePurchaseRequisitionMutations';
import type { PurchaseRequisition } from '../types/purchaseRequisition';
import type { PurchaseOrder } from '../types';
import { getCountryProfile } from '../utils/localization';
import { hasPermission } from '../utils/permissions';

type DraftItem = { product_name: string; sku: string; quantity: string; unit_cost: string };
const blankItem = (): DraftItem => ({ product_name: '', sku: '', quantity: '1', unit_cost: '' });
const reviewers = ['buyer', 'regional_procurement_manager', 'country_supply_chain_director'];

export default function PurchaseRequests() {
  const { user, showToast } = useStore();
  const { sites, effectiveCountry } = useData();
  const country = effectiveCountry || user?.country_code || 'ET';
  const { requests, submit, review, refresh } = usePurchaseRequisitions(country, `${user?.id || 'anonymous'}:${country}:${user?.regionCode || ''}`);
  const profile = getCountryProfile(country as 'ET' | 'KE');
  const warehouses = useMemo(() => sites.filter(site =>
    site.country === country && ['Warehouse', 'Distribution Center'].includes(site.type) &&
    (!user?.regionCode || !site.regionCode || site.regionCode === user.regionCode)
  ), [sites, country, user?.regionCode]);
  const [destinationId, setDestinationId] = useState('');
  const [title, setTitle] = useState('');
  const [reason, setReason] = useState('');
  const [items, setItems] = useState<DraftItem[]>([blankItem()]);
  const [poDraft, setPoDraft] = useState<Partial<PurchaseOrder> | null>(null);
  const [decisionReason, setDecisionReason] = useState('');
  const canReview = reviewers.includes(user?.role || '');
  const canCreatePO = hasPermission(user?.role, 'CREATE_PO');
  const money = new Intl.NumberFormat(undefined, { style: 'currency', currency: country === 'KE' ? 'KES' : 'ETB' });

  const submitRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    const validItems = items.map(item => ({
      product_name: item.product_name.trim(), sku: item.sku.trim(),
      quantity: Number(item.quantity), unit_cost: Number(item.unit_cost)
    }));
    if (!user?.id || !user.siteId || !destinationId || title.trim().length < 3 || reason.trim().length < 3 ||
      validItems.some(item => !item.product_name || item.quantity <= 0 || item.unit_cost < 0 || !Number.isFinite(item.unit_cost))) {
      showToast('Complete the request details and enter valid item quantities and estimates.', 'warning');
      return;
    }
    try {
      await submit.mutateAsync({ requesterEmployeeId: user.id, requesterName: user.name, requesterSiteId: user.siteId,
        destinationSiteId: destinationId, countryCode: country, title, businessReason: reason, items: validItems });
      setTitle(''); setReason(''); setItems([blankItem()]);
      showToast('Purchase request submitted to Procurement.', 'success');
    } catch (error) { showToast(error instanceof Error ? error.message : 'Could not submit request.', 'error'); }
  };

  const decide = async (request: PurchaseRequisition, decision: 'Approved' | 'Rejected') => {
    if (decision === 'Rejected' && decisionReason.trim().length < 3) {
      showToast('Enter a reason before rejecting this request.', 'warning'); return;
    }
    try {
      await review.mutateAsync({ id: request.id, decision, reason: decisionReason });
      setDecisionReason(''); showToast(`Request ${decision.toLowerCase()}.`, 'success');
    } catch (error) { showToast(error instanceof Error ? error.message : 'Could not review request.', 'error'); }
  };

  const openPO = (request: PurchaseRequisition) => {
    const lineItems = request.items.map((item, index) => ({
      id: `${request.id}-${index}`, productId: '', productName: item.product_name, sku: item.sku,
      quantity: item.quantity, unitCost: item.unit_cost, totalCost: item.quantity * item.unit_cost
    }));
    const initialDraft: Partial<PurchaseOrder> = {
      siteId: request.destination_site_id, countryCode: request.country_code, currency: request.currency,
      notes: `Request ${request.request_number}: ${request.business_reason}`,
      requestedBy: request.requester_name, purchaseRequisitionId: request.id, lineItems
    };
    setPoDraft(initialDraft);
  };

  return <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
    <header className="flex items-center gap-3"><ClipboardList className="h-6 w-6 text-[var(--theme-accent)]" />
      <div><h1 className="text-xl font-semibold text-[var(--theme-text-primary)]">Purchase Requests</h1>
        <p className="text-sm text-[var(--theme-text-secondary)]">Request stock, get a Buyer review, then route the PO for independent approval.</p></div></header>

    <form onSubmit={submitRequest} className="space-y-4 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-surface)] p-4">
      <h2 className="font-semibold">New request</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">Destination warehouse
          <select required value={destinationId} onChange={event => setDestinationId(event.target.value)} className="w-full rounded-lg border p-2">
            <option value="">Choose a warehouse or DC</option>{warehouses.map(site => <option key={site.id} value={site.id}>{site.name}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-sm">Request title
          <input required minLength={3} maxLength={160} value={title} onChange={event => setTitle(event.target.value)} className="w-full rounded-lg border p-2" />
        </label>
      </div>
      <label className="block space-y-1 text-sm">Business reason
        <textarea required minLength={3} maxLength={1200} value={reason} onChange={event => setReason(event.target.value)} className="w-full rounded-lg border p-2" />
      </label>
      {items.map((item, index) => <div key={index} className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]">
        <input aria-label="Item name" placeholder="Item name" required value={item.product_name} onChange={e => setItems(rows => rows.map((row, i) => i === index ? { ...row, product_name: e.target.value } : row))} className="rounded-lg border p-2" />
        <input aria-label="SKU" placeholder="SKU (optional)" value={item.sku} onChange={e => setItems(rows => rows.map((row, i) => i === index ? { ...row, sku: e.target.value } : row))} className="rounded-lg border p-2" />
        <input aria-label="Quantity" type="number" min="1" required value={item.quantity} onChange={e => setItems(rows => rows.map((row, i) => i === index ? { ...row, quantity: e.target.value } : row))} className="rounded-lg border p-2" />
        <input aria-label={`Estimated unit cost (${profile.currencyCode})`} type="number" min="0" step="0.01" required placeholder={`Unit cost (${profile.currencyCode})`} value={item.unit_cost} onChange={e => setItems(rows => rows.map((row, i) => i === index ? { ...row, unit_cost: e.target.value } : row))} className="rounded-lg border p-2" />
        <button type="button" aria-label="Remove item" onClick={() => setItems(rows => rows.filter((_, i) => i !== index))} disabled={items.length === 1} className="rounded-lg border px-3 disabled:opacity-40"><X size={16} /></button>
      </div>)}
      <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setItems(rows => [...rows, blankItem()])} className="rounded-lg border px-3 py-2"><Plus size={16} className="mr-1 inline" />Add item</button>
        <button disabled={submit.isPending || !warehouses.length} className="rounded-lg bg-[var(--theme-accent)] px-4 py-2 text-white">{submit.isPending ? 'Submitting…' : 'Submit request'}</button></div>
    </form>

    <section className="space-y-3"><div className="flex items-center justify-between"><h2 className="font-semibold">Requests visible to you</h2>
      <button type="button" onClick={() => refresh()} className="rounded-lg border px-3 py-2 text-sm">Refresh</button></div>
      {requests.isLoading ? <p>Loading requests…</p> : requests.error ? <p role="alert">{requests.error.message}</p> : !requests.data?.length ? <p className="text-sm text-[var(--theme-text-secondary)]">No requests yet.</p> : requests.data.map(request => {
        const estimated = Number(request.estimated_total);
        return <article key={request.id} className="space-y-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-surface)] p-4">
          <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-semibold">{request.request_number} · {request.title}</h3>
            <p className="text-sm text-[var(--theme-text-secondary)]">{request.requester_name} · {sites.find(site => site.id === request.destination_site_id)?.name || 'Warehouse'} · {money.format(estimated)}</p></div>
            <span className="rounded-full border px-3 py-1 text-sm">{request.status}</span></div>
          <p className="text-sm">{request.business_reason}</p><ul className="list-inside list-disc text-sm">{request.items.map((item, i) => <li key={`${request.id}-${i}`}>{item.quantity} × {item.product_name}{item.sku ? ` (${item.sku})` : ''} — {money.format(item.quantity * item.unit_cost)}</li>)}</ul>
          {request.decision_reason && <p className="text-sm text-[var(--theme-text-secondary)]">Review note: {request.decision_reason}</p>}
          {canReview && request.status === 'Submitted' && request.requester_employee_id !== user?.id && <div className="flex flex-wrap gap-2">
            <input aria-label="Decision note" placeholder="Note or rejection reason" value={decisionReason} onChange={e => setDecisionReason(e.target.value)} className="min-w-48 flex-1 rounded-lg border p-2" />
            <button onClick={() => decide(request, 'Approved')} disabled={review.isPending} className="rounded-lg border px-3 py-2"><Check size={16} className="mr-1 inline" />Buyer review</button>
            <button onClick={() => decide(request, 'Rejected')} disabled={review.isPending} className="rounded-lg border px-3 py-2">Reject</button>
          </div>}
          {request.status === 'Approved' && canCreatePO && request.requester_employee_id !== user?.id && <button onClick={() => openPO(request)} className="rounded-lg bg-[var(--theme-accent)] px-3 py-2 text-white">Create draft PO</button>}
        </article>;
      })}
    </section>
    {poDraft && <CreatePOModal isOpen onClose={() => setPoDraft(null)} initialDraft={poDraft} onSuccess={() => { setPoDraft(null); refresh(); }} />}
  </div>;
}
