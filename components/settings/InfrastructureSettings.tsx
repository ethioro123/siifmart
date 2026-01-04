import React, { useState, useEffect } from 'react';
import { Printer, Scale, Scan, Wifi, Bluetooth, Usb, Plus, Settings2, RefreshCw, Power, Save } from 'lucide-react';
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

const ConnectionBadge = ({ type }: { type: 'network' | 'usb' | 'bluetooth' }) => {
    switch (type) {
        case 'network': return <span className="flex items-center gap-1 text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20"><Wifi size={10} /> Network</span>;
        case 'usb': return <span className="flex items-center gap-1 text-[10px] bg-gray-500/10 text-gray-400 px-2 py-0.5 rounded border border-gray-500/20"><Usb size={10} /> USB</span>;
        case 'bluetooth': return <span className="flex items-center gap-1 text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20"><Bluetooth size={10} /> Bluetooth</span>;
    }
};

const DeviceCard = ({ device, onTest, onConfig }: any) => (
    <div className="bg-black/40 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all flex flex-col gap-4 group relative overflow-hidden">

        {/* Status Dot */}
        <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />

        <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-300 group-hover:bg-cyber-primary/10 group-hover:text-cyber-primary transition-colors">
                {device.icon}
            </div>
            <div>
                <h4 className="font-bold text-white text-sm">{device.name}</h4>
                <p className="text-[10px] text-gray-500 mt-0.5">{device.model}</p>
                <div className="flex gap-2 mt-2">
                    <ConnectionBadge type={device.connection} />
                    <span className="text-[10px] text-gray-600 bg-white/5 px-1.5 py-0.5 rounded font-mono">{device.address}</span>
                </div>
            </div>
        </div>

        <div className="flex gap-2 pt-4 border-t border-white/5">
            <button
                onClick={onTest}
                className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
            >
                <RefreshCw size={12} /> Test
            </button>
            <button
                onClick={onConfig}
                className="flex-1 py-1.5 bg-cyber-primary/10 hover:bg-cyber-primary/20 text-cyber-primary text-xs rounded-lg transition-colors flex items-center justify-center gap-1 border border-cyber-primary/20"
            >
                <Settings2 size={12} /> Config
            </button>
        </div>
    </div>
);

