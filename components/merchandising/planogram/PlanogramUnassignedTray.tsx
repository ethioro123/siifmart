import React, { useState, useMemo } from 'react';
import { Package, Search, Filter, MousePointer2, Plus } from 'lucide-react';
import type { Product, PendingInventoryChange } from '../../../types';
import type { ProductSalesMetrics } from '../../../utils/merchandisingAnalytics';

interface PlanogramUnassignedTrayProps {
  products: Product[];
  salesMetricsIndex: Map<string, ProductSalesMetrics>;
  pendingRequestsByProductId: Map<string, PendingInventoryChange>;
  swapSource: string | null;
  onSelectProduct: (productId: string) => void;
  currencySymbol: string;
}

export const PlanogramUnassignedTray: React.FC<PlanogramUnassignedTrayProps> = ({
  products,
  salesMetricsIndex,
  pendingRequestsByProductId,
  swapSource,
  onSelectProduct,
  currencySymbol
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Strictly unassigned products (no shelfPosition assigned)
  const unassignedProducts = useMemo(() => {
    return products.filter(p => !p.shelfPosition);
  }, [products]);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    unassignedProducts.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [unassignedProducts]);

  // Filtered unassigned products by search and category
  const filteredProducts = useMemo(() => {
    return unassignedProducts.filter(p => {
      const matchesSearch = !searchTerm ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [unassignedProducts, searchTerm, categoryFilter]);

  return (
    <div className="bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)] p-4 flex flex-col space-y-3">
      {/* Header with Counter */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--theme-border)]">
        <div>
          <h4 className="text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider">
            Unassigned Tray
          </h4>
          <p className="text-[10px] text-[var(--theme-text-secondary)]">
            Showing {filteredProducts.length} of {unassignedProducts.length} unplaced products
          </p>
        </div>
        <span className="text-[10px] font-semibold text-[var(--theme-accent)] bg-[var(--theme-accent)]/10 px-2 py-0.5 rounded-full">
          Click to Stage
        </span>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)]" />
          <input
            type="text"
            placeholder="Search SKU or name…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] pl-8 pr-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)] placeholder:text-[var(--theme-text-secondary)]/60"
          />
        </div>

        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter unassigned products by category"
            className="text-xs rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)] max-w-[120px]"
          >
            <option value="ALL">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {/* Unassigned Product Cards List */}
      <div
        className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1"
        role="region"
        aria-label="Unassigned products tray"
      >
        {filteredProducts.length === 0 ? (
          <div className="p-6 text-center text-xs text-[var(--theme-text-secondary)]">
            {unassignedProducts.length === 0
              ? 'All products for this store are assigned to fixtures.'
              : 'No unassigned products match your filter.'}
          </div>
        ) : (
          filteredProducts.map(p => {
            const isSelected = swapSource === p.id;
            const metrics = salesMetricsIndex.get(p.id);
            const pending = pendingRequestsByProductId.get(p.id);

            return (
              <button
                type="button"
                key={p.id}
                onClick={() => onSelectProduct(p.id)}
                aria-pressed={isSelected}
                aria-label={`Select unassigned product ${p.name}, SKU ${p.sku}`}
                className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-all cursor-pointer border focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
                  isSelected
                    ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/10 ring-1 ring-[var(--theme-accent)]'
                    : 'border-[var(--theme-border)] bg-[var(--theme-bg-card)]/80 hover:bg-[var(--theme-bg-card)] hover:border-[var(--theme-accent)]/40'
                }`}
              >
                {/* Thumbnail */}
                <div className="w-9 h-9 rounded-lg bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center shrink-0 overflow-hidden">
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
                    <Package size={15} className="text-[var(--theme-accent)]" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[var(--theme-text-primary)] truncate">
                    {p.name}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-[var(--theme-text-secondary)] font-mono">
                    <span>{p.sku || p.category}</span>
                    <span>·</span>
                    <span className="font-semibold text-[var(--theme-text-primary)]">
                      {currencySymbol} {p.price}
                    </span>
                    {metrics?.hasOrderHistory && (
                      <>
                        <span>·</span>
                        <span>{metrics.unitsSold7d} u/7d</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Staged indicator */}
                {isSelected ? (
                  <span className="text-[10px] font-semibold text-[var(--theme-accent)] flex items-center gap-1 uppercase tracking-wider">
                    <MousePointer2 size={12} />
                    <span>Staged</span>
                  </span>
                ) : (
                  <Plus size={14} className="text-[var(--theme-text-secondary)] shrink-0" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
