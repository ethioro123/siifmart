import React, { useState, useEffect, useMemo } from 'react';
import {
    Shield, Package, RotateCw, AlertTriangle, Scan, Search,
    ClipboardCheck, ArrowRight, Save, MapPin, Lock, Globe
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
        'super_admin', 'CEO',
        'operations_manager', 'warehouse_manager',
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
        putawayLogic: 'system' as 'manual' | 'system'
    });

    const [health, setHealth] = useState({
        rotationPolicy: 'fefo' as 'fefo' | 'fifo',
        requireExpiry: true,
        cycleCountStrategy: 'abc' as 'abc' | 'random'
    });

    const [outbound, setOutbound] = useState({
        pickingMethod: 'order' as 'order' | 'wave' | 'zone',
        strictScanning: true,
        bayScan: true
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
                receivingLogic: countryPartition?.receivingLogic || (isCountryActive ? settings.receivingLogic : undefined) || 'verified',
                qcSamplingRate: countryPartition?.qcSamplingRate ?? (isCountryActive ? settings.qcSamplingRate : undefined) ?? 10,
                qcBlockOnFailure: countryPartition?.qcBlockOnFailure ?? (isCountryActive ? settings.qcBlockOnFailure : undefined) ?? true,
                putawayLogic: countryPartition?.putawayLogic || (isCountryActive ? settings.putawayLogic : undefined) || 'system'
            });

            setHealth({
                rotationPolicy: countryPartition?.rotationPolicy === 'fifo' ? 'fifo' : 'fefo',
                requireExpiry: countryPartition?.requireExpiry ?? (isCountryActive ? settings.requireExpiry : undefined) ?? true,
                cycleCountStrategy: countryPartition?.cycleCountStrategy || (isCountryActive ? settings.cycleCountStrategy : undefined) || 'abc'
            });

            setOutbound({
                pickingMethod: countryPartition?.pickingMethod || (isCountryActive ? settings.pickingMethod : undefined) || 'order',
                strictScanning: countryPartition?.strictScanning ?? (isCountryActive ? settings.strictScanning : undefined) ?? true,
                bayScan: countryPartition?.bayScan ?? (isCountryActive ? settings.bayScan : undefined) ?? true
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
    const cardBase = "bg-white/85 dark:bg-[#18201B]/60 lg:backdrop-blur-2xl border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[32px] p-6 lg:p-8 shadow-[0_4px_24px_-4px_rgba(34,50,38,0.04)] dark:shadow-[0_8px_32px_-4px_rgba(5,8,6,0.5)]";

    return (
        <React.Fragment>
        {/* ── ROLE GATE — L3/L4 staff cannot access WMS configuration ── */}
        {!canConfigureWMS && (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <Lock size={40} className="text-stone-400 dark:text-gray-600" />
                <h3 className="font-bold text-stone-600 dark:text-gray-300">Access Restricted</h3>
                <p className="text-xs text-stone-500 dark:text-gray-500 max-w-xs">
                    WMS Engine policy configuration requires Central Operations or Warehouse Manager access.
                    Local store managers cannot alter enterprise fulfillment rules.
                </p>
            </div>
        )}

        <div className={`w-full max-w-full space-y-6 ${canConfigureWMS ? 'block' : 'hidden'}`}>
            {/* Tab Switcher */}
            <div className="flex items-center gap-2 p-1.5 bg-[#FAF8F5] dark:bg-black/40 rounded-2xl border border-[#E2DCCE] dark:border-white/10 mb-6">
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
                            className={`min-h-[44px] flex-1 px-4 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer ${active
                                ? 'bg-[#2C5E3B] text-white shadow-md'
                                : 'text-stone-500 dark:text-gray-400 hover:text-[#1E3F27] dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
                                }`}
                        >
                            <Icon size={16} /> {tab.label}
                        </button>
                    );
                })}
            </div>

            {activeTab === 'rules' && (
                <div className="space-y-6">
                    <div className="p-4 bg-emerald-50 dark:bg-[#2C5E3B]/20 border border-emerald-200 dark:border-emerald-950/30 rounded-2xl flex items-start gap-3">
                        <Shield className="text-[#2C5E3B] dark:text-[#A9CBA2] shrink-0 mt-0.5" size={20} />
                        <div>
                            <h4 className="text-[#1E3F27] dark:text-white font-bold text-sm">Enterprise WMS Engine</h4>
                            <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83] mt-0.5 leading-relaxed">
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
                                    <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-700 dark:text-amber-300">
                                        <AlertTriangle size={14} className="shrink-0" />
                                        <span>Verified Receive exposes expected quantities to staff. Zero-trust blind receiving is recommended.</span>
                                    </div>
                                )}
                                <div className="p-4 bg-[#FAF8F5] dark:bg-black/20 rounded-2xl border border-[#E2DCCE] dark:border-white/5 space-y-4">
                                    <SliderGroup
                                        label="QC Sampling Rate"
                                        icon={Search}
                                        min={0} max={100} step={5} unit="%"
                                        value={inbound.qcSamplingRate}
                                        onChange={(val: number) => setInbound(prev => ({ ...prev, qcSamplingRate: val }))}
                                    />
                                    <ToggleRow
                                        label="Block on QC Failure"
                                        sub="Quarantines lot and raises HQ approval request — branch cannot unilaterally reject"
                                        checked={inbound.qcBlockOnFailure}
                                        onChange={() => setInbound(prev => ({ ...prev, qcBlockOnFailure: !prev.qcBlockOnFailure }))}
                                    />
                                </div>
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
                                <div className="pt-4 border-t border-[#E2DCCE]/60 dark:border-white/10 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => handleSaveSection('inbound')}
                                        disabled={isSaving === 'inbound' || !canConfigureWMS}
                                        className="px-6 min-h-[44px] bg-[#2C5E3B] hover:opacity-90 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-opacity disabled:opacity-50"
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
                                    <div className="pt-4 border-t border-[#E2DCCE]/60 dark:border-white/10 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => handleSaveSection('health')}
                                            disabled={isSaving === 'health' || !canConfigureWMS}
                                            className="px-6 min-h-[44px] bg-[#2C5E3B] hover:opacity-90 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-opacity disabled:opacity-50"
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
                                    <div className="p-4 bg-[#FAF8F5] dark:bg-black/20 rounded-2xl border border-[#E2DCCE] dark:border-white/5 space-y-3">
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
                                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-[10px] font-semibold p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
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
                                    </div>
                                    <div className="pt-4 border-t border-[#E2DCCE]/60 dark:border-white/10 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => handleSaveSection('outbound')}
                                            disabled={isSaving === 'outbound' || !canConfigureWMS}
                                            className="px-6 min-h-[44px] bg-[#2C5E3B] hover:opacity-90 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-opacity disabled:opacity-50"
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
