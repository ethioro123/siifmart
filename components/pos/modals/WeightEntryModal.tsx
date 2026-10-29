import React, { useState } from 'react';
import { Scale, X } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
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
    const { t } = useLanguage();
    const [value, setValue] = useState('');
    const unit = getSellUnit(product.unit);
    const effectivePrice = product.isOnSale && product.salePrice ? product.salePrice : product.price;
    const numericValue = parseFloat(value) || 0;
    const lineTotal = effectivePrice * numericValue;

    return (
        <div className="fixed inset-0 z-[999] bg-[color-mix(in_srgb,var(--theme-overlay)_60%,transparent)] flex items-center justify-center p-4" onClick={onCancel}>
            <div
                className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl w-full max-w-sm shadow-xl animate-in zoom-in-95 fade-in duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--theme-border)]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--theme-pill-bg)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-primary)]">
                            <Scale size={16} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-[var(--theme-text-primary)] text-sm font-bold leading-tight truncate">{product.name}</h3>
                            <p className="text-xs text-[var(--theme-text-secondary)] font-medium truncate">
                                {CURRENCY_SYMBOL} {formatPriceValue(effectivePrice)} {t('pos.perUnit', { unit: unit.shortLabel })}
                            </p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="p-1.5 hover:bg-[var(--theme-bg-subtle)] rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors cursor-pointer" title="Close">
                        <X size={16} />
                    </button>
                </div>

                {/* Input */}
                <div className="p-5">
                    <label className="text-xs text-[var(--theme-text-secondary)] font-bold uppercase tracking-wider block mb-2">
                        {t('pos.enterUnit', { unit: unit.label })}
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
                            className="flex-1 min-w-0 bg-[var(--theme-input-bg)] border border-[var(--theme-input-border)] rounded-xl px-2 py-3 lg:px-4 text-xl lg:text-2xl text-[var(--theme-input-text)] font-mono text-center focus:border-[var(--theme-border-focus)] outline-none transition-all [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <span className="text-sm lg:text-base text-[var(--theme-text-secondary)] font-bold uppercase shrink-0 w-8 lg:w-10 text-right">{unit.shortLabel}</span>
                    </div>

                    {unit.category === 'weight' && (
                        <div className="grid grid-cols-3 gap-1.5 lg:gap-2 mt-3">
                            {[0.25, 0.5, 1, 1.5, 2, 5].map(preset => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => setValue(preset.toString())}
                                    className="py-1.5 lg:py-2 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] border border-[var(--theme-border)] rounded-xl text-xs text-[var(--theme-text-primary)] font-bold transition-all active:scale-95 shadow-xs truncate whitespace-nowrap px-1 cursor-pointer"
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
                                    className="py-1.5 lg:py-2 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] border border-[var(--theme-border)] rounded-xl text-xs text-[var(--theme-text-primary)] font-bold transition-all active:scale-95 shadow-xs truncate whitespace-nowrap px-1 cursor-pointer"
                                >
                                    {preset} {unit.shortLabel}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Line total preview */}
                    {numericValue > 0 && (
                        <div className="mt-4 p-3 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl flex justify-between items-center shadow-xs">
                            <span className="text-xs text-[var(--theme-text-secondary)] font-bold uppercase tracking-wider">{t('pos.lineTotal')}</span>
                            <span className="text-lg text-[var(--theme-primary)] font-bold tabular-nums font-mono">
                                {CURRENCY_SYMBOL} {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[var(--theme-border)] flex gap-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] rounded-xl font-bold text-xs transition-colors border border-[var(--theme-border)] cursor-pointer shadow-xs"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={() => numericValue > 0 && onConfirm(numericValue)}
                        disabled={numericValue <= 0}
                        className="flex-1 py-3 bg-[var(--theme-primary)] disabled:opacity-30 text-[var(--theme-primary-text)] border border-transparent disabled:cursor-not-allowed rounded-xl font-bold text-xs transition-colors uppercase tracking-wider cursor-pointer shadow-xs"
                    >
                        {t('pos.addToCart')}
                    </button>
                </div>
            </div>
        </div>
    );
};
export default WeightEntryModal;
