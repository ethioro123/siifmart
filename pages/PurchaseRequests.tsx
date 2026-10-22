import React, { useMemo, useState } from 'react';
import { Check, ClipboardList, Lightbulb, Plus, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useStore } from '../contexts/CentralStore';
import { CreatePOModal } from '../components/procurement/CreatePOModal';
import { usePurchaseRequisitions } from '../hooks/usePurchaseRequisitionMutations';
import { useProductSuggestions } from '../hooks/useProductSuggestions';
import type { PurchaseRequisition } from '../types/purchaseRequisition';
import type { ProductSuggestion, ProductSuggestionStatus } from '../types/productSuggestion';
import type { PurchaseOrder } from '../types';
import { hasPermission } from '../utils/permissions';

type DraftItem = { product_id: string; product_name: string; sku: string; quantity: string };
const blankItem = (): DraftItem => ({ product_id: '', product_name: '', sku: '', quantity: '1' });
const requestReviewers = ['buyer', 'regional_procurement_manager', 'country_supply_chain_director'];
const suggestionReviewers = [
  'group_ceo', 'country_commercial_director', 'country_supply_chain_director',
  'regional_procurement_manager', 'regional_merchandising_manager', 'buyer',
  'demand_planner', 'vendor_relations_manager', 'merchandising_specialist'
];
const suggestionDecisions: ProductSuggestionStatus[] = [
  'Under Review', 'Accepted for Sourcing', 'Duplicate', 'Declined'
];

