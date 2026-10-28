import { isPriceProposal } from '../../utils/priceApproval';
import { proposalApprovalBlock } from '../../utils/proposalReviewPolicy';
import { useSearchParams } from 'react-router-dom';
import { PRODUCT_APPROVAL_INBOX_KEY } from '../../utils/approvalInbox';
import { ProposalReviewModal } from './components/ProposalReviewModal';
import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle, ChevronLeft, ChevronRight, XCircle, Clock, Layers } from 'lucide-react';
import { useStore } from '../../contexts/CentralStore';
import { useData } from '../../contexts/DataContext';
import { inventoryRequestsService } from '../../services/inventory-requests.service';
import { PRODUCT_EDIT_APPROVERS } from '../../utils/productEditApproval';
import { logger } from '../../utils/logger';
import { useMerchandising } from './MerchandisingContext';
import { useCreateInventoryRequestMutation } from '../../hooks/useInventoryRequestMutations';
import { ProductEditApprovalProgress } from '../inventory/ProductEditApprovalProgress';
import { ProposalDiffView } from './components/ProposalDiffView';
import { RejectProposalModal } from './components/RejectProposalModal';
import type { PendingInventoryChange } from '../../types';

const MERCHANDISING_LEADS = new Set(Object.keys(PRODUCT_EDIT_APPROVERS));

type StatusFilter = 'pending' | 'completed' | 'all';

