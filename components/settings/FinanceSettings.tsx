import React, { useState, useEffect } from 'react';
import {
    DollarSign, PieChart, CreditCard, Landmark, Calculator,
    Calendar, Percent, Coins, ArrowRightLeft,
    Save, Globe, MapPin, Plus, Layers, ShieldCheck, CheckCircle2
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import Button from '../shared/Button';
import Modal from '../Modal';

// Subcomponents
import { SectionHeader, InputGroup, RadioCard, ToggleRow } from './finance/FinanceInputControls';
import { TaxZoneCard } from './finance/TaxZoneCard';
import { FinanceModals } from './finance/FinanceModals';

export default function FinanceSettings() {
    const { user } = useStore();
    const { settings, updateSettings, addNotification, sites, updateSite } = useData();

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
                fiscalYearStart: settings.fiscalYearStart || '2025-01',
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
            section === 'limits' ? setIsSavingLimits : (v: boolean) => { };

        const data = section === 'policy' ? policy :
            section === 'limits' ? limits : { exchangeRates };

        if (section !== 'currency') setSaving(true);
        try {
            await updateSettings(data, user?.name || 'Admin');
            addNotification('success', `${section.charAt(0).toUpperCase() + section.slice(1)} finance settings saved!`);
        } catch (err) {
            console.error(`Failed to save ${section} settings:`, err);
            addNotification('alert', `Failed to save ${section} settings.`);
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
        addNotification('success', `Jurisdiction ${zone.name} added.`);
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
        addNotification('success', `Rule ${newRule.name} added.`);
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
        addNotification('info', 'Tax rule removed.');
    };

    const handleSaveJurisdictions = async () => {
        setIsSavingJurisdictions(true);
        try {
            await updateSettings({ taxJurisdictions: taxZones }, user?.name || 'Admin');
            addNotification('success', 'Tax jurisdictions saved successfully.');
        } catch (err) {
            console.error('Failed to save jurisdictions:', err);
            addNotification('alert', 'Failed to save jurisdictions.');
        } finally {
            setIsSavingJurisdictions(false);
        }
    };

    const handleAssignSite = async (siteId: string, jurisdictionId: string | null) => {
        const site = sites.find(s => s.id === siteId);
        if (!site) return;
        try {
            await updateSite({ ...site, taxJurisdictionId: jurisdictionId || undefined }, user?.name || 'Admin');
            addNotification('success', jurisdictionId ? `Site ${site.name} assigned to jurisdiction.` : `Site ${site.name} unassigned.`);
        } catch (err) {
            addNotification('alert', 'Failed to update site assignment.');
        }
    };

    return (
        <div className="w-full max-w-full space-y-6 animate-in fade-in slide-in-from-right-4">

            {/* HEADER BANNER */}
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3">
                <Landmark className="text-yellow-400 shrink-0 mt-0.5" size={20} />
                <div>
                    <h4 className="text-yellow-400 font-bold text-sm">Financial & Tax Control Center</h4>
                    <p className="text-xs text-gray-400 mt-1">
                        Manage fiscal policies, tax jurisdictions, and automated approval limits.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* COLUMN 1: FISCAL & GLOBAL TAX */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all">
                        <div className="mb-6 border-b border-white/5 pb-4 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-white">Fiscal & Tax Policy</h3>
                                <p className="text-sm text-gray-400 mt-1">Foundational financial rules</p>
                            </div>
                            <Button
                                onClick={() => handleSaveSection('policy')}
                                loading={isSavingPolicy}
                                icon={<Save size={16} />}
                                variant="primary"
                                className="px-6"
                            >
                                Save Policy
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-6">
                                <InputGroup
                                    label="Fiscal Year Start"
                                    icon={Calendar}
                                    type="month"
                                    value={policy.fiscalYearStart}
                                    onChange={(e: any) => setPolicy(prev => ({ ...prev, fiscalYearStart: e.target.value }))}
                                    sub="Reporting cycles will align with this start date"
                                />

                                <div className="space-y-3">
                                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wide">Accounting Basis</label>
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

                            <div className="space-y-6">
                                <div className="p-4 bg-black/20 rounded-xl border border-white/5 space-y-4">
                                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wide flex items-center gap-2">
                                        <Calculator size={14} /> Tax Configuration
                                    </label>

                                    <div className="flex items-center gap-4 bg-black/20 p-3 rounded-lg border border-white/5">
                                        <div className="flex-1">
                                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Base Tax Rate</p>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.5"
                                                    value={policy.taxRate}
                                                    title="Base Tax Rate"
                                                    onChange={(e: any) => setPolicy(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                                                    className="w-20 bg-black/40 border border-white/10 rounded px-2 py-1 text-cyber-primary font-mono font-bold focus:border-cyber-primary outline-none transition-all"
                                                />
                                                <span className="text-xs font-bold text-white">%</span>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-cyber-primary/10 flex items-center justify-center text-cyber-primary">
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
                                        onChange={(e: any) => setPolicy(prev => ({ ...prev, withholdingTax: parseFloat(e.target.value) }))}
                                        icon={Percent}
                                        prefix="%"
                                        sub="Applied to service contracts"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TAX JURISDICTIONS (TAX MATRIX) */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6">
                        <div className="mb-6 border-b border-white/5 pb-4 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-white">Tax Jurisdictions</h3>
                                <p className="text-sm text-gray-400 mt-1">Manage multiple nexus and regional overrides</p>
                            </div>
                            <Button
                                onClick={handleSaveJurisdictions}
                                loading={isSavingJurisdictions}
                                icon={<Save size={16} />}
                                variant="secondary"
                                className="px-6"
                            >
                                Save Matrix
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {taxZones.length === 0 && (
                                <div className="sm:col-span-2 text-center py-12 bg-black/20 rounded-xl border border-dashed border-white/10">
                                    <Globe size={40} className="mx-auto text-gray-600 mb-4" />
                                    <h4 className="text-gray-400 font-bold">No Tax Jurisdictions</h4>
                                    <p className="text-xs text-gray-500 mt-1">Create your first jurisdiction to apply location-specific tax rules.</p>
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
                                        addNotification('info', `Jurisdiction ${zone.name} removed.`);
                                    }}
                                />
                            ))}

                            <button
                                onClick={() => setIsAddingZone(true)}
                                title="Add New Jurisdiction"
                                className="bg-black/20 border-2 border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all group min-h-[150px]"
                            >
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Plus size={20} />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wide">Add Jurisdiction</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* COLUMN 2: LIMITS, CURRENCY & COMPLIANCE */}
                <div className="space-y-6">
                    {/* LIMITS & APPROVALS */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all">
                        <div className="mb-6 border-b border-white/5 pb-4 flex justify-between items-center">
                            <div>
                                <h3 className="text-base font-bold text-white">Limits & Approvals</h3>
                                <p className="text-[10px] text-gray-400 mt-1">Expense control thresholds</p>
                            </div>
                            <Button
                                onClick={() => handleSaveSection('limits')}
                                loading={isSavingLimits}
                                icon={<Save size={14} />}
                                variant="secondary"
                                className="px-3 py-1.5 h-auto text-xs"
                            >
                                Save Limits
                            </Button>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-4">
                                <InputGroup
                                    label="Max Petty Cash"
                                    type="number"
                                    prefix="$"
                                    value={limits.maxPettyCash}
                                    onChange={(e: any) => setLimits(prev => ({ ...prev, maxPettyCash: parseInt(e.target.value) }))}
                                    sub="Max cash on hand per drawer"
                                />
                                <InputGroup
                                    label="Expense Approval"
                                    type="number"
                                    prefix="$"
                                    value={limits.expenseApprovalLimit}
                                    onChange={(e: any) => setLimits(prev => ({ ...prev, expenseApprovalLimit: parseInt(e.target.value) }))}
                                    sub="Requires Manager > this amount"
                                />
                                <InputGroup
                                    label="Default Credit Limit"
                                    icon={CreditCard}
                                    type="number"
                                    prefix="$"
                                    value={limits.defaultCreditLimit}
                                    onChange={(e: any) => setLimits(prev => ({ ...prev, defaultCreditLimit: parseInt(e.target.value) }))}
                                    sub="New B2B customers start with this limit"
                                />
                            </div>
                        </div>
                    </div>

                    {/* COMPLIANCE RULES */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6">
                        <SectionHeader title="Compliance" desc="Automated tax logic" />
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-3 bg-black/20 rounded-xl border border-white/5">
                                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                                    <Layers size={18} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <p className="text-sm font-bold text-white">Compound Tax</p>
                                        <CheckCircle2 size={14} className="text-cyber-primary" />
                                    </div>
                                    <p className="text-[10px] text-gray-400">VAT on top of Duty enabled</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-black/20 rounded-xl border border-white/5">
                                <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                                    <ShieldCheck size={18} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <p className="text-sm font-bold text-white">Tax Exemptions</p>
                                        <CheckCircle2 size={14} className="text-cyber-primary" />
                                    </div>
                                    <p className="text-[10px] text-gray-400">Qualified NGO/Diplomatic rules active</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MULTI-CURRENCY */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-base font-bold text-white">Currency Settings</h3>
                            <Button
                                onClick={() => handleSaveSection('currency')}
                                icon={<Save size={14} />}
                                variant="secondary"
                                className="px-3 py-1.5 h-auto text-xs"
                            >
                                Save Rates
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-cyber-primary/10 border border-cyber-primary/20 rounded-xl">
                                <div>
                                    <p className="text-[10px] text-cyber-primary font-bold uppercase">Base Currency</p>
                                    <p className="text-xl font-bold text-white mt-1">{settings.currency || 'ETB'}</p>
                                </div>
                                <DollarSign className="text-cyber-primary" size={24} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 font-bold uppercase tracking-wide flex items-center gap-2">
                                    <ArrowRightLeft size={14} /> Other Rates
                                </label>
                                {exchangeRates.map((curr, idx) => (
                                    <div key={curr.code} className="flex items-center gap-2">
                                        <div className="w-10 h-8 flex items-center justify-center bg-black/40 border border-white/10 rounded-lg text-xs font-bold text-gray-300">
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
                                            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs outline-none focus:border-cyber-primary"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
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
