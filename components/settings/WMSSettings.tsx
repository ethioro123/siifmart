import React, { useState, useEffect, useMemo } from 'react';
import {
    Shield, Package, RotateCw, AlertTriangle, Scan, Search,
    ClipboardCheck, ArrowRight, Save, MapPin
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { logger } from '../../utils/logger';
import { SectionHeader, RadioGroup, SliderGroup, ToggleRow } from './components/SettingFormControls';
import SmartRoutingConfig from './components/SmartRoutingConfig';
import { WMSPickControlTab } from './components/WMSPickControlTab';

export default function WMSSettings() {
    const { user, showToast } = useStore();
    const {
        settings, updateSettings,
        sites, allSales, releaseOrder, refreshData
    } = useData();

    const [activeTab, setActiveTab] = useState<'rules' | 'pick-control' | 'smart-routing'>('rules');

    // --- GENERAL RULES STATE ---
    const [inbound, setInbound] = useState({
        receivingLogic: 'verified',
        qcSamplingRate: 10,
        qcBlockOnFailure: true,
        putawayLogic: 'system'
    });

    const [health, setHealth] = useState({
        rotationPolicy: 'fifo',
        requireExpiry: true,
        cycleCountStrategy: 'abc'
    });

    const [outbound, setOutbound] = useState({
        pickingMethod: 'order',
        strictScanning: true,
        bayScan: true
    });

    const [isSaving, setIsSaving] = useState<string | null>(null);

    // Sync from settings
    useEffect(() => {
        if (settings) {
            setInbound({
                receivingLogic: settings.receivingLogic || 'verified',
                qcSamplingRate: settings.qcSamplingRate || 10,
                qcBlockOnFailure: settings.qcBlockOnFailure ?? true,
                putawayLogic: settings.putawayLogic || 'system'
            });
            setHealth({
                rotationPolicy: settings.rotationPolicy || 'fifo',
                requireExpiry: settings.requireExpiry ?? true,
                cycleCountStrategy: settings.cycleCountStrategy || 'abc'
            });
            setOutbound({
                pickingMethod: settings.pickingMethod || 'order',
                strictScanning: settings.strictScanning ?? true,
                bayScan: settings.bayScan ?? true
            });
        }
    }, [settings]);

    const handleSaveSection = async (section: 'inbound' | 'health' | 'outbound') => {
        const data =
            section === 'inbound' ? inbound :
                section === 'health' ? health :
                    outbound;
        setIsSaving(section);
        try {
            await updateSettings(data as any, user?.name || 'Admin');
            showToast(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved`, 'success');
        } catch (err) {
            logger.error('WMSSettings', 'caught error', err as Error);
            showToast(`Failed to save ${section} settings`, 'error');
        } finally {
            setIsSaving(null);
        }
    };

    const fulfillmentSites = useMemo(() =>
        sites.filter(s => s.type === 'Warehouse' || s.type === 'Store' || s.type === 'Distribution Center' || s.type === 'Dark Store'),
        [sites]
    );

    const pendingOrders = useMemo(() =>
        allSales.filter(s => s.release_status === 'PENDING'),
        [allSales]
    );

    const cardBase = "bg-white/85 dark:bg-[#18201B]/60 lg:backdrop-blur-2xl border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[32px] p-6 lg:p-8 shadow-[0_4px_24px_-4px_rgba(34,50,38,0.04)] dark:shadow-[0_8px_32px_-4px_rgba(5,8,6,0.5)]";

    return (
        <div className="w-full max-w-full space-y-6 animate-in fade-in slide-in-from-right-4">

            {/* Tab Switcher */}
            <div className="flex items-center gap-2 p-1.5 bg-[#FAF8F5] dark:bg-black/40 rounded-2xl border border-[#E2DCCE] dark:border-white/10 mb-6">
                {[
                    { id: 'rules', label: 'Fulfillment Rules', icon: Package },
                    { id: 'pick-control', label: 'Pick Control Hub', icon: Scan },
                    { id: 'smart-routing', label: 'Smart Routing', icon: MapPin },
                ].map(tab => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${active
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
                                Configure the base rules for receiving inspection, FEFO/FIFO rotation, and pick scanning verification.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* INBOUND STRATEGY */}
                        <div className={cardBase}>
                            <SectionHeader title="Inbound Strategy" desc="Receiving, QC, and Putaway" />
                            <div className="space-y-6">
                                <RadioGroup
                                    label="Receiving Verification"
                                    icon={ClipboardCheck}
                                    options={[
                                        { value: 'blind', label: 'Blind Receive', desc: 'Accept manifest without count' },
                                        { value: 'verified', label: 'Verified Receive', desc: 'Scan every item against PO' },
                                    ]}
                                    value={inbound.receivingLogic}
                                    onChange={(val: 'blind' | 'verified') => setInbound(prev => ({ ...prev, receivingLogic: val }))}
                                />
                                <div className="p-4 bg-[#FAF8F5] dark:bg-black/20 rounded-2xl border border-[#E2DCCE] dark:border-white/5 space-y-4">
                                    <SliderGroup
                                        label="QC Sampling Rate"
                                        icon={Search}
                                        min={0} max={100} step={5} unit="%"
                                        value={inbound.qcSamplingRate}
                                        onChange={(val: number) => setInbound(prev => ({ ...prev, qcSamplingRate: val }))}
                                    />
                                    <ToggleRow
                                        label="Block on Failure"
                                        sub="Reject entire lot if sample fails QC"
                                        checked={inbound.qcBlockOnFailure}
                                        onChange={() => setInbound(prev => ({ ...prev, qcBlockOnFailure: !prev.qcBlockOnFailure }))}
                                    />
                                </div>
                                <RadioGroup
                                    label="Putaway Logic"
                                    icon={ArrowRight}
                                    options={[
                                        { value: 'manual', label: 'User Directed', desc: 'Operator chooses bay' },
                                        { value: 'system', label: 'System Directed', desc: 'Algorithm optimizes path' },
                                    ]}
                                    value={inbound.putawayLogic}
                                    onChange={(val: 'manual' | 'system') => setInbound(prev => ({ ...prev, putawayLogic: val }))}
                                />
                                <div className="pt-4 border-t border-[#E2DCCE]/60 dark:border-white/10 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => handleSaveSection('inbound')}
                                        disabled={isSaving === 'inbound'}
                                        className="px-6 py-2.5 bg-[#2C5E3B] hover:opacity-90 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-50"
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
                                    <RadioGroup
                                        label="Rotation Policy"
                                        icon={RotateCw}
                                        options={[
                                            { value: 'fifo', label: 'FIFO', desc: 'First In First Out' },
                                            { value: 'fefo', label: 'FEFO', desc: 'First Expiry First Out' },
                                            { value: 'lifo', label: 'LIFO', desc: 'Last In First Out' },
                                        ]}
                                        value={health.rotationPolicy}
                                        onChange={(val: 'fifo' | 'fefo' | 'lifo') => setHealth(prev => ({ ...prev, rotationPolicy: val }))}
                                    />
                                    <ToggleRow
                                        label="Mandatory Expiry"
                                        sub="Require expiry entry for perishables"
                                        checked={health.requireExpiry}
                                        onChange={() => setHealth(prev => ({ ...prev, requireExpiry: !prev.requireExpiry }))}
                                    />
                                    <RadioGroup
                                        label="Cycle Count Strategy"
                                        icon={RotateCw}
                                        options={[
                                            { value: 'abc', label: 'ABC Analysis', desc: 'Count High-Value often' },
                                            { value: 'random', label: 'Random Sample', desc: 'Daily random bays' },
                                        ]}
                                        value={health.cycleCountStrategy}
                                        onChange={(val: 'abc' | 'random') => setHealth(prev => ({ ...prev, cycleCountStrategy: val }))}
                                    />
                                    <div className="pt-4 border-t border-[#E2DCCE]/60 dark:border-white/10 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => handleSaveSection('health')}
                                            disabled={isSaving === 'health'}
                                            className="px-6 py-2.5 bg-[#2C5E3B] hover:opacity-90 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-50"
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
                                    <RadioGroup
                                        label="Picking Method"
                                        icon={Package}
                                        options={[
                                            { value: 'order', label: 'Discrete Order', desc: 'One order at a time' },
                                            { value: 'wave', label: 'Wave Picking', desc: 'Batch multiple orders' },
                                            { value: 'zone', label: 'Zone Picking', desc: 'Pick by warehouse zone' },
                                        ]}
                                        value={outbound.pickingMethod}
                                        onChange={(val: 'order' | 'wave' | 'zone') => setOutbound(prev => ({ ...prev, pickingMethod: val }))}
                                    />
                                    <div className="p-4 bg-[#FAF8F5] dark:bg-black/20 rounded-2xl border border-[#E2DCCE] dark:border-white/5 space-y-3">
                                        <ToggleRow
                                            label="Strict Barcode Validation"
                                            checked={outbound.strictScanning}
                                            onChange={() => setOutbound(prev => ({ ...prev, strictScanning: !prev.strictScanning }))}
                                        />
                                        <ToggleRow
                                            label="Bay Verification"
                                            checked={outbound.bayScan}
                                            onChange={() => setOutbound(prev => ({ ...prev, bayScan: !prev.bayScan }))}
                                            warning="Disabling increases errors"
                                        />
                                    </div>
                                    <div className="pt-4 border-t border-[#E2DCCE]/60 dark:border-white/10 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => handleSaveSection('outbound')}
                                            disabled={isSaving === 'outbound'}
                                            className="px-6 py-2.5 bg-[#2C5E3B] hover:opacity-90 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-50"
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
    );
}
