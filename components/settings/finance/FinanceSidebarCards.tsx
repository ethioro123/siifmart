import React from 'react';
import { CreditCard, Layers, ShieldCheck, DollarSign, ArrowRightLeft, Save } from 'lucide-react';
import { InputGroup, SectionHeader, ToggleRow } from './FinanceInputControls';

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
    compliance: {
        compoundTax: boolean;
        taxExemptions: boolean;
    };
    setCompliance: React.Dispatch<React.SetStateAction<{
        compoundTax: boolean;
        taxExemptions: boolean;
    }>>;
    isSavingLimits: boolean;
    isSavingCompliance: boolean;
    isSavingRates: boolean;
    handleSaveSection: (section: 'policy' | 'limits' | 'currency' | 'compliance') => void;
    baseCurrency: string;
    currencySymbol: string;
    exchangeRates: { code: string; rate: number }[];
    setExchangeRates: React.Dispatch<React.SetStateAction<{ code: string; rate: number }[]>>;
    isAuthorized: boolean;
}

export const FinanceSidebarCards: React.FC<FinanceSidebarCardsProps> = ({
    limits,
    setLimits,
    compliance,
    setCompliance,
    isSavingLimits,
    isSavingCompliance,
    isSavingRates,
    handleSaveSection,
    baseCurrency,
    currencySymbol,
    exchangeRates,
    setExchangeRates,
    isAuthorized,
}) => {
    return (
        <div className="space-y-6">
            {/* LIMITS & APPROVALS */}
            <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm">
                <div className="mb-4 border-b border-[#E2DCCE]/60 dark:border-white/5 pb-3 flex justify-between items-center">
                    <div>
                        <h3 className="text-sm font-black text-[#1E3F27] dark:text-white uppercase tracking-wider">Limits & Approvals</h3>
                        <p className="text-[10px] text-stone-500 dark:text-gray-400">Drawer & B2B credit caps ({baseCurrency})</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleSaveSection('limits')}
                        disabled={isSavingLimits || !isAuthorized}
                        className="px-3.5 py-1.5 bg-[#2C5E3B] text-white font-bold text-[10px] uppercase tracking-wider rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                        {isSavingLimits ? (
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save size={12} />
                        )}
                        Save Limits
                    </button>
                </div>

                <div className="space-y-4">
                    <InputGroup
                        label="Max Petty Cash"
                        type="number"
                        prefix={currencySymbol}
                        value={limits.maxPettyCash}
                        disabled={!isAuthorized}
                        onChange={(e) => setLimits(prev => ({ ...prev, maxPettyCash: Math.max(0, Number(e.target.value) || 0) }))}
                        sub="Max cash on hand per cashier drawer"
                    />
                    <InputGroup
                        label="Expense Approval"
                        type="number"
                        prefix={currencySymbol}
                        value={limits.expenseApprovalLimit}
                        disabled={!isAuthorized}
                        onChange={(e) => setLimits(prev => ({ ...prev, expenseApprovalLimit: Math.max(0, Number(e.target.value) || 0) }))}
                        sub="Requires Store Manager PIN > this threshold"
                    />
                    <InputGroup
                        label="Default Credit Limit"
                        icon={CreditCard}
                        type="number"
                        prefix={currencySymbol}
                        value={limits.defaultCreditLimit}
                        disabled={!isAuthorized}
                        onChange={(e) => setLimits(prev => ({ ...prev, defaultCreditLimit: Math.max(0, Number(e.target.value) || 0) }))}
                        sub="New B2B account initial balance ceiling"
                    />
                </div>
            </div>

            {/* COMPLIANCE RULES (CONFIG-GATED) */}
            <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm">
                <div className="mb-4 border-b border-[#E2DCCE]/60 dark:border-white/5 pb-3 flex justify-between items-center">
                    <div>
                        <h3 className="text-sm font-black text-[#1E3F27] dark:text-white uppercase tracking-wider">Compliance Rules</h3>
                        <p className="text-[10px] text-stone-500 dark:text-gray-400">Automated tax & exemption policies</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleSaveSection('compliance')}
                        disabled={isSavingCompliance || !isAuthorized}
                        className="px-3.5 py-1.5 bg-[#2C5E3B] text-white font-bold text-[10px] uppercase tracking-wider rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                        {isSavingCompliance ? (
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save size={12} />
                        )}
                        Save Policy
                    </button>
                </div>
                <div className="space-y-3">
                    <ToggleRow
                        label="Compound Tax"
                        sub="Apply VAT on top of Customs/Excise Duty"
                        checked={compliance.compoundTax}
                        disabled={!isAuthorized}
                        onChange={() => setCompliance(prev => ({ ...prev, compoundTax: !prev.compoundTax }))}
                    />

                    <ToggleRow
                        label="Tax Exemptions"
                        sub="Enable qualified NGO & diplomatic exemption workflows"
                        checked={compliance.taxExemptions}
                        disabled={!isAuthorized}
                        onChange={() => setCompliance(prev => ({ ...prev, taxExemptions: !prev.taxExemptions }))}
                    />
                </div>
            </div>

            {/* MULTI-CURRENCY & EXCHANGE RATES */}
            <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#E2DCCE]/60 dark:border-white/5">
                    <div>
                        <h3 className="text-sm font-black text-[#1E3F27] dark:text-white uppercase tracking-wider">Exchange Rates</h3>
                        <p className="text-[10px] text-stone-500 dark:text-gray-400">Forex benchmark relative to {baseCurrency}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleSaveSection('currency')}
                        disabled={isSavingRates || !isAuthorized}
                        className="px-3.5 py-1.5 bg-[#2C5E3B] text-white font-bold text-[10px] uppercase tracking-wider rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                        {isSavingRates ? (
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save size={12} />
                        )}
                        Save Rates
                    </button>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3.5 bg-emerald-50 dark:bg-[#2C5E3B]/20 border border-emerald-200 dark:border-emerald-950/30 rounded-2xl">
                        <div>
                            <p className="text-[9px] text-[#2C5E3B] dark:text-[#A9CBA2] font-black uppercase tracking-wider">Base Currency ({baseCurrency})</p>
                            <p className="text-lg font-black text-[#1E3F27] dark:text-white mt-0.5">{currencySymbol}</p>
                        </div>
                        <DollarSign className="text-[#2C5E3B] dark:text-[#A9CBA2]" size={22} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] text-stone-500 dark:text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <ArrowRightLeft size={12} /> Foreign Benchmark Currencies
                        </label>
                        {exchangeRates.map((curr, idx) => (
                            <div key={curr.code} className="flex items-center gap-2">
                                <div className="w-12 h-9 flex items-center justify-center bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl text-xs font-black text-[#1E3F27] dark:text-gray-300">
                                    {curr.code}
                                </div>
                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={curr.rate}
                                    disabled={!isAuthorized}
                                    onChange={(e) => {
                                        const newRates = [...exchangeRates];
                                        newRates[idx] = { ...newRates[idx], rate: Math.max(0.0001, parseFloat(e.target.value) || 0) };
                                        setExchangeRates(newRates);
                                    }}
                                    title={`Exchange rate for ${curr.code}`}
                                    className="flex-1 bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3 py-2 text-[#1E3F27] dark:text-white text-xs font-bold outline-none focus:border-[#2C5E3B] disabled:opacity-50"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
