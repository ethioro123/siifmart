import React from 'react';
import { CURRENCY_SYMBOL } from '../../constants';
import { formatCompactNumber } from '../../utils/formatting';
import { FileText, DollarSign, Percent } from 'lucide-react';

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
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Notes & Terms */}
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 flex items-center gap-2">
                        <FileText size={12} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> Transaction Notes
                    </label>
                    <textarea
                        className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-4 text-sm text-gray-900 dark:text-white focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-2 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 outline-none transition-all resize-none h-32 placeholder-gray-400 dark:placeholder-gray-700 shadow-inner font-bold"
                        placeholder="Specify internal directives or supplier instructions..."
                        value={poNotes}
                        onChange={(e) => setPoNotes(e.target.value)}
                    />
                </div>
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Payment Terms</label>
                        <input
                            type="text"
                            placeholder="e.g. Net 30"
                            className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-2 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-700 font-bold"
                            value={paymentTerms}
                            onChange={(e) => setPaymentTerms(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Incoterms</label>
                        <input
                            type="text"
                            placeholder="e.g. EXW"
                            className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-2 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-700 font-bold"
                            value={incoterms}
                            onChange={(e) => setIncoterms(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Right: Financial Totals */}
            <div className="relative overflow-hidden rounded-2xl p-[1px]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2C5E3B]/10 via-transparent to-amber-500/5 dark:from-[#2C5E3B]/20 dark:via-transparent dark:to-amber-500/5 opacity-40"></div>
                <div className="relative bg-white dark:bg-black/60 backdrop-blur-2xl rounded-2xl p-8 space-y-6 border border-gray-200 dark:border-white/5 shadow-xl dark:shadow-2xl">

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-2 pb-2 border-b border-gray-100 dark:border-white/10">
                        <div className="w-2 h-2 rounded-full bg-[#2C5E3B] dark:bg-[#A9CBA2] shadow-[0_0_10px_rgba(44,94,59,0.3)] dark:shadow-[0_0_10px_rgba(169,203,162,0.4)]"></div>
                        <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Financial Overview</h3>
                    </div>

                    {/* Subtotal */}
                    <div className="flex justify-between items-center group">
                        <span className="text-gray-500 dark:text-gray-400 text-sm font-black uppercase tracking-widest group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Net Subtotal</span>
                        <span className="text-gray-900 dark:text-white font-mono text-xl tracking-tight font-black">{formatCompactNumber(poSubtotal, { currency: CURRENCY_SYMBOL })}</span>
                    </div>

                    {/* Discount */}
                    <div className="group space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm flex items-center gap-2 group-hover:text-white transition-colors">
                                <Percent size={14} className="text-[#2C5E3B]/70 dark:text-[#A9CBA2]/70" /> Applied Discount
                            </span>
                             <div className="flex items-center bg-gray-50 dark:bg-black/60 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-1.5 focus-within:border-[#2C5E3B] dark:focus-within:border-[#A9CBA2] focus-within:ring-2 focus-within:ring-[#2C5E3B]/10 dark:focus-within:ring-[#A9CBA2]/10 transition-all shadow-sm">
                                <input
                                    type="number"
                                    min="0" max="100"
                                    className="w-12 bg-transparent text-right text-gray-900 dark:text-white font-mono text-sm outline-none font-bold"
                                    value={discountRate}
                                    onChange={(e) => setDiscountRate(parseFloat(e.target.value) || 0)}
                                    placeholder="0"
                                />
                                <span className="text-gray-400 dark:text-gray-500 text-xs ml-1 font-bold">%</span>
                            </div>
                        </div>
                        {discountRate > 0 && (
                            <div className="flex justify-end pr-1">
                                <span className="text-[10px] text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20 tracking-tighter shadow-[0_0_10px_rgba(74,222,128,0.1)]">
                                    - {formatCompactNumber(poDiscount, { currency: CURRENCY_SYMBOL })}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Tax */}
                    <div className="group space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm flex items-center gap-2 group-hover:text-white transition-colors">
                                <Percent size={14} className="text-amber-600 dark:text-amber-400" /> Regulatory Tax
                            </span>
                             <div className="flex items-center bg-gray-50 dark:bg-black/60 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-1.5 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/10 transition-all shadow-sm">
                                <input
                                    type="number"
                                    min="0" max="100"
                                    className="w-12 bg-transparent text-right text-gray-900 dark:text-white font-mono text-sm outline-none font-bold"
                                    value={taxRate}
                                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                                    placeholder="0"
                                />
                                <span className="text-gray-400 dark:text-gray-500 text-xs ml-1 font-bold">%</span>
                            </div>
                        </div>
                        {taxRate > 0 && (
                            <div className="flex justify-end pr-1">
                                <span className="text-[10px] text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 tracking-tighter shadow-[0_0_10px_rgba(248,113,113,0.1)]">
                                    + {formatCompactNumber(poTax, { currency: CURRENCY_SYMBOL })}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Shipping */}
                    <div className="flex justify-between items-center group">
                        <span className="text-gray-400 text-sm flex items-center gap-2 group-hover:text-white transition-colors">
                            <DollarSign size={14} className="text-amber-600 dark:text-amber-400" /> Freight / Shipping
                        </span>
                         <div className="flex items-center bg-gray-50 dark:bg-black/60 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-1.5 focus-within:border-[#2C5E3B] dark:focus-within:border-[#A9CBA2] focus-within:ring-2 focus-within:ring-[#2C5E3B]/10 dark:focus-within:ring-[#A9CBA2]/10 transition-all shadow-sm">
                            <span className="text-gray-400 dark:text-gray-600 text-xs mr-2 font-bold">{CURRENCY_SYMBOL}</span>
                            <input
                                type="number"
                                min="0"
                                className="w-24 bg-transparent text-right text-gray-900 dark:text-white font-mono text-sm outline-none font-bold"
                                value={shippingCost}
                                onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* Divider with high-end glowing effect */}
                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-white dark:bg-black px-2 text-[8px] text-gray-400 dark:text-gray-600 uppercase font-black tracking-widest">Verification Layer</span>
                        </div>
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-end pt-2">
                        <div className="space-y-1">
                            <span className="text-gray-500 dark:text-gray-300 font-black uppercase tracking-[0.2em] text-[10px]">Grand Total</span>
                            <div className="text-[9px] text-gray-400 dark:text-gray-600 font-mono uppercase font-black tracking-widest">
                                {incoterms ? `Terms: ${incoterms}` : 'Ready for settlement'}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-black text-[#2C5E3B] dark:text-[#A9CBA2] font-mono tracking-tighter">
                                {formatCompactNumber(poTotal, { currency: CURRENCY_SYMBOL })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
