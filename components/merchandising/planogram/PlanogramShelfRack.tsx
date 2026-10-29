import React from 'react';
import { Package, MousePointer2, Plus, Clock, AlertCircle } from 'lucide-react';
import type { FixtureDefinition, FixtureTier } from './types';
import type { Product, PendingInventoryChange } from '../../../types';
import type { ProductSalesMetrics } from '../../../utils/merchandisingAnalytics';

interface PlanogramShelfRackProps {
  fixture: FixtureDefinition;
  products: Product[];
  salesMetricsIndex: Map<string, ProductSalesMetrics>;
  pendingRequestsByProductId: Map<string, PendingInventoryChange>;
  swapSource: string | null;
  onSelectProduct: (productId: string) => void;
  onMoveToTier: (tierPosition: string) => void;
  showHeatmap: boolean;
  currencySymbol: string;
}

export const PlanogramShelfRack: React.FC<PlanogramShelfRackProps> = ({
  fixture,
  products,
  salesMetricsIndex,
  pendingRequestsByProductId,
  swapSource,
  onSelectProduct,
  onMoveToTier,
  showHeatmap,
  currencySymbol
}) => {
  // Calculate total loaded sales units (7d recorded)
  const totalFixtureUnits7d = fixture.tiers.reduce((total, tier) => {
    const tierProducts = products.filter(p => p.shelfPosition === tier.position);
    const tierUnits = tierProducts.reduce((sum, p) => {
      const metrics = salesMetricsIndex.get(p.id);
      return sum + (metrics?.unitsSold7d || 0);
    }, 0);
    return total + tierUnits;
  }, 0);

  return (
    <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-6 space-y-6">
      {/* Fixture Header & Heatmap Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--theme-border)]">
        <div>
          <h4 className="text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider">
            {fixture.label}
          </h4>
          <p className="text-[11px] text-[var(--theme-text-secondary)]">
            {fixture.tiers.length} Placement {fixture.tiers.length === 1 ? 'Tier' : 'Tiers'} · Select an item to swap or reposition
          </p>
        </div>

        {showHeatmap && (
          <div className="flex items-center gap-3 text-xs bg-[var(--theme-bg-card)] px-3 py-1.5 rounded-xl border border-[var(--theme-border)]">
            <span className="flex items-center gap-1.5 text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] font-medium">
              <span className="w-2 h-2 rounded-full bg-[var(--theme-status-success-bg)]"></span> High Vel
            </span>
            <span className="flex items-center gap-1.5 text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] font-medium">
              <span className="w-2 h-2 rounded-full bg-[var(--theme-status-warning-bg)]"></span> Med
            </span>
            <span className="flex items-center gap-1.5 text-[var(--theme-text-secondary)] font-medium">
              <span className="w-2 h-2 rounded-full bg-stone-400 dark:bg-stone-600"></span> Low
            </span>
          </div>
        )}
      </div>

      {/* Fixture Tiers */}
      <div className="space-y-6">
        {fixture.tiers.map((tier) => {
          // Strictly match items assigned to this tier position (Never leak unassigned items here)
          const tierProducts = products.filter(p => p.shelfPosition === tier.position);
          const hasRecordedHistory = tierProducts.some(p => salesMetricsIndex.get(p.id)?.hasOrderHistory);
          const tierUnitsSold7d = tierProducts.reduce((sum, p) => {
            const metrics = salesMetricsIndex.get(p.id);
            return sum + (metrics?.unitsSold7d || 0);
          }, 0);

          // Merchandising Whole-Number Rule: round to nearest integer
          const sharePct = totalFixtureUnits7d > 0
            ? Math.round((tierUnitsSold7d / totalFixtureUnits7d) * 100)
            : 0;

          return (
            <div key={tier.position} className="space-y-2">
              {/* Tier Header with Recorded Sales */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold uppercase tracking-wider ${
                    tier.isPrime ? 'text-[var(--theme-accent)]' : 'text-[var(--theme-text-primary)]'
                  }`}>
                    {tier.label}
                  </span>
                  {tier.isPrime && (
                    <span className="text-[10px] bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                      Prime Tier
                    </span>
                  )}
                  <span className="text-[10px] text-[var(--theme-text-secondary)] font-medium">
                    {tierProducts.length} products · capacity not recorded
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {hasRecordedHistory ? (
                    <span className="font-mono text-xs font-semibold text-[var(--theme-text-primary)]">
                      {tierUnitsSold7d} units/7d ({sharePct}% loaded sales)
                    </span>
                  ) : (
                    <span className="text-[11px] text-[var(--theme-text-secondary)] italic">
                      No sales data recorded
                    </span>
                  )}
                </div>
              </div>

              {/* Tier Progress Bar (Share of Fixture Sales) */}
              <div className="w-full h-1.5 bg-[var(--theme-border)] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    tier.isPrime ? 'bg-[var(--theme-accent)]' : 'bg-[var(--theme-text-secondary)]/50'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, sharePct))}%` }}
                />
              </div>

              {/* Shelf Rack Bay Container (Horizontally Scrollable, Accessible) */}
              <div
                className={`min-h-[120px] p-3 border-b-4 rounded-b-2xl flex items-end gap-3 overflow-x-auto custom-scrollbar relative transition-colors ${
                  tier.isPrime
                    ? 'bg-[var(--theme-accent)]/5 border-b-[var(--theme-accent)]/50'
                    : 'bg-[var(--theme-bg-card)]/60 border-b-[var(--theme-border)]'
                }`}
                role="region"
                aria-label={`${tier.label} shelf with ${tierProducts.length} products`}
              >
                {tierProducts.length === 0 && !swapSource && (
                  <div className="w-full h-24 flex flex-col items-center justify-center text-xs text-[var(--theme-text-secondary)] border border-dashed border-[var(--theme-border)] rounded-xl">
                    <Package size={20} className="mb-1 opacity-40" />
                    <span>Empty shelf tier. Select an unassigned product to place here.</span>
                  </div>
                )}

                {tierProducts.map((p) => {
                  const isSelected = swapSource === p.id;
                  const metrics = salesMetricsIndex.get(p.id);
                  const pendingProposal = pendingRequestsByProductId.get(p.id);
                  const velocity = metrics?.effectiveVelocity || p.salesVelocity;
                  const isHot = velocity === 'High';
                  const isMedium = velocity === 'Medium';

                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => onSelectProduct(p.id)}
                      aria-label={`Select ${p.name}, SKU ${p.sku}, Shelf ${tier.label}${pendingProposal ? ', Pending Approval' : ''}`}
                      aria-pressed={isSelected}
                      className={`w-28 h-28 rounded-xl transition-all cursor-pointer relative overflow-hidden border flex flex-col justify-between p-2 shrink-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
                        isSelected
                          ? 'border-[var(--theme-accent)] ring-2 ring-[var(--theme-accent)]/40 scale-105 shadow-md z-10 bg-[var(--theme-bg-card)]'
                          : 'border-[var(--theme-border)] hover:border-[var(--theme-accent)]/40 bg-[var(--theme-bg-card)]'
                      } ${
                        showHeatmap && isHot
                          ? 'ring-2 ring-[var(--theme-status-success-border)] bg-[var(--theme-status-success-bg)]'
                          : showHeatmap && isMedium
                          ? 'ring-1 ring-[var(--theme-status-warning-border)] bg-[var(--theme-status-warning-bg)]'
                          : ''
                      }`}
                    >
                      {/* Image Thumbnail & Pending Overlay */}
                      <div className="w-full h-12 bg-[var(--theme-bg-subtle)] rounded-lg flex items-center justify-center overflow-hidden border border-[var(--theme-border)] relative">
                        {p.image && !p.image.includes('placeholder.com') ? (
                          <img
                            src={p.image}
                            className="w-full h-full object-cover"
                            alt=""
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Package size={16} className="text-[var(--theme-accent)]" />
                        )}

                        {pendingProposal && (
                          <div className="absolute inset-0 bg-[var(--theme-status-warning-bg)] flex items-center justify-center text-white text-[9px] font-semibold tracking-wider uppercase gap-0.5">
                            <Clock size={10} />
                            <span>Pending</span>
                          </div>
                        )}
                      </div>

                      {/* Product Name & SKU */}
                      <div className="overflow-hidden">
                        <p className="text-[11px] font-semibold text-[var(--theme-text-primary)] truncate leading-tight">
                          {p.name}
                        </p>
                        <p className="text-[9px] text-[var(--theme-text-secondary)] font-mono truncate">
                          {p.sku || p.category}
                        </p>
                      </div>

                      {/* Velocity & 7d Units Footer */}
                      <div className="flex items-center justify-between text-[9px]">
                        <span className="font-semibold text-[var(--theme-text-primary)]">
                          {currencySymbol} {p.price}
                        </span>
                        {metrics?.hasOrderHistory ? (
                          <span className="font-mono text-[var(--theme-text-secondary)]">
                            {metrics.unitsSold7d} u/7d
                          </span>
                        ) : (
                          <span className="text-[var(--theme-text-secondary)] italic">
                            No data
                          </span>
                        )}
                      </div>

                      {/* Swap Target Indicator */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-white backdrop-blur-[2px]">
                          <MousePointer2 size={14} className="motion-safe:animate-bounce" />
                          <span className="text-[9px] font-semibold uppercase mt-0.5 tracking-wider">
                            Swap Target
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}

                {/* Place Button when an item is selected */}
                {swapSource && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveToTier(tier.position);
                    }}
                    aria-label={`Place selected product on ${tier.label}`}
                    className="h-28 w-24 border-2 border-dashed border-[var(--theme-accent)]/50 rounded-xl flex flex-col items-center justify-center text-xs font-semibold text-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/10 transition-colors cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                  >
                    <Plus size={18} className="mb-1" />
                    <span>Place Here</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
