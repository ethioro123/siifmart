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
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 shadow-xs">
                <div className="mb-4 border-b border-[var(--theme-border)] pb-3 flex justify-between items-center">
                    <div>
                        <h3 className="text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider">Limits & Approvals</h3>
                        <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">Drawer & B2B credit caps ({baseCurrency})</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleSaveSection('limits')}
                        disabled={isSavingLimits || !isAuthorized}
                        className="h-8 px-3 bg-[#0071E3] dark:bg-[#2997FF] hover:opacity-90 active:scale-[0.98] text-white font-semibold text-[11px] rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-all disabled:opacity-40"
                    >
                        {isSavingLimits ? (
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save size={12} />
                        )}
                        Save Limits
                    </button>
                </div>

                <div className="space-y-3.5">
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
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 shadow-xs">
                <div className="mb-4 border-b border-[var(--theme-border)] pb-3 flex justify-between items-center">
                    <div>
                        <h3 className="text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider">Compliance Rules</h3>
                        <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">Automated tax & exemption policies</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleSaveSection('compliance')}
                        disabled={isSavingCompliance || !isAuthorized}
                        className="h-8 px-3 bg-[#0071E3] dark:bg-[#2997FF] hover:opacity-90 active:scale-[0.98] text-white font-semibold text-[11px] rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-all disabled:opacity-40"
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
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 shadow-xs">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-[var(--theme-border)]">
                    <div>
                        <h3 className="text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider">Exchange Rates</h3>
                        <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">Forex benchmark relative to {baseCurrency}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleSaveSection('currency')}
                        disabled={isSavingRates || !isAuthorized}
                        className="h-8 px-3 bg-[#0071E3] dark:bg-[#2997FF] hover:opacity-90 active:scale-[0.98] text-white font-semibold text-[11px] rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-all disabled:opacity-40"
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
                    <div className="flex items-center justify-between p-3.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl">
                        <div>
                            <p className="text-[10px] text-[#0071E3] dark:text-[#2997FF] font-semibold uppercase tracking-wider">Base Currency ({baseCurrency})</p>
                            <p className="text-lg font-bold text-[var(--theme-text-primary)] mt-0.5">{currencySymbol}</p>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-[#0071E3]/10 dark:bg-[#2997FF]/15 text-[#0071E3] dark:text-[#2997FF] flex items-center justify-center border border-[#0071E3]/20 shrink-0">
                            <DollarSign size={18} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                            <ArrowRightLeft size={12} /> Foreign Benchmark Currencies
                        </label>
                        {exchangeRates.map((curr, idx) => (
                            <div key={curr.code} className="flex items-center gap-2">
                                <div className="w-12 h-9 flex items-center justify-center bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-xs font-semibold text-[var(--theme-text-primary)]">
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
                                    className="flex-1 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-[var(--theme-text-primary)] text-xs font-medium outline-none focus:ring-2 focus:ring-[#0071E3]/20 focus:border-[#0071E3] dark:focus:border-[#2997FF] transition-all disabled:opacity-50"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
