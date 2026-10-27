import React, { useEffect } from 'react';
import { Package, X, ArrowRightLeft, MapPin, BarChart3, AlertCircle } from 'lucide-react';
import type { Product } from '../../../types';
import type { ProductSalesMetrics } from '../../../utils/merchandisingAnalytics';

interface PlanogramSelectedPanelProps {
  product: Product;
  metrics?: ProductSalesMetrics;
  onCancel: () => void;
  currencySymbol: string;
}

export const PlanogramSelectedPanel: React.FC<PlanogramSelectedPanelProps> = ({
  product,
  metrics,
  onCancel,
  currencySymbol
}) => {
  // Support Escape key to cancel selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="p-4 bg-[var(--theme-accent)]/10 border-2 border-[var(--theme-accent)] rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-2"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* Product Details Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center justify-center shrink-0 overflow-hidden">
            {product.image && !product.image.includes('placeholder.com') ? (
              <img
                src={product.image}
                className="w-full h-full object-cover"
                alt=""
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <Package size={20} className="text-[var(--theme-accent)]" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--theme-accent)] bg-[var(--theme-accent)]/20 px-2 py-0.5 rounded-full">
                Selected for Placement
              </span>
              <span className="text-[11px] font-mono text-[var(--theme-text-secondary)]">
                SKU: {product.sku}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-[var(--theme-text-primary)] mt-0.5">
              {product.name}
            </h4>
            <div className="flex items-center gap-3 text-xs text-[var(--theme-text-secondary)] mt-0.5">
              <span>Category: <strong className="text-[var(--theme-text-primary)] font-medium">{product.category}</strong></span>
              <span>·</span>
              <span>Current Shelf: <strong className="text-[var(--theme-text-primary)] font-medium">{product.shelfPosition || 'Unassigned'}</strong></span>
              <span>·</span>
              <span>Price: <strong className="text-[var(--theme-text-primary)] font-medium">{currencySymbol} {product.price}</strong></span>
              {metrics?.hasOrderHistory && (
                <>
                  <span>·</span>
                  <span>7d Sales: <strong className="text-[var(--theme-text-primary)] font-medium">{metrics.unitsSold7d} units</strong></span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Cancel Button */}
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel product selection"
          className="px-3 py-1.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] text-xs font-semibold text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] flex items-center gap-1.5 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
        >
          <X size={14} />
          <span>Cancel (Esc)</span>
        </button>
      </div>

      {/* Instructional Banner */}
      <div className="mt-3 pt-3 border-t border-[var(--theme-accent)]/20 flex items-center gap-2 text-xs text-[var(--theme-text-primary)]">
        <ArrowRightLeft size={14} className="text-[var(--theme-accent)] shrink-0" />
        <span>
          <strong>Next step:</strong> Click another product card on the fixture to <strong>swap</strong> their positions, or click <strong>[Place Here]</strong> on any tier to assign it.
        </span>
      </div>
    </div>
  );
};
