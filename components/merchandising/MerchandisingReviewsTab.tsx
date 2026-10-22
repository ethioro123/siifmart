import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useStore } from '../../contexts/CentralStore';
import { useData } from '../../contexts/DataContext';
import { inventoryRequestsService } from '../../services/inventory-requests.service';
import { isBelowMarginFloor } from '../../utils/pricingGovernance';
import { logger } from '../../utils/logger';
import { useMerchandising } from './MerchandisingContext';
import { useCreateInventoryRequestMutation } from '../../hooks/useInventoryRequestMutations';

const MERCHANDISING_LEADS = new Set(['group_ceo', 'country_commercial_director', 'regional_merchandising_manager']);
const FINANCE_LEADS = new Set(['group_ceo', 'country_finance_director', 'regional_finance_manager']);

export const MerchandisingReviewsTab: React.FC = () => {
  const { user } = useStore();
  const { addNotification, effectiveCountry } = useData();
  const { products } = useMerchandising();
  const [productId, setProductId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const createRequest = useCreateInventoryRequestMutation();
  const country = (effectiveCountry || user?.country || 'ET').toUpperCase();
  const role = (user?.role || '').toLowerCase();
  const queryClient = useQueryClient();
  const queryKey = ['merchandising_reviews', country];
  const { data: requests = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: () => inventoryRequestsService.getMerchandisingPending(country)
  });
  const decision = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'approve' | 'finance' }) => {
      if (action === 'approve') await inventoryRequestsService.approveMerchandising(id);
      else await inventoryRequestsService.signoffMerchandisingPrice(id);
      return action;
    },
    onSuccess: action => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['inventory_requests'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      addNotification('success', action === 'approve' ? 'Proposal approved and applied.' : 'Finance signoff recorded.');
    },
    onError: error => {
      logger.error('MerchandisingReviewsTab', 'Decision failed', error as Error);
      addNotification('alert', `Decision failed: ${(error as Error).message}`);
    }
  });

  const submitProductProposal = async () => {
    const product = products.find(item => item.id === productId);
    const siteId = product?.siteId || (product as typeof product & { site_id?: string })?.site_id;
    if (!product || !siteId || (!name.trim() && !description.trim())) {
      addNotification('alert', 'Select a product and enter a name or description.');
      return;
    }
    try {
      await createRequest.mutateAsync({
        productId: product.id, productName: product.name, productSku: product.sku,
        siteId, countryCode: country, changeType: 'edit', status: 'pending',
        requestedBy: user?.name || user?.email || 'Unknown', requestedAt: new Date().toISOString(),
        proposedChanges: { ...(name.trim() && { name: name.trim() }), ...(description.trim() && { description: description.trim() }) },
        adjustmentReason: 'MERCHANDISING: product details proposal'
      });
      setProductId(''); setName(''); setDescription('');
      addNotification('success', 'Product proposal submitted for lead approval.');
      queryClient.invalidateQueries({ queryKey });
    } catch (cause) {
      logger.error('MerchandisingReviewsTab', 'Product proposal failed', cause as Error);
      addNotification('alert', `Proposal failed: ${(cause as Error).message}`);
    }
  };

  if (isLoading) return <p className="text-sm text-[var(--theme-text-secondary)]">Loading proposals…</p>;
  if (error) return <p className="text-sm text-[var(--theme-text-secondary)]">Could not load proposals: {(error as Error).message}</p>;

  return <section className="space-y-4" aria-label="Merchandising proposal reviews">
    {role === 'merchandising_specialist' && <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-5 space-y-3">
      <h3 className="font-semibold text-[var(--theme-text-primary)]">Propose product details</h3>
      <select aria-label="Product" value={productId} onChange={event => setProductId(event.target.value)} className="w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] p-2 text-sm text-[var(--theme-text-primary)]">
        <option value="">Select product</option>
        {products.slice(0, 100).map(product => <option key={product.id} value={product.id}>{product.name} · {product.sku}</option>)}
      </select>
      <input aria-label="Proposed name" value={name} onChange={event => setName(event.target.value)} placeholder="Proposed name (optional)" className="w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] p-2 text-sm text-[var(--theme-text-primary)]" />
      <textarea aria-label="Proposed description" value={description} onChange={event => setDescription(event.target.value)} placeholder="Proposed description (optional)" className="w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] p-2 text-sm text-[var(--theme-text-primary)]" />
      <button type="button" disabled={createRequest.isPending} onClick={submitProductProposal} className="rounded-xl bg-[var(--theme-accent)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Submit proposal</button>
    </div>}
    <p className="text-sm text-[var(--theme-text-secondary)]">
      Pending proposals in your authorized territory. Finance signs off below-floor prices before a merchandising lead approves.
    </p>
    {requests.length === 0 && <p className="rounded-2xl border border-[var(--theme-border)] p-6 text-sm text-[var(--theme-text-secondary)]">No pending proposals.</p>}
    {requests.map(request => {
      const isPrice = request.adjustmentReason?.startsWith('PRICE_CHANGE');
      const needsFinance = isPrice && isBelowMarginFloor(request.proposedChanges || {});
      return <article key={request.id} className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-[var(--theme-text-primary)]">{request.productName}</h3>
            <p className="text-xs text-[var(--theme-text-secondary)] mt-1">
              {isPrice ? 'Price' : 'Product or planogram'} proposal · {request.productSku} · {request.requestedBy}
            </p>
            <p className="text-xs text-[var(--theme-text-secondary)] mt-1">
              {request.regionCode || country} · {request.siteId}
            </p>
            {needsFinance && <p className="text-xs text-[var(--theme-text-secondary)] mt-2">
              Finance: {request.financeApprovedByEmployeeId ? 'signed off' : 'awaiting signoff'}
            </p>}
            <pre className="mt-3 whitespace-pre-wrap break-words text-xs text-[var(--theme-text-secondary)]">{JSON.stringify(request.proposedChanges, null, 2)}</pre>
          </div>
          <div className="flex gap-2">
            {needsFinance && !request.financeApprovedByEmployeeId && FINANCE_LEADS.has(role) &&
              <button type="button" disabled={decision.isPending} onClick={() => decision.mutate({ id: request.id, action: 'finance' })}
                className="rounded-xl border border-[var(--theme-border)] px-3 py-2 text-xs font-semibold text-[var(--theme-text-primary)] disabled:opacity-50">
                Finance signoff
              </button>}
            {MERCHANDISING_LEADS.has(role) &&
              <button type="button" disabled={decision.isPending || Boolean(needsFinance && !request.financeApprovedByEmployeeId)}
                onClick={() => decision.mutate({ id: request.id, action: 'approve' })}
                className="rounded-xl bg-[var(--theme-accent)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
                Approve and apply
              </button>}
          </div>
        </div>
      </article>;
    })}
  </section>;
};
