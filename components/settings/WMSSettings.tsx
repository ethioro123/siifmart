import React, { useState, useEffect } from 'react';
import { Shield, Truck, Package, RotateCw, AlertTriangle, Scan, Search, Barcode, ClipboardCheck, ArrowRight, Layers, Save } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import Button from '../shared/Button';

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
    const { settings, updateSettings, addNotification } = useData();

    // Local States
    const [inbound, setInbound] = useState<{
        receivingLogic: 'blind' | 'verified';
        qcSamplingRate: number;
        qcBlockOnFailure: boolean;
        putawayLogic: 'manual' | 'system';
    }>({
        receivingLogic: 'verified',
        qcSamplingRate: 10,
        qcBlockOnFailure: true,
        putawayLogic: 'system'
    });

    const [health, setHealth] = useState<{
        rotationPolicy: 'fifo' | 'fefo' | 'lifo';
        requireExpiry: boolean;
        cycleCountStrategy: 'abc' | 'random';
    }>({
        rotationPolicy: 'fifo',
        requireExpiry: true,
        cycleCountStrategy: 'abc'
    });

    const [outbound, setOutbound] = useState<{
        pickingMethod: 'order' | 'wave' | 'zone';
        strictScanning: boolean;
        binScan: boolean;
    }>({
        pickingMethod: 'order',
        strictScanning: true,
        binScan: true
    });

    const [isSavingInbound, setIsSavingInbound] = useState(false);
    const [isSavingHealth, setIsSavingHealth] = useState(false);
    const [isSavingOutbound, setIsSavingOutbound] = useState(false);

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
        const setSaving = section === 'inbound' ? setIsSavingInbound :
            section === 'health' ? setIsSavingHealth : setIsSavingOutbound;
        const data = section === 'inbound' ? inbound :
            section === 'health' ? health : outbound;

        setSaving(true);
        try {
            await updateSettings(data, user?.name || 'Admin');
            addNotification('success', `${section.charAt(0).toUpperCase() + section.slice(1)} wms settings saved successfully!`);
        } catch (err) {
            console.error(`Failed to save ${section} settings:`, err);
            addNotification('alert', `Failed to save ${section} settings.`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="w-full max-w-full space-y-6 animate-in fade-in slide-in-from-right-4">

            {/* HEADER BANNER */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3">
                <Shield className="text-blue-400 shrink-0 mt-0.5" size={20} />
                <div>
                    <h4 className="text-blue-400 font-bold text-sm">Enterprise WMS Engine Active</h4>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                        These rules govern automated decision-making for inventory movement.
                        Startups typically use <strong>FIFO</strong> and <strong>Manual Putaway</strong>.
                        Scale-ups should switch to <strong>System Directed</strong> logic.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* INBOUND STRATEGY */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all">
                    <div className="mb-6 border-b border-white/5 pb-4">
                        <h3 className="text-xl font-bold text-white">Inbound Strategy</h3>
                        <p className="text-sm text-gray-400 mt-1">Receiving, QC, and Putaway</p>
                    </div>

                    <div className="space-y-6">
                        <RadioGroup
                            label="Receiving Verification"
                            icon={ClipboardCheck}
                            options={[
                                { value: 'blind', label: 'Blind Receive', desc: 'Accept manifest without count (Speed)' },
                                { value: 'verified', label: 'Verified Receive', desc: 'Scan every item against PO (Accuracy)' },
                            ]}
                            value={inbound.receivingLogic}
                            onChange={(val: 'blind' | 'verified') => setInbound(prev => ({ ...prev, receivingLogic: val }))}
                        />

                        <div className="p-4 bg-black/20 rounded-xl border border-white/5 space-y-4">
                            <SliderGroup
                                label="QC Sampling Rate"
                                icon={Search}
                                min={0}
                                max={100}
                                step={5}
                                unit="%"
                                value={inbound.qcSamplingRate}
                                onChange={(val: number) => setInbound(prev => ({ ...prev, qcSamplingRate: val }))}
                                sub="Percentage of inbound stock diverted to Quality Control"
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
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                        <Button
                            onClick={() => handleSaveSection('inbound')}
                            loading={isSavingInbound}
                            icon={<Save size={16} />}
                            variant="primary"
                            className="px-8"
                        >
                            Save Inbound
                        </Button>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* INVENTORY HEALTH */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all">
                        <div className="mb-6 border-b border-white/5 pb-4">
                            <h3 className="text-xl font-bold text-white">Inventory Health</h3>
                            <p className="text-sm text-gray-400 mt-1">Rotation and Counting Policies</p>
                        </div>

                        <div className="space-y-6">
                            <RadioGroup
                                label="Rotation Policy"
                                icon={RotateCw}
                                options={[
                                    { value: 'fifo', label: 'FIFO', desc: 'First In First Out' },
                                    { value: 'fefo', label: 'FEFO', desc: 'First Expiry First Out (Food/Pharma)' },
                                    { value: 'lifo', label: 'LIFO', desc: 'Last In First Out' },
                                ]}
                                value={health.rotationPolicy}
                                onChange={(val: 'fifo' | 'fefo' | 'lifo') => setHealth(prev => ({ ...prev, rotationPolicy: val }))}
                            />

                            <ToggleRow
                                label="Mandatory Expiry Date"
                                sub="Require expiry entry for all perishable goods"
                                checked={health.requireExpiry}
                                onChange={() => setHealth(prev => ({ ...prev, requireExpiry: !prev.requireExpiry }))}
                            />

                            <div className="pt-4 border-t border-white/5">
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
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                            <Button
                                onClick={() => handleSaveSection('health')}
                                loading={isSavingHealth}
                                icon={<Save size={16} />}
                                variant="primary"
                                className="px-8"
                            >
                                Save Health
                            </Button>
                        </div>
                    </div>

                    {/* OUTBOUND & COMPLIANCE */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all">
                        <div className="mb-6 border-b border-white/5 pb-4">
                            <h3 className="text-xl font-bold text-white">Outbound & Compliance</h3>
                            <p className="text-sm text-gray-400 mt-1">Picking Efficiency and Safety</p>
                        </div>

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
                                <label className="text-xs text-red-300 font-bold uppercase tracking-wide flex items-center gap-2">
                                    <Barcode size={14} /> Enforcement Level
                                </label>
                                <ToggleRow
                                    label="Strict Barcode Validation"
                                    sub="Prevent picking without valid item scan"
                                    checked={outbound.strictScanning}
                                    onChange={() => setOutbound(prev => ({ ...prev, strictScanning: !prev.strictScanning }))}
                                />
                                <ToggleRow
                                    label="Bin Verification"
                                    sub="Must scan bin label before picking"
                                    checked={outbound.binScan}
                                    onChange={() => setOutbound(prev => ({ ...prev, binScan: !prev.binScan }))}
                                    warning="Disabling increases errors"
                                />
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                            <Button
                                onClick={() => handleSaveSection('outbound')}
                                loading={isSavingOutbound}
                                icon={<Save size={16} />}
                                variant="primary"
                                className="px-8"
                            >
                                Save Outbound
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
