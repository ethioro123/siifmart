import React from 'react';
import { CreditCard, Layers, ShieldCheck, CheckCircle2, DollarSign, ArrowRightLeft, Save } from 'lucide-react';
import { InputGroup, SectionHeader } from './FinanceInputControls';

interface FinanceSidebarCardsProps {
    limits: {
        maxPettyCash: number;
        expenseApprovalLimit: number;
        defaultCreditLimit: number;
    };
    setLimits: React.Dispatch<React.SetStateAction<{
        maxPettyCash: number;
        expenseApprovalLimit: number;
        defaultCreditLimit: number;
    }>>;
    isSavingLimits: boolean;
    handleSaveSection: (section: 'policy' | 'limits' | 'currency') => void;
    baseCurrency: string;
    exchangeRates: { code: string; rate: number }[];
    setExchangeRates: React.Dispatch<React.SetStateAction<{ code: string; rate: number }[]>>;
}

export const FinanceSidebarCards: React.FC<FinanceSidebarCardsProps> = ({
    limits,
    setLimits,
    isSavingLimits,
    handleSaveSection,
    baseCurrency,
    exchangeRates,
    setExchangeRates
}) => {
    return (
        <div className="space-y-6">
            {/* LIMITS & APPROVALS */}
            <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm">
                <div className="mb-4 border-b border-[#E2DCCE]/60 dark:border-white/5 pb-3 flex justify-between items-center">
                    <div>
                        <h3 className="text-sm font-black text-[#1E3F27] dark:text-white uppercase tracking-wider">Limits & Approvals</h3>
                        <p className="text-[10px] text-stone-500 dark:text-gray-400">Drawer & B2B credit caps</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleSaveSection('limits')}
                        disabled={isSavingLimits}
                        className="px-3.5 py-1.5 bg-[#2C5E3B] text-white font-bold text-[10px] uppercase tracking-wider rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                        <Save size={12} /> Save Limits
                    </button>
                </div>

                <div className="space-y-4">
                    <InputGroup
                        label="Max Petty Cash"
                        type="number"
                        prefix="ETB"
                        value={limits.maxPettyCash}
                        onChange={(e: any) => setLimits(prev => ({ ...prev, maxPettyCash: Number(e.target.value) || 0 }))}
                        sub="Max cash on hand per cashier drawer"
                    />
                    <InputGroup
                        label="Expense Approval"
                        type="number"
                        prefix="ETB"
                        value={limits.expenseApprovalLimit}
                        onChange={(e: any) => setLimits(prev => ({ ...prev, expenseApprovalLimit: Number(e.target.value) || 0 }))}
                        sub="Requires Store Manager PIN > this threshold"
                    />
                    <InputGroup
                        label="Default Credit Limit"
                        icon={CreditCard}
                        type="number"
                        prefix="ETB"
                        value={limits.defaultCreditLimit}
                        onChange={(e: any) => setLimits(prev => ({ ...prev, defaultCreditLimit: Number(e.target.value) || 0 }))}
                        sub="New B2B account initial balance ceiling"
                    />
                </div>
            </div>

            {/* COMPLIANCE RULES */}
            <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm">
                <SectionHeader title="Compliance" desc="Automated tax calculation logic" />
                <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-[#FAF8F5] dark:bg-black/20 rounded-2xl border border-[#E2DCCE]/60 dark:border-white/5">
                        <div className="p-2 rounded-xl bg-emerald-50 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2]">
                            <Layers size={16} />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center">
                                <p className="text-xs font-black text-[#1E3F27] dark:text-white">Compound Tax</p>
                                <CheckCircle2 size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                            </div>
                            <p className="text-[10px] text-stone-500 dark:text-gray-400 mt-0.5">VAT on top of Duty enabled</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-[#FAF8F5] dark:bg-black/20 rounded-2xl border border-[#E2DCCE]/60 dark:border-white/5">
                        <div className="p-2 rounded-xl bg-emerald-50 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2]">
                            <ShieldCheck size={16} />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center">
                                <p className="text-xs font-black text-[#1E3F27] dark:text-white">Tax Exemptions</p>
                                <CheckCircle2 size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                            </div>
                            <p className="text-[10px] text-stone-500 dark:text-gray-400 mt-0.5">Qualified NGO & diplomatic rules active</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* MULTI-CURRENCY */}
            <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#E2DCCE]/60 dark:border-white/5">
                    <div>
                        <h3 className="text-sm font-black text-[#1E3F27] dark:text-white uppercase tracking-wider">Exchange Rates</h3>
                        <p className="text-[10px] text-stone-500 dark:text-gray-400">Forex benchmark conversion</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleSaveSection('currency')}
                        className="px-3.5 py-1.5 bg-[#2C5E3B] text-white font-bold text-[10px] uppercase tracking-wider rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                        <Save size={12} /> Save Rates
                    </button>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3.5 bg-emerald-50 dark:bg-[#2C5E3B]/20 border border-emerald-200 dark:border-emerald-950/30 rounded-2xl">
                        <div>
                            <p className="text-[9px] text-[#2C5E3B] dark:text-[#A9CBA2] font-black uppercase tracking-wider">Base Currency</p>
                            <p className="text-lg font-black text-[#1E3F27] dark:text-white mt-0.5">{baseCurrency}</p>
                        </div>
                        <DollarSign className="text-[#2C5E3B] dark:text-[#A9CBA2]" size={22} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] text-stone-500 dark:text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <ArrowRightLeft size={12} /> Foreign Currencies
                        </label>
                        {exchangeRates.map((curr, idx) => (
                            <div key={curr.code} className="flex items-center gap-2">
                                <div className="w-12 h-9 flex items-center justify-center bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl text-xs font-black text-[#1E3F27] dark:text-gray-300">
                                    {curr.code}
                                </div>
                                <input
                                    type="number"
                                    value={curr.rate}
                                    onChange={(e: any) => {
                                        const newRates = [...exchangeRates];
                                        newRates[idx] = { ...newRates[idx], rate: parseFloat(e.target.value) || 0 };
                                        setExchangeRates(newRates);
                                    }}
                                    title={`Exchange rate for ${curr.code}`}
                                    className="flex-1 bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3 py-2 text-[#1E3F27] dark:text-white text-xs font-bold outline-none focus:border-[#2C5E3B]"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
