import React, { useState } from 'react';
import { Printer, Scale, Scan, CreditCard, Wifi, Bluetooth, Usb, Plus, Settings2, RefreshCw, CheckCircle, XCircle, Power } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';

// --- SUB-COMPONENTS ---
const SectionHeader = ({ title, desc }: { title: string, desc: string }) => (
    <div className="mb-6 pb-4 border-b border-[var(--theme-border)]">
        <h3 className="text-xl font-bold text-[var(--theme-text-primary)]">{title}</h3>
        <p className="text-sm text-[var(--theme-text-secondary)] mt-1">{desc}</p>
    </div>
);

const ConnectionBadge = ({ type }: { type: 'network' | 'usb' | 'bluetooth' }) => {
    switch (type) {
        case 'network': return <span className="flex items-center gap-1 text-[10px] bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] px-2 py-0.5 rounded border border-[var(--theme-status-info-border)]"><Wifi size={10} /> Network</span>;
        case 'usb': return <span className="flex items-center gap-1 text-[10px] bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] px-2 py-0.5 rounded border border-[var(--theme-border)]"><Usb size={10} /> USB</span>;
        case 'bluetooth': return <span className="flex items-center gap-1 text-[10px] bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] px-2 py-0.5 rounded border border-[var(--theme-border-accent)]"><Bluetooth size={10} /> Bluetooth</span>;
    }
};

const DeviceCard = ({ device, onTest, onConfig }: any) => (
    <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl p-4 hover:border-[var(--theme-accent)]/30 transition-all flex flex-col gap-4 group relative overflow-hidden shadow-xs">

        {/* Status Dot */}
        <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-[var(--theme-status-success-bg)] shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-[var(--theme-status-danger-bg)]'}`} />

        <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--theme-bg-card)] flex items-center justify-center text-[var(--theme-text-secondary)] group-hover:bg-[var(--theme-accent)]/10 group-hover:text-[var(--theme-accent)] transition-colors border border-[var(--theme-border)]">
                {device.icon}
            </div>
            <div>
                <h4 className="font-bold text-[var(--theme-text-primary)] text-sm">{device.name}</h4>
                <p className="text-[10px] text-[var(--theme-text-secondary)] mt-0.5">{device.model}</p>
                <div className="flex gap-2 mt-2">
                    <ConnectionBadge type={device.connection} />
                    <span className="text-[10px] text-[var(--theme-text-secondary)] bg-[var(--theme-bg-card)] px-1.5 py-0.5 rounded font-mono border border-[var(--theme-border)]">{device.address}</span>
                </div>
            </div>
        </div>

        <div className="flex gap-2 pt-4 border-t border-[var(--theme-border)]">
            <button
                type="button"
                onClick={onTest}
                className="flex-1 py-1.5 bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] text-xs rounded-lg transition-colors flex items-center justify-center gap-1 border border-[var(--theme-border)] cursor-pointer"
            >
                <RefreshCw size={12} /> Test
            </button>
            <button
                type="button"
                onClick={onConfig}
                className="flex-1 py-1.5 bg-[var(--theme-accent)]/10 hover:bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] text-xs rounded-lg transition-colors flex items-center justify-center gap-1 border border-[var(--theme-border-accent)] cursor-pointer"
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
                <div className="lg:col-span-2 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-xs">
                    <div className="flex justify-between items-center mb-6 border-b border-[var(--theme-border)] pb-4">
                        <div>
                            <h3 className="text-xl font-bold text-[var(--theme-text-primary)]">Connected Devices</h3>
                            <p className="text-sm text-[var(--theme-text-secondary)] mt-1">Active hardware in current session</p>
                        </div>
                        <button type="button" className="bg-[var(--theme-accent)] text-[var(--theme-accent-text)] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer">
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
                    <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-xs">
                        <SectionHeader title="Global Drivers" desc="Protocol settings" />

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)]">
                                <div className="flex items-center gap-3">
                                    <Printer size={16} className="text-[var(--theme-text-secondary)]" />
                                    <div className="text-sm text-[var(--theme-text-primary)]">Print Spooler</div>
                                </div>
                                <span className="text-[10px] font-semibold text-[var(--theme-status-success-text)] flex items-center gap-1 bg-[var(--theme-status-success-bg)] px-2 py-0.5 rounded border border-[var(--theme-status-success-border)]">Running</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)]">
                                <div className="flex items-center gap-3">
                                    <Scale size={16} className="text-[var(--theme-text-secondary)]" />
                                    <div className="text-sm text-[var(--theme-text-primary)]">OPOS Bridge</div>
                                </div>
                                <span className="text-[10px] font-semibold text-[var(--theme-status-warning-text)] flex items-center gap-1 bg-[var(--theme-status-warning-bg)] px-2 py-0.5 rounded border border-[var(--theme-status-warning-border)]">Restarting</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] shadow-xs">
                        <h4 className="text-sm font-bold text-[var(--theme-text-primary)] mb-3 flex items-center gap-2">
                            System Defaults
                        </h4>
                        <div className="space-y-3">
                            <div className="group">
                                <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-bold mb-1 block">Default Printer</label>
                                <select
                                    aria-label="Default Printer"
                                    className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-lg px-3 py-2 text-xs text-[var(--theme-text-primary)] outline-none focus:border-[var(--theme-accent)]">
                                    <option>Main Receipt Printer</option>
                                    <option>Kitchen Printer</option>
                                </select>
                            </div>
                            <div className="group">
                                <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-bold mb-1 block">Scale Unit</label>
                                <div className="flex bg-[var(--theme-bg-card)] rounded-lg border border-[var(--theme-border)] p-1">
                                    <button type="button" className="flex-1 py-1 text-xs font-bold rounded bg-[var(--theme-accent)] text-[var(--theme-accent-text)] shadow-2xs">KG</button>
                                    <button type="button" className="flex-1 py-1 text-xs text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors">LBS</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
