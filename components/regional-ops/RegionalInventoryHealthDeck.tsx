import React from 'react';
import { Box, ArrowRightLeft, Truck, AlertTriangle, ShieldCheck } from 'lucide-react';
import { formatCompactNumber } from '../../utils/formatting';

interface RegionalInventoryHealthDeckProps {
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  optimalStockCount: number;
  totalSKUs: number;
  currencySymbol: string;
  onOpenTransfers: () => void;
  onOpenProcurement: () => void;
}

export const RegionalInventoryHealthDeck: React.FC<RegionalInventoryHealthDeckProps> = ({
  totalValue,
  lowStockCount,
  outOfStockCount,
  optimalStockCount,
  totalSKUs,
  currencySymbol,
  onOpenTransfers,
  onOpenProcurement
}) => {
  const safeTotal = Math.max(totalSKUs, 1);
  const optimalPercent = Math.round((optimalStockCount / safeTotal) * 100);
  const lowPercent = Math.round((lowStockCount / safeTotal) * 100);
  const outPercent = Math.round((outOfStockCount / safeTotal) * 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* 1. Regional Inventory Asset Valuation (5 cols) */}
      <div className="lg:col-span-5 p-5 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-[var(--theme-text-secondary)]">
            <span className="font-semibold uppercase tracking-wider">Territory Inventory Assets</span>
            <div className="p-2 rounded-xl bg-[var(--theme-accent)]/10 text-[var(--theme-accent)]">
              <Box size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--theme-text-primary)] mt-3">
            {formatCompactNumber(totalValue, { currency: currencySymbol })}
          </div>
          <p className="text-xs text-[var(--theme-text-secondary)] mt-1 font-medium">
            Active valuation across stores and distribution centers in this territory ({totalSKUs} SKUs)
          </p>
        </div>

        <div className="flex items-center gap-2 pt-4 mt-4 border-t border-[var(--theme-border)]">
          <button
            type="button"
            onClick={onOpenTransfers}
            className="flex-1 px-3 py-2 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-border)]/50 text-[var(--theme-text-primary)] border border-[var(--theme-border)] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <ArrowRightLeft size={13} />
            <span>Balance Stock</span>
          </button>
          <button
            type="button"
            onClick={onOpenProcurement}
            className="flex-1 px-3 py-2 rounded-xl bg-[var(--theme-accent)] text-[var(--theme-accent-contrast)] hover:opacity-90 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Truck size={13} />
            <span>Autonomous PO</span>
          </button>
        </div>
      </div>

      {/* 2. Stock Health Distribution (7 cols) */}
      <div className="lg:col-span-7 p-5 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="font-semibold text-[var(--theme-text-primary)]">Catalog Health Distribution</span>
            <span className="font-mono text-[11px] text-[var(--theme-text-secondary)] font-medium">
              {optimalPercent}% Healthy In-Stock
            </span>
          </div>

          {/* Distribution Stacked Bar */}
          <div className="w-full h-3 rounded-full overflow-hidden flex bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
            <div
              style={{ width: `${optimalPercent}%` }}
              className="bg-[var(--theme-status-success-bg)] h-full transition-all duration-300"
              title={`Optimal: ${optimalStockCount} SKUs`}
            />
            <div
              style={{ width: `${lowPercent}%` }}
              className="bg-[var(--theme-status-warning-bg)] h-full transition-all duration-300"
              title={`Low Stock: ${lowStockCount} SKUs`}
            />
            <div
              style={{ width: `${outPercent}%` }}
              className="bg-[var(--theme-status-danger-bg)] h-full transition-all duration-300"
              title={`Out of Stock: ${outOfStockCount} SKUs`}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] font-semibold">
                <ShieldCheck size={12} />
                <span>Optimal</span>
              </div>
              <div className="text-base font-bold font-mono text-[var(--theme-text-primary)] mt-1">
                {optimalStockCount}
              </div>
              <span className="text-[10px] text-[var(--theme-text-secondary)]">Sufficient buffer</span>
            </div>

            <div className="p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] font-semibold">
                <AlertTriangle size={12} />
                <span>Low Stock</span>
              </div>
              <div className="text-base font-bold font-mono text-[var(--theme-text-primary)] mt-1">
                {lowStockCount}
              </div>
              <span className="text-[10px] text-[var(--theme-text-secondary)]">Reorder required</span>
            </div>

            <div className="p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] font-semibold">
                <Box size={12} />
                <span>Out of Stock</span>
              </div>
              <div className="text-base font-bold font-mono text-[var(--theme-text-primary)] mt-1">
                {outOfStockCount}
              </div>
              <span className="text-[10px] text-[var(--theme-text-secondary)]">Depleted shelf</span>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-[var(--theme-text-secondary)] mt-3 pt-3 border-t border-[var(--theme-border)]">
          Stock thresholds dynamically governed per store type; sister-store loans recommended for critical zero-stock SKUs.
        </p>
      </div>
    </div>
  );
};
