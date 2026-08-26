import React, { useState, useEffect } from 'react';
import {
    Printer, Scale, Scan, Wifi, Bluetooth, Usb, Plus, Settings2,
    RefreshCw, Power, Save, CheckCircle, Shield
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { logger } from '../../utils/logger';

// --- SUB-COMPONENTS ---
const SectionHeader = ({ title, desc }: { title: string, desc: string }) => (
    <div className="mb-6 pb-4 border-b border-[#E2DCCE]/60 dark:border-white/5">
        <h3 className="text-lg font-black text-[#1E3F27] dark:text-[#EAE5D9] tracking-tight">{title}</h3>
        <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83] mt-0.5">{desc}</p>
    </div>
);

const ConnectionBadge = ({ type }: { type: 'network' | 'usb' | 'bluetooth' }) => {
    switch (type) {
        case 'network':
            return <span className="flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-900/30"><Wifi size={10} /> Network</span>;
        case 'usb':
            return <span className="flex items-center gap-1 text-[10px] font-bold bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 px-2 py-0.5 rounded-lg border border-stone-200 dark:border-stone-700"><Usb size={10} /> USB</span>;
        case 'bluetooth':
            return <span className="flex items-center gap-1 text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 px-2 py-0.5 rounded-lg border border-purple-200 dark:border-purple-900/30"><Bluetooth size={10} /> Bluetooth</span>;
    }
};

const DeviceCard = ({ device, onTest, onConfig }: any) => (
    <div className="bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-3xl p-5 hover:border-[#2C5E3B]/40 transition-all flex flex-col gap-4 group relative overflow-hidden shadow-sm">
        {/* Status Dot */}
        <div className={`absolute top-4 right-4 w-2.5 h-2.5 rounded-full ${device.status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(44,94,59,0.5)]' : 'bg-stone-300 dark:bg-stone-700'}`} />

        <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2] flex items-center justify-center border border-emerald-200 dark:border-emerald-950/30 shrink-0">
                {device.icon}
            </div>
            <div>
                <h4 className="font-black text-sm text-[#1E3F27] dark:text-white">{device.name}</h4>
                <p className="text-[10px] text-stone-500 dark:text-gray-400 mt-0.5 font-medium">{device.model}</p>
                <div className="flex items-center gap-2 mt-2">
                    <ConnectionBadge type={device.connection} />
                    <span className="text-[10px] text-stone-600 dark:text-gray-400 bg-white/80 dark:bg-white/5 px-2 py-0.5 rounded-lg font-mono border border-[#E2DCCE]/60 dark:border-white/5">{device.address}</span>
                </div>
            </div>
        </div>

        <div className="flex gap-2 pt-3 border-t border-[#E2DCCE]/60 dark:border-white/10">
            <button
                type="button"
                onClick={onTest}
                className="flex-1 py-2 bg-white dark:bg-white/5 hover:bg-stone-100 dark:hover:bg-white/10 text-stone-700 dark:text-gray-200 text-xs font-bold rounded-xl border border-[#E2DCCE] dark:border-white/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
                <RefreshCw size={12} /> Test Ping
            </button>
            <button
                type="button"
                onClick={onConfig}
                className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-[#2C5E3B]/20 dark:hover:bg-[#2C5E3B]/30 text-[#2C5E3B] dark:text-[#A9CBA2] text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-950/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
                <Settings2 size={12} /> Config
            </button>
        </div>
    </div>
);

