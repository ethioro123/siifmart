import React, { useState, useEffect, useMemo } from 'react';
import {
    Shield, Package, RotateCw, AlertTriangle, Scan, Search,
    ClipboardCheck, ArrowRight, Save, MapPin, Lock, Globe,
    Tag, DollarSign, Percent
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { isAdmin, canSwitchCountry } from '../../utils/permissions';
import { useWMSSettingsMutation } from '../../hooks/useWMSSettingsMutation';
import { SectionHeader, RadioGroup, SliderGroup, ToggleRow } from './components/SettingFormControls';
import SmartRoutingConfig from './components/SmartRoutingConfig';
import { WMSPickControlTab } from './components/WMSPickControlTab';
import { Country, getCountryProfile } from '../../utils/localization';

export default function WMSSettings() {
    const { user, showToast } = useStore();
    const {
        settings,
        sites, allSales, releaseOrder, refreshData,
        effectiveCountry
    } = useData();

    // ── ROLE GUARD (RULES.md §Role Hierarchy & Zero-Trust) ──
    // Only L1–L2 central operations and warehouse managers may configure WMS engine policies.
    // Store-level staff (store_manager, cashier, picker) are unconditionally blocked.
    const WMS_ALLOWED_ROLES = [
        'super_admin', 'CEO', 'ceo',
        'operations_manager', 'regional_manager', 'warehouse_manager',
    ];
    const canConfigureWMS = WMS_ALLOWED_ROLES.includes(user?.role || '');
    const isHQAdmin = isAdmin(user?.role as Parameters<typeof isAdmin>[0]);

    const [activeTab, setActiveTab] = useState<'rules' | 'pick-control' | 'smart-routing'>('rules');

    // ── INVISIBLE MULTI-TENANCY & BACKGROUND ISOLATION (AGENTS.md Rule 8 / §6) ──
    // Country is determined exclusively by the central global switch (effectiveCountry).
    // Individual settings pages MUST NEVER render country selector chips, dropdowns,
    // or partition banners. Non-CEO users experience a native, single-nation interface.
    const activeCountry: Country = (effectiveCountry || settings?.country || 'ET') as Country;

    // ── WMS CONFIG STATE ──
    const [inbound, setInbound] = useState({
        receivingLogic: 'verified' as 'blind' | 'verified',
        qcSamplingRate: 10,
        qcBlockOnFailure: true,
        putawayLogic: 'system' as 'manual' | 'system',
        requirePutawayQuantityEntry: true,
        overReceiveTolerancePct: 0,
        poPriceApplyAt: 'putaway' as 'putaway' | 'receive',
        printPriceTagAt: 'store' as 'store' | 'putaway' | 'receive'
    });

    const [health, setHealth] = useState({
        rotationPolicy: 'fefo' as 'fefo' | 'fifo',
        requireExpiry: true,
        cycleCountStrategy: 'abc' as 'abc' | 'random',
        maxCycleCountRecounts: 1,
        requireSecondCounterOnVariance: true
    });

    const [outbound, setOutbound] = useState({
        pickingMethod: 'order' as 'order' | 'wave' | 'zone',
        strictScanning: true,
        bayScan: true,
        requirePickQuantityEntry: true,
        requirePackSecuritySeal: true,
        requirePackCartonWeight: false,
        packWeightTolerancePct: 5
    });

    // ── MUTATION HOOK ──
    const wmsSettingsMutation = useWMSSettingsMutation();
    const isSaving = wmsSettingsMutation.isPending ? wmsSettingsMutation.variables?.section : null;

    // Sync from settings partition whenever activeCountry or settings change
    useEffect(() => {
        if (settings) {
            const countryPartition = settings.countryConfigs?.[activeCountry];
            const isCountryActive = settings.country === activeCountry;

            setInbound({
                receivingLogic: (countryPartition?.receivingLogic ?? (isCountryActive ? settings.receivingLogic : undefined)) === 'verified' ? 'verified' : 'blind',
                qcSamplingRate: countryPartition?.qcSamplingRate ?? (isCountryActive ? settings.qcSamplingRate : undefined) ?? 10,
                qcBlockOnFailure: countryPartition?.qcBlockOnFailure ?? (isCountryActive ? settings.qcBlockOnFailure : undefined) ?? true,
                putawayLogic: countryPartition?.putawayLogic || (isCountryActive ? settings.putawayLogic : undefined) || 'system',
                requirePutawayQuantityEntry: countryPartition?.requirePutawayQuantityEntry ?? (isCountryActive ? settings.requirePutawayQuantityEntry : undefined) ?? true,
                overReceiveTolerancePct: countryPartition?.overReceiveTolerancePct ?? (isCountryActive ? settings.overReceiveTolerancePct : undefined) ?? 0,
                poPriceApplyAt: countryPartition?.poPriceApplyAt || (isCountryActive ? settings.poPriceApplyAt : undefined) || 'putaway',
                printPriceTagAt: countryPartition?.printPriceTagAt || (isCountryActive ? settings.printPriceTagAt : undefined) || 'store'
            });

            setHealth({
                rotationPolicy: countryPartition?.rotationPolicy === 'fifo' ? 'fifo' : 'fefo',
                requireExpiry: countryPartition?.requireExpiry ?? (isCountryActive ? settings.requireExpiry : undefined) ?? true,
                cycleCountStrategy: countryPartition?.cycleCountStrategy || (isCountryActive ? settings.cycleCountStrategy : undefined) || 'abc',
                maxCycleCountRecounts: countryPartition?.maxCycleCountRecounts ?? (isCountryActive ? settings.maxCycleCountRecounts : undefined) ?? 1,
                requireSecondCounterOnVariance: countryPartition?.requireSecondCounterOnVariance ?? (isCountryActive ? settings.requireSecondCounterOnVariance : undefined) ?? true
            });

            setOutbound({
                pickingMethod: countryPartition?.pickingMethod || (isCountryActive ? settings.pickingMethod : undefined) || 'order',
                strictScanning: countryPartition?.strictScanning ?? (isCountryActive ? settings.strictScanning : undefined) ?? true,
                bayScan: countryPartition?.bayScan ?? (isCountryActive ? settings.bayScan : undefined) ?? true,
                requirePickQuantityEntry: countryPartition?.requirePickQuantityEntry ?? (isCountryActive ? settings.requirePickQuantityEntry : undefined) ?? true,
                requirePackSecuritySeal: countryPartition?.requirePackSecuritySeal ?? (isCountryActive ? settings.requirePackSecuritySeal : undefined) ?? true,
                requirePackCartonWeight: countryPartition?.requirePackCartonWeight ?? (isCountryActive ? settings.requirePackCartonWeight : undefined) ?? false,
                packWeightTolerancePct: countryPartition?.packWeightTolerancePct ?? (isCountryActive ? settings.packWeightTolerancePct : undefined) ?? 5
            });
        }
    }, [activeCountry, settings]);

    const handleSaveSection = (section: 'inbound' | 'health' | 'outbound') => {
        if (!canConfigureWMS) {
            showToast('Permission denied: Warehouse Manager or HQ Operations credentials required.', 'error');
            return;
        }

        const data = section === 'inbound' ? inbound
            : section === 'health' ? health
            : outbound;

        wmsSettingsMutation.mutate({
            section,
            targetCountry: activeCountry,
            data: { ...data, country: activeCountry }
        });
    };

    const fulfillmentSites = useMemo(() =>
        sites.filter(s => s.type === 'Warehouse' || s.type === 'Store' || s.type === 'Distribution Center' || s.type === 'Dark Store'),
        [sites]
    );

    const pendingOrders = useMemo(() =>
        allSales.filter(s => s.release_status === 'PENDING'),
        [allSales]
    );

    const activeProfile = getCountryProfile(activeCountry);
    const cardBase = "bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 lg:p-8 shadow-xs";

    return (
        <React.Fragment>
        {/* ── ROLE GATE — L3/L4 staff cannot access WMS configuration ── */}
        {!canConfigureWMS && (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center">
                    <Lock size={22} className="text-[var(--theme-text-secondary)]" />
                </div>
                <h3 className="font-semibold text-[var(--theme-text-primary)] text-sm">Access Restricted</h3>
                <p className="text-xs text-[var(--theme-text-secondary)] max-w-xs leading-relaxed">
                    WMS Engine policy configuration requires Central Operations or Warehouse Manager access.
                    Local store managers cannot alter enterprise fulfillment rules.
                </p>
            </div>
        )}

        <div className={`w-full max-w-full space-y-6 ${canConfigureWMS ? 'block' : 'hidden'}`}>
            {/* Tab Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] mb-6">
                {[
                    { id: 'rules' as const, label: 'Fulfillment Rules', icon: Package },
                    { id: 'pick-control' as const, label: 'Pick Control Hub', icon: Scan },
                    { id: 'smart-routing' as const, label: 'Smart Routing', icon: MapPin },
                ].map(tab => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`min-h-[38px] flex-1 px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${active
                                ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs'
                                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)]/50'
                                }`}
                        >
                            <Icon size={15} /> {tab.label}
                        </button>
                    );
                })}
            </div>

            {activeTab === 'rules' && (
                <div className="space-y-6">
                    <div className="p-4 bg-[#0071E3]/10 dark:bg-[#2997FF]/15 border border-[#0071E3]/20 dark:border-[#2997FF]/30 rounded-2xl flex items-start gap-3">
                        <Shield className="text-[#0071E3] dark:text-[#2997FF] shrink-0 mt-0.5" size={20} />
                        <div>
                            <h4 className="text-[var(--theme-text-primary)] font-semibold text-sm">Enterprise WMS Engine</h4>
                            <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5 leading-relaxed">
                                Configure the base rules for receiving inspection, FEFO/FIFO rotation, and pick scanning verification for {activeProfile.name}.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* INBOUND STRATEGY */}
                        <div className={cardBase}>
                            <SectionHeader title="Inbound Strategy" desc="Receiving, QC, and Putaway" />
                            <div className="space-y-6">
                                <RadioGroup<'blind' | 'verified'>
                                    label="Receiving Verification"
                                    icon={ClipboardCheck}
                                    options={[
                                        { value: 'blind', label: 'Blind Count Receive', desc: 'Staff count all items — expected qty hidden until submission' },
                                        { value: 'verified', label: 'Verified Receive', desc: 'Scan every item against PO (expected qty visible)' },
                                    ]}
                                    value={inbound.receivingLogic}
                                    onChange={(val) => setInbound(prev => ({ ...prev, receivingLogic: val }))}
                                />
                                {inbound.receivingLogic === 'verified' && (
                                    <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                                        <AlertTriangle size={14} className="shrink-0" />
                                        <span>Verified Receive exposes expected quantities to staff. Zero-trust blind receiving is recommended.</span>
                                    </div>
                                )}
                                <div className="p-4 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] space-y-4">
                                    <SliderGroup
                                        label="QC Sampling Rate"
                                        icon={Search}
                                        min={0} max={100} step={5} unit="%"
                                        value={inbound.qcSamplingRate}
                                        onChange={(val: number) => setInbound(prev => ({ ...prev, qcSamplingRate: val }))}
                                    />
                                    <SliderGroup
                                        label="Over-Receive Tolerance"
                                        icon={Percent}
                                        min={0} max={20} step={1} unit="%"
                                        value={inbound.overReceiveTolerancePct}
                                        onChange={(val: number) => setInbound(prev => ({ ...prev, overReceiveTolerancePct: val }))}
                                    />
                                    <ToggleRow
                                        label="Block on QC Failure"
                                        sub="Quarantines lot and raises HQ approval request — branch cannot unilaterally reject"
                                        checked={inbound.qcBlockOnFailure}
                                        onChange={() => setInbound(prev => ({ ...prev, qcBlockOnFailure: !prev.qcBlockOnFailure }))}
                                    />
                                </div>
                                <RadioGroup<'putaway' | 'receive'>
                                    label="PO Retail Price Activation"
                                    icon={DollarSign}
                                    options={[
                                        { value: 'putaway', label: 'At Putaway (Recommended)', desc: 'Live price updates only when goods are shelved' },
                                        { value: 'receive', label: 'At Receive Dock', desc: 'Overrides live shelf price immediately upon unloading' },
                                    ]}
                                    value={inbound.poPriceApplyAt}
                                    onChange={(val) => setInbound(prev => ({ ...prev, poPriceApplyAt: val }))}
                                />
                                <RadioGroup<'store' | 'putaway' | 'receive'>
                                    label="Price Tag Printing Location"
                                    icon={Tag}
                                    options={[
                                        { value: 'store', label: 'POS Command / Store Floor (Recommended)', desc: 'Print shelf price tags at retail display to guarantee scanner parity' },
                                        { value: 'putaway', label: 'At Putaway', desc: 'Print tags when moving goods into storage bays' },
                                        { value: 'receive', label: 'At Receive Dock', desc: 'Print price tags at receiving dock (caution: risks price divergence)' },
                                    ]}
                                    value={inbound.printPriceTagAt}
                                    onChange={(val) => setInbound(prev => ({ ...prev, printPriceTagAt: val }))}
                                />
                                <RadioGroup<'manual' | 'system'>
                                    label="Putaway Logic"
                                    icon={ArrowRight}
                                    options={[
                                        { value: 'manual', label: 'User Directed', desc: 'Operator chooses bay' },
                                        { value: 'system', label: 'System Directed', desc: 'Algorithm optimizes path' },
                                    ]}
                                    value={inbound.putawayLogic}
                                    onChange={(val) => setInbound(prev => ({ ...prev, putawayLogic: val }))}
                                />
                                <ToggleRow
                                    label="Require Explicit Putaway Quantity Entry"
                                    sub="Forces operator to verify and enter physical quantity shelved into bay (blocks single-scan full crediting)"
                                    checked={inbound.requirePutawayQuantityEntry}
                                    onChange={() => setInbound(prev => ({ ...prev, requirePutawayQuantityEntry: !prev.requirePutawayQuantityEntry }))}
                                />
                                <div className="pt-4 border-t border-[var(--theme-border)] flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => handleSaveSection('inbound')}
                                        disabled={isSaving === 'inbound' || !canConfigureWMS}
                                        className="h-10 px-5 bg-[#0071E3] dark:bg-[#2997FF] hover:opacity-90 active:scale-[0.98] text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-all disabled:opacity-40"
                                    >
                                        {isSaving === 'inbound' ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                                        Save Inbound
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* HEALTH */}
                            <div className={cardBase}>
                                <SectionHeader title="Inventory Health" desc="Rotation and Counting Policies" />
                                <div className="space-y-6">
                                    <RadioGroup<'fefo' | 'fifo'>
                                        label="Rotation Policy"
                                        icon={RotateCw}
                                        options={[
                                            { value: 'fefo', label: 'FEFO', desc: 'First Expiry First Out — mandatory for perishables' },
                                            { value: 'fifo', label: 'FIFO', desc: 'First In First Out — dry/non-dated goods only' },
                                        ]}
                                        value={health.rotationPolicy}
                                        onChange={(val) => setHealth(prev => ({ ...prev, rotationPolicy: val }))}
                                    />
                                    <ToggleRow
                                        label="Mandatory Expiry"
                                        sub="Require expiry entry for perishables"
                                        checked={health.requireExpiry}
                                        onChange={() => setHealth(prev => ({ ...prev, requireExpiry: !prev.requireExpiry }))}
                                    />
                                    <RadioGroup<'abc' | 'random'>
                                        label="Cycle Count Strategy"
                                        icon={RotateCw}
                                        options={[
                                            { value: 'abc', label: 'ABC Analysis', desc: 'Count High-Value often' },
                                            { value: 'random', label: 'Random Sample', desc: 'Daily random bays' },
                                        ]}
                                        value={health.cycleCountStrategy}
                                        onChange={(val) => setHealth(prev => ({ ...prev, cycleCountStrategy: val }))}
                                    />
                                    <ToggleRow
                                        label="Require Second Counter on Variance"
                                        sub="Recounts on count discrepancy items require dual sign-off (4-Eyes principle)"
                                        checked={health.requireSecondCounterOnVariance}
                                        onChange={() => setHealth(prev => ({ ...prev, requireSecondCounterOnVariance: !prev.requireSecondCounterOnVariance }))}
                                    />
                                    <div className="pt-4 border-t border-[var(--theme-border)] flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => handleSaveSection('health')}
                                            disabled={isSaving === 'health' || !canConfigureWMS}
                                            className="h-10 px-5 bg-[#0071E3] dark:bg-[#2997FF] hover:opacity-90 active:scale-[0.98] text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-all disabled:opacity-40"
                                        >
                                            {isSaving === 'health' ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                                            Save Health
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* OUTBOUND */}
                            <div className={cardBase}>
                                <SectionHeader title="Outbound Efficiency" desc="Picking and Compliance" />
                                <div className="space-y-6">
                                    <RadioGroup<'order' | 'wave' | 'zone'>
                                        label="Picking Method"
                                        icon={Package}
                                        options={[
                                            { value: 'order', label: 'Discrete Order', desc: 'One order at a time' },
                                            { value: 'wave', label: 'Wave Picking', desc: 'Batch multiple orders' },
                                            { value: 'zone', label: 'Zone Picking', desc: 'Pick by warehouse zone' },
                                        ]}
                                        value={outbound.pickingMethod}
                                        onChange={(val) => setOutbound(prev => ({ ...prev, pickingMethod: val }))}
                                    />
                                    <div className="p-4 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] space-y-3">
                                        <ToggleRow
                                            label="Strict Barcode Validation"
                                            checked={outbound.strictScanning}
                                            disabled={!isHQAdmin}
                                            onChange={() => {
                                                if (!isHQAdmin) {
                                                    showToast('Only HQ Executive Admins may toggle strict barcode scanning safeguards.', 'warning');
                                                    return;
                                                }
                                                setOutbound(prev => ({ ...prev, strictScanning: !prev.strictScanning }));
                                            }}
                                            warning={!isHQAdmin ? 'HQ Executive Admin required to toggle barcode scanning' : undefined}
                                        />
                                        {!outbound.strictScanning && (
                                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-[11px] font-medium p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
                                                <AlertTriangle size={14} className="shrink-0" />
                                                <span>Barcode validation disabled — scan fraud risk elevated. HQ audit active.</span>
                                            </div>
                                        )}
                                        <ToggleRow
                                            label="Bay Verification"
                                            checked={outbound.bayScan}
                                            disabled={!isHQAdmin}
                                            onChange={() => {
                                                if (!isHQAdmin) {
                                                    showToast('Only HQ Executive Admins may toggle bay verification safeguards.', 'warning');
                                                    return;
                                                }
                                                setOutbound(prev => ({ ...prev, bayScan: !prev.bayScan }));
                                            }}
                                            warning={!isHQAdmin ? 'HQ Admin required to disable' : 'Disabling increases pick errors and audit exposure'}
                                        />
                                        <ToggleRow
                                            label="Require Explicit Pick Quantity Entry"
                                            sub="Forces picker to count and enter verified physical units picked (prevents auto-crediting entire order on single scan)"
                                            checked={outbound.requirePickQuantityEntry}
                                            onChange={() => setOutbound(prev => ({ ...prev, requirePickQuantityEntry: !prev.requirePickQuantityEntry }))}
                                        />
                                        <ToggleRow
                                            label="Require Tamper Security Seal"
                                            sub="Requires serial number scan/entry for tamper-evident security seal before box closure"
                                            checked={outbound.requirePackSecuritySeal}
                                            onChange={() => setOutbound(prev => ({ ...prev, requirePackSecuritySeal: !prev.requirePackSecuritySeal }))}
                                        />
                                        <ToggleRow
                                            label="Require Scale Carton Weight Check"
                                            sub="Enforces physical scale weighing against computed SKU weights prior to shipping"
                                            checked={outbound.requirePackCartonWeight}
                                            onChange={() => setOutbound(prev => ({ ...prev, requirePackCartonWeight: !prev.requirePackCartonWeight }))}
                                        />
                                    </div>
                                    <div className="pt-4 border-t border-[var(--theme-border)] flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => handleSaveSection('outbound')}
                                            disabled={isSaving === 'outbound' || !canConfigureWMS}
                                            className="h-10 px-5 bg-[#0071E3] dark:bg-[#2997FF] hover:opacity-90 active:scale-[0.98] text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-all disabled:opacity-40"
                                        >
                                            {isSaving === 'outbound' ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                                            Save Outbound
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'smart-routing' && (
                <div className="space-y-6">
                    <SmartRoutingConfig siteId={fulfillmentSites[0]?.id || ''} />
                </div>
            )}

            {activeTab === 'pick-control' && (
                <WMSPickControlTab
                    fulfillmentSites={fulfillmentSites}
                    pendingOrders={pendingOrders}
                    onReleaseOrder={releaseOrder}
                    refreshData={refreshData}
                />
            )}
        </div>
        </React.Fragment>
    );
}
