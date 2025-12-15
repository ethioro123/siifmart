import React, { useState } from 'react';
import { DollarSign, PieChart, CreditCard, Landmark, Calculator, AlertTriangle, Calendar, Percent, Coins, ArrowRightLeft } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';

// --- SUB-COMPONENTS (Shared styles) ---
const SectionHeader = ({ title, desc }: { title: string, desc: string }) => (
    <div className="mb-6 pb-4 border-b border-white/5">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-sm text-gray-400 mt-1">{desc}</p>
    </div>
);

const InputGroup = ({ label, value, onChange, placeholder, sub, icon: Icon, type = "text", prefix }: any) => (
    <div className="group">
        <label className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-2 block group-hover:text-cyber-primary transition-colors flex items-center gap-2">
            {Icon && <Icon size={14} />} {label}
        </label>
        <div className="relative">
            {prefix && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm pointer-events-none">
                    {prefix}
                </div>
            )}
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`w-full bg-black/40 border border-white/10 rounded-xl py-3 text-white text-sm focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary/50 outline-none transition-all placeholder:text-gray-600 ${prefix ? 'pl-10 pr-4' : 'px-4'}`}
            />
            {sub && <p className="text-[10px] text-gray-500 mt-2 ml-1">{sub}</p>}
        </div>
    </div>
);

const RadioCard = ({ options, value, onChange }: any) => (
    <div className="grid grid-cols-2 gap-3">
        {options.map((opt: any) => (
            <button
                key={opt.value}
                onClick={() => onChange(opt.value)}
                className={`p-4 rounded-xl border text-left transition-all ${value === opt.value
                    ? 'bg-cyber-primary/10 border-cyber-primary text-white'
                    : 'bg-black/40 border-white/10 text-gray-400 hover:bg-white/5'
                    }`}
            >
                <div className="flex items-center gap-2 mb-1">
                    {opt.icon && <opt.icon size={16} className={value === opt.value ? 'text-cyber-primary' : 'text-gray-500'} />}
                    <span className="font-bold text-sm">{opt.label}</span>
                </div>
                <p className="text-[10px] opacity-70">{opt.desc}</p>
            </button>
        ))}
    </div>
);

const ToggleRow = ({ label, sub, checked, onChange }: any) => (
    <div className="flex items-start justify-between p-3 bg-black/20 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
        <div className="space-y-1">
            <p className="text-sm font-bold text-gray-200">{label}</p>
            <p className="text-[10px] text-gray-500">{sub}</p>
        </div>
        <div
            onClick={onChange}
            className={`w-11 h-6 shrink-0 rounded-full p-1 cursor-pointer transition-colors relative ${checked ? 'bg-cyber-primary' : 'bg-white/10'
                }`}
        >
            <div className={`w-4 h-4 bg-black rounded-full shadow-md transition-transform transform ${checked ? 'translate-x-5' : 'translate-x-0'
                }`} />
        </div>
    </div>
);

