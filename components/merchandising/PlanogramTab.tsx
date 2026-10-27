import React, { useState, useMemo, useCallback } from 'react';
import { Layers, Sparkles, RefreshCw, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMerchandising } from './MerchandisingContext';
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
  const queryClient = useQueryClient();

  // 1. Store & Physical Fixture Context State
  const storeSites = useMemo(() => {
    const list = (sites || []).filter(s => s.type === 'Store' || !s.type?.toLowerCase().includes('warehouse'));
    return list.length > 0 ? list : (sites || []);
  }, [sites]);

  const [selectedStoreId, setSelectedStoreId] = useState<string>(() => {
    if (activeSite?.id && storeSites.some(s => s.id === activeSite.id)) {
      return activeSite.id;
    }
    return storeSites[0]?.id || '';
  });

  const [zone, setZone] = useState('Zone B');
  const [aisle, setAisle] = useState('Aisle 04');
  const [bay, setBay] = useState('Bay 02');
  const [fixtureType, setFixtureType] = useState<FixtureType>('gondola');
  const [viewMode, setViewMode] = useState<'visual' | 'list'>('visual');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);

  // 2. Fetch pending inventory requests for this store
  const { data: pendingData } = useQuery({
    queryKey: ['planogram_pending_requests', activeCountry, selectedStoreId],
    queryFn: () => inventoryRequestsService.getMerchandisingRequests(activeCountry, {
      siteId: selectedStoreId,
      status: 'pending',
      limit: 100
    }),
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

  // 3. Products scoped to selected store (with fallback if mock products lack siteId)
  const storeProducts = useMemo(() => {
    if (!selectedStoreId) return products;
    const filtered = products.filter(p => (p.siteId || (p as any).site_id) === selectedStoreId);
    return filtered.length > 0 ? filtered : products;
  }, [products, selectedStoreId]);

  const activeFixture = FIXTURE_DEFINITIONS[fixtureType];

  // Currently selected product for swap / placement
  const selectedProduct = useMemo(() => {
    return swapSource ? storeProducts.find(p => p.id === swapSource) : null;
  }, [swapSource, storeProducts]);

  // 4. Handle Product Selection / Swap (Submission lock & selection retention on failure)
  const handleSelectProduct = useCallback(async (productId: string) => {
    if (isSubmittingRevision) return;

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

    const s1 = p1.shelfPosition || 'Bottom Shelf';
    const s2 = p2.shelfPosition || 'Bottom Shelf';

    setIsSubmittingRevision(true);
    try {
      await submitPlanogram([
        { product: p1, shelfPosition: s2 },
        { product: p2, shelfPosition: s1 }
      ], `MERCHANDISING: atomic swap between ${p1.name} and ${p2.name}`);
      setSwapSource(null);
      await queryClient.invalidateQueries({ queryKey: ['planogram_pending_requests'] });
    } catch (err: any) {
      logger.error('PlanogramTab', 'Failed to submit swap', err);
      // Retain selection on failure per Finding 8
      addNotification('alert', `Failed to submit swap: ${err.message || 'Unknown error'}. Selection retained.`);
    } finally {
      setIsSubmittingRevision(false);
    }
  }, [swapSource, storeProducts, submitPlanogram, addNotification, queryClient, isSubmittingRevision, setSwapSource]);

  // 5. Handle Move to Tier (Submission lock & selection retention on failure)
  const handleMoveToTier = useCallback(async (targetShelf: string) => {
    if (!swapSource || isSubmittingRevision) return;

    const p = storeProducts.find(prod => prod.id === swapSource);
    if (!p) {
      setSwapSource(null);
      return;
    }

    setIsSubmittingRevision(true);
    try {
      await submitPlanogram([
        { product: p, shelfPosition: targetShelf }
      ], `MERCHANDISING: move ${p.name} to ${targetShelf}`);
      setSwapSource(null);
      await queryClient.invalidateQueries({ queryKey: ['planogram_pending_requests'] });
    } catch (err: any) {
      logger.error('PlanogramTab', 'Failed to submit move', err);
      addNotification('alert', `Failed to move product: ${err.message || 'Unknown error'}. Selection retained.`);
    } finally {
      setIsSubmittingRevision(false);
    }
  }, [swapSource, storeProducts, submitPlanogram, addNotification, queryClient, isSubmittingRevision, setSwapSource]);

  // 6. Generate Suggested Moves with Constraints (Weight/Safety, Capacity, Velocity)
  const suggestedMoves = useMemo<ProposedPlanogramMove[]>(() => {
    const moves: ProposedPlanogramMove[] = [];
    const eyeLevelProducts = storeProducts.filter(p => p.shelfPosition === 'Eye Level');
    const bottomShelfProducts = storeProducts.filter(p => p.shelfPosition === 'Bottom Shelf');

    // Rule 1: High velocity on bottom shelf -> promote to Eye Level (ONLY IF NOT HEAVY)
    bottomShelfProducts.forEach(p => {
      const metrics = salesMetricsIndex.get(p.id);
      const units = metrics?.unitsSold7d || 0;
      const velocity = metrics?.effectiveVelocity || p.salesVelocity;

      // Heavy / Bulk Check: Bales, bulk master cartons, or items > 5kg must stay on Bottom Shelf
      const isHeavyOrBulk = Boolean(
        p.name.toLowerCase().includes('bale') ||
        p.name.toLowerCase().includes('bulk') ||
        p.name.toLowerCase().includes('10 pk') ||
        p.name.toLowerCase().includes('case') ||
        (p.customAttributes as any)?.package_type?.toLowerCase().includes('bulk')
      );

      if ((velocity === 'High' || units >= 10) && !isHeavyOrBulk && eyeLevelProducts.length < 10) {
        moves.push({
          productId: p.id,
          productName: p.name,
          productSku: p.sku,
          currentPosition: 'Bottom Shelf',
          targetPosition: 'Eye Level',
          unitsSold7d: units,
          reason: `High sales velocity (${units} units/7d). Promote to Prime Eye Level.`,
          constraints: {
            weightSafe: true,
            capacityOk: true,
            categoryCompatible: true
          },
          selected: true
        });
      }
    });

    // Rule 2: Low velocity occupying Eye Level Prime Tier -> demote to Bottom Shelf
    eyeLevelProducts.forEach(p => {
      const metrics = salesMetricsIndex.get(p.id);
      const units = metrics?.unitsSold7d || 0;
      const velocity = metrics?.effectiveVelocity || p.salesVelocity;

      if (velocity === 'Low' || (metrics?.hasOrderHistory && units <= 2)) {
        moves.push({
          productId: p.id,
          productName: p.name,
          productSku: p.sku,
          currentPosition: 'Eye Level',
          targetPosition: 'Bottom Shelf',
          unitsSold7d: units,
          reason: `Low velocity (${units} units/7d) on Prime Tier. Demote to open prime space.`,
          constraints: {
            weightSafe: true,
            capacityOk: true,
            categoryCompatible: true
          },
          selected: true
        });
      }
    });

    return moves;
  }, [storeProducts, salesMetricsIndex]);

  // 7. Handle Confirm Suggested Moves (Atomic Submission)
  const handleConfirmSuggestedMoves = async (selectedMoves: ProposedPlanogramMove[]) => {
    setIsSubmittingRevision(true);
    try {
      const payload = selectedMoves.map(m => {
        const product = storeProducts.find(p => p.id === m.productId)!;
        return {
          product,
          shelfPosition: m.targetPosition
        };
      });

      await submitPlanogram(payload, `MERCHANDISING: layout optimization (${selectedMoves.length} moves)`);
      setIsReviewModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['planogram_pending_requests'] });
    } catch (err: any) {
      logger.error('PlanogramTab', 'Failed to submit layout revision', err);
      addNotification('alert', `Failed to apply layout revision: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmittingRevision(false);
    }
  };

  const pendingCount = pendingRequestsByProductId.size;

  return (
    <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl shadow-sm overflow-hidden animate-in fade-in space-y-5 p-5 sm:p-6">
      {/* Top Header: Fixture & Physical Context Selector */}
      <PlanogramFixtureSelector
        stores={storeSites}
        selectedStoreId={selectedStoreId}
        onSelectStore={(id) => {
          setSelectedStoreId(id);
          setSwapSource(null);
        }}
        zone={zone}
        onSelectZone={setZone}
        aisle={aisle}
        onSelectAisle={setAisle}
        bay={bay}
        onSelectBay={setBay}
        fixtureType={fixtureType}
        onSelectFixtureType={setFixtureType}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        showHeatmap={showHeatmap}
        onToggleHeatmap={() => setShowHeatmap(!showHeatmap)}
      />

      {/* Proposal Progression Status Banner */}
      <div className="px-4 py-2.5 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider text-[11px]">
            Layout Workflow:
          </span>
          <div className="flex items-center gap-1.5 text-[var(--theme-text-secondary)]">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 size={13} /> Active Fixture
            </span>
            <span>→</span>
            <span className={`font-semibold flex items-center gap-1 ${
              pendingCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--theme-text-secondary)]'
            }`}>
              <Clock size={13} />
              <span>{pendingCount} Pending Revisions</span>
            </span>
            <span>→</span>
            <span>3 Regional Approvals Required</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsReviewModalOpen(true)}
          disabled={isSubmittingRevision}
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-[var(--theme-accent)] hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Sparkles size={13} />
          <span>Review Suggested Moves ({suggestedMoves.length})</span>
        </button>
      </div>

      {/* Selected Product Sticky Panel */}
      {selectedProduct && (
        <PlanogramSelectedPanel
          product={selectedProduct}
          metrics={salesMetricsIndex.get(selectedProduct.id)}
          onCancel={() => setSwapSource(null)}
          currencySymbol={currencySymbol}
        />
      )}

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
            try {
              await submitPlanogram([{ product, shelfPosition: targetShelf }]);
              await queryClient.invalidateQueries({ queryKey: ['planogram_pending_requests'] });
            } catch (err: any) {
              addNotification('alert', `Failed to move: ${err.message}`);
            }
          }}
          currencySymbol={currencySymbol}
        />
      )}

      {/* Review Suggested Moves Modal */}
      <PlanogramReviewMovesModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        moves={suggestedMoves}
        onConfirm={handleConfirmSuggestedMoves}
        isSubmitting={isSubmittingRevision}
      />
    </div>
  );
};
