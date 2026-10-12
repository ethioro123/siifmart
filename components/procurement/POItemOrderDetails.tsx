import React from 'react';
import { ShoppingBag, Sparkles } from 'lucide-react';
import { getCategorySpecGroup } from './categoryAttributes';
import { getCategoryProcurementMetrics } from './categoryLogistics';

export interface POItemOrderDetailsProps {
    currentQty: number;
    setCurrentQty: (val: number) => void;
    currentCost: number;
    setCurrentCost: (val: number) => void;
    currentRetailPrice: number;
    setCurrentRetailPrice: (val: number) => void;
    unitsPerOrderUnit: number;
    totalUnits: number;
    showConversion: boolean;
    unitSuffix: string;
    orderUnitName: string;
    sellUnit: string;
    currencySymbol: string;
    showRetailInput: boolean;
    errors: Record<string, string>;
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    selectedMainCategory?: string;
    customAttributes?: any;
}

export const POItemOrderDetails: React.FC<POItemOrderDetailsProps> = ({
    currentQty,
    setCurrentQty,
    currentCost,
    setCurrentCost,
    currentRetailPrice,
    setCurrentRetailPrice,
    unitsPerOrderUnit,
    totalUnits,
    showConversion,
    unitSuffix,
    orderUnitName,
    sellUnit,
    currencySymbol,
    showRetailInput,
    errors,
    setErrors,
    selectedMainCategory = '',
    customAttributes
}) => {
    const costPerSellUnit = unitsPerOrderUnit > 1 ? currentCost / unitsPerOrderUnit : currentCost;
    const specGroup = getCategorySpecGroup(selectedMainCategory, customAttributes?.identity?.subcategory);
    const domainId = specGroup.id;
    const procurementMetrics = getCategoryProcurementMetrics(domainId, currentQty, unitsPerOrderUnit, customAttributes);
    const totalCommitment = currentQty > 0 && currentCost > 0 ? currentQty * currentCost : 0;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--theme-border-subtle)]">
                <span className="text-[10px] text-[var(--theme-text-primary)] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag size={13} className="text-[var(--theme-accent)]" /> Procurement & Order Quantity
                </span>
            </div>

            <div className="rounded-2xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] p-5 shadow-sm space-y-4">
                <div className="grid grid-cols-12 gap-4">
                    {/* Order Qty */}
                    <div className={`${showRetailInput ? 'col-span-4' : 'col-span-6'} space-y-1`}>
                        <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider font-semibold ml-1 block">
                            Order Qty{' '}
                            {unitSuffix && (
                                <span className="text-[var(--theme-text-secondary)] normal-case font-medium text-[9px]">
                                    {unitSuffix}
                                </span>
                            )}{' '}
                            <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="number"
                            step="1"
                            min="1"
                            className={`w-full h-11 bg-[var(--theme-bg-subtle)] border ${errors.qty ? 'border-rose-500/50' : 'border-[var(--theme-border)]'} rounded-2xl px-4 text-xs text-[var(--theme-text-primary)] font-mono focus:border-[var(--theme-accent)] text-center font-bold outline-none transition-all tabular-nums`}
                            value={currentQty || ''}
                            onChange={e => {
                                const val = parseInt(e.target.value) || 0;
                                setCurrentQty(val);
                                if (errors.qty) setErrors(prev => ({ ...prev, qty: '' }));
                            }}
                            placeholder="0"
                        />
                        {showConversion && (
                            <span className="text-[10px] text-[var(--theme-text-secondary)] block text-center font-mono font-medium">
                                = {totalUnits.toLocaleString()} sellable {sellUnit === 'ea' ? 'units' : `${sellUnit}s`}
                            </span>
                        )}
                        {errors.qty && <span className="text-[9px] text-rose-500 block text-center font-semibold">{errors.qty}</span>}
                    </div>

                    {/* Manifest Unit Cost */}
                    <div className={`${showRetailInput ? 'col-span-4' : 'col-span-6'} space-y-1`}>
                        <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider font-semibold ml-1 block">
                            Cost / {orderUnitName} <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="number"
                            step="any"
                            min="0"
                            className={`w-full h-11 bg-[var(--theme-bg-subtle)] border ${errors.cost ? 'border-rose-500/50' : 'border-[var(--theme-border)]'} rounded-2xl px-4 text-xs text-[var(--theme-text-primary)] font-mono focus:border-[var(--theme-accent)] text-center font-bold outline-none transition-all tabular-nums`}
                            value={currentCost || ''}
                            onChange={e => {
                                setCurrentCost(parseFloat(e.target.value) || 0);
                                if (errors.cost) setErrors(prev => ({ ...prev, cost: '' }));
                            }}
                            placeholder="0.00"
                        />
                        {currentCost > 0 && unitsPerOrderUnit > 1 && (
                            <span className="text-[10px] text-[var(--theme-text-secondary)] block text-center font-mono font-medium">
                                = ~{currencySymbol} {costPerSellUnit.toFixed(2)} / {sellUnit}
                            </span>
                        )}
                        {errors.cost && <span className="text-[9px] text-rose-500 block text-center font-semibold">{errors.cost}</span>}
                    </div>

                    {/* Retail Input (Shown for Catalog items) */}
                    {showRetailInput && (
                        <div className="col-span-4 space-y-1 relative">
                            <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider font-semibold ml-1 block">
                                Retail / {sellUnit} <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                {(() => {
                                    if (!currentRetailPrice || !costPerSellUnit) return null;
                                    const marginPct = ((currentRetailPrice - costPerSellUnit) / currentRetailPrice) * 100;
                                    const badgeClass = marginPct >= 40
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                        : marginPct >= 20
                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
                                    return (
                                        <div className={`absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>
                                            {parseFloat(marginPct.toFixed(2))}%
                                        </div>
                                    );
                                })()}
                                <input
                                    type="number"
                                    className={`w-full h-11 bg-[var(--theme-bg-subtle)] border ${errors.retail ? 'border-rose-500/50' : 'border-[var(--theme-border)]'} rounded-2xl text-xs text-[var(--theme-text-primary)] font-mono focus:border-[var(--theme-accent)] text-center font-bold outline-none transition-all tabular-nums ${currentRetailPrice > 0 && currentCost > 0 ? 'pl-16 pr-2' : 'px-4'}`}
                                    value={currentRetailPrice || ''}
                                    onChange={e => {
                                        setCurrentRetailPrice(Math.round(parseFloat(e.target.value) || 0));
                                        if (errors.retail) setErrors(prev => ({ ...prev, retail: '' }));
                                    }}
                                    placeholder="0"
                                />
                            </div>
                            {errors.retail && <span className="text-[9px] text-rose-500 block text-center font-semibold">{errors.retail}</span>}
                        </div>
                    )}
                </div>

                {/* Dynamic Category Procurement Metrics & Order Commitment */}
                {(procurementMetrics.length > 0 || totalCommitment > 0) && (
                    <div className="pt-2 border-t border-[var(--theme-border-subtle)] flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                            {procurementMetrics.map((m, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[10px]">
                                    <span className="text-[var(--theme-text-secondary)] font-medium">{m.label}:</span>
                                    <span className={`font-bold font-mono ${m.badgeColor || 'text-[var(--theme-text-primary)]'}`}>{m.value}</span>
                                </div>
                            ))}
                        </div>
                        {totalCommitment > 0 && (
                            <div className="text-[11px] font-mono font-bold text-[var(--theme-text-primary)]">
                                <span className="text-[10px] text-[var(--theme-text-secondary)] font-normal mr-1">Line Commitment:</span>
                                {currencySymbol} {totalCommitment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
