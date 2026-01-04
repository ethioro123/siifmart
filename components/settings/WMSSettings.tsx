import React, { useState, useEffect, useMemo } from 'react';
import {
    Shield, Truck, Package, RotateCw, AlertTriangle, Scan, Search,
    Barcode, ClipboardCheck, ArrowRight, Layers, Save, Globe, Clock,
    Play, CheckCircle, MapPin
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import Button from '../shared/Button';
import { FulfillmentStrategy } from '../../types';
import { sitesService, warehouseZonesService } from '../../services/supabase.service';
import { formatDateTime } from '../../utils/formatting';

// --- SUB-COMPONENTS ---
const SectionHeader = ({ title, desc }: { title: string, desc: string }) => (
    <div className="mb-6 pb-4 border-b border-white/5">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-sm text-gray-400 mt-1">{desc}</p>
    </div>
);

const RadioGroup = ({ label, options, value, onChange, icon: Icon }: any) => (
    <div className="space-y-3">
        {label && (
            <label className="text-xs text-gray-400 font-bold uppercase tracking-wide flex items-center gap-2">
                {Icon && <Icon size={14} />} {label}
            </label>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {options.map((opt: any) => (
                <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange(opt.value)}
                    className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${value === opt.value
                        ? 'bg-cyber-primary/10 border-cyber-primary text-white'
                        : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/30 hover:bg-white/5'
                        }`}
                >
                    <div className="relative z-10 flex flex-col h-full justify-between gap-2">
                        <span className={`text-sm font-bold ${value === opt.value ? 'text-cyber-primary' : 'text-gray-300'}`}>
                            {opt.label}
                        </span>
                        {opt.desc && <span className="text-[10px] opacity-70 leading-tight">{opt.desc}</span>}
                    </div>
                    {value === opt.value && (
                        <div className="absolute top-0 right-0 p-1.5">
                            <div className="w-2 h-2 rounded-full bg-cyber-primary shadow-[0_0_8px_rgba(0,255,157,0.5)]" />
                        </div>
                    )}
                </button>
            ))}
        </div>
    </div>
);

const SliderGroup = ({ label, value, onChange, min, max, step, unit, icon: Icon, sub }: any) => (
    <div className="group">
        <div className="flex justify-between items-end mb-2">
            <label className="text-xs text-gray-400 font-bold uppercase tracking-wide group-hover:text-cyber-primary transition-colors flex items-center gap-2">
                {Icon && <Icon size={14} />} {label}
            </label>
            <span className="text-sm font-mono font-bold text-cyber-primary bg-cyber-primary/10 px-2 py-0.5 rounded">
                {value}{unit}
            </span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            title={label}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full accent-cyber-primary h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer"
        />
        {sub && <p className="text-[10px] text-gray-500 mt-1.5">{sub}</p>}
    </div>
);

const ToggleRow = ({ label, sub, checked, onChange, warning }: any) => (
    <div className="flex items-start justify-between p-3 bg-black/20 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
        <div className="space-y-1">
            <p className="text-sm font-bold text-gray-200">{label}</p>
            <p className="text-[10px] text-gray-500">{sub}</p>
            {warning && checked && (
                <p className="text-[10px] text-yellow-500 flex items-center gap-1 mt-1">
                    <AlertTriangle size={10} /> {warning}
                </p>
            )}
        </div>
        <div
            onClick={onChange}
            className={`w-11 h-6 rounded-full p-1 cursor-pointer transition-colors relative ${checked ? 'bg-cyber-primary' : 'bg-white/10'
                }`}
        >
            <div className={`w-4 h-4 bg-black rounded-full shadow-md transition-transform transform ${checked ? 'translate-x-5' : 'translate-x-0'
                }`} />
        </div>
    </div>
);

export default function WMSSettings() {
    const { user } = useStore();
    const {
        settings, updateSettings, addNotification,
        sites, allZones, allSales, releaseOrder, refreshData
    } = useData();

    const [activeTab, setActiveTab] = useState<'rules' | 'pick-control'>('rules');
    const [activePickSubTab, setActivePickSubTab] = useState<'strategies' | 'zones' | 'release'>('strategies');

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
        binScan: true
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
                binScan: settings.binScan ?? true
            });
        }
    }, [settings]);

    const handleSaveSection = async (section: 'inbound' | 'health' | 'outbound') => {
        const data = section === 'inbound' ? inbound : section === 'health' ? health : outbound;
        setIsSaving(section);
        try {
            await updateSettings(data as any, user?.name || 'Admin');
            addNotification('success', `${section.charAt(0).toUpperCase() + section.slice(1)} wms settings saved`);
        } catch (err) {
            console.error(err);
            addNotification('alert', `Failed to save ${section} settings`);
        } finally {
            setIsSaving(null);
        }
    };

    // --- PICK CONTROL LOGIC ---
    const fulfillmentSites = useMemo(() =>
        sites.filter(s => s.type === 'Warehouse' || s.type === 'Store' || s.type === 'Distribution Center' || s.type === 'Dark Store'),
        [sites]
    );

    const handleStrategyChange = async (siteId: string, strategy: FulfillmentStrategy) => {
        setIsSaving(siteId);
        try {
            await sitesService.update(siteId, { fulfillmentStrategy: strategy });
            addNotification('success', 'Fulfillment strategy updated');
            refreshData();
        } catch (error) {
            console.error(error);
            addNotification('alert', 'Failed to update strategy');
        } finally {
            setIsSaving(null);
        }
    };

    const handleToggleFulfillmentNode = async (siteId: string, isNode: boolean) => {
        setIsSaving(siteId);
        try {
            await sitesService.update(siteId, { isFulfillmentNode: isNode });
            addNotification('success', 'Fulfillment node status updated');
            refreshData();
        } catch (error) {
            console.error(error);
            addNotification('alert', 'Failed to update node status');
        } finally {
            setIsSaving(null);
        }
    };

    const [selectedSiteId, setSelectedSiteId] = useState<string>(fulfillmentSites[0]?.id || '');
    const siteZones = useMemo(() =>
        allZones.filter(z => z.siteId === selectedSiteId),
        [allZones, selectedSiteId]
    );

    const handlePriorityChange = async (zoneId: string, priority: number) => {
        setIsSaving(zoneId);
        try {
            await warehouseZonesService.update(zoneId, { pickingPriority: priority });
            addNotification('success', 'Zone priority updated');
            refreshData();
        } catch (error) {
            console.error(error);
            addNotification('alert', 'Failed to update zone priority');
        } finally {
            setIsSaving(null);
        }
    };

    const pendingOrders = useMemo(() =>
        allSales.filter(s => s.release_status === 'PENDING'),
        [allSales]
    );

    const handleReleaseOrder = async (saleId: string) => {
        setIsSaving(saleId);
        try {
            await releaseOrder(saleId);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(null);
        }
    };

    return (
        <div className="w-full max-w-full space-y-6 animate-in fade-in slide-in-from-right-4">

            {/* Tab Switcher */}
            <div className="flex items-center gap-2 p-1 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 mb-6">
                <button
                    onClick={() => setActiveTab('rules')}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${activeTab === 'rules' ? 'bg-cyber-primary text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <Package size={16} /> Fulfillment Rules
                </button>
                <button
                    onClick={() => setActiveTab('pick-control')}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${activeTab === 'pick-control' ? 'bg-cyber-primary text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <Scan size={16} /> Pick Control Hub
                </button>
            </div>

            {activeTab === 'rules' && (
                <div className="space-y-6">
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3">
                        <Shield className="text-blue-400 shrink-0 mt-0.5" size={20} />
                        <div>
                            <h4 className="text-blue-400 font-bold text-sm">Enterprise WMS Engine</h4>
                            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                Configure the base logic for inbound and inventory movement.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* INBOUND STRATEGY */}
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all">
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
                                <div className="p-4 bg-black/20 rounded-xl border border-white/5 space-y-4">
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
                                        { value: 'manual', label: 'User Directed', desc: 'Operator chooses bin' },
                                        { value: 'system', label: 'System Directed', desc: 'Algorithm optimizes path' },
                                    ]}
                                    value={inbound.putawayLogic}
                                    onChange={(val: 'manual' | 'system') => setInbound(prev => ({ ...prev, putawayLogic: val }))}
                                />
                                <div className="pt-6 border-t border-white/5 flex justify-end">
                                    <Button onClick={() => handleSaveSection('inbound')} loading={isSaving === 'inbound'} icon={<Save size={16} />}>Save Inbound</Button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* HEALTH */}
                            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all">
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
                                            { value: 'random', label: 'Random Sample', desc: 'Daily random bins' },
                                        ]}
                                        value={health.cycleCountStrategy}
                                        onChange={(val: 'abc' | 'random') => setHealth(prev => ({ ...prev, cycleCountStrategy: val }))}
                                    />
                                    <div className="pt-6 border-t border-white/5 flex justify-end">
                                        <Button onClick={() => handleSaveSection('health')} loading={isSaving === 'health'} icon={<Save size={16} />}>Save Health</Button>
                                    </div>
                                </div>
                            </div>

                            {/* OUTBOUND */}
                            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all">
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
                                    <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/10 space-y-3">
                                        <ToggleRow
                                            label="Strict Barcode Validation"
                                            checked={outbound.strictScanning}
                                            onChange={() => setOutbound(prev => ({ ...prev, strictScanning: !prev.strictScanning }))}
                                        />
                                        <ToggleRow
                                            label="Bin Verification"
                                            checked={outbound.binScan}
                                            onChange={() => setOutbound(prev => ({ ...prev, binScan: !prev.binScan }))}
                                            warning="Disabling increases errors"
                                        />
                                    </div>
                                    <div className="pt-6 border-t border-white/5 flex justify-end">
                                        <Button onClick={() => handleSaveSection('outbound')} loading={isSaving === 'outbound'} icon={<Save size={16} />}>Save Outbound</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'pick-control' && (
                <div className="space-y-6">
                    <div className="flex items-center gap-2 p-1 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 mb-6">
                        <button
                            onClick={() => setActivePickSubTab('strategies')}
                            className={`flex-1 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${activePickSubTab === 'strategies' ? 'bg-cyber-primary text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Globe size={14} /> Strategies
                        </button>
                        <button
                            onClick={() => setActivePickSubTab('zones')}
                            className={`flex-1 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${activePickSubTab === 'zones' ? 'bg-cyber-primary text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Layers size={14} /> Zone Priority
                        </button>
                        <button
                            onClick={() => setActivePickSubTab('release')}
                            className={`flex-1 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${activePickSubTab === 'release' ? 'bg-cyber-primary text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Clock size={14} /> Order Release
                            {pendingOrders.length > 0 && <span className="px-1.5 py-0.5 bg-red-500 text-white rounded-md text-[8px] animate-pulse">{pendingOrders.length}</span>}
                        </button>
                    </div>

                    {activePickSubTab === 'strategies' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {fulfillmentSites.map(site => (
                                <div key={site.id} className={`p-5 rounded-2xl border transition-all duration-300 ${isSaving === site.id ? 'border-cyber-primary bg-cyber-primary/5' : 'border-white/5 bg-black/20'}`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${site.type === 'Warehouse' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'}`}>
                                                <MapPin size={18} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{site.name}</p>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase">{site.type}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleToggleFulfillmentNode(site.id, !site.isFulfillmentNode)}
                                            disabled={!!isSaving}
                                            title={`Toggle node for ${site.name}`}
                                            className={`w-10 h-5 rounded-full relative transition-all ${site.isFulfillmentNode ? 'bg-cyber-primary' : 'bg-white/10 opacity-50'}`}
                                        >
                                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${site.isFulfillmentNode ? 'left-6 bg-black' : 'left-1'}`} />
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Operational Strategy</label>
                                        <select
                                            value={site.fulfillmentStrategy || 'NEAREST'}
                                            onChange={(e) => handleStrategyChange(site.id, e.target.value as FulfillmentStrategy)}
                                            disabled={!!isSaving}
                                            title={`Select strategy for ${site.name}`}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:border-cyber-primary transition-all disabled:opacity-50"
                                        >
                                            <option value="NEAREST">Nearest Warehouse</option>
                                            <option value="LOCAL_ONLY">Local Only</option>
                                            <option value="SPLIT">Split (Cross-Site)</option>
                                            <option value="MANUAL">Manual Control</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activePickSubTab === 'zones' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                                <Layers size={20} className="text-cyber-primary" />
                                <select
                                    value={selectedSiteId}
                                    onChange={(e) => setSelectedSiteId(e.target.value)}
                                    title="Select site"
                                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-cyber-primary transition-all"
                                >
                                    {fulfillmentSites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {siteZones.map(zone => (
                                    <div key={zone.id} className={`p-5 rounded-2xl border transition-all ${isSaving === zone.id ? 'border-cyber-primary bg-cyber-primary/5' : 'border-white/5 bg-black/20'}`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h4 className="text-sm font-black text-white uppercase">{zone.name}</h4>
                                                <span className="text-[9px] font-black px-1.5 py-0.5 bg-cyber-primary/10 text-cyber-primary rounded uppercase mt-1 inline-block">{zone.zoneType || 'Standard'}</span>
                                            </div>
                                            <input
                                                type="number"
                                                min="1" max="100"
                                                title={`Priority for ${zone.name}`}
                                                value={zone.pickingPriority || 10}
                                                onChange={(e) => handlePriorityChange(zone.id, parseInt(e.target.value))}
                                                className="w-16 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-center text-xs font-bold text-cyber-primary outline-none focus:border-cyber-primary"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activePickSubTab === 'release' && (
                        <div className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden">
                            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                    <Clock size={16} className="text-cyber-primary" /> Pending Release
                                </h3>
                            </div>
                            <div className="overflow-x-auto text-xs">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white/5 border-b border-white/5 text-[10px] font-black text-gray-500 uppercase">
                                            <th className="px-6 py-4">Order Ref</th>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Items</th>
                                            <th className="px-6 py-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {pendingOrders.map(sale => (
                                            <tr key={sale.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-6 py-4"><div className="font-bold text-white">{sale.receiptNumber}</div></td>
                                                <td className="px-6 py-4 text-gray-400">{formatDateTime(sale.date || sale.created_at || '')}</td>
                                                <td className="px-6 py-4"><span className="bg-white/5 px-2 py-1 rounded border border-white/10 text-white">{sale.items.length} units</span></td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button onClick={() => handleReleaseOrder(sale.id)} loading={isSaving === sale.id} icon={<Play size={12} />} className="text-[9px] font-black uppercase tracking-widest h-8 px-4 rounded-lg">Release</Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {pendingOrders.length === 0 && (
                                            <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-600 uppercase text-[10px] font-black tracking-widest">Queue Clear</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