export const MerchandisingReviewsTab: React.FC = () => {
  const { user } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const focusedRequest = searchParams.get('requestId') || undefined;
  const focusedRevision = searchParams.get('revisionId') || undefined;
  useEffect(() => { setPage(1); }, [focusedRequest, focusedRevision]);
  const { addNotification, effectiveCountry, activeSite, sites } = useData();
  const { products } = useMerchandising();
  const [productId, setProductId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [page, setPage] = useState(1);
  const [selectedReview, setSelectedReview] = useState<PendingInventoryChange | null>(null);
  const [selectedRejectRequest, setSelectedRejectRequest] = useState<PendingInventoryChange | null>(null);

  const createRequest = useCreateInventoryRequestMutation();
  const country = (effectiveCountry || user?.country || 'ET').toUpperCase();
  const currencySymbol = country === 'KE' ? 'KES' : 'ETB';
  const role = (user?.role || '').toLowerCase();
  useEffect(() => { setSelectedReview(null); }, [country, user?.id]);
  const queryClient = useQueryClient();

  const queryKey = ['merchandising_reviews', country, user?.regionCode, activeSite?.id, user?.id, statusFilter, page, focusedRequest, focusedRevision];
  const { data: pagedData, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => inventoryRequestsService.getMerchandisingRequests(country, {
      page,
      limit: 25,
      status: focusedRequest || focusedRevision ? 'all' : statusFilter,
      requestId: focusedRevision ? undefined : focusedRequest,
      layoutRevisionId: focusedRevision
    })
  });

  const requests = pagedData?.data || [];
  const totalCount = pagedData?.totalCount || 0;
  const totalPages = pagedData?.totalPages || 1;

  const decision = useMutation({
    mutationFn: async ({
      id,
      action,
      reason
    }: {
      id: string;
      action: 'approve' | 'finance' | 'reject';
      reason?: string;
    }) => {
      if (action === 'approve') {
        return { action, ...(await inventoryRequestsService.approveProductEdit(id)) };
      }
      if (action === 'finance') {
        await inventoryRequestsService.signoffMerchandisingPrice(id);
        return { action, applied: false, approvalCount: 0, workflow: undefined };
      }
      if (action === 'reject') {
        if (!reason?.trim()) throw new Error('A rejection reason is required');
        await inventoryRequestsService.rejectProductEdit(id, reason.trim());
        return { action, applied: false, approvalCount: 0, workflow: undefined };
      }
      throw new Error(`Unsupported action: ${action}`);
    },
    onSuccess: result => {
      queryClient.invalidateQueries({ queryKey: [PRODUCT_APPROVAL_INBOX_KEY] });
      queryClient.invalidateQueries({ queryKey: ['merchandising_reviews'] });
      queryClient.invalidateQueries({ queryKey: ['inventory_requests'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['price_manager_catalog'] });

      if (result.action === 'reject') {
        addNotification('success', 'Proposal has been rejected.');
      } else if (result.action === 'finance') {
        addNotification('success', 'Finance signoff recorded.');
      } else if (result.applied) {
        addNotification('success', result.workflow === 'price' ? 'Price change approved and applied.' : 'Three approvals received. Product edit applied.');
      } else {
        addNotification('success', `Regional approval recorded (${result.approvalCount}/3).`);
      }
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
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        siteId,
        countryCode: country,
        changeType: 'edit',
        status: 'pending',
        requestedBy: user?.name || user?.email || 'Unknown',
        requestedAt: new Date().toISOString(),
        proposedChanges: {
          ...(name.trim() && { name: name.trim() }),
          ...(description.trim() && { description: description.trim() })
        },
        adjustmentReason: 'MERCHANDISING: product details proposal'
      });
      setProductId('');
      setName('');
      setDescription('');
      addNotification('success', 'Product proposal submitted for lead approval.');
      queryClient.invalidateQueries({ queryKey: ['merchandising_reviews'] });
    } catch (cause) {
      logger.error('MerchandisingReviewsTab', 'Product proposal failed', cause as Error);
      addNotification('alert', `Proposal failed: ${(cause as Error).message}`);
    }
  };

  const handleTabChange = (newTab: StatusFilter) => {
    if (focusedRequest || focusedRevision) { const next = new URLSearchParams(searchParams); next.delete('requestId'); next.delete('revisionId'); setSearchParams(next); }
    setStatusFilter(newTab);
    setPage(1);
  };

  const startRecord = totalCount === 0 ? 0 : (page - 1) * 25 + 1;
  const endRecord = Math.min(page * 25, totalCount);

  return (
    <section className="space-y-4" aria-label="Merchandising proposal reviews">
      {role === 'merchandising_specialist' && (
        <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-5 space-y-3">
          <h3 className="font-semibold text-[var(--theme-text-primary)]">Propose product details</h3>
          <select
            aria-label="Product"
            value={productId}
            onChange={event => setProductId(event.target.value)}
            className="w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] p-2 text-sm text-[var(--theme-text-primary)]"
          >
            <option value="">Select product</option>
            {products.slice(0, 100).map(product => (
              <option key={product.id} value={product.id}>
                {product.name} · {product.sku}
              </option>
            ))}
          </select>
          <input
            aria-label="Proposed name"
            value={name}
            onChange={event => setName(event.target.value)}
            placeholder="Proposed name (optional)"
            className="w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] p-2 text-sm text-[var(--theme-text-primary)]"
          />
          <textarea
            aria-label="Proposed description"
            value={description}
            onChange={event => setDescription(event.target.value)}
            placeholder="Proposed description (optional)"
            className="w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] p-2 text-sm text-[var(--theme-text-primary)]"
          />
          <button
            type="button"
            disabled={createRequest.isPending}
            onClick={submitProductProposal}
            className="rounded-xl bg-[var(--theme-accent)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            Submit proposal
          </button>
        </div>
      )}

      {(focusedRequest || focusedRevision) && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--theme-border)] p-3 text-sm">
        <span>{focusedRevision ? 'Showing the selected shelf revision.' : 'Showing the selected approval request.'}</span>
        <button type="button" onClick={() => { const next = new URLSearchParams(searchParams); next.delete('requestId'); next.delete('revisionId'); setSearchParams(next); setPage(1); setStatusFilter('pending'); }} className="min-h-11 rounded-xl border border-[var(--theme-border)] px-3">Show all pending requests</button>
      </div>}
      {/* Governance Banner & Status Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--theme-border)] pb-3">
        <div>
          <h2 className="text-base font-bold text-[var(--theme-text-primary)]">Product & Price Governance</h2>
          <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
            Prices at or above 15% margin need one independent commercial approval. Below-floor prices need Country Finance clearance and country commercial approval. Product details and shelf layouts retain three regional approvals.
          </p>
        </div>
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleTabChange('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'pending'
                ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm'
                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
            }`}
          >
            Pending Review
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'completed'
                ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm'
                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
            }`}
          >
            Review History
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'all'
                ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-sm'
                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
            }`}
          >
            All Proposals
          </button>
        </div>
      </div>

      {isLoading && <p className="text-sm text-[var(--theme-text-secondary)]">Loading proposals…</p>}
      {error && (
        <p className="text-sm text-rose-500">
          Could not load proposals: {(error as Error).message}
        </p>
      )}

      {!isLoading && !error && requests.length === 0 && (
        <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-8 text-center text-sm text-[var(--theme-text-secondary)]">
          No proposals found for the selected view.
        </div>
      )}

      {!isLoading && !error && requests.length > 0 && (
        <div className="space-y-4">
          <div className="text-xs text-[var(--theme-text-secondary)] flex justify-between items-center px-1">
            <span>
              Showing {startRecord}–{endRecord} of {totalCount} proposals
            </span>
            <span>Page {page} of {totalPages}</span>
          </div>

          {requests.map(request => {
            const site = (sites || []).find(site => (site.id === request.siteId || site.code === request.siteId) && site.country === country);
            const siteLabel = site ? `${site.name} · ${site.code}` : 'Site unavailable';
            const isPrice = isPriceProposal(request);
            const baselineProduct = request.currentProduct || products.find(p => p.id === request.productId);
            const canApprove = !proposalApprovalBlock(request,user,baselineProduct);
            const canActAsLead = isPrice ? request.priceApprovalRoute?.canReject : MERCHANDISING_LEADS.has(role) || role === 'group_ceo';
            const isPending = request.status === 'pending';
            const isApproved = request.status === 'approved';
            const isRejected = request.status === 'rejected';

            return (
              <article
                key={request.id}
                className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-5 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-base text-[var(--theme-text-primary)]">
                        {request.productName}
                      </h3>
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <Clock size={11} />
                          Pending Review
                        </span>
                      )}
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle size={11} />
                          Approved
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          <XCircle size={11} />
                          Rejected
                        </span>
                      )}
                      {(request.layoutRevisionId || request.layout_revision_id) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20" title="Part of an atomic planogram layout revision; approved and applied together">
                          <Layers size={11} />
                          Layout Revision
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--theme-text-secondary)]">
                      {isPrice ? 'Price Change Proposal' : 'Product & Catalog Proposal'} · SKU:{' '}
                      <span className="font-mono">{request.productSku}</span> · Requested by {request.requestedBy}
                    </p>
                    <p className="text-xs text-[var(--theme-text-secondary)]">
                      Region: <span className="font-medium text-[var(--theme-text-primary)]">{request.regionCode || country}</span> · Site: <span className="font-medium text-[var(--theme-text-primary)]">{siteLabel}</span> · Submitted {new Date(request.requestedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <button type="button" onClick={() => setSelectedReview(request)} className="min-h-11 rounded-xl border border-[var(--theme-border)] px-4 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]" aria-label={'Review proposal for ' + request.productName}>Review proposal</button>
                  {/* Actions for Pending Proposals */}
                  {isPending && (
                    <div className="flex flex-wrap items-center gap-2">
                      {isPrice && request.priceApprovalRoute?.canFinance && (
                        <button
                          type="button"
                          disabled={decision.isPending}
                          onClick={() => decision.mutate({ id: request.id, action: 'finance' })}
                          className="rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 px-3 py-2 text-xs font-semibold disabled:opacity-50 transition-colors"
                        >
                          Finance signoff
                        </button>
                      )}
                      {canActAsLead && (
                        <button
                          type="button"
                          disabled={decision.isPending}
                          onClick={() => setSelectedRejectRequest(request)}
                          className="rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 px-3 py-2 text-xs font-semibold disabled:opacity-50 transition-colors"
                        >
                          Reject proposal
                        </button>
                      )}
                      {(isPrice ? request.priceApprovalRoute?.canApprove : MERCHANDISING_LEADS.has(role)) && (
                        <button
                          type="button"
                          disabled={decision.isPending || !canApprove}
                          onClick={() => {
                            setSelectedReview(request);
                          }}
                          className="rounded-xl bg-[var(--theme-accent)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
                        >
                          {isPrice ? 'Approve price change' : 'Record regional approval'}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Structured Before-and-After Comparison Diff View */}
                <ProposalDiffView
                  request={request}
                  currentProduct={baselineProduct}
                  currencySymbol={currencySymbol}
                />

                {/* 3-Way Regional Approval Progress */}
                <div className="pt-2">
                  <ProductEditApprovalProgress request={request} />
                </div>

                {/* Rejection Details Banner if Rejected */}
                {isRejected && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs">
                    <AlertCircle className="shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" size={15} />
                    <div className="space-y-0.5">
                      <p className="font-semibold text-rose-700 dark:text-rose-300">
                        Proposal Rejected {request.rejectedBy ? `by ${request.rejectedBy}` : ''}
                      </p>
                      <p className="text-[var(--theme-text-primary)]">
                        Reason: {request.rejectionReason || 'No detailed reason provided.'}
                      </p>
                    </div>
                  </div>
                )}
              </article>
            );
          })}

          {/* Bounded Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-[var(--theme-border)]">
              <button
                type="button"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                className="inline-flex items-center gap-1 rounded-xl border border-[var(--theme-border)] px-3 py-1.5 text-xs font-medium text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={14} />
                Previous
              </button>
              <span className="text-xs font-medium text-[var(--theme-text-secondary)]">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                className="inline-flex items-center gap-1 rounded-xl border border-[var(--theme-border)] px-3 py-1.5 text-xs font-medium text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] disabled:opacity-40 transition-colors"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {selectedReview && <ProposalReviewModal key={selectedReview.id} request={requests.find(request => request.id === selectedReview.id) || selectedReview} country={country} currencySymbol={currencySymbol}
        currentProduct={selectedReview.currentProduct || products.find(product => product.id === selectedReview.productId)} submitting={decision.isPending}
        onClose={() => { if (!decision.isPending) setSelectedReview(null); }} onApprove={async () => {
          await decision.mutateAsync({ id: selectedReview.id, action: 'approve' });
          setSelectedReview(null);
        }} />}
      {/* Reject Modal */}
      <RejectProposalModal
        isOpen={Boolean(selectedRejectRequest)}
        request={selectedRejectRequest}
        onClose={() => setSelectedRejectRequest(null)}
        isSubmitting={decision.isPending}
        onConfirmReject={async (requestId, reason) => {
          await decision.mutateAsync({
            id: requestId,
            action: 'reject',
            reason
          });
        }}
      />
    </section>
  );
};
