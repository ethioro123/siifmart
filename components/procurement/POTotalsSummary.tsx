import React from 'react';
import { CURRENCY_SYMBOL } from '../../constants';
import { formatCompactNumber } from '../../utils/formatting';
import { FileText, DollarSign, Percent, Calculator, ShieldCheck } from 'lucide-react';

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
    setTaxRate: (val: number) => void;

    // Computed (Read-only)
    poSubtotal: number;
    poTax: number;
    poDiscount: number;
    poTotal: number;
}

export const POTotalsSummary: React.FC<POTotalsSummaryProps> = ({
    poNotes, setPoNotes,
    paymentTerms, setPaymentTerms,
    incoterms, setIncoterms,
    shippingCost, setShippingCost,
    discountRate, setDiscountRate,
    taxRate, setTaxRate,
    poSubtotal, poTax, poDiscount, poTotal
}) => {
    return (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Notes & Commercial Terms */}
            <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold tracking-wider flex items-center gap-2">
                        <FileText size={13} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> Transaction Notes & Instructions
                    </label>
                    <textarea
                        className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl p-3.5 text-xs text-[#1E3F27] dark:text-white focus:border-[#2C5E3B] outline-none transition-all resize-none h-28 placeholder:text-stone-400 font-medium"
                        placeholder="Specify internal warehouse receiving directives or supplier delivery instructions..."
                        value={poNotes}
                        onChange={(e) => setPoNotes(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold tracking-wider block">Payment Terms</label>
                        <input
                            type="text"
                            placeholder="e.g. Net 30, COD"
                            className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-[#1E3F27] dark:text-white focus:border-[#2C5E3B] outline-none font-bold placeholder:text-stone-400"
                            value={paymentTerms}
                            onChange={(e) => setPaymentTerms(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold tracking-wider block">Incoterms</label>
                        <input
                            type="text"
                            placeholder="e.g. EXW, FOB, CIF"
                            className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-[#1E3F27] dark:text-white focus:border-[#2C5E3B] outline-none font-bold placeholder:text-stone-400"
                            value={incoterms}
                            onChange={(e) => setIncoterms(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Right: Financial Totals */}
            <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-6 lg:p-7 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-[#E2DCCE]/60 dark:border-white/5">
                    <Calculator size={16} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                    <h3 className="text-xs font-black text-[#1E3F27] dark:text-[#EAE5D9] uppercase tracking-wider">Financial Overview</h3>
                </div>

                {/* Subtotal */}
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-stone-500 dark:text-gray-400 uppercase tracking-wide">Net Subtotal</span>
                    <span className="text-base font-black text-[#1E3F27] dark:text-white font-mono">{formatCompactNumber(poSubtotal, { currency: CURRENCY_SYMBOL })}</span>
                </div>

                {/* Discount */}
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-stone-500 dark:text-gray-400 flex items-center gap-1.5">
                        <Percent size={13} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> Applied Discount
                    </span>
                    <div className="flex items-center gap-2">
                        {discountRate > 0 && (
                            <span className="text-[10px] text-emerald-700 dark:text-[#A9CBA2] font-bold font-mono">
                                - {formatCompactNumber(poDiscount, { currency: CURRENCY_SYMBOL })}
                            </span>
                        )}
                        <div className="flex items-center bg-[#FAF8F5] dark:bg-black/30 rounded-xl border border-[#E2DCCE] dark:border-white/10 px-2.5 py-1 focus-within:border-[#2C5E3B]">
                            <input
                                type="number"
                                min="0" max="100"
                                className="w-10 bg-transparent text-right text-[#1E3F27] dark:text-white font-mono text-xs outline-none font-bold"
                                value={discountRate || ''}
                                onChange={(e) => setDiscountRate(parseFloat(e.target.value) || 0)}
                                placeholder="0"
                            />
                            <span className="text-stone-400 text-xs ml-1 font-bold">%</span>
                        </div>
                    </div>
                </div>

                {/* Tax */}
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-stone-500 dark:text-gray-400 flex items-center gap-1.5">
                        <Percent size={13} className="text-amber-600 dark:text-amber-400" /> Regulatory Tax
                    </span>
                    <div className="flex items-center gap-2">
                        {taxRate > 0 && (
                            <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold font-mono">
                                + {formatCompactNumber(poTax, { currency: CURRENCY_SYMBOL })}
                            </span>
                        )}
                        <div className="flex items-center bg-[#FAF8F5] dark:bg-black/30 rounded-xl border border-[#E2DCCE] dark:border-white/10 px-2.5 py-1 focus-within:border-[#2C5E3B]">
                            <input
                                type="number"
                                min="0" max="100"
                                className="w-10 bg-transparent text-right text-[#1E3F27] dark:text-white font-mono text-xs outline-none font-bold"
                                value={taxRate || ''}
                                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                                placeholder="0"
                            />
                            <span className="text-stone-400 text-xs ml-1 font-bold">%</span>
                        </div>
                    </div>
                </div>

                {/* Shipping */}
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-stone-500 dark:text-gray-400 flex items-center gap-1.5">
                        <DollarSign size={13} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> Freight / Shipping
                    </span>
                    <div className="flex items-center bg-[#FAF8F5] dark:bg-black/30 rounded-xl border border-[#E2DCCE] dark:border-white/10 px-2.5 py-1 focus-within:border-[#2C5E3B]">
                        <span className="text-stone-400 text-[10px] mr-1 font-bold">{CURRENCY_SYMBOL}</span>
                        <input
                            type="number"
                            min="0"
                            className="w-16 bg-transparent text-right text-[#1E3F27] dark:text-white font-mono text-xs outline-none font-bold"
                            value={shippingCost || ''}
                            onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                            placeholder="0"
                        />
                    </div>
                </div>

                {/* Total Section */}
                <div className="pt-3 border-t border-[#E2DCCE]/60 dark:border-white/5 flex justify-between items-end">
                    <div>
                        <span className="text-[10px] text-stone-500 dark:text-gray-400 font-bold uppercase tracking-wider block">Grand Total</span>
                        <span className="text-[10px] text-[#4D6E56] dark:text-[#7A9E83] font-medium mt-0.5 block">
                            {incoterms ? `Terms: ${incoterms}` : 'Ready for authorization'}
                        </span>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-black text-[#2C5E3B] dark:text-[#A9CBA2] font-mono tracking-tight">
                            {formatCompactNumber(poTotal, { currency: CURRENCY_SYMBOL })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
