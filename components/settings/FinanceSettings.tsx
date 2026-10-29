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
import { FinanceBaselineBanner, BaselineBadge } from './finance/FinanceBaselineBanner';
import { useFinanceSettingsMutation, FinanceSettingsSection } from '../../hooks/useFinanceSettingsMutation';
import type { TaxJurisdiction, TaxRule, Site, SystemConfig } from '../../types';

export default function FinanceSettings() {
    const { user, showToast } = useStore();
    const { settings, effectiveCountry, sites } = useData();
    const mutation = useFinanceSettingsMutation();

    // ── ROLE GATING (RULES.md Zero-Trust §1) ──
    const isAuthorized = ['group_ceo', 'country_managing_director', 'country_finance_director'].includes(user?.role || '');

    // ── INVISIBLE TENANCY & COUNTRY ISOLATION (AGENTS.md Rule 7 & 8) ──
    const activeCountry: Country = (effectiveCountry || settings?.country || 'ET') as Country;
    const countryProfile = getCountryProfile(activeCountry);
    const currencySymbol = countryProfile.currencySymbol;
    const baseCurrency = countryProfile.currency;

    // Filter sites to current country to prevent cross-border leakage
    const countrySites = sites.filter((s: Site) => (s.country || 'ET') === activeCountry);

    // Determine whether configuration is explicitly persisted or unverified fallback templates
    const countryConfigs = (settings?.countryConfigs || {}) as Record<string, Partial<SystemConfig>>;
    const activeConfig = countryConfigs[activeCountry] || {};
    const isCountryActiveInSettings = settings?.country === activeCountry;

    const isPolicyPersisted = Boolean(
        activeConfig.fiscalYearStart || activeConfig.taxRate !== undefined ||
        (isCountryActiveInSettings && (settings?.fiscalYearStart || settings?.taxRate !== undefined))
    );
    const isLimitsPersisted = Boolean(
        activeConfig.maxPettyCash !== undefined || activeConfig.expenseApprovalLimit !== undefined ||
        (isCountryActiveInSettings && (settings?.maxPettyCash !== undefined || settings?.expenseApprovalLimit !== undefined))
    );
    const isForexPersisted = Boolean(
        (activeConfig.exchangeRates && activeConfig.exchangeRates.length > 0) ||
        (isCountryActiveInSettings && settings?.exchangeRates && settings?.exchangeRates.length > 0)
    );

    // Local States
    const [policy, setPolicy] = useState({
        fiscalYearStart: activeCountry === 'KE' ? '2026-07' : '2026-01',
        accountingMethod: 'accrual' as 'accrual' | 'cash',
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
            showToast('Unauthorized: Modifying financial settings requires CEO or Country Finance Director role.', 'error');
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
                <div className="p-3.5 bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] rounded-xl flex items-center gap-2.5">
                    <ShieldAlert className="text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] shrink-0" size={18} />
                    <p className="text-xs text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] font-medium">
                        Read-Only View: Modifying corporate financial policies, tax matrices, and drawer caps requires Group Chief Executive Officer or Country Finance Director authorization.
                    </p>
                </div>
            )}

            {/* HEADER BANNER */}
            <div className="p-4 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl flex items-start gap-3 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/15 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center border border-[var(--theme-accent)]/20 shrink-0 mt-0.5">
                    <Landmark size={18} />
                </div>
                <div>
                    <h4 className="text-[var(--theme-text-primary)] font-semibold text-sm">Financial & Tax Control Center</h4>
                    <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                        Manage fiscal reporting cycles, tax jurisdictions, currency conversion, and drawer petty cash limits for {countryProfile.name}.
                    </p>
                </div>
            </div>

            {/* STATUTORY TEMPLATE BASELINE (UNVERIFIED) BANNER */}
            <FinanceBaselineBanner
                countryName={countryProfile.name}
                targetCountry={activeCountry}
                isPolicyPersisted={isPolicyPersisted}
                isLimitsPersisted={isLimitsPersisted}
                isForexPersisted={isForexPersisted}
                isAuthorized={isAuthorized}
                policy={policy}
                limits={limits}
                exchangeRates={exchangeRates}
                mutation={mutation}
                showToast={showToast}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* COLUMN 1: FISCAL & GLOBAL TAX */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 lg:p-6 shadow-xs">
                        <div className="mb-5 border-b border-[var(--theme-border)] pb-3.5 flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-semibold tracking-tight text-[var(--theme-text-primary)]">Fiscal & Tax Policy</h3>
                                    <BaselineBadge isPersisted={isPolicyPersisted} />
                                </div>
                                <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">Foundational accounting rules</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleSaveSection('policy')}
                                disabled={savingSection === 'policy' || !isAuthorized}
                                className="h-8 px-3.5 bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] hover:opacity-90 active:scale-[0.98] text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all disabled:opacity-40"
                            >
                                {savingSection === 'policy' ? (
                                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Save size={13} />
                                )}
                                Save Policy
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Accounting Basis</label>
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
                                <div className="p-4 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] space-y-3.5">
                                    <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider flex items-center gap-2">
                                        <Calculator size={14} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" /> Tax Configuration
                                    </label>

                                    <div className="flex items-center gap-3 bg-[var(--theme-bg-card)] p-3 rounded-xl border border-[var(--theme-border)]">
                                        <div className="flex-1">
                                            <p className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider mb-1">Base Tax Rate</p>
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
                                                    className="w-20 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-lg px-2.5 py-1 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] font-mono font-bold text-sm focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] focus:ring-1 focus:ring-[var(--theme-accent)]/20 outline-none disabled:opacity-50"
                                                />
                                                <span className="text-xs font-semibold text-[var(--theme-text-primary)]">%</span>
                                            </div>
                                        </div>
                                        <div className="w-9 h-9 rounded-xl bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/15 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center border border-[var(--theme-accent)]/20 shrink-0">
                                            <Percent size={16} />
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
                    <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 lg:p-6 shadow-xs">
                        <div className="mb-5 border-b border-[var(--theme-border)] pb-3.5 flex justify-between items-center">
                            <div>
                                <h3 className="text-sm font-semibold tracking-tight text-[var(--theme-text-primary)]">Tax Jurisdictions</h3>
                                <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">Manage multiple nexus and regional tax overrides ({countryProfile.name})</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleSaveSection('jurisdictions')}
                                disabled={savingSection === 'jurisdictions' || !isAuthorized}
                                className="h-8 px-3.5 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-[var(--theme-border)] cursor-pointer transition-all disabled:opacity-40"
                            >
                                {savingSection === 'jurisdictions' ? (
                                    <span className="w-3.5 h-3.5 border-2 border-[var(--theme-text-secondary)] border-t-[var(--theme-text-primary)] rounded-full animate-spin" />
                                ) : (
                                    <Save size={13} />
                                )}
                                Save Matrix
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {taxZones.length === 0 && (
                                <div className="sm:col-span-2 text-center py-10 bg-[var(--theme-bg-subtle)] rounded-xl border border-dashed border-[var(--theme-border)]">
                                    <Globe size={32} className="mx-auto text-[var(--theme-text-secondary)] mb-2 opacity-50" />
                                    <h4 className="text-[var(--theme-text-primary)] font-semibold text-xs">No Tax Jurisdictions</h4>
                                    <p className="text-xs text-[var(--theme-text-secondary)] mt-1">Create your first jurisdiction to apply location-specific tax rules.</p>
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
                                    className="bg-[var(--theme-bg-subtle)] border-2 border-dashed border-[var(--theme-border)] hover:border-[var(--theme-accent)]/40 rounded-2xl p-4.5 flex flex-col items-center justify-center gap-2 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-all group min-h-[130px] cursor-pointer"
                                >
                                    <div className="w-9 h-9 rounded-xl bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/15 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center border border-[var(--theme-accent)]/20 group-hover:scale-105 transition-transform">
                                        <Plus size={18} />
                                    </div>
                                    <span className="text-xs font-semibold uppercase tracking-wider">Add Jurisdiction</span>
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
                    isLimitsPersisted={isLimitsPersisted}
                    isForexPersisted={isForexPersisted}
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
