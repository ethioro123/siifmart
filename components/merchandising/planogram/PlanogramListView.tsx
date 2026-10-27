import React from 'react';
import { Package, ArrowRightLeft, Clock, CheckCircle, ChevronDown } from 'lucide-react';
import type { Product, PendingInventoryChange, ShelfPosition } from '../../../types';
import type { ProductSalesMetrics } from '../../../utils/merchandisingAnalytics';
import { VALID_SHELF_POSITIONS } from '../../../hooks/useSubmitMerchandisingChanges';

interface PlanogramListViewProps {
  products: Product[];
  salesMetricsIndex: Map<string, ProductSalesMetrics>;
  pendingRequestsByProductId: Map<string, PendingInventoryChange>;
  swapSource: string | null;
  onSelectProduct: (productId: string) => void;
  onQuickMove: (product: Product, targetShelf: string) => void;
  currencySymbol: string;
}

export const PlanogramListView: React.FC<PlanogramListViewProps> = ({
  products,
  salesMetricsIndex,
  pendingRequestsByProductId,
  swapSource,
  onSelectProduct,
  onQuickMove,
  currencySymbol
}) => {
  return (
    <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--theme-border)]">
        <div>
          <h4 className="text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider">
            Accessible Fixture Product List
          </h4>
          <p className="text-[11px] text-[var(--theme-text-secondary)]">
            Full keyboard and screen-reader accessible tabular layout for planogram management.
          </p>
        </div>
        <span className="text-xs font-semibold text-[var(--theme-text-primary)]">
          {products.length} Products
        </span>
      </div>

      <div className="border border-[var(--theme-border)] rounded-xl overflow-x-auto bg-[var(--theme-bg-card)]">
        <table className="w-full text-xs text-left" aria-label="Planogram product table">
          <thead className="bg-[var(--theme-bg-subtle)] border-b border-[var(--theme-border)] text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase">
            <tr>
              <th scope="col" className="p-3">Product</th>
              <th scope="col" className="p-3">Assigned Shelf</th>
              <th scope="col" className="p-3">Price</th>
              <th scope="col" className="p-3">7-Day Sales</th>
              <th scope="col" className="p-3">Proposal Status</th>
              <th scope="col" className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--theme-border)]">
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-xs text-[var(--theme-text-secondary)]">
                  No loaded products for this store.
                </td>
              </tr>
            ) : (
              products.map(p => {
                const metrics = salesMetricsIndex.get(p.id);
                const pending = pendingRequestsByProductId.get(p.id);
                const isSelected = swapSource === p.id;

                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-[var(--theme-bg-subtle)]/40 transition-colors ${
                      isSelected ? 'bg-[var(--theme-accent)]/10' : ''
                    }`}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center shrink-0 overflow-hidden">
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
                            <Package size={14} className="text-[var(--theme-accent)]" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--theme-text-primary)]">{p.name}</p>
                          <p className="text-[10px] text-[var(--theme-text-secondary)] font-mono">{p.sku}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)]">
                        {p.shelfPosition || 'Unassigned'}
                      </span>
                    </td>

                    <td className="p-3 font-semibold text-[var(--theme-text-primary)]">
                      {currencySymbol} {p.price}
                    </td>

                    <td className="p-3 font-mono">
                      {metrics?.hasOrderHistory ? (
                        <span className="font-semibold text-[var(--theme-text-primary)]">
                          {metrics.unitsSold7d} units
                        </span>
                      ) : (
                        <span className="text-[11px] text-[var(--theme-text-secondary)] italic">
                          No sales data
                        </span>
                      )}
                    </td>

                    <td className="p-3">
                      {pending ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <Clock size={10} />
                          <span>Moving to {pending.proposedChanges?.shelfPosition || 'New Tier'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                          <CheckCircle size={11} />
                          <span>Active Layout</span>
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectProduct(p.id)}
                          aria-pressed={isSelected}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-[var(--theme-accent)] text-white border-[var(--theme-accent)]'
                              : 'bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-border)]/50 text-[var(--theme-text-primary)] border-[var(--theme-border)]'
                          }`}
                        >
                          <ArrowRightLeft size={11} />
                          <span>{isSelected ? 'Selected' : 'Swap'}</span>
                        </button>

                        <select
                          disabled={Boolean(pending)}
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              onQuickMove(p, e.target.value);
                            }
                          }}
                          aria-label={`Move ${p.name} to another shelf tier`}
                          className="text-xs rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)]"
                        >
                          <option value="">Move to…</option>
                          {VALID_SHELF_POSITIONS.filter(pos => pos !== p.shelfPosition).map(pos => (
                            <option key={pos} value={pos}>{pos}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
