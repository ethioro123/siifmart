import React, { useState, useEffect } from 'react';
import {
    Landmark, Calculator, Calendar, Percent, Coins,
    PieChart, Save, Globe, Plus
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { InputGroup, RadioCard, ToggleRow } from './finance/FinanceInputControls';
import { TaxZoneCard } from './finance/TaxZoneCard';
import { FinanceModals } from './finance/FinanceModals';
import { FinanceSidebarCards } from './finance/FinanceSidebarCards';
import { logger } from '../../utils/logger';

export default function FinanceSettings() {
    const { user, showToast } = useStore();
    const { settings, updateSettings, sites, updateSite } = useData();

    // Local States
    const [policy, setPolicy] = useState<{
        fiscalYearStart: string;
        accountingMethod: 'accrual' | 'cash';
        taxInclusive: boolean;
        taxRate: number;
        withholdingTax: number;
    }>({
        fiscalYearStart: '',
        accountingMethod: 'accrual',
        taxInclusive: true,
        taxRate: settings.taxRate ?? 0,
        withholdingTax: 2
    });

    const [limits, setLimits] = useState({
        maxPettyCash: 200,
        expenseApprovalLimit: 500,
        defaultCreditLimit: 1000
    });

    const [exchangeRates, setExchangeRates] = useState<{ code: string; rate: number }[]>([
        { code: 'USD', rate: 120 },
        { code: 'EUR', rate: 132.8 }
    ]);

    const [taxZones, setTaxZones] = useState<any[]>([]);

    const [isSavingPolicy, setIsSavingPolicy] = useState(false);
    const [isSavingLimits, setIsSavingLimits] = useState(false);
    const [isSavingJurisdictions, setIsSavingJurisdictions] = useState(false);

    // Modal States
    const [isAddingZone, setIsAddingZone] = useState(false);
    const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
    const [newZone, setNewZone] = useState({ name: '', type: 'Region' });
    const [newRule, setNewRule] = useState({ name: '', rate: 0, compound: false });

    // Sync from settings
    useEffect(() => {
        if (settings) {
            setPolicy({
                fiscalYearStart: settings.fiscalYearStart || '2026-01',
                accountingMethod: settings.accountingMethod || 'accrual',
                taxInclusive: settings.taxInclusive ?? true,
                taxRate: settings.taxRate ?? 0,
                withholdingTax: settings.withholdingTax ?? 2
            });
            setLimits({
                maxPettyCash: settings.maxPettyCash ?? 200,
                expenseApprovalLimit: settings.expenseApprovalLimit ?? 500,
                defaultCreditLimit: settings.defaultCreditLimit ?? 1000
            });
            if (settings.taxJurisdictions) {
                setTaxZones(settings.taxJurisdictions);
            }
            if (settings.exchangeRates && settings.exchangeRates.length > 0) {
                setExchangeRates(settings.exchangeRates);
            }
        }
    }, [settings]);

    const handleSaveSection = async (section: 'policy' | 'limits' | 'currency') => {
        const setSaving = section === 'policy' ? setIsSavingPolicy :
            section === 'limits' ? setIsSavingLimits : () => { };

        const data = section === 'policy' ? policy :
            section === 'limits' ? limits : { exchangeRates };

        if (section !== 'currency') setSaving(true);
        try {
            await updateSettings(data, user?.name || 'Admin');
            showToast(`${section.charAt(0).toUpperCase() + section.slice(1)} finance settings saved!`, 'success');
        } catch (err) {
            logger.error('FinanceSettings', `Failed to save ${section} settings:`, err);
            showToast(`Failed to save ${section} settings.`, 'error');
        } finally {
            if (section !== 'currency') setSaving(false);
        }
    };

    const handleAddZone = () => {
        if (!newZone.name) return;
        const zone = {
            id: crypto.randomUUID(),
            name: newZone.name,
            type: newZone.type,
            rules: []
        };
        setTaxZones(prev => [...prev, zone]);
        setIsAddingZone(false);
        setNewZone({ name: '', type: 'Region' });
        showToast(`Jurisdiction ${zone.name} added.`, 'success');
    };

    const handleAddRule = () => {
        if (!activeZoneId || !newRule.name) return;
        setTaxZones(prev => prev.map(z => {
            if (z.id === activeZoneId) {
                return {
                    ...z,
                    rules: [...z.rules, { ...newRule }]
                };
            }
            return z;
        }));
        setActiveZoneId(null);
        setNewRule({ name: '', rate: 0, compound: false });
        showToast(`Tax rule ${newRule.name} added.`, 'success');
    };

    const handleDeleteRule = (zoneId: string, ruleIndex: number) => {
        setTaxZones(prev => prev.map(z => {
            if (z.id === zoneId) {
                return {
                    ...z,
                    rules: z.rules.filter((_: any, idx: number) => idx !== ruleIndex)
                };
            }
            return z;
        }));
        showToast('Tax rule removed.', 'info');
    };

    const handleSaveJurisdictions = async () => {
        setIsSavingJurisdictions(true);
        try {
            await updateSettings({ taxJurisdictions: taxZones }, user?.name || 'Admin');
            showToast('Tax jurisdictions saved successfully.', 'success');
        } catch (err) {
            logger.error('FinanceSettings', 'Failed to save jurisdictions:', err);
            showToast('Failed to save jurisdictions.', 'error');
        } finally {
            setIsSavingJurisdictions(false);
        }
    };

    const handleAssignSite = async (siteId: string, jurisdictionId: string | null) => {
        const site = sites.find(s => s.id === siteId);
        if (!site) return;
        try {
            await updateSite({ ...site, taxJurisdictionId: jurisdictionId || undefined }, user?.name || 'Admin');
            showToast(jurisdictionId ? `Site ${site.name} assigned to jurisdiction.` : `Site ${site.name} unassigned.`, 'success');
        } catch (err) {
            showToast('Failed to update site assignment.', 'error');
        }
    };

    return (
        <div className="w-full max-w-full space-y-6 animate-in fade-in slide-in-from-right-4">

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
                                disabled={isSavingPolicy}
                                className="px-5 py-2.5 bg-[#2C5E3B] hover:opacity-90 text-white font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-50"
                            >
                                {isSavingPolicy ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
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
                                    onChange={(e: any) => setPolicy(prev => ({ ...prev, fiscalYearStart: e.target.value }))}
                                    sub="Reporting cycles will align with this start date"
                                />

                                <div className="space-y-2">
                                    <label className="text-xs text-stone-600 dark:text-gray-400 font-bold uppercase tracking-wide">Accounting Basis</label>
                                    <RadioCard
                                        value={policy.accountingMethod}
                                        onChange={(val: 'accrual' | 'cash') => setPolicy(prev => ({ ...prev, accountingMethod: val }))}
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
                                                    step="0.5"
                                                    value={policy.taxRate}
                                                    title="Base Tax Rate"
                                                    onChange={(e: any) => setPolicy(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                                                    className="w-20 bg-[#FAF8F5] dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-lg px-2.5 py-1 text-[#2C5E3B] dark:text-[#A9CBA2] font-mono font-black text-sm focus:border-[#2C5E3B] outline-none"
                                                />
                                                <span className="text-xs font-bold text-[#1E3F27] dark:text-white">%</span>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] flex items-center justify-center">
                                            <Percent size={18} />
                                        </div>
                                    </div>

                                    <ToggleRow
                                        label="Tax Inclusive Pricing"
                                        sub="Prices displayed include VAT"
                                        checked={policy.taxInclusive}
                                        onChange={() => setPolicy(prev => ({ ...prev, taxInclusive: !prev.taxInclusive }))}
                                    />

                                    <InputGroup
                                        label="Withholding Tax"
                                        type="number"
                                        value={policy.withholdingTax}
                                        onChange={(e: any) => setPolicy(prev => ({ ...prev, withholdingTax: parseFloat(e.target.value) || 0 }))}
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
                                <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83] mt-0.5">Manage multiple nexus and regional tax overrides</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleSaveJurisdictions}
                                disabled={isSavingJurisdictions}
                                className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-[#1E3F27] dark:text-white font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 border border-[#E2DCCE] dark:border-white/10 cursor-pointer transition-all disabled:opacity-50"
                            >
                                {isSavingJurisdictions ? <span className="w-3.5 h-3.5 border-2 border-stone-400 border-t-stone-800 rounded-full animate-spin" /> : <Save size={14} />}
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
                                    sites={sites}
                                    onAddRule={() => setActiveZoneId(zone.id)}
                                    onDeleteRule={handleDeleteRule}
                                    onAssignSite={handleAssignSite}
                                    onUnassignSite={(sid: string) => handleAssignSite(sid, null)}
                                    onDelete={() => {
                                        setTaxZones(taxZones.filter(z => z.id !== zone.id));
                                        showToast(`Jurisdiction ${zone.name} removed.`, 'info');
                                    }}
                                />
                            ))}

                            <button
                                onClick={() => setIsAddingZone(true)}
                                title="Add New Jurisdiction"
                                className="bg-[#FAF8F5] dark:bg-black/20 border-2 border-dashed border-[#E2DCCE] dark:border-white/10 rounded-3xl p-5 flex flex-col items-center justify-center gap-2 text-stone-500 dark:text-gray-400 hover:text-[#1E3F27] dark:hover:text-white hover:border-[#2C5E3B]/40 hover:bg-white dark:hover:bg-white/5 transition-all group min-h-[140px] cursor-pointer"
                            >
                                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Plus size={20} />
                                </div>
                                <span className="text-xs font-black uppercase tracking-wider">Add Jurisdiction</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* COLUMN 2: LIMITS, CURRENCY & COMPLIANCE */}
                <FinanceSidebarCards
                    limits={limits}
                    setLimits={setLimits}
                    isSavingLimits={isSavingLimits}
                    handleSaveSection={handleSaveSection}
                    baseCurrency={settings.currency || 'ETB'}
                    exchangeRates={exchangeRates}
                    setExchangeRates={setExchangeRates}
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
