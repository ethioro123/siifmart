import React from 'react';
import { Layers, TrendingDown, TrendingUp, Lock, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface EditableStockPoliciesCardProps {
    register: any;
    watch: any;
    thresholdsDisabled: boolean;
}

export const EditableStockPoliciesCard: React.FC<EditableStockPoliciesCardProps> = ({
    register,
    watch,
    thresholdsDisabled
}) => {
    const stock = Number(watch('stock')) || 0;
    const minStock = Number(watch('minStock')) || 0;
    const maxStock = Number(watch('maxStock')) || 0;

    const stockPct = maxStock > 0 ? Math.min(100, (stock / maxStock) * 100) : null;
    const isLow = minStock > 0 && stock < minStock;
    const isOptimal = minStock > 0 && maxStock > 0 && stock >= minStock && stock <= maxStock;

    return (
        <div className="bg-[var(--theme-bg-card)] p-5 rounded-2xl border border-[var(--theme-border)] space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-[var(--theme-border)] pb-2.5">
                <div className="flex items-center gap-2">
                    <Layers size={14} className="text-[var(--theme-text-secondary)]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-primary)]">
                        Stock Policies
                    </h3>
                </div>
                {thresholdsDisabled && (
                    <span className="text-[11px] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] font-bold uppercase tracking-wider flex items-center gap-1.5 bg-[var(--theme-status-warning-bg)] px-2.5 py-0.5 rounded-full border border-[var(--theme-status-warning-border)]">
                        <Lock size={11} /> Manager Access Required
                    </span>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3">
                {/* Min Stock */}
                <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] space-y-1">
                    <label className="text-[11px] text-[var(--theme-text-muted)] font-medium uppercase tracking-wider block">
                        Min Stock (Reorder Point)
                    </label>
                    <div className="flex items-center gap-1.5">
                        <TrendingDown size={14} className="text-[var(--theme-status-warning-text)] shrink-0" />
                        <input
                            type="number"
                            min="0"
                            {...register('minStock', { valueAsNumber: true })}
                            placeholder="e.g. 10"
                            disabled={thresholdsDisabled}
                            className={`w-full bg-transparent text-sm font-mono font-bold text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] focus:outline-none ${
                                thresholdsDisabled ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        />
                    </div>
                    <span className="text-[11px] text-[var(--theme-text-muted)] block">Safety buffer alert</span>
                </div>

                {/* Max Stock */}
                <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] space-y-1">
                    <label className="text-[11px] text-[var(--theme-text-muted)] font-medium uppercase tracking-wider block">
                        Max Stock (Capacity)
                    </label>
                    <div className="flex items-center gap-1.5">
                        <TrendingUp size={14} className="text-[var(--theme-status-success-text)] shrink-0" />
                        <input
                            type="number"
                            min="0"
                            {...register('maxStock', { valueAsNumber: true })}
                            placeholder="e.g. 100"
                            disabled={thresholdsDisabled}
                            className={`w-full bg-transparent text-sm font-mono font-bold text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] focus:outline-none ${
                                thresholdsDisabled ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        />
                    </div>
                    <span className="text-[11px] text-[var(--theme-text-muted)] block">Capacity ceiling</span>
                </div>
            </div>

            {/* Live Stock Health Bar */}
            {(minStock > 0 || maxStock > 0) && (
                <div className="p-3.5 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                        {isLow ? (
                            <span className="text-[var(--theme-status-danger-text)] flex items-center gap-1">
                                <AlertTriangle size={12} className="shrink-0" /> Below Min — Triggers Replenishment
                            </span>
                        ) : isOptimal ? (
                            <span className="text-[var(--theme-status-success-text)] flex items-center gap-1">
                                <CheckCircle size={12} className="shrink-0" /> Optimal Stock Range
                            </span>
                        ) : (
                            <span className="text-[var(--theme-text-muted)] flex items-center gap-1">
                                <Info size={12} className="shrink-0" /> Stock Policy Active
                            </span>
                        )}
                        {stockPct !== null && (
                            <span className="text-[var(--theme-text-muted)] font-mono">{Math.round(stockPct)}% of max</span>
                        )}
                    </div>
                    {stockPct !== null && (
                        <div className="w-full h-1.5 bg-[var(--theme-bg-card)] rounded-full overflow-hidden border border-[var(--theme-border)]">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                    isLow ? 'bg-[var(--theme-status-danger-bg)]' : stockPct > 80 ? 'bg-[var(--theme-status-success-bg)]' : 'bg-[var(--theme-status-warning-bg)]'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(0, stockPct))}%` }}
                            />
                        </div>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-[var(--theme-text-muted)] font-mono">
                        <span>Min: {minStock || '—'}</span>
                        <span>Current: <strong className="text-[var(--theme-text-primary)]">{stock}</strong></span>
                        <span>Max: {maxStock || '—'}</span>
                    </div>
                </div>
            )}
        </div>
    );
};
