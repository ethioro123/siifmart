import React, { useState, useEffect } from 'react';
import {
    Landmark, Calculator, Calendar, Percent, Coins,
    PieChart, Save, Globe, Plus, ShieldAlert
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { Country, getCountryProfile } from '../../utils/localization';
import { InputGroup, RadioCard, ToggleRow } from './finance/FinanceInputControls';
import { TaxZoneCard } from './finance/TaxZoneCard';
import { FinanceModals } from './finance/FinanceModals';
import { FinanceSidebarCards } from './finance/FinanceSidebarCards';
import { useFinanceSettingsMutation, FinanceSettingsSection } from '../../hooks/useFinanceSettingsMutation';
import type { TaxJurisdiction, TaxRule, Site, SystemConfig } from '../../types';

export default function FinanceSettings() {
    const { user, showToast } = useStore();
    const { settings, effectiveCountry, sites } = useData();
    const mutation = useFinanceSettingsMutation();

    // ── ROLE GATING (RULES.md Zero-Trust §1) ──
    const isAuthorized = ['super_admin', 'CEO', 'finance_manager'].includes(user?.role || '');

    // ── INVISIBLE TENANCY & COUNTRY ISOLATION (AGENTS.md Rule 7 & 8) ──
    const activeCountry: Country = (effectiveCountry || settings?.country || 'ET') as Country;
    const countryProfile = getCountryProfile(activeCountry);
    const currencySymbol = countryProfile.currencySymbol;
    const baseCurrency = countryProfile.currency;

    // Filter sites to current country to prevent cross-border leakage
    const countrySites = sites.filter((s: Site) => (s.country || 'ET') === activeCountry);

    // Local States
    const [policy, setPolicy] = useState<{
        fiscalYearStart: string;
        accountingMethod: 'accrual' | 'cash';
        taxInclusive: boolean;
        taxOnSelling: boolean;
        taxOnPurchasing: boolean;
        taxRate: number;
        withholdingTax: number;
    }>({
        fiscalYearStart: activeCountry === 'KE' ? '2026-07' : '2026-01',
        accountingMethod: 'accrual',
        taxInclusive: true,
        taxOnSelling: false,
        taxOnPurchasing: false,
        taxRate: activeCountry === 'KE' ? 16 : 15,
        withholdingTax: 2,
    });

    const [limits, setLimits] = useState({
        maxPettyCash: activeCountry === 'KE' ? 25000 : 5000,
        expenseApprovalLimit: activeCountry === 'KE' ? 50000 : 10000,
        defaultCreditLimit: activeCountry === 'KE' ? 100000 : 50000,
    });

    const [compliance, setCompliance] = useState({
        compoundTax: false,
        taxExemptions: true,
    });

    const [exchangeRates, setExchangeRates] = useState<{ code: string; rate: number }[]>([
        { code: 'USD', rate: activeCountry === 'KE' ? 130 : 120 },
        { code: 'EUR', rate: activeCountry === 'KE' ? 142 : 132.8 },
    ]);

    const [taxZones, setTaxZones] = useState<TaxJurisdiction[]>([]);

    // Pending save indicators
    const [savingSection, setSavingSection] = useState<FinanceSettingsSection | null>(null);

    // Modal States
    const [isAddingZone, setIsAddingZone] = useState(false);
    const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
    const [newZone, setNewZone] = useState<{ name: string; type: 'National' | 'Region' }>({
        name: '',
        type: 'Region',
    });
    const [newRule, setNewRule] = useState<TaxRule>({ name: '', rate: 0, compound: false });

    // Sync from countryConfigs[activeCountry]
    useEffect(() => {
        if (!settings) return;

        const countryConfigs = (settings.countryConfigs || {}) as Record<string, Partial<SystemConfig>>;
        const activeConfig = countryConfigs[activeCountry] || {};

        setPolicy({
            fiscalYearStart: activeConfig.fiscalYearStart || settings.fiscalYearStart || (activeCountry === 'KE' ? '2026-07' : '2026-01'),
            accountingMethod: activeConfig.accountingMethod || settings.accountingMethod || 'accrual',
            taxInclusive: activeConfig.taxInclusive ?? settings.taxInclusive ?? true,
            taxOnSelling: activeConfig.taxOnSelling ?? settings.taxOnSelling ?? false,
            taxOnPurchasing: activeConfig.taxOnPurchasing ?? settings.taxOnPurchasing ?? false,
            taxRate: activeConfig.taxRate ?? (activeCountry === 'KE' ? (settings.taxRate ?? 16) : (settings.taxRate ?? 15)),
            withholdingTax: activeConfig.withholdingTax ?? settings.withholdingTax ?? 2,
        });

        setLimits({
            maxPettyCash: activeConfig.maxPettyCash ?? settings.maxPettyCash ?? (activeCountry === 'KE' ? 25000 : 5000),
            expenseApprovalLimit: activeConfig.expenseApprovalLimit ?? settings.expenseApprovalLimit ?? (activeCountry === 'KE' ? 50000 : 10000),
            defaultCreditLimit: activeConfig.defaultCreditLimit ?? settings.defaultCreditLimit ?? (activeCountry === 'KE' ? 100000 : 50000),
        });

        setCompliance({
            compoundTax: activeConfig.compoundTax ?? settings.compoundTax ?? false,
            taxExemptions: activeConfig.taxExemptions ?? settings.taxExemptions ?? true,
        });

        if (activeConfig.taxJurisdictions && activeConfig.taxJurisdictions.length > 0) {
            setTaxZones(activeConfig.taxJurisdictions);
        } else if (settings.taxJurisdictions && settings.taxJurisdictions.length > 0) {
            setTaxZones(settings.taxJurisdictions);
        } else {
            setTaxZones([]);
        }

        if (activeConfig.exchangeRates && activeConfig.exchangeRates.length > 0) {
            setExchangeRates(activeConfig.exchangeRates);
        } else if (settings.exchangeRates && settings.exchangeRates.length > 0) {
            setExchangeRates(settings.exchangeRates);
        } else {
            setExchangeRates([
                { code: 'USD', rate: activeCountry === 'KE' ? 130 : 120 },
                { code: 'EUR', rate: activeCountry === 'KE' ? 142 : 132.8 },
            ]);
        }
    }, [settings, activeCountry]);

    const handleSaveSection = async (section: FinanceSettingsSection) => {
        if (!isAuthorized) {
            showToast('Unauthorized: Modifying financial settings requires CEO or Finance Manager role.', 'error');
            return;
        }

        setSavingSection(section);
        try {
            let dataPayload: Partial<SystemConfig> = {};
            if (section === 'policy') {
                dataPayload = policy;
            } else if (section === 'limits') {
                dataPayload = limits;
            } else if (section === 'currency') {
                dataPayload = { exchangeRates };
            } else if (section === 'jurisdictions') {
                dataPayload = { taxJurisdictions: taxZones };
            } else if (section === 'compliance') {
                dataPayload = compliance;
            }

            await mutation.mutateAsync({
                section,
                targetCountry: activeCountry,
                data: dataPayload,
            });
        } catch {
            // Handled in mutation onError
        } finally {
            setSavingSection(null);
        }
    };

    const handleAddZone = () => {
        if (!newZone.name.trim()) return;
        const zone: TaxJurisdiction = {
            id: crypto.randomUUID(),
            name: newZone.name.trim(),
            type: newZone.type,
            rules: [],
        };
        setTaxZones(prev => [...prev, zone]);
        setIsAddingZone(false);
        setNewZone({ name: '', type: 'Region' });
        showToast(`Jurisdiction ${zone.name} added. Click 'Save Matrix' to persist.`, 'info');
    };

    const handleAddRule = () => {
        if (!activeZoneId || !newRule.name.trim()) return;
        setTaxZones(prev => prev.map(z => {
            if (z.id === activeZoneId) {
                return {
                    ...z,
                    rules: [...(z.rules || []), { ...newRule }],
                };
            }
            return z;
        }));
        setActiveZoneId(null);
        setNewRule({ name: '', rate: 0, compound: false });
        showToast(`Tax rule ${newRule.name} added. Click 'Save Matrix' to persist.`, 'info');
    };

    const handleDeleteRule = (zoneId: string, ruleIndex: number) => {
        setTaxZones(prev => prev.map(z => {
            if (z.id === zoneId) {
                return {
                    ...z,
                    rules: (z.rules || []).filter((_, idx) => idx !== ruleIndex),
                };
            }
            return z;
        }));
        showToast('Tax rule removed. Click \'Save Matrix\' to persist.', 'info');
    };

    const handleAssignSite = async (siteId: string, jurisdictionId: string | null) => {
        if (!isAuthorized) {
            showToast('Unauthorized: Assigning sites requires managerial credentials.', 'error');
            return;
        }

        try {
            await mutation.assignSite({
                siteId,
                taxJurisdictionId: jurisdictionId,
                targetCountry: activeCountry,
            });
        } catch {
            // Handled in mutation onError
        }
    };

    return (
        <div className="w-full max-w-full space-y-6 animate-in fade-in slide-in-from-right-4">
            {/* ROLE WARNING BANNER IF UNAUTHORIZED */}
            {!isAuthorized && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl flex items-center gap-3">
                    <ShieldAlert className="text-amber-700 dark:text-amber-400 shrink-0" size={20} />
                    <p className="text-xs text-amber-800 dark:text-amber-300 font-bold">
                        Read-Only View: Modifying corporate financial policies, tax matrices, and drawer caps requires CEO, Super Admin, or Finance Manager authorization.
                    </p>
                </div>
            )}

            {/* HEADER BANNER */}
            <div className="p-4 bg-emerald-50 dark:bg-[#2C5E3B]/20 border border-emerald-200 dark:border-emerald-950/30 rounded-2xl flex items-start gap-3">
                <Landmark className="text-[#2C5E3B] dark:text-[#A9CBA2] shrink-0 mt-0.5" size={20} />
                <div>
                    <h4 className="text-[#1E3F27] dark:text-white font-bold text-sm">Financial & Tax Control Center</h4>
                    <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83] mt-0.5">
                        Manage fiscal reporting cycles, tax jurisdictions, currency conversion, and drawer petty cash limits.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* COLUMN 1: FISCAL & GLOBAL TAX */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[32px] p-6 lg:p-8 shadow-sm">
                        <div className="mb-6 border-b border-[#E2DCCE]/60 dark:border-white/5 pb-4 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-black text-[#1E3F27] dark:text-[#EAE5D9]">Fiscal & Tax Policy</h3>
                                <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83] mt-0.5">Foundational accounting rules</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleSaveSection('policy')}
                                disabled={savingSection === 'policy' || !isAuthorized}
                                className="px-5 py-2.5 bg-[#2C5E3B] hover:opacity-90 text-white font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-50"
                            >
                                {savingSection === 'policy' ? (
                                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Save size={14} />
                                )}
                                Save Policy
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <InputGroup
                                    label="Fiscal Year Start"
                                    icon={Calendar}
                                    type="month"
                                    value={policy.fiscalYearStart}
                                    disabled={!isAuthorized}
                                    onChange={(e) => setPolicy(prev => ({ ...prev, fiscalYearStart: e.target.value }))}
                                    sub="Reporting cycles will align with this start date"
                                />

                                <div className="space-y-2">
                                    <label className="text-xs text-stone-600 dark:text-gray-400 font-bold uppercase tracking-wide">Accounting Basis</label>
                                    <RadioCard<'accrual' | 'cash'>
                                        value={policy.accountingMethod}
                                        disabled={!isAuthorized}
                                        onChange={(val) => setPolicy(prev => ({ ...prev, accountingMethod: val }))}
                                        options={[
                                            { value: 'accrual', label: 'Accrual Basis', desc: 'Record when transaction occurs', icon: PieChart },
                                            { value: 'cash', label: 'Cash Basis', desc: 'Record when cash exchanges', icon: Coins },
                                        ]}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-[#FAF8F5] dark:bg-black/20 rounded-2xl border border-[#E2DCCE] dark:border-white/5 space-y-4">
                                    <label className="text-xs text-stone-600 dark:text-gray-400 font-bold uppercase tracking-wide flex items-center gap-2">
                                        <Calculator size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> Tax Configuration
                                    </label>

                                    <div className="flex items-center gap-4 bg-white dark:bg-black/40 p-3 rounded-xl border border-[#E2DCCE] dark:border-white/5">
                                        <div className="flex-1">
                                            <p className="text-[10px] text-stone-500 uppercase font-black tracking-wider mb-1">Base Tax Rate</p>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.5"
                                                    value={policy.taxRate}
                                                    disabled={!isAuthorized}
                                                    title="Base Tax Rate"
                                                    onChange={(e) => setPolicy(prev => ({ ...prev, taxRate: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) }))}
                                                    className="w-20 bg-[#FAF8F5] dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-lg px-2.5 py-1 text-[#2C5E3B] dark:text-[#A9CBA2] font-mono font-black text-sm focus:border-[#2C5E3B] outline-none disabled:opacity-50"
                                                />
                                                <span className="text-xs font-bold text-[#1E3F27] dark:text-white">%</span>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] flex items-center justify-center">
                                            <Percent size={18} />
                                        </div>
                                    </div>

                                    <ToggleRow
                                        label="Tax / VAT on Sales (Selling)"
                                        sub="Auto-apply VAT to POS checkout (Opt-in only. When OFF, sales tax defaults to 0% with manual override available)"
                                        checked={policy.taxOnSelling}
                                        disabled={!isAuthorized}
                                        onChange={() => setPolicy(prev => ({ ...prev, taxOnSelling: !prev.taxOnSelling }))}
                                    />

                                    <ToggleRow
                                        label="Tax / VAT on Procurement (Buying)"
                                        sub="Auto-apply VAT to purchase orders (Opt-in only. When OFF, PO tax defaults to 0% with manual override available)"
                                        checked={policy.taxOnPurchasing}
                                        disabled={!isAuthorized}
                                        onChange={() => setPolicy(prev => ({ ...prev, taxOnPurchasing: !prev.taxOnPurchasing }))}
                                    />

                                    <ToggleRow
                                        label="Tax Inclusive Pricing"
                                        sub="Prices displayed include VAT"
                                        checked={policy.taxInclusive}
                                        disabled={!isAuthorized}
                                        onChange={() => setPolicy(prev => ({ ...prev, taxInclusive: !prev.taxInclusive }))}
                                    />

                                    <InputGroup
                                        label="Withholding Tax"
                                        type="number"
                                        value={policy.withholdingTax}
                                        disabled={!isAuthorized}
                                        onChange={(e) => setPolicy(prev => ({ ...prev, withholdingTax: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) }))}
                                        icon={Percent}
                                        prefix="%"
                                        sub="Applied to service contracts"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TAX JURISDICTIONS (TAX MATRIX) */}
                    <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[32px] p-6 lg:p-8 shadow-sm">
                        <div className="mb-6 border-b border-[#E2DCCE]/60 dark:border-white/5 pb-4 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-black text-[#1E3F27] dark:text-[#EAE5D9]">Tax Jurisdictions</h3>
                                <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83] mt-0.5">Manage multiple nexus and regional tax overrides ({countryProfile.name})</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleSaveSection('jurisdictions')}
                                disabled={savingSection === 'jurisdictions' || !isAuthorized}
                                className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-[#1E3F27] dark:text-white font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 border border-[#E2DCCE] dark:border-white/10 cursor-pointer transition-all disabled:opacity-50"
                            >
                                {savingSection === 'jurisdictions' ? (
                                    <span className="w-3.5 h-3.5 border-2 border-stone-400 border-t-stone-800 rounded-full animate-spin" />
                                ) : (
                                    <Save size={14} />
                                )}
                                Save Matrix
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {taxZones.length === 0 && (
                                <div className="sm:col-span-2 text-center py-10 bg-[#FAF8F5] dark:bg-black/20 rounded-2xl border border-dashed border-[#E2DCCE] dark:border-white/10">
                                    <Globe size={36} className="mx-auto text-stone-400 dark:text-gray-600 mb-2" />
                                    <h4 className="text-stone-600 dark:text-gray-400 font-bold text-sm">No Tax Jurisdictions</h4>
                                    <p className="text-xs text-stone-400 dark:text-gray-500 mt-1">Create your first jurisdiction to apply location-specific tax rules.</p>
                                </div>
                            )}
                            {taxZones.map(zone => (
                                <TaxZoneCard
                                    key={zone.id}
                                    zone={zone}
                                    sites={countrySites}
                                    onAddRule={() => setActiveZoneId(zone.id)}
                                    onDeleteRule={handleDeleteRule}
                                    onAssignSite={handleAssignSite}
                                    onUnassignSite={(sid: string) => handleAssignSite(sid, null)}
                                    isAuthorized={isAuthorized}
                                    onDelete={() => {
                                        setTaxZones(taxZones.filter(z => z.id !== zone.id));
                                        showToast(`Jurisdiction ${zone.name} removed. Click 'Save Matrix' to persist.`, 'info');
                                    }}
                                />
                            ))}

                            {isAuthorized && (
                                <button
                                    type="button"
                                    onClick={() => setIsAddingZone(true)}
                                    title="Add New Jurisdiction"
                                    className="bg-[#FAF8F5] dark:bg-black/20 border-2 border-dashed border-[#E2DCCE] dark:border-white/10 rounded-3xl p-5 flex flex-col items-center justify-center gap-2 text-stone-500 dark:text-gray-400 hover:text-[#1E3F27] dark:hover:text-white hover:border-[#2C5E3B]/40 hover:bg-white dark:hover:bg-white/5 transition-all group min-h-[140px] cursor-pointer"
                                >
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Plus size={20} />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-wider">Add Jurisdiction</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* COLUMN 2: LIMITS, CURRENCY & COMPLIANCE */}
                <FinanceSidebarCards
                    limits={limits}
                    setLimits={setLimits}
                    compliance={compliance}
                    setCompliance={setCompliance}
                    isSavingLimits={savingSection === 'limits'}
                    isSavingCompliance={savingSection === 'compliance'}
                    isSavingRates={savingSection === 'currency'}
                    handleSaveSection={handleSaveSection}
                    baseCurrency={baseCurrency}
                    currencySymbol={currencySymbol}
                    exchangeRates={exchangeRates}
                    setExchangeRates={setExchangeRates}
                    isAuthorized={isAuthorized}
                />
            </div>

            {/* MODALS */}
            <FinanceModals
                isAddingZone={isAddingZone}
                setIsAddingZone={setIsAddingZone}
                handleAddZone={handleAddZone}
                newZone={newZone}
                setNewZone={setNewZone}
                activeZoneId={activeZoneId}
                setActiveZoneId={setActiveZoneId}
                handleAddRule={handleAddRule}
                newRule={newRule}
                setNewRule={setNewRule}
            />
        </div>
    );
}