export default function FinanceSettings() {
    const { user } = useStore();
    const { settings, updateSettings } = useData();

    // Mock state for secondary currencies since it's a list
    const [currencies, setCurrencies] = useState([
        { code: 'USD', rate: 120.5 },
        { code: 'EUR', rate: 132.8 }
    ]);

    return (
        <div className="w-full max-w-full space-y-6 animate-in fade-in slide-in-from-right-4">

            {/* HEADER BANNER */}
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3">
                <Landmark className="text-yellow-400 shrink-0 mt-0.5" size={20} />
                <div>
                    <h4 className="text-yellow-400 font-bold text-sm">Financial Control Center</h4>
                    <p className="text-xs text-gray-400 mt-1">
                        Manage fiscal policies, tax compliance, and automated approval limits.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* FISCAL POLICY */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all">
                    <SectionHeader title="Fiscal Policy" desc="Accounting years and methods" />

                    <div className="space-y-6">
                        <InputGroup
                            label="Fiscal Year Start"
                            icon={Calendar}
                            type="month"
                            value={settings.fiscalYearStart || '2025-01'}
                            onChange={(e: any) => updateSettings({ fiscalYearStart: e.target.value }, user?.name || 'Admin')}
                            sub="Reporting cycles will align with this start date"
                        />

                        <div className="space-y-3">
                            <label className="text-xs text-gray-400 font-bold uppercase tracking-wide">Accounting Basis</label>
                            <RadioCard
                                value={settings.accountingMethod || 'accrual'}
                                onChange={(val: string) => updateSettings({ accountingMethod: val }, user?.name || 'Admin')}
                                options={[
                                    { value: 'accrual', label: 'Accrual Basis', desc: 'Record when transaction occurs', icon: PieChart },
                                    { value: 'cash', label: 'Cash Basis', desc: 'Record when cash exchanges', icon: Coins },
                                ]}
                            />
                        </div>

                        <div className="p-4 bg-black/20 rounded-xl border border-white/5 space-y-3">
                            <label className="text-xs text-gray-400 font-bold uppercase tracking-wide flex items-center gap-2">
                                <Calculator size={14} /> Tax Handling
                            </label>
                            <ToggleRow
                                label="Tax Inclusive Pricing"
                                sub="Prices displayed include VAT"
                                checked={settings.taxInclusive}
                                onChange={() => updateSettings({ taxInclusive: !settings.taxInclusive }, user?.name || 'Admin')}
                            />
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <InputGroup
                                    label="Default VAT Rate"
                                    type="number"
                                    value={settings.defaultVatRate || 15}
                                    onChange={(e: any) => updateSettings({ defaultVatRate: parseFloat(e.target.value) }, user?.name || 'Admin')}
                                    icon={Percent}
                                    prefix="%"
                                />
                                <InputGroup
                                    label="Withholding Tax"
                                    type="number"
                                    value={settings.withholdingTax || 2}
                                    onChange={(e: any) => updateSettings({ withholdingTax: parseFloat(e.target.value) }, user?.name || 'Admin')}
                                    icon={Percent}
                                    prefix="%"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* LIMITS & APPROVALS */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all">
                        <SectionHeader title="Limits & Approvals" desc="Expense controls and automation" />

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputGroup
                                    label="Max Petty Cash"
                                    type="number"
                                    prefix="$"
                                    value={settings.maxPettyCash || 200}
                                    onChange={(e: any) => updateSettings({ maxPettyCash: parseInt(e.target.value) }, user?.name || 'Admin')}
                                    sub="Max cash on hand per drawer"
                                />
                                <InputGroup
                                    label="Expense Approval"
                                    type="number"
                                    prefix="$"
                                    value={settings.expenseApprovalLimit || 500}
                                    onChange={(e: any) => updateSettings({ expenseApprovalLimit: parseInt(e.target.value) }, user?.name || 'Admin')}
                                    sub="Requires Manager > this amount"
                                />
                            </div>

                            <InputGroup
                                label="Default Credit Limit"
                                icon={CreditCard}
                                type="number"
                                prefix="$"
                                value={settings.defaultCreditLimit || 1000}
                                onChange={(e: any) => updateSettings({ defaultCreditLimit: parseInt(e.target.value) }, user?.name || 'Admin')}
                                sub="New B2B customers start with this limit"
                            />
                        </div>
                    </div>

                    {/* MULTI-CURRENCY */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all">
                        <SectionHeader title="Multi-Currency" desc="Exchange rates and conversions" />

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-cyber-primary/10 border border-cyber-primary/20 rounded-xl">
                                <div>
                                    <p className="text-xs text-cyber-primary font-bold uppercase">Base Currency</p>
                                    <p className="text-xl font-bold text-white mt-1">{settings.currency || 'ETB'}</p>
                                </div>
                                <DollarSign className="text-cyber-primary" size={24} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 font-bold uppercase tracking-wide flex items-center gap-2">
                                    <ArrowRightLeft size={14} /> Exchange Rates (vs Base)
                                </label>
                                {currencies.map((curr, idx) => (
                                    <div key={curr.code} className="flex items-center gap-3">
                                        <div className="w-12 h-10 flex items-center justify-center bg-black/40 border border-white/10 rounded-lg text-sm font-bold text-gray-300">
                                            {curr.code}
                                        </div>
                                        <input
                                            type="number"
                                            defaultValue={curr.rate}
                                            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-cyber-primary"
                                        />
                                    </div>
                                ))}
                                <button className="w-full py-2 mt-2 border border-dashed border-white/20 rounded-lg text-xs text-gray-400 hover:text-white hover:border-white/40 transition-colors">
                                    + Add Currency
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
