import React, { useState } from 'react';
import { Scale, X } from 'lucide-react';
import { CURRENCY_SYMBOL } from '../../../constants';
import { formatPriceValue } from '../../../utils/formatting';
import { getSellUnit } from '../../../utils/units';

interface WeightEntryModalProps {
    product: { name: string; price: number; unit?: string; isOnSale?: boolean; salePrice?: number };
    onConfirm: (qty: number) => void;
    onCancel: () => void;
}

/** Inline weight/quantity entry modal for decimal-unit products */
export const WeightEntryModal: React.FC<WeightEntryModalProps> = ({ product, onConfirm, onCancel }) => {
    const [value, setValue] = useState('');
    const unit = getSellUnit(product.unit);
    const effectivePrice = product.isOnSale && product.salePrice ? product.salePrice : product.price;
    const numericValue = parseFloat(value) || 0;
    const lineTotal = effectivePrice * numericValue;

    return (
        <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={onCancel}>
            <div
                className="bg-white/95 dark:bg-[#18201B] border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[32px] w-full max-w-sm shadow-2xl animate-in zoom-in-95 fade-in duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#E2DCCE]/50 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#2C5E3B]/10 border border-[#2C5E3B]/20 flex items-center justify-center">
                            <Scale size={16} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-[#1E3F27] dark:text-[#EAE5D9] text-sm font-bold leading-tight truncate">{product.name}</h3>
                            <p className="text-[10px] text-[#4D6E56] dark:text-[#7A9E83] truncate">
                                {CURRENCY_SYMBOL} {formatPriceValue(effectivePrice)} per {unit.shortLabel}
                            </p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="p-1.5 hover:bg-white/10 rounded-lg text-[#4D6E56] dark:text-gray-400 hover:text-[#1E3F27] dark:hover:text-white transition-colors" title="Close">
                        <X size={16} />
                    </button>
                </div>

                {/* Input */}
                <div className="p-6">
                    <label className="text-[10px] text-[#4D6E56] dark:text-[#7A9E83] font-bold uppercase tracking-widest block mb-2">
                        Enter {unit.label}
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            step={unit.step}
                            min={unit.step}
                            autoFocus
                            value={value}
                            onChange={e => setValue(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && numericValue > 0) onConfirm(numericValue);
                                if (e.key === 'Escape') onCancel();
                            }}
                            placeholder="0.00"
                            className="flex-1 min-w-0 bg-white dark:bg-black/60 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-2 py-3 lg:px-4 text-xl lg:text-2xl text-[#1E3F27] dark:text-white font-mono text-center focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] outline-none transition-all [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <span className="text-sm lg:text-lg text-[#4D6E56] dark:text-gray-400 font-bold uppercase shrink-0 w-8 lg:w-10 text-right">{unit.shortLabel}</span>
                    </div>

                    {unit.category === 'weight' && (
                        <div className="grid grid-cols-3 gap-1.5 lg:gap-2 mt-3">
                            {[0.25, 0.5, 1, 1.5, 2, 5].map(preset => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => setValue(preset.toString())}
                                    className="py-1.5 lg:py-2 bg-white/90 dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl text-[9px] lg:text-[10px] text-[#2C4D35] dark:text-gray-300 font-bold transition-all active:scale-95 shadow-sm truncate whitespace-nowrap px-1"
                                >
                                    {preset} {unit.shortLabel}
                                </button>
                            ))}
                        </div>
                    )}
                    {unit.category === 'volume' && (
                        <div className="grid grid-cols-3 gap-1.5 lg:gap-2 mt-3">
                            {[0.25, 0.5, 1, 2, 5, 10].map(preset => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => setValue(preset.toString())}
                                    className="py-1.5 lg:py-2 bg-white/90 dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl text-[9px] lg:text-[10px] text-[#2C4D35] dark:text-gray-300 font-bold transition-all active:scale-95 shadow-sm truncate whitespace-nowrap px-1"
                                >
                                    {preset} {unit.shortLabel}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Line total preview */}
                    {numericValue > 0 && (
                        <div className="mt-4 p-3 bg-[#2C5E3B]/5 border border-[#2C5E3B]/10 rounded-xl flex justify-between items-center">
                            <span className="text-[10px] text-[#4D6E56] dark:text-gray-400 font-bold uppercase">Line Total</span>
                            <span className="text-lg text-[#2C5E3B] dark:text-[#A9CBA2] font-black tabular-nums">
                                {CURRENCY_SYMBOL} {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[#E2DCCE]/50 dark:border-white/5 flex gap-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 bg-white/90 dark:bg-black/30 text-stone-700 dark:text-gray-300 hover:bg-stone-100 dark:hover:bg-black/50 rounded-xl font-bold text-sm transition-all border border-[#E2DCCE] dark:border-white/10"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => numericValue > 0 && onConfirm(numericValue)}
                        disabled={numericValue <= 0}
                        className="flex-1 py-3 bg-gradient-to-r from-[#224429] to-[#2C5E3B] disabled:bg-stone-200 dark:disabled:bg-white/5 text-white disabled:text-stone-400 dark:disabled:text-stone-600 border border-transparent disabled:border-stone-300 dark:disabled:border-white/5 disabled:cursor-not-allowed rounded-xl font-black text-sm transition-all uppercase tracking-wider"
                    >
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    );
};
export default WeightEntryModal;
