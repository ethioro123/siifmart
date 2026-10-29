import React, { useState } from 'react';
import { Printer, Scale, Scan, CreditCard, Wifi, Bluetooth, Usb, Plus, Settings2, RefreshCw, CheckCircle, XCircle, Power } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';

// --- SUB-COMPONENTS ---
const SectionHeader = ({ title, desc }: { title: string, desc: string }) => (
    <div className="mb-6 pb-4 border-b border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)]">
        <h3 className="text-xl font-bold text-[var(--theme-text-primary)]">{title}</h3>
        <p className="text-sm text-[var(--theme-text-muted)] mt-1">{desc}</p>
    </div>
);

const ConnectionBadge = ({ type }: { type: 'network' | 'usb' | 'bluetooth' }) => {
    switch (type) {
        case 'network': return <span className="flex items-center gap-1 text-[10px] bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] px-2 py-0.5 rounded border border-[var(--theme-status-info-border)]"><Wifi size={10} /> Network</span>;
        case 'usb': return <span className="flex items-center gap-1 text-[10px] bg-[color-mix(in_srgb,var(--theme-bg-card-hover)_10%,transparent)] text-[var(--theme-text-muted)] px-2 py-0.5 rounded border border-[color-mix(in_srgb,var(--theme-border)_20%,transparent)]"><Usb size={10} /> USB</span>;
        case 'bluetooth': return <span className="flex items-center gap-1 text-[10px] bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] px-2 py-0.5 rounded border border-[var(--theme-border-accent)]"><Bluetooth size={10} /> Bluetooth</span>;
    }
};

const DeviceCard = ({ device, onTest, onConfig }: any) => (
    <div className="bg-[color-mix(in_srgb,var(--theme-overlay)_40%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] rounded-xl p-4 hover:border-[color-mix(in_srgb,var(--theme-border)_20%,transparent)] transition-all flex flex-col gap-4 group relative overflow-hidden">

        {/* Status Dot */}
        <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-[var(--theme-status-success-bg)] shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-[var(--theme-status-danger-bg)]'}`} />

        <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)] flex items-center justify-center text-[var(--theme-text-muted)] group-hover:bg-cyber-primary/10 group-hover:text-cyber-primary transition-colors">
                {device.icon}
            </div>
            <div>
                <h4 className="font-bold text-[var(--theme-text-primary)] text-sm">{device.name}</h4>
                <p className="text-[10px] text-[var(--theme-text-secondary)] mt-0.5">{device.model}</p>
                <div className="flex gap-2 mt-2">
                    <ConnectionBadge type={device.connection} />
                    <span className="text-[10px] text-[var(--theme-text-secondary)] bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)] px-1.5 py-0.5 rounded font-mono">{device.address}</span>
                </div>
            </div>
        </div>

        <div className="flex gap-2 pt-4 border-t border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)]">
            <button
                onClick={onTest}
                className="flex-1 py-1.5 bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)] hover:bg-[color-mix(in_srgb,var(--theme-bg-card)_10%,transparent)] text-[var(--theme-text-muted)] text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
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

export default function HardwareSettings() {
    const { user } = useStore();
    const { settings, updateSettings } = useData();

    // Mock state for devices (usually from local hardware service)
    const [devices, setDevices] = useState([
        { id: 1, name: 'Main Receipt Printer', model: 'Epson TM-T88VI', type: 'printer', connection: 'network', address: '192.168.1.200', status: 'online', icon: <Printer size={18} /> },
        { id: 2, name: 'Counter Scale 1', model: 'Datalogic Magellan', type: 'scale', connection: 'usb', address: 'COM3', status: 'offline', icon: <Scale size={18} /> },
        { id: 3, name: 'Handheld Scanner', model: 'Zebra DS2208', type: 'scanner', connection: 'bluetooth', address: 'BT-MAC-001', status: 'online', icon: <Scan size={18} /> }
    ]);

    return (
        <div className="w-full max-w-full space-y-6 animate-in fade-in slide-in-from-right-4">

            {/* HEADER BANNER */}
            <div className="p-4 bg-[var(--theme-status-success-bg)] border border-[var(--theme-status-success-border)] rounded-xl flex items-start gap-3">
                <Power className="text-[var(--theme-status-success-text)] shrink-0 mt-0.5" size={20} />
                <div>
                    <h4 className="text-[var(--theme-status-success-text)] font-bold text-sm">Retail Device Manager</h4>
                    <p className="text-xs text-[var(--theme-text-muted)] mt-1">
                        Configure connected peripherals, run diagnostic tests, and manage device drivers.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* DEVICE TOPOLOGY */}
                <div className="lg:col-span-2 bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)] backdrop-blur-sm border border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] rounded-3xl p-6">
                    <div className="flex justify-between items-center mb-6 border-b border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] pb-4">
                        <div>
                            <h3 className="text-xl font-bold text-[var(--theme-text-primary)]">Connected Devices</h3>
                            <p className="text-sm text-[var(--theme-text-muted)] mt-1">Active hardware in current session</p>
                        </div>
                        <button className="bg-cyber-primary text-[var(--theme-text-primary)] px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-cyber-accent transition-colors">
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
                    <div className="bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)] backdrop-blur-sm border border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] rounded-3xl p-6">
                        <SectionHeader title="Global Drivers" desc="Protocol settings" />

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-[color-mix(in_srgb,var(--theme-overlay)_20%,transparent)] rounded-xl border border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)]">
                                <div className="flex items-center gap-3">
                                    <Printer size={16} className="text-[var(--theme-text-muted)]" />
                                    <div className="text-sm text-[var(--theme-text-muted)]">Print Spooler</div>
                                </div>
                                <span className="text-[10px] text-[var(--theme-status-success-text)] flex items-center gap-1 bg-[var(--theme-status-success-bg)] px-2 py-0.5 rounded border border-[var(--theme-status-success-border)]">Running</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-[color-mix(in_srgb,var(--theme-overlay)_20%,transparent)] rounded-xl border border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)]">
                                <div className="flex items-center gap-3">
                                    <Scale size={16} className="text-[var(--theme-text-muted)]" />
                                    <div className="text-sm text-[var(--theme-text-muted)]">OPOS Bridge</div>
                                </div>
                                <span className="text-[10px] text-[var(--theme-status-warning-text)] flex items-center gap-1 bg-[var(--theme-status-warning-bg)] px-2 py-0.5 rounded border border-[var(--theme-status-warning-border)]">Restarting</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] bg-gradient-to-br from-[var(--theme-accent)] to-transparent">
                        <h4 className="text-sm font-bold text-[var(--theme-text-primary)] mb-3 flex items-center gap-2">
                            System Defaults
                        </h4>
                        <div className="space-y-3">
                            <div className="group">
                                <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-bold mb-1 block">Default Printer</label>
                                <select
                                    aria-label="Default Printer"
                                    className="w-full bg-[color-mix(in_srgb,var(--theme-overlay)_30%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] rounded-lg px-3 py-2 text-xs text-[var(--theme-text-primary)] outline-none focus:border-cyber-primary">
                                    <option>Main Receipt Printer</option>
                                    <option>Kitchen Printer</option>
                                </select>
                            </div>
                            <div className="group">
                                <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-bold mb-1 block">Scale Unit</label>
                                <div className="flex bg-[color-mix(in_srgb,var(--theme-overlay)_30%,transparent)] rounded-lg border border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] p-1">
                                    <button className="flex-1 py-1 text-xs font-bold rounded bg-cyber-primary text-[var(--theme-text-primary)] shadow-sm">KG</button>
                                    <button className="flex-1 py-1 text-xs text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors">LBS</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
