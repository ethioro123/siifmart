import React from 'react';
import { formatCompactNumber } from '../../utils/formatting';
import { FileText, DollarSign, Percent, Calculator } from 'lucide-react';

interface POTotalsSummaryProps {
    poNotes: string;
    setPoNotes: (val: string) => void;
    paymentTerms: string;
    setPaymentTerms: (val: string) => void;
    incoterms: string;
    setIncoterms: (val: string) => void;

    // Financials
    shippingCost: number;
    setShippingCost: (val: number) => void;
    discountRate: number;
    setDiscountRate: (val: number) => void;
    taxRate: number;
    setTaxRate?: (val: number) => void;

    // Computed (Read-only)
    poSubtotal: number;
    poTax: number;
    poDiscount: number;
    poTotal: number;
    currencySymbol?: string;
}

export const POTotalsSummary: React.FC<POTotalsSummaryProps> = ({
    poNotes, setPoNotes,
    paymentTerms, setPaymentTerms,
    incoterms, setIncoterms,
    shippingCost, setShippingCost,
    discountRate, setDiscountRate,
    taxRate, setTaxRate,
    poSubtotal, poTax, poDiscount, poTotal,
    currencySymbol = 'ETB'
}) => {
    return (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Notes & Commercial Terms */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl p-6 shadow-sm space-y-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider flex items-center gap-2 block ml-1">
                        <FileText size={14} className="text-[var(--theme-accent)]" /> Transaction Notes & Instructions
                    </label>
                    <textarea
                        className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl p-3.5 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none transition-all resize-none h-28 placeholder:text-[var(--theme-text-muted)] font-medium"
                        placeholder="Specify internal warehouse receiving directives or supplier delivery instructions..."
                        value={poNotes}
                        onChange={(e) => setPoNotes(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider block ml-1">Payment Terms</label>
                        <input
                            type="text"
                            placeholder="e.g. Net 30, COD"
                            className="w-full h-11 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl px-3.5 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none font-semibold placeholder:text-[var(--theme-text-muted)]"
                            value={paymentTerms}
                            onChange={(e) => setPaymentTerms(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider block ml-1">Incoterms</label>
                        <input
                            type="text"
                            placeholder="e.g. EXW, FOB, CIF"
                            className="w-full h-11 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl px-3.5 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none font-semibold placeholder:text-[var(--theme-text-muted)]"
                            value={incoterms}
                            onChange={(e) => setIncoterms(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Right: Financial Totals */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl p-6 lg:p-7 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-[var(--theme-border-subtle)]">
                    <div className="w-8 h-8 rounded-xl bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20 flex items-center justify-center shrink-0">
                        <Calculator size={16} />
                    </div>
                    <h3 className="text-xs font-bold text-[var(--theme-text-primary)] uppercase tracking-wider">Financial Overview</h3>
                </div>

                {/* Subtotal */}
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-wide">Net Subtotal</span>
                    <span className="text-base font-black text-[var(--theme-text-primary)] font-mono tabular-nums">{formatCompactNumber(poSubtotal, { currency: currencySymbol })}</span>
                </div>

                {/* Discount */}
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[var(--theme-text-secondary)] flex items-center gap-1.5">
                        <Percent size={13} className="text-emerald-600 dark:text-emerald-400" /> Applied Discount
                    </span>
                    <div className="flex items-center gap-2">
                        {discountRate > 0 && (
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold font-mono tabular-nums">
                                - {formatCompactNumber(poDiscount, { currency: currencySymbol })}
                            </span>
                        )}
                        <div className="flex items-center bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] px-2.5 py-1 focus-within:border-[var(--theme-accent)]">
                            <input
                                type="number"
                                min="0" max="100"
                                className="w-10 bg-transparent text-right text-[var(--theme-text-primary)] font-mono text-xs outline-none font-bold"
                                value={discountRate || ''}
                                onChange={(e) => setDiscountRate(parseFloat(e.target.value) || 0)}
                                placeholder="0"
                            />
                            <span className="text-[var(--theme-text-secondary)] text-xs ml-1 font-bold">%</span>
                        </div>
                    </div>
                </div>

                {/* Tax */}
                {/* Tax (Only rendered when purchasing tax is enabled in Country Finance Settings) */}
                {taxRate > 0 && (
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-[var(--theme-text-secondary)] flex items-center gap-1.5">
                            <Percent size={13} className="text-amber-600 dark:text-amber-400" /> Regulatory Tax
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 font-black">
                                {currencySymbol === 'KSh' ? 'KRA' : 'ERCA'} {taxRate}%
                            </span>
                        </span>
                        <span className="text-xs font-black text-amber-700 dark:text-amber-300 font-mono tabular-nums">
                            + {formatCompactNumber(poTax, { currency: currencySymbol })}
                        </span>
                    </div>
                )}

                {/* Shipping */}
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[var(--theme-text-secondary)] flex items-center gap-1.5">
                        <DollarSign size={13} className="text-[var(--theme-accent)]" /> Freight / Shipping
                    </span>
                    <div className="flex items-center bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] px-2.5 py-1 focus-within:border-[var(--theme-accent)]">
                        <span className="text-[var(--theme-text-secondary)] text-[10px] mr-1 font-bold">{currencySymbol}</span>
                        <input
                            type="number"
                            min="0"
                            className="w-16 bg-transparent text-right text-[var(--theme-text-primary)] font-mono text-xs outline-none font-bold"
                            value={shippingCost || ''}
                            onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                            placeholder="0"
                        />
                    </div>
                </div>

                {/* Total Section */}
                <div className="pt-3 border-t border-[var(--theme-border-subtle)] flex justify-between items-end">
                    <div>
                        <span className="text-[10px] text-[var(--theme-text-secondary)] font-bold uppercase tracking-wider block">Grand Total</span>
                        <span className="text-[10px] text-[var(--theme-text-secondary)] font-medium mt-0.5 block">
                            {incoterms ? `Terms: ${incoterms}` : 'Ready for authorization'}
                        </span>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-black text-[var(--theme-text-primary)] font-mono tracking-tight tabular-nums">
                            {formatCompactNumber(poTotal, { currency: currencySymbol })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
