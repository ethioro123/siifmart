import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle } from 'lucide-react';
import type { PendingInventoryChange, Product } from '../../../types';
import { checkRequiresFinanceSignoff, MARGIN_FLOOR_PCT } from '../../../utils/pricingGovernance';

interface ProposalDiffViewProps {
  request: PendingInventoryChange;
  currentProduct?: Partial<Product> | null;
  currencySymbol?: string;
}

export const ProposalDiffView: React.FC<ProposalDiffViewProps> = ({
  request,
  currentProduct,
  currencySymbol = 'ETB'
}) => {
  const [showRawJson, setShowRawJson] = useState(false);
  const proposed = request.proposedChanges || {};

  const pricingAnalysis = checkRequiresFinanceSignoff(
    proposed,
    currentProduct || request.currentProduct
  );

  const baseline = currentProduct || request.currentProduct || {};

  // Normalize fields to inspect
  const diffRows: Array<{ label: string; currentVal: string; proposedVal: string; isChanged: boolean }> = [];

  const addDiff = (label: string, cur: any, prop: any) => {
    if (prop === undefined) return;
    const curStr = cur === undefined || cur === null || cur === '' ? '—' : String(cur);
    const propStr = prop === undefined || prop === null || prop === '' ? '—' : String(prop);
    diffRows.push({
      label,
      currentVal: curStr,
      proposedVal: propStr,
      isChanged: curStr !== propStr
    });
  };

  if ('name' in proposed) addDiff('Product Name', baseline.name, proposed.name);
  if ('sku' in proposed) addDiff('SKU', baseline.sku, proposed.sku);
  if ('category' in proposed) addDiff('Category', baseline.category, proposed.category);
  if ('brand' in proposed) addDiff('Brand', baseline.brand, proposed.brand);
  if ('description' in proposed) addDiff('Description', baseline.description, proposed.description);
  if ('barcode' in proposed) addDiff('Barcode', baseline.barcode, proposed.barcode);
  if ('minStock' in proposed || 'min_stock' in proposed) {
    addDiff('Min Stock', baseline.minStock, (proposed as any).minStock ?? (proposed as any).min_stock);
  }
  if ('maxStock' in proposed || 'max_stock' in proposed) {
    addDiff('Max Stock', baseline.maxStock, (proposed as any).maxStock ?? (proposed as any).max_stock);
  }
  if ('shelfPosition' in proposed || 'shelf_position' in proposed) {
    addDiff('Shelf Position', baseline.shelfPosition, (proposed as any).shelfPosition ?? (proposed as any).shelf_position);
  }

  const hasPricing = pricingAnalysis.effectiveSellingPrice !== null || pricingAnalysis.effectiveCostPrice !== null;

  return (
    <div className="space-y-3 mt-3">
      {/* Pricing & Margin Comparison Card if pricing is affected */}
      {hasPricing && (
        <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] p-3 text-xs space-y-2">
          <div className="flex items-center justify-between border-b border-[var(--theme-border)] pb-2">
            <span className="font-semibold text-[var(--theme-text-primary)]">Pricing & Margin Impact</span>
            {pricingAnalysis.requiresFinance ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <AlertTriangle size={12} />
                Below {MARGIN_FLOOR_PCT}% Floor · Finance Co-Approval Required
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle size={12} />
                Complies with Margin Floor
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div>
              <p className="text-[10px] text-[var(--theme-text-secondary)]">Current Selling Price</p>
              <p className="font-medium text-[var(--theme-text-primary)]">
                {currencySymbol} {baseline.price !== undefined ? Number(baseline.price).toLocaleString() : '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--theme-text-secondary)]">Proposed Selling Price</p>
              <p className="font-bold text-[var(--theme-accent)]">
                {currencySymbol} {pricingAnalysis.effectiveSellingPrice !== null ? pricingAnalysis.effectiveSellingPrice.toLocaleString() : '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--theme-text-secondary)]">Cost Price (Baseline)</p>
              <p className="font-medium text-[var(--theme-text-primary)]">
                {currencySymbol} {pricingAnalysis.effectiveCostPrice !== null ? pricingAnalysis.effectiveCostPrice.toLocaleString() : '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--theme-text-secondary)]">Effective Gross Margin</p>
              <p className={`font-bold ${pricingAnalysis.requiresFinance ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {pricingAnalysis.effectiveMarginPct !== null ? `${pricingAnalysis.effectiveMarginPct.toFixed(1)}%` : 'N/A'}
                {pricingAnalysis.currentMarginPct !== null && (
                  <span className="text-[10px] font-normal text-[var(--theme-text-secondary)] ml-1">
                    (was {pricingAnalysis.currentMarginPct.toFixed(1)}%)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Product Details Diff Rows */}
      {diffRows.length > 0 && (
        <div className="rounded-xl border border-[var(--theme-border)] overflow-hidden text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--theme-bg-subtle)] border-b border-[var(--theme-border)] text-[var(--theme-text-secondary)]">
                <th className="p-2 font-semibold">Attribute</th>
                <th className="p-2 font-semibold">Current Value</th>
                <th className="p-2 font-semibold">Proposed Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--theme-border)]">
              {diffRows.map(row => (
                <tr key={row.label} className={row.isChanged ? 'bg-[var(--theme-bg-card)]' : 'opacity-70'}>
                  <td className="p-2 font-medium text-[var(--theme-text-primary)]">{row.label}</td>
                  <td className="p-2 text-[var(--theme-text-secondary)] max-w-[200px] truncate">{row.currentVal}</td>
                  <td className="p-2 font-semibold text-[var(--theme-accent)] max-w-[200px] truncate">{row.proposedVal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Raw JSON toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowRawJson(prev => !prev)}
          className="inline-flex items-center gap-1 text-[11px] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors"
        >
          {showRawJson ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          <span>{showRawJson ? 'Hide Raw Payload' : 'View Raw Payload'}</span>
        </button>
        {showRawJson && (
          <pre className="mt-1 p-2 rounded-lg bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] whitespace-pre-wrap break-words text-[11px] font-mono text-[var(--theme-text-secondary)]">
            {JSON.stringify(proposed, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};