export default function PurchaseRequests() {
  const { user, showToast } = useStore();
  const { sites, products, effectiveCountry } = useData();
  const country = effectiveCountry || user?.country_code || 'ET';
  const cacheScope = [user?.id || 'anonymous', country, user?.regionCode || ''].join(':');
  const { requests, submit, review, refresh } = usePurchaseRequisitions(country, cacheScope);
  const productSuggestions = useProductSuggestions(country, cacheScope);
  const warehouses = useMemo(() => sites.filter(site =>
    site.country === country && ['Warehouse', 'Distribution Center'].includes(site.type) &&
    (!user?.regionCode || !site.regionCode || site.regionCode === user.regionCode)
  ), [sites, country, user?.regionCode]);
  const requestableProducts = products.filter(product => {
    const approval = product.approvalStatus || product.approval_status;
    return product.status !== 'archived' && (!approval || approval === 'approved');
  });
  const assignedSite = sites.find(site => site.id === user?.siteId);
  const canSubmitSuggestion = Boolean(user?.id && user.siteId &&
    assignedSite && ['Store', 'Warehouse', 'Distribution Center'].includes(assignedSite.type));
  const [destinationId, setDestinationId] = useState('');
  const [title, setTitle] = useState('');
  const [reason, setReason] = useState('');
  const [items, setItems] = useState<DraftItem[]>([blankItem()]);
  const [poDraft, setPoDraft] = useState<Partial<PurchaseOrder> | null>(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [suggestedName, setSuggestedName] = useState('');
  const [suggestedCategory, setSuggestedCategory] = useState('');
  const [brandOrExample, setBrandOrExample] = useState('');
  const [productDetails, setProductDetails] = useState('');
  const [demandSignal, setDemandSignal] = useState('');
  const [requestCount, setRequestCount] = useState('');
  const [suggestionNotes, setSuggestionNotes] = useState<Record<string, string>>({});
  const canReviewRequests = requestReviewers.includes(user?.role || '');
  const canReviewSuggestions = suggestionReviewers.includes(user?.role || '');
  const canCreatePO = hasPermission(user?.role, 'CREATE_PO');

  const submitRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    const validItems = items.map(item => ({
      product_name: item.product_name.trim(),
      sku: item.sku.trim(),
      quantity: Number(item.quantity)
    }));
    if (!user?.id || !user.siteId || !destinationId || title.trim().length < 3 || reason.trim().length < 3 ||
      validItems.some((item, index) => !items[index].product_id || !item.product_name || item.quantity <= 0 || !Number.isFinite(item.quantity))) {
      showToast('Complete the request details and enter valid item quantities.', 'warning');
      return;
    }
    try {
      await submit.mutateAsync({
        requesterEmployeeId: user.id, requesterName: user.name, requesterSiteId: user.siteId,
        destinationSiteId: destinationId, countryCode: country, title, businessReason: reason, items: validItems
      });
      setTitle(''); setReason(''); setItems([blankItem()]);
      showToast('Stock request submitted to Procurement.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not submit request.', 'error');
    }
  };

  const submitProductSuggestion = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.id || !user.siteId || suggestedName.trim().length < 2 || demandSignal.trim().length < 3 ||
      (requestCount && (!Number.isInteger(Number(requestCount)) || Number(requestCount) < 0))) {
      showToast('Describe the product and the demand you observed.', 'warning');
      return;
    }
    try {
      await productSuggestions.submit.mutateAsync({
        submitterEmployeeId: user.id,
        siteId: user.siteId,
        productName: suggestedName,
        category: suggestedCategory,
        brandOrExample,
        productDetails,
        demandSignal,
        customerRequestCount: requestCount ? Number(requestCount) : null
      });
      setSuggestedName(''); setSuggestedCategory(''); setBrandOrExample('');
      setProductDetails(''); setDemandSignal(''); setRequestCount('');
      showToast('Product suggestion sent to Procurement for review.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not submit product suggestion.', 'error');
    }
  };

  const decideRequest = async (request: PurchaseRequisition, decision: 'Approved' | 'Rejected') => {
    if (decision === 'Rejected' && decisionReason.trim().length < 3) {
      showToast('Enter a reason before rejecting this request.', 'warning');
      return;
    }
    try {
      await review.mutateAsync({ id: request.id, decision, reason: decisionReason });
      setDecisionReason('');
      showToast('Request ' + decision.toLowerCase() + '.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not review request.', 'error');
    }
  };

  const decideSuggestion = async (suggestion: ProductSuggestion, decision: ProductSuggestionStatus) => {
    const note = suggestionNotes[suggestion.id] || '';
    if (['Declined', 'Duplicate'].includes(decision) && note.trim().length < 3) {
      showToast('Add a short note before declining or marking a duplicate.', 'warning');
      return;
    }
    try {
      await productSuggestions.review.mutateAsync({ id: suggestion.id, decision, note });
      setSuggestionNotes(notes => ({ ...notes, [suggestion.id]: '' }));
      showToast(decision === 'Accepted for Sourcing'
        ? 'Suggestion accepted for sourcing review.'
        : 'Suggestion marked ' + decision.toLowerCase() + '.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not review product suggestion.', 'error');
    }
  };

  const openPO = (request: PurchaseRequisition) => {
    const lineItems = request.items.map((item, index) => ({
      id: request.id + '-' + index, productId: '', productName: item.product_name, sku: item.sku,
      quantity: item.quantity, unitCost: item.unit_cost ?? 0, totalCost: item.quantity * (item.unit_cost ?? 0)
    }));
    const initialDraft: Partial<PurchaseOrder> = {
      siteId: request.destination_site_id, countryCode: request.country_code, currency: request.currency,
      notes: 'Request ' + request.request_number + ': ' + request.business_reason,
      requestedBy: request.requester_name, purchaseRequisitionId: request.id, lineItems
    };
    setPoDraft(initialDraft);
  };

  return <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
    <header className="flex items-center gap-3">
      <ClipboardList className="h-6 w-6 text-[var(--theme-accent)]" />
      <div>
        <h1 className="text-xl font-semibold text-[var(--theme-text-primary)]">Purchase Requests</h1>
        <p className="text-sm text-[var(--theme-text-secondary)]">
          Request stock already in the range, or report unmet product demand for Procurement to investigate.
        </p>
      </div>
    </header>

    <div className="grid gap-5 lg:grid-cols-2">
      <form onSubmit={submitRequest} className="space-y-4 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-surface)] p-4">
        <div>
          <h2 className="font-semibold">Request existing stock</h2>
          <p className="text-sm text-[var(--theme-text-secondary)]">Choose an approved item already in your site catalog and enter quantity. Procurement completes sourcing and price.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">Destination warehouse
            <select required value={destinationId} onChange={event => setDestinationId(event.target.value)} className="w-full rounded-lg border p-2">
              <option value="">Choose a warehouse or DC</option>
              {warehouses.map(site => <option key={site.id} value={site.id}>{site.name}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm">Request title
            <input required minLength={3} maxLength={160} value={title} onChange={event => setTitle(event.target.value)} className="w-full rounded-lg border p-2" />
          </label>
        </div>
        <label className="block space-y-1 text-sm">Business reason
          <textarea required minLength={3} maxLength={1200} value={reason} onChange={event => setReason(event.target.value)} className="w-full rounded-lg border p-2" />
        </label>
        {items.map((item, index) => <div key={index} className="grid gap-2 sm:grid-cols-[2fr_1fr_auto]">
          <label className="space-y-1 text-sm">Existing catalog item
            <select aria-label="Existing catalog item" required value={item.product_id} onChange={event => {
              const product = requestableProducts.find(candidate => candidate.id === event.target.value);
              setItems(rows => rows.map((row, i) => i === index ? {
                ...row, product_id: product?.id || '', product_name: product?.name || '', sku: product?.sku || ''
              } : row));
            }} className="w-full rounded-lg border p-2">
              <option value="">Choose an item already in your site catalog</option>
              {requestableProducts.map(product => <option key={product.id} value={product.id}>{product.name} · {product.sku}</option>)}
            </select>
          </label>
          <input aria-label="Quantity" type="number" min="1" required value={item.quantity} onChange={e => setItems(rows => rows.map((row, i) => i === index ? { ...row, quantity: e.target.value } : row))} className="rounded-lg border p-2" />
          <button type="button" aria-label="Remove item" onClick={() => setItems(rows => rows.filter((_, i) => i !== index))} disabled={items.length === 1} className="rounded-lg border px-3 disabled:opacity-40"><X size={16} /></button>
        </div>)}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setItems(rows => [...rows, blankItem()])} className="rounded-lg border px-3 py-2"><Plus size={16} className="mr-1 inline" />Add item</button>
          <button disabled={submit.isPending || !warehouses.length} className="rounded-lg bg-[var(--theme-accent)] px-4 py-2 text-white">{submit.isPending ? 'Submitting…' : 'Submit stock request'}</button>
        </div>
      </form>

      {canSubmitSuggestion && <form onSubmit={submitProductSuggestion} className="space-y-4 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-surface)] p-4">
        <div className="flex items-start gap-2">
          <Lightbulb className="mt-0.5 h-5 w-5 text-[var(--theme-accent)]" />
          <div>
            <h2 className="font-semibold">Suggest a product</h2>
            <p className="text-sm text-[var(--theme-text-secondary)]">
              Report what customers or your site need. Procurement checks demand and sourcing. No supplier or price needed.
            </p>
            <p className="mt-1 text-xs text-[var(--theme-text-secondary)]">Submitted from {assignedSite?.name}</p>
          </div>
        </div>
        <label className="block space-y-1 text-sm">Product or need
          <input required minLength={2} maxLength={160} value={suggestedName} onChange={event => setSuggestedName(event.target.value)} placeholder="For example, lactose-free 1L milk" className="w-full rounded-lg border p-2" />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">Category (optional)
            <input maxLength={100} value={suggestedCategory} onChange={event => setSuggestedCategory(event.target.value)} placeholder="Dairy" className="w-full rounded-lg border p-2" />
          </label>
          <label className="space-y-1 text-sm">Brand or example (optional)
            <input maxLength={160} value={brandOrExample} onChange={event => setBrandOrExample(event.target.value)} className="w-full rounded-lg border p-2" />
          </label>
        </div>
        <label className="block space-y-1 text-sm">Useful details (optional)
          <input maxLength={500} value={productDetails} onChange={event => setProductDetails(event.target.value)} placeholder="Size, pack type, or key feature" className="w-full rounded-lg border p-2" />
        </label>
        <label className="block space-y-1 text-sm">What did you observe?
          <textarea required minLength={3} maxLength={1000} value={demandSignal} onChange={event => setDemandSignal(event.target.value)} placeholder="Customer requests, unmet need, or repeated substitute requests" className="w-full rounded-lg border p-2" />
        </label>
        <label className="block space-y-1 text-sm">Approximate customer requests (optional)
          <input type="number" min="0" step="1" value={requestCount} onChange={event => setRequestCount(event.target.value)} className="w-full rounded-lg border p-2" />
        </label>
        <button disabled={productSuggestions.submit.isPending} className="rounded-lg bg-[var(--theme-accent)] px-4 py-2 text-white">
          {productSuggestions.submit.isPending ? 'Sending…' : 'Send suggestion'}
        </button>
      </form>}
    </div>

    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Product suggestions visible to you</h2>
        <button type="button" onClick={() => productSuggestions.refresh()} className="rounded-lg border px-3 py-2 text-sm">Refresh</button>
      </div>
      {productSuggestions.suggestions.isLoading ? <p>Loading suggestions…</p>
        : productSuggestions.suggestions.error ? <p role="alert">{productSuggestions.suggestions.error.message}</p>
        : !productSuggestions.suggestions.data?.length ? <p className="text-sm text-[var(--theme-text-secondary)]">No product suggestions yet.</p>
        : productSuggestions.suggestions.data.map(suggestion => {
          const mayReview = canReviewSuggestions && ['Submitted', 'Under Review'].includes(suggestion.status)
            && suggestion.submitter_employee_id !== user?.id;
          return <article key={suggestion.id} className="space-y-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-surface)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold">{suggestion.product_name}</h3>
                <p className="text-sm text-[var(--theme-text-secondary)]">
                  {[suggestion.category, suggestion.brand_or_example, sites.find(site => site.id === suggestion.site_id)?.name].filter(Boolean).join(' · ')}
                </p>
              </div>
              <span className="rounded-full border px-3 py-1 text-sm">{suggestion.status}</span>
            </div>
            {suggestion.product_details && <p className="text-sm">{suggestion.product_details}</p>}
            <p className="text-sm">{suggestion.demand_signal}</p>
            {suggestion.customer_request_count !== null && <p className="text-xs text-[var(--theme-text-secondary)]">Approximate customer requests: {suggestion.customer_request_count}</p>}
            {suggestion.review_note && <p className="text-sm text-[var(--theme-text-secondary)]">Review note: {suggestion.review_note}</p>}
            {mayReview && <div className="space-y-2">
              <input aria-label="Product suggestion review note" placeholder="Review note (required for decline or duplicate)" value={suggestionNotes[suggestion.id] || ''} onChange={event => setSuggestionNotes(notes => ({ ...notes, [suggestion.id]: event.target.value }))} className="w-full rounded-lg border p-2" />
              <div className="flex flex-wrap gap-2">
                {suggestionDecisions.map(decision => <button key={decision} type="button" onClick={() => decideSuggestion(suggestion, decision)} disabled={productSuggestions.review.isPending} className="rounded-lg border px-3 py-2 text-sm">
                  {decision === 'Under Review' ? 'Start review' : decision === 'Accepted for Sourcing' ? 'Accept for sourcing' : decision === 'Duplicate' ? 'Mark duplicate' : 'Decline'}
                </button>)}
              </div>
            </div>}
          </article>;
        })}
    </section>

    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Stock requests visible to you</h2>
        <button type="button" onClick={() => refresh()} className="rounded-lg border px-3 py-2 text-sm">Refresh</button>
      </div>
      {requests.isLoading ? <p>Loading requests…</p> : requests.error ? <p role="alert">{requests.error.message}</p> : !requests.data?.length ? <p className="text-sm text-[var(--theme-text-secondary)]">No requests yet.</p> : requests.data.map(request =>
        <article key={request.id} className="space-y-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-surface)] p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold">{request.request_number} · {request.title}</h3>
              <p className="text-sm text-[var(--theme-text-secondary)]">{request.requester_name} · {sites.find(site => site.id === request.destination_site_id)?.name || 'Warehouse'}</p>
            </div>
            <span className="rounded-full border px-3 py-1 text-sm">{request.status}</span>
          </div>
          <p className="text-sm">{request.business_reason}</p>
          <ul className="list-inside list-disc text-sm">{request.items.map((item, i) => <li key={request.id + '-' + i}>{item.quantity} × {item.product_name}{item.sku ? ' (' + item.sku + ')' : ''}</li>)}</ul>
          {request.decision_reason && <p className="text-sm text-[var(--theme-text-secondary)]">Review note: {request.decision_reason}</p>}
          {canReviewRequests && request.status === 'Submitted' && request.requester_employee_id !== user?.id && <div className="flex flex-wrap gap-2">
            <input aria-label="Decision note" placeholder="Note or rejection reason" value={decisionReason} onChange={e => setDecisionReason(e.target.value)} className="min-w-48 flex-1 rounded-lg border p-2" />
            <button onClick={() => decideRequest(request, 'Approved')} disabled={review.isPending} className="rounded-lg border px-3 py-2"><Check size={16} className="mr-1 inline" />Buyer review</button>
            <button onClick={() => decideRequest(request, 'Rejected')} disabled={review.isPending} className="rounded-lg border px-3 py-2">Reject</button>
          </div>}
          {request.status === 'Approved' && canCreatePO && request.requester_employee_id !== user?.id && <button onClick={() => openPO(request)} className="rounded-lg bg-[var(--theme-accent)] px-3 py-2 text-white">Create draft PO</button>}
        </article>
      )}
    </section>
    {poDraft && <CreatePOModal isOpen onClose={() => setPoDraft(null)} initialDraft={poDraft} onSuccess={() => { setPoDraft(null); refresh(); }} />}
  </div>;
}