export default function InfrastructureSettings() {
    const { user } = useStore();
    const { settings, updateSettings, addNotification } = useData();

    const [hardware, setHardware] = useState<{
        scaleIpAddress: string;
        scannerComPort: string;
        defaultPrinter: string;
        scaleUnit: 'KG' | 'LBS';
    }>({
        scaleIpAddress: '',
        scannerComPort: '',
        defaultPrinter: 'Main Receipt Printer',
        scaleUnit: 'KG'
    });
    const [isSaving, setIsSaving] = useState(false);

    // Sync from settings
    useEffect(() => {
        if (settings) {
            setHardware({
                scaleIpAddress: settings.scaleIpAddress || '',
                scannerComPort: settings.scannerComPort || '',
                defaultPrinter: settings.defaultPrinter || 'Main Receipt Printer',
                scaleUnit: settings.scaleUnit || 'KG'
            });
        }
    }, [settings]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateSettings(hardware, user?.name || 'Admin');
            addNotification('success', 'Hardware configuration saved successfully!');
        } catch (err) {
            console.error('Failed to save hardware settings:', err);
            addNotification('alert', 'Failed to save hardware settings.');
        } finally {
            setIsSaving(false);
        }
    };

    // Mock state for devices
    const [devices] = useState([
        { id: 1, name: 'Main Receipt Printer', model: 'Epson TM-T88VI', type: 'printer', connection: 'network', address: '192.168.1.200', status: 'online', icon: <Printer size={18} /> },
        { id: 2, name: 'Counter Scale 1', model: 'Datalogic Magellan', type: 'scale', connection: 'usb', address: 'COM3', status: 'offline', icon: <Scale size={18} /> },
        { id: 3, name: 'Handheld Scanner', model: 'Zebra DS2208', type: 'scanner', connection: 'bluetooth', address: 'BT-MAC-001', status: 'online', icon: <Scan size={18} /> }
    ]);

    return (
        <div className="w-full max-w-full space-y-6 animate-in fade-in slide-in-from-right-4">

            {/* HEADER BANNER */}
            <div className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-xl flex items-start gap-3">
                <Power className="text-teal-400 shrink-0 mt-0.5" size={20} />
                <div>
                    <h4 className="text-teal-400 font-bold text-sm">Infrastructure & Device Manager</h4>
                    <p className="text-xs text-gray-400 mt-1">
                        Configure physical infrastructure, connected peripherals, and device drivers.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* DEVICE TOPOLOGY */}
                <div className="lg:col-span-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6">
                    <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                        <div>
                            <h3 className="text-xl font-bold text-white">Connected Devices</h3>
                            <p className="text-sm text-gray-400 mt-1">Active hardware in current session</p>
                        </div>
                        <button className="bg-cyber-primary text-black px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-cyber-accent transition-colors">
                            <Plus size={14} /> Add Device
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {devices.map(device => (
                            <DeviceCard
                                key={device.id}
                                device={device}
                                onTest={() => alert(`Testing connection to ${device.name}...`)}
                                onConfig={() => alert(`Configuring ${device.name}`)}
                            />
                        ))}
                    </div>
                </div>

                {/* QUICK ACTIONS & DRIVERS */}
                <div className="space-y-6">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6">
                        <div className="mb-6 border-b border-white/5 pb-4">
                            <h3 className="text-lg font-bold text-white">Device Settings</h3>
                            <p className="text-xs text-gray-400 mt-1">Port and IP assignments</p>
                        </div>

                        <div className="space-y-4">
                            <div className="group">
                                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Counter Scale IP</label>
                                <input
                                    type="text"
                                    value={hardware.scaleIpAddress}
                                    onChange={(e) => setHardware(prev => ({ ...prev, scaleIpAddress: e.target.value }))}
                                    placeholder="e.g. 192.168.1.50"
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyber-primary"
                                />
                            </div>
                            <div className="group">
                                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Scanner COM Port</label>
                                <input
                                    type="text"
                                    value={hardware.scannerComPort}
                                    onChange={(e) => setHardware(prev => ({ ...prev, scannerComPort: e.target.value }))}
                                    placeholder="e.g. COM3"
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyber-primary"
                                />
                            </div>

                            <div className="h-px bg-white/5 my-2" />

                            <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <Printer size={16} className="text-gray-400" />
                                    <div className="text-sm text-gray-300">Print Spooler</div>
                                </div>
                                <span className="text-[10px] text-green-400 flex items-center gap-1 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">Running</span>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                            <Button
                                onClick={handleSave}
                                loading={isSaving}
                                icon={<Save size={16} />}
                                variant="primary"
                                className="px-8"
                            >
                                Save Device Config
                            </Button>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-white/10 bg-gradient-to-br from-black/40 to-transparent">
                        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                            System Defaults
                        </h4>
                        <div className="space-y-3">
                            <div className="group">
                                <select
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyber-primary"
                                    value={hardware.defaultPrinter}
                                    onChange={(e) => setHardware(prev => ({ ...prev, defaultPrinter: e.target.value }))}
                                    aria-label="Default Printer"
                                    title="Default Printer"
                                >
                                    <option>Main Receipt Printer</option>
                                    <option>Kitchen Printer</option>
                                </select>
                            </div>
                            <div className="group">
                                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Scale Unit</label>
                                <div className="flex bg-black/30 rounded-lg border border-white/10 p-1">
                                    <button
                                        onClick={() => setHardware(prev => ({ ...prev, scaleUnit: 'KG' }))}
                                        className={`flex-1 py-1 text-xs font-bold rounded transition-all ${hardware.scaleUnit === 'KG' ? 'bg-cyber-primary text-black shadow-sm' : 'text-gray-500 hover:text-white'}`}
                                    >
                                        KG
                                    </button>
                                    <button
                                        onClick={() => setHardware(prev => ({ ...prev, scaleUnit: 'LBS' }))}
                                        className={`flex-1 py-1 text-xs font-bold rounded transition-all ${hardware.scaleUnit === 'LBS' ? 'bg-cyber-primary text-black shadow-sm' : 'text-gray-500 hover:text-white'}`}
                                    >
                                        LBS
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
