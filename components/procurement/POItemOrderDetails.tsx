import React from 'react';
import { ShoppingBag } from 'lucide-react';

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
    setErrors
}) => {
    const costPerSellUnit = unitsPerOrderUnit > 1 ? currentCost / unitsPerOrderUnit : currentCost;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 pb-2 border-b border-[#2C5E3B]/20 dark:border-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2C5E3B] dark:bg-[#A9CBA2] shadow-[0_0_8px_rgba(44,94,59,0.4)] dark:shadow-[0_0_8px_rgba(169,203,162,0.4)]" />
                <span className="text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
                    <ShoppingBag size={12} /> Procurement & Order Quantity
                </span>
            </div>

            <div className="relative overflow-hidden rounded-xl p-[1px]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2C5E3B]/10 via-transparent to-[#8C6239]/10 dark:from-[#2C5E3B]/20 dark:via-transparent dark:to-[#8C6239]/20 opacity-30" />
                <div className="relative glass-panel rounded-xl p-5 shadow-sm dark:shadow-none">
                    <div className="grid grid-cols-12 gap-4">
                        {/* Order Qty */}
                        <div className={`${showRetailInput ? 'col-span-4' : 'col-span-6'} space-y-1`}>
                            <label className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wider font-bold ml-1 block">
                                Order Qty{' '}
                                {unitSuffix && (
                                    <span className="text-[#2C5E3B]/80 dark:text-[#A9CBA2] normal-case font-bold text-[9px]">
                                        {unitSuffix}
                                    </span>
                                )}{' '}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                step="1"
                                min="1"
                                className={`w-full bg-[#FAF8F5] dark:bg-black/30 border ${errors.qty ? 'border-red-500/50' : 'border-[#E2DCCE] dark:border-white/10'} rounded-2xl px-4 py-2.5 text-xs text-[#1E3F27] dark:text-white font-mono focus:border-[#2C5E3B] text-center font-black`}
                                value={currentQty || ''}
                                onChange={e => {
                                    const val = parseInt(e.target.value) || 0;
                                    setCurrentQty(val);
                                    if (errors.qty) setErrors(prev => ({ ...prev, qty: '' }));
                                }}
                                placeholder="0"
                            />
                            {showConversion && (
                                <span className="text-[9px] text-[#2C5E3B] dark:text-[#A9CBA2] block text-center font-bold">
                                    = {totalUnits.toLocaleString()} sellable {sellUnit}s
                                </span>
                            )}
                            {errors.qty && <span className="text-[9px] text-red-500 block text-center">{errors.qty}</span>}
                        </div>

                        {/* Manifest Unit Cost */}
                        <div className={`${showRetailInput ? 'col-span-4' : 'col-span-6'} space-y-1`}>
                            <label className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wider font-bold ml-1 block">
                                Cost / {orderUnitName} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                step="any"
                                min="0"
                                className={`w-full bg-[#FAF8F5] dark:bg-black/30 border ${errors.cost ? 'border-red-500/50' : 'border-[#E2DCCE] dark:border-white/10'} rounded-2xl px-4 py-2.5 text-xs text-[#1E3F27] dark:text-white font-mono focus:border-[#2C5E3B] text-center font-black`}
                                value={currentCost || ''}
                                onChange={e => {
                                    setCurrentCost(parseFloat(e.target.value) || 0);
                                    if (errors.cost) setErrors(prev => ({ ...prev, cost: '' }));
                                }}
                                placeholder="0.00"
                            />
                            {currentCost > 0 && unitsPerOrderUnit > 1 && (
                                <span className="text-[9px] text-[#2C5E3B] dark:text-[#A9CBA2] block text-center font-bold">
                                    = ~{currencySymbol} {costPerSellUnit.toFixed(2)} / {sellUnit}
                                </span>
                            )}
                            {errors.cost && <span className="text-[9px] text-red-500 block text-center">{errors.cost}</span>}
                        </div>

                        {/* Retail Input (Shown for Catalog items) */}
                        {showRetailInput && (
                            <div className="col-span-4 space-y-1 relative">
                                <label className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wider font-bold ml-1 block">
                                    Retail / {sellUnit} <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    {(() => {
                                        if (!currentRetailPrice || !costPerSellUnit) return null;
                                        const marginPct = ((currentRetailPrice - costPerSellUnit) / currentRetailPrice) * 100;
                                        const badgeClass = marginPct >= 40
                                            ? 'bg-emerald-50 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] border border-emerald-200 dark:border-emerald-950/30'
                                            : marginPct >= 20
                                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30'
                                            : 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-900/30';
                                        return (
                                            <div className={`absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-black px-1.5 py-0.5 rounded-lg ${badgeClass}`}>
                                                {parseFloat(marginPct.toFixed(2))}%
                                            </div>
                                        );
                                    })()}
                                    <input
                                        type="number"
                                        className={`w-full bg-[#FAF8F5] dark:bg-black/30 border ${errors.retail ? 'border-red-500/50' : 'border-[#E2DCCE] dark:border-white/10'} rounded-2xl py-2.5 text-xs text-[#1E3F27] dark:text-white font-mono focus:border-[#2C5E3B] text-center font-black ${currentRetailPrice > 0 && currentCost > 0 ? 'pl-14 pr-2' : 'px-4'}`}
                                        value={currentRetailPrice || ''}
                                        onChange={e => {
                                            setCurrentRetailPrice(Math.round(parseFloat(e.target.value) || 0));
                                            if (errors.retail) setErrors(prev => ({ ...prev, retail: '' }));
                                        }}
                                        placeholder="0"
                                    />
                                </div>
                                {errors.retail && <span className="text-[9px] text-red-500 block text-center">{errors.retail}</span>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
