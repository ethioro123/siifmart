import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Layers, Sparkles, RefreshCw, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMerchandising } from './MerchandisingContext';
import { useStore } from '../../contexts/CentralStore';
import { useData } from '../../contexts/DataContext';
import { inventoryRequestsService } from '../../services/inventory-requests.service';
import { PlanogramFixtureSelector } from './planogram/PlanogramFixtureSelector';
import { PlanogramShelfRack } from './planogram/PlanogramShelfRack';
import { PlanogramUnassignedTray } from './planogram/PlanogramUnassignedTray';
import { PlanogramSelectedPanel } from './planogram/PlanogramSelectedPanel';
import { PlanogramReviewMovesModal } from './planogram/PlanogramReviewMovesModal';
import { PlanogramListView } from './planogram/PlanogramListView';
import { FIXTURE_DEFINITIONS, FixtureType, ProposedPlanogramMove } from './planogram/types';
import type { Product, PendingInventoryChange, ShelfPosition } from '../../types';
import { planogramStoreProducts, suggestPlanogramMoves } from '../../utils/planogram';
import { logger } from '../../utils/logger';

export const PlanogramTab: React.FC = () => {
  const {
    showHeatmap,
    setShowHeatmap,
    swapSource,
    setSwapSource,
    products,
    submitPlanogram,
    addNotification,
    salesMetricsIndex,
    currencySymbol,
    activeCountry
  } = useMerchandising();

  const { sites, activeSite } = useData();
  const { user } = useStore();
  const queryClient = useQueryClient();

  // 1. Store & Physical Fixture Context State
  const storeSites = useMemo(() => {
    return (sites || []).filter(s => s.type === 'Store' && s.country === activeCountry);
  }, [sites, activeCountry]);

  const [selectedStoreId, setSelectedStoreId] = useState<string>(() => {
    if (activeSite?.id && storeSites.some(s => s.id === activeSite.id)) {
      return activeSite.id;
    }
    return storeSites[0]?.id || '';
  });

  const [fixtureType, setFixtureType] = useState<FixtureType>('gondola');
  const [viewMode, setViewMode] = useState<'visual' | 'list'>('visual');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);

  const submissionLock = useRef(false);
  useEffect(() => {
    setSelectedStoreId(current => storeSites.some(site => site.id === current) ? current : storeSites[0]?.id || '');
    setSwapSource(null);
    setIsReviewModalOpen(false);
  }, [activeCountry, activeSite?.id, storeSites, setSwapSource]);

  // 2. Fetch pending inventory requests for this store
  const { data: pendingData, isLoading: pendingLoading, error: pendingError, refetch: retryPending } = useQuery({
    queryKey: ['planogram_pending_requests', activeCountry, selectedStoreId, user?.id],
    queryFn: () => inventoryRequestsService.getMerchandisingRequests(activeCountry, {
      siteId: selectedStoreId,
      status: 'pending',
      limit: 100
    }),
    enabled: Boolean(selectedStoreId && user?.id),
    staleTime: 10_000
  });

  // Map pending proposals by product id
  const pendingRequestsByProductId = useMemo(() => {
    const map = new Map<string, PendingInventoryChange>();
    (pendingData?.data || []).forEach(req => {
      if (req.proposedChanges && 'shelfPosition' in req.proposedChanges) {
        map.set(req.productId, req);
      }
    });
    return map;
  }, [pendingData?.data]);

  const storeProducts = useMemo(() => planogramStoreProducts(products, selectedStoreId), [products, selectedStoreId]);

  const activeFixture = FIXTURE_DEFINITIONS[fixtureType];

  // Currently selected product for swap / placement
  const selectedProduct = useMemo(() => {
    return swapSource ? storeProducts.find(p => p.id === swapSource) : null;
  }, [swapSource, storeProducts]);

  // 4. Handle Product Selection / Swap (Submission lock & selection retention on failure)
  const handleSelectProduct = useCallback(async (productId: string) => {
    if (submissionLock.current || pendingLoading || pendingError) return;

    if (!swapSource) {
      setSwapSource(productId);
      addNotification('info', 'Selected product. Click another product on the fixture to swap, or click [Place Here] on a tier.');
      return;
    }

    if (swapSource === productId) {
      setSwapSource(null);
      return;
    }

    // Both products chosen: execute atomic swap
    const p1 = storeProducts.find(p => p.id === swapSource);
    const p2 = storeProducts.find(p => p.id === productId);

    if (!p1 || !p2) {
      setSwapSource(null);
      return;
    }

    if (pendingRequestsByProductId.has(p1.id) || pendingRequestsByProductId.has(p2.id)) {
      addNotification('info', 'Review the pending proposal before moving this product again.'); return;
    }
    if (!p1.shelfPosition || !p2.shelfPosition) {
      setSwapSource(productId);
      addNotification('info', 'Select a placement for the unassigned product using Place Here or the list.'); return;
    }
    const s1 = p1.shelfPosition;
    const s2 = p2.shelfPosition;
    if (s1 === s2) { setSwapSource(productId); return; }

    submissionLock.current = true;
    setIsSubmittingRevision(true);
    try {
      await submitPlanogram([
        { product: p1, shelfPosition: s2 },
        { product: p2, shelfPosition: s1 }
      ], `MERCHANDISING: atomic swap between ${p1.name} and ${p2.name}`);
      setSwapSource(null);
      await queryClient.invalidateQueries({ queryKey: ['planogram_pending_requests'] });
    } catch (err: unknown) {
      logger.error('PlanogramTab', 'Failed to submit swap', err);
      // Retain selection on failure per Finding 8
      addNotification('alert', `Failed to submit swap: ${err instanceof Error ? err.message : 'Unknown error'}. Selection retained.`);
    } finally {
      submissionLock.current = false;
      setIsSubmittingRevision(false);
    }
  }, [swapSource, storeProducts, submitPlanogram, addNotification, queryClient, isSubmittingRevision, setSwapSource, pendingRequestsByProductId, pendingLoading, pendingError]);

  // 5. Handle Move to Tier (Submission lock & selection retention on failure)
  const handleMoveToTier = useCallback(async (targetShelf: string) => {
    if (!swapSource || submissionLock.current || pendingLoading || pendingError) return;

    const p = storeProducts.find(prod => prod.id === swapSource);
    if (!p) {
      setSwapSource(null);
      return;
    }

    submissionLock.current = true;
    setIsSubmittingRevision(true);
    try {
      if (pendingRequestsByProductId.has(p.id)) throw new Error('This product already has a pending placement proposal.');
      if (p.shelfPosition === targetShelf) return;
      await submitPlanogram([
        { product: p, shelfPosition: targetShelf }
      ], `MERCHANDISING: move ${p.name} to ${targetShelf}`);
      setSwapSource(null);
      await queryClient.invalidateQueries({ queryKey: ['planogram_pending_requests'] });
    } catch (err: unknown) {
      logger.error('PlanogramTab', 'Failed to submit move', err);
      addNotification('alert', `Failed to move product: ${err instanceof Error ? err.message : 'Unknown error'}. Selection retained.`);
    } finally {
      submissionLock.current = false;
      setIsSubmittingRevision(false);
    }
  }, [swapSource, storeProducts, submitPlanogram, addNotification, queryClient, isSubmittingRevision, setSwapSource, pendingRequestsByProductId, pendingLoading, pendingError]);

  const suggestedMoves = useMemo(() => suggestPlanogramMoves(storeProducts, salesMetricsIndex, new Set(pendingRequestsByProductId.keys())), [storeProducts, salesMetricsIndex, pendingRequestsByProductId]);

  // 7. Handle Confirm Suggested Moves (Atomic Submission)
  const handleConfirmSuggestedMoves = async (selectedMoves: ProposedPlanogramMove[]) => {
    if (submissionLock.current || pendingLoading || pendingError || selectedMoves.length === 0) return;
    submissionLock.current = true;
    setIsSubmittingRevision(true);
    try {
      const payload = selectedMoves.map(m => {
        const product = storeProducts.find(p => p.id === m.productId);
        if (!product || pendingRequestsByProductId.has(product.id)) throw new Error('The store or pending proposals changed. Review the moves again.');
        return {
          product,
          shelfPosition: m.targetPosition
        };
      });

      await submitPlanogram(payload, `MERCHANDISING: layout optimization (${selectedMoves.length} moves)`);
      setIsReviewModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['planogram_pending_requests'] });
    } catch (err: unknown) {
      logger.error('PlanogramTab', 'Failed to submit layout revision', err);
      addNotification('alert', `Failed to submit layout revision: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      submissionLock.current = false;
      setIsSubmittingRevision(false);
    }
  };

  const pendingCount = pendingRequestsByProductId.size;

  return (
    <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl shadow-sm overflow-hidden animate-in fade-in space-y-5 p-5 sm:p-6">
      {/* Top Header: Fixture & Physical Context Selector */}
      <fieldset disabled={isSubmittingRevision} className="min-w-0">
      <PlanogramFixtureSelector
        stores={storeSites}
        selectedStoreId={selectedStoreId}
        onSelectStore={(id) => {
          setSelectedStoreId(id);
          setSwapSource(null);
        }}
        fixtureType={fixtureType}
        onSelectFixtureType={setFixtureType}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        showHeatmap={showHeatmap}
        onToggleHeatmap={() => setShowHeatmap(!showHeatmap)}
      />

      </fieldset>
      {/* Proposal Progression Status Banner */}
      <div className="px-4 py-2.5 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider text-[11px]">
            Layout Workflow:
          </span>
          <div className="flex items-center gap-1.5 text-[var(--theme-text-secondary)]">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 size={13} /> Current placements
            </span>
            <span>→</span>
            <span className={`font-semibold flex items-center gap-1 ${
              pendingCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--theme-text-secondary)]'
            }`}>
              <Clock size={13} />
              <span>{pendingCount} Loaded Pending Moves</span>
            </span>
            <span>→</span>
            <span>3 Regional Approvals Required</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsReviewModalOpen(true)}
          disabled={isSubmittingRevision || pendingLoading || Boolean(pendingError) || !selectedStoreId || suggestedMoves.length === 0}
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-[var(--theme-accent)] hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Sparkles size={13} />
          <span>Review Suggested Moves ({suggestedMoves.length})</span>
        </button>
      </div>

      {pendingData?.hasMore && <p className="text-sm text-[var(--theme-text-secondary)]">Additional pending proposals are available in Reviews. Submission checks for duplicates across all proposals.</p>}
      {pendingLoading && <p role="status">Loading pending placement proposals…</p>}
      {pendingError && <p role="alert">Pending proposals could not be loaded. <button type="button" className="underline" onClick={() => retryPending()}>Retry</button></p>}
      {!storeProducts.length && <p role="status">No loaded products for this store. Select a store with an available catalog.</p>}
      <p className="text-sm text-[var(--theme-text-secondary)]">Store-level shelf positions. Product dimensions, facings, fixture capacity and physical completion are not recorded here. Sales reflect loaded completed orders.</p>
      {/* Selected Product Sticky Panel */}
      {selectedProduct && (
        <PlanogramSelectedPanel
          product={selectedProduct}
          metrics={salesMetricsIndex.get(selectedProduct.id)}
          onCancel={() => setSwapSource(null)}
          currencySymbol={currencySymbol}
        />
      )}

      <fieldset disabled={isSubmittingRevision || pendingLoading || Boolean(pendingError) || !selectedStoreId} className="min-w-0">
      {/* Main Content: Shelf Rack + Unassigned Tray OR Accessible List View */}
      {viewMode === 'visual' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left: Interactive Shelf Rack */}
          <div className="lg:col-span-2">
            <PlanogramShelfRack
              fixture={activeFixture}
              products={storeProducts}
              salesMetricsIndex={salesMetricsIndex}
              pendingRequestsByProductId={pendingRequestsByProductId}
              swapSource={swapSource}
              onSelectProduct={handleSelectProduct}
              onMoveToTier={handleMoveToTier}
              showHeatmap={showHeatmap}
              currencySymbol={currencySymbol}
            />
          </div>

          {/* Right: Unassigned Items Tray */}
          <div>
            <PlanogramUnassignedTray
              products={storeProducts}
              salesMetricsIndex={salesMetricsIndex}
              pendingRequestsByProductId={pendingRequestsByProductId}
              swapSource={swapSource}
              onSelectProduct={handleSelectProduct}
              currencySymbol={currencySymbol}
            />
          </div>
        </div>
      ) : (
        <PlanogramListView
          products={storeProducts}
          salesMetricsIndex={salesMetricsIndex}
          pendingRequestsByProductId={pendingRequestsByProductId}
          swapSource={swapSource}
          onSelectProduct={handleSelectProduct}
          onQuickMove={async (product, targetShelf) => {
            if (submissionLock.current || pendingLoading || pendingError) return;
            submissionLock.current = true; setIsSubmittingRevision(true);
            try {
              if (pendingRequestsByProductId.has(product.id)) throw new Error('This product already has a pending proposal.');
              await submitPlanogram([{ product, shelfPosition: targetShelf }]);
              await queryClient.invalidateQueries({ queryKey: ['planogram_pending_requests', activeCountry, selectedStoreId, user?.id] });
            } catch (err) { addNotification('alert', err instanceof Error ? err.message : 'Could not submit move.'); }
            finally { submissionLock.current = false; setIsSubmittingRevision(false); }
          }}
          currencySymbol={currencySymbol}
        />
      )}

      </fieldset>
      {/* Review Suggested Moves Modal */}
      <PlanogramReviewMovesModal
        isOpen={isReviewModalOpen}
        onClose={() => { if (!submissionLock.current) setIsReviewModalOpen(false); }}
        moves={suggestedMoves}
        onConfirm={handleConfirmSuggestedMoves}
        isSubmitting={isSubmittingRevision}
      />
    </div>
  );
};