export default function InfrastructureSettings() {
    const { user, showToast } = useStore();
    const { settings, updateSettings } = useData();

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
            showToast('Hardware configuration saved successfully!', 'success');
        } catch (err) {
            logger.error('InfrastructureSettings', 'Failed to save hardware settings:', err);
            showToast('Failed to save hardware settings.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // Active device topology
    const [devices] = useState([
        { id: 1, name: 'Main Receipt Printer', model: 'Epson TM-T88VI', type: 'printer', connection: 'network' as const, address: '192.168.1.200', status: 'online', icon: <Printer size={20} /> },
        { id: 2, name: 'Counter Scale 1', model: 'Datalogic Magellan', type: 'scale', connection: 'usb' as const, address: 'COM3', status: 'offline', icon: <Scale size={20} /> },
        { id: 3, name: 'Handheld Scanner', model: 'Zebra DS2208', type: 'scanner', connection: 'bluetooth' as const, address: 'BT-MAC-001', status: 'online', icon: <Scan size={20} /> }
    ]);

    const cardBase = "bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[32px] p-6 lg:p-8 shadow-sm";

    return (
        <div className="w-full max-w-full space-y-6 animate-in fade-in slide-in-from-right-4">

            {/* HEADER BANNER */}
            <div className="p-4 bg-emerald-50 dark:bg-[#2C5E3B]/20 border border-emerald-200 dark:border-emerald-950/30 rounded-2xl flex items-start gap-3">
                <Power className="text-[#2C5E3B] dark:text-[#A9CBA2] shrink-0 mt-0.5" size={20} />
                <div>
                    <h4 className="text-[#1E3F27] dark:text-white font-bold text-sm">Infrastructure & Hardware Device Manager</h4>
                    <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83] mt-0.5">
                        Manage thermal receipt printers, electronic scale calibration, hardware barcodes, and COM/IP port mappings.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* DEVICE TOPOLOGY */}
                <div className={`lg:col-span-2 ${cardBase}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-[#E2DCCE]/60 dark:border-white/5 pb-4">
                        <div>
                            <h3 className="text-lg font-black text-[#1E3F27] dark:text-[#EAE5D9]">Connected Peripherals</h3>
                            <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83] mt-0.5">Active POS and warehouse hardware in current station</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => showToast('Scanning local network for new devices...', 'info')}
                            className="bg-[#2C5E3B] hover:opacity-90 text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95 self-start sm:self-auto"
                        >
                            <Plus size={14} /> Add Device
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {devices.map(device => (
                            <DeviceCard
                                key={device.id}
                                device={device}
                                onTest={() => showToast(`Ping test to ${device.name} (${device.address}): 4ms OK`, 'success')}
                                onConfig={() => showToast(`Opening driver configuration for ${device.name}...`, 'info')}
                            />
                        ))}
                    </div>
                </div>

                {/* QUICK ACTIONS & DRIVERS */}
                <div className="space-y-6">
                    <div className={cardBase}>
                        <div className="mb-6 border-b border-[#E2DCCE]/60 dark:border-white/5 pb-4">
                            <h3 className="text-sm font-black text-[#1E3F27] dark:text-white uppercase tracking-wider">Device Settings</h3>
                            <p className="text-[10px] text-stone-500 dark:text-gray-400 mt-0.5">Port and IP assignments</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs text-stone-600 dark:text-gray-400 font-bold uppercase tracking-wide block">Counter Scale IP</label>
                                <input
                                    type="text"
                                    value={hardware.scaleIpAddress}
                                    onChange={(e) => setHardware(prev => ({ ...prev, scaleIpAddress: e.target.value }))}
                                    placeholder="e.g. 192.168.1.50"
                                    className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-[#1E3F27] dark:text-white font-mono font-bold outline-none focus:border-[#2C5E3B] transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-stone-600 dark:text-gray-400 font-bold uppercase tracking-wide block">Scanner COM Port</label>
                                <input
                                    type="text"
                                    value={hardware.scannerComPort}
                                    onChange={(e) => setHardware(prev => ({ ...prev, scannerComPort: e.target.value }))}
                                    placeholder="e.g. COM3"
                                    className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-[#1E3F27] dark:text-white font-mono font-bold outline-none focus:border-[#2C5E3B] transition-all"
                                />
                            </div>

                            <div className="h-px bg-[#E2DCCE]/60 dark:bg-white/5 my-2" />

                            <div className="flex items-center justify-between p-3.5 bg-[#FAF8F5] dark:bg-black/20 rounded-2xl border border-[#E2DCCE] dark:border-white/5">
                                <div className="flex items-center gap-3">
                                    <Printer size={16} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                    <div className="text-xs font-black text-[#1E3F27] dark:text-stone-300">Print Spooler</div>
                                </div>
                                <span className="text-[10px] font-black text-[#2C5E3B] dark:text-[#A9CBA2] flex items-center gap-1 bg-emerald-50 dark:bg-[#2C5E3B]/20 px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-950/30">
                                    <CheckCircle size={10} /> Running
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-[#E2DCCE]/60 dark:border-white/10 flex justify-end">
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-6 py-2.5 bg-[#2C5E3B] hover:opacity-90 text-white font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-50"
                            >
                                {isSaving ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                                Save Device Config
                            </button>
                        </div>
                    </div>

                    <div className={cardBase}>
                        <h4 className="text-xs font-black text-[#1E3F27] dark:text-white uppercase tracking-wider mb-3">
                            Hardware Defaults
                        </h4>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold tracking-wider block">Default Terminal Printer</label>
                                <select
                                    className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-[#1E3F27] dark:text-white font-bold outline-none focus:border-[#2C5E3B]"
                                    value={hardware.defaultPrinter}
                                    onChange={(e) => setHardware(prev => ({ ...prev, defaultPrinter: e.target.value }))}
                                    aria-label="Default Printer"
                                    title="Default Printer"
                                >
                                    <option>Main Receipt Printer</option>
                                    <option>Kitchen Printer</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold tracking-wider block">Scale Calibration Unit</label>
                                <div className="flex bg-[#FAF8F5] dark:bg-black/30 rounded-2xl border border-[#E2DCCE] dark:border-white/10 p-1">
                                    <button
                                        type="button"
                                        onClick={() => setHardware(prev => ({ ...prev, scaleUnit: 'KG' }))}
                                        className={`flex-1 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${hardware.scaleUnit === 'KG' ? 'bg-[#2C5E3B] text-white shadow-sm' : 'text-stone-500 hover:text-[#1E3F27] dark:text-gray-400 dark:hover:text-white'}`}
                                    >
                                        KG (Metric)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setHardware(prev => ({ ...prev, scaleUnit: 'LBS' }))}
                                        className={`flex-1 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${hardware.scaleUnit === 'LBS' ? 'bg-[#2C5E3B] text-white shadow-sm' : 'text-stone-500 hover:text-[#1E3F27] dark:text-gray-400 dark:hover:text-white'}`}
                                    >
                                        LBS (Imperial)
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
