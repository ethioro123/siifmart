import React from 'react';
import { Hash, RefreshCw, Save, AlertTriangle, Check } from 'lucide-react';
import { Product } from '../../../types';
import { getSellUnit } from '../../../utils/units';

export interface StockConfig {
    minStock: string;
    maxStock: string;
}

interface Props {
    product: Product;
    stockCfg: StockConfig;
    setStockCfg: React.Dispatch<React.SetStateAction<StockConfig>>;
    handleSaveStock: () => Promise<void>;
    isSaving: boolean;
    sellUnit: string;
}

export const StockTab: React.FC<Props> = ({
    product,
    stockCfg,
    setStockCfg,
    handleSaveStock,
    isSaving,
    sellUnit
}) => {
    const unitDef = getSellUnit(sellUnit);

    return (
        <div className="space-y-4">
            <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] flex items-center justify-between">
                <div>
                    <p className="text-[10px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">Current Stock</p>
                    <p className="text-2xl font-bold font-mono tabular-nums text-[var(--theme-text-primary)]">
                        {product.stock} <span className="text-sm font-semibold text-[var(--theme-text-secondary)]">{unitDef.shortLabel}</span>
                    </p>
                </div>
                <Hash size={24} className="text-[var(--theme-text-secondary)] opacity-40" />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs font-semibold text-amber-600 dark:text-amber-400 block mb-1.5">Min Stock (Reorder Point)</label>
                    <input
                        type="number"
                        min="0"
                        value={stockCfg.minStock}
                        onChange={e => setStockCfg(c => ({ ...c, minStock: e.target.value }))}
                        placeholder="e.g. 10"
                        className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] focus:border-amber-500 rounded-xl px-3 py-2 text-sm font-mono font-semibold tabular-nums text-[var(--theme-text-primary)] outline-none transition-colors"
                    />
                    <p className="text-[10px] text-[var(--theme-text-secondary)] mt-1">Alert triggered below this level</p>
                </div>
                <div>
                    <label className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block mb-1.5">Max Stock (Capacity)</label>
                    <input
                        type="number"
                        min="0"
                        value={stockCfg.maxStock}
                        onChange={e => setStockCfg(c => ({ ...c, maxStock: e.target.value }))}
                        placeholder="e.g. 100"
                        className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] focus:border-emerald-500 rounded-xl px-3 py-2 text-sm font-mono font-semibold tabular-nums text-[var(--theme-text-primary)] outline-none transition-colors"
                    />
                    <p className="text-[10px] text-[var(--theme-text-secondary)] mt-1">Replenishment target ceiling</p>
                </div>
            </div>

            {(stockCfg.minStock || stockCfg.maxStock) && (() => {
                const min = parseInt(stockCfg.minStock) || 0;
                const max = parseInt(stockCfg.maxStock) || 0;
                const pct = max > 0 ? Math.min(100, (product.stock / max) * 100) : 0;
                const isLow = min > 0 && product.stock < min;
                return (
                    <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-semibold uppercase tracking-wider">
                            <span className={isLow ? 'text-rose-600 dark:text-rose-400 flex items-center gap-1' : 'text-emerald-600 dark:text-emerald-400 flex items-center gap-1'}>
                                {isLow ? (
                                    <>
                                        <AlertTriangle size={12} />
                                        <span>Below Min — Reorder Needed</span>
                                    </>
                                ) : (
                                    <>
                                        <Check size={12} />
                                        <span>Within Policy</span>
                                    </>
                                )}
                            </span>
                            <span className="text-[var(--theme-text-secondary)] font-mono tabular-nums">{Math.round(pct)}% of max</span>
                        </div>
                        <div className="h-1.5 bg-[var(--theme-border)] rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${isLow ? 'bg-rose-500' : pct > 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-[10px] text-[var(--theme-text-secondary)] font-mono tabular-nums">
                            <span>Min: {min || '—'}</span>
                            <span className="font-semibold text-[var(--theme-text-primary)]">Now: {product.stock}</span>
                            <span>Max: {max || '—'}</span>
                        </div>
                    </div>
                );
            })()}

            <button
                type="button"
                onClick={handleSaveStock}
                disabled={isSaving}
                className="w-full py-2.5 bg-[var(--theme-accent)] hover:opacity-90 text-white rounded-xl font-semibold text-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-opacity"
            >
                {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                <span>{isSaving ? 'Saving...' : 'Save Stock Policies'}</span>
            </button>
        </div>
    );
};

