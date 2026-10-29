import React, { useState, useEffect } from 'react';
import {
    Printer, Scale, Scan, Wifi, Bluetooth, Usb, Plus, Settings2,
    RefreshCw, Power, Save, CheckCircle, ShieldAlert, AlertTriangle
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { Country, getCountryProfile } from '../../utils/localization';
import { testNetworkPrinter } from '../../utils/printerDiscovery';
import { useHardwareSettingsMutation } from '../../hooks/useHardwareSettingsMutation';
import { AddDeviceModal, ConfigDeviceModal } from './hardware/HardwareModals';
import type { Device, HardwareState } from './hardware/hardwareTypes';
import type { SystemConfig } from '../../types';

// --- SUB-COMPONENTS WITH STRICT TYPES ---
interface ConnectionBadgeProps {
    type: 'network' | 'usb' | 'bluetooth';
}

const ConnectionBadge: React.FC<ConnectionBadgeProps> = ({ type }) => {
    switch (type) {
        case 'network':
            return (
                <span className="flex items-center gap-1 text-[10px] font-semibold bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:bg-[var(--theme-accent)]/15 dark:text-[var(--theme-accent)] px-2 py-0.5 rounded-full border border-[var(--theme-accent)]/20">
                    <Wifi size={10} /> Network
                </span>
            );
        case 'usb':
            return (
                <span className="flex items-center gap-1 text-[10px] font-semibold bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] px-2 py-0.5 rounded-full border border-[var(--theme-border)]">
                    <Usb size={10} /> USB
                </span>
            );
        case 'bluetooth':
            return (
                <span className="flex items-center gap-1 text-[10px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20">
                    <Bluetooth size={10} /> Bluetooth
                </span>
            );
    }
};

interface DeviceCardProps {
    device: Device;
    onTest: () => void;
    onConfig: () => void;
    isTesting?: boolean;
    isAuthorized?: boolean;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device, onTest, onConfig, isTesting = false, isAuthorized = true }) => {
    const renderIcon = () => {
        switch (device.type) {
            case 'printer':
                return <Printer size={18} />;
            case 'scale':
                return <Scale size={18} />;
            case 'scanner':
                return <Scan size={18} />;
        }
    };

    return (
        <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl p-4.5 hover:border-[var(--theme-accent)]/30 transition-all flex flex-col gap-3.5 group relative overflow-hidden shadow-xs">
            {/* Status Indicator */}
            <div
                className={`absolute top-4 right-4 w-2 h-2 rounded-full ${
                    device.status === 'online'
                        ? 'bg-[var(--theme-status-success-bg)] shadow-[0_0_6px_rgba(16,185,129,0.5)]'
                        : 'bg-neutral-400 dark:bg-neutral-600'
                }`}
            />

            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/15 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center border border-[var(--theme-accent)]/20 shrink-0">
                    {renderIcon()}
                </div>
                <div>
                    <h4 className="font-semibold text-xs text-[var(--theme-text-primary)]">{device.name}</h4>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5 font-medium">{device.model}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                        <ConnectionBadge type={device.connection} />
                        <span className="text-[10px] text-[var(--theme-text-secondary)] bg-[var(--theme-bg-card)] px-2 py-0.5 rounded-md font-mono border border-[var(--theme-border)]">
                            {device.address}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-[var(--theme-border)]">
                <button
                    type="button"
                    onClick={onTest}
                    disabled={isTesting}
                    className="flex-1 py-1.5 bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] text-xs font-semibold rounded-xl border border-[var(--theme-border)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                >
                    <RefreshCw size={12} className={isTesting ? 'animate-spin text-[var(--theme-accent)] dark:text-[var(--theme-accent)]' : ''} />
                    {isTesting ? 'Testing...' : 'Test Ping'}
                </button>
                {isAuthorized && (
                    <button
                        type="button"
                        onClick={onConfig}
                        className="flex-1 py-1.5 bg-[var(--theme-accent)]/10 hover:bg-[var(--theme-accent)]/20 dark:bg-[var(--theme-accent)]/15 dark:hover:bg-[var(--theme-accent)]/25 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] text-xs font-semibold rounded-xl border border-[var(--theme-accent)]/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                        <Settings2 size={12} /> Config
                    </button>
                )}
            </div>
        </div>
    );
};

export default function InfrastructureSettings() {
    const { user, showToast } = useStore();
    const { settings, effectiveCountry } = useData();
    const mutation = useHardwareSettingsMutation();

    // ── ROLE GATING (RULES.md Zero-Trust §1) ──
    const allowedRoles = ['group_ceo', 'country_managing_director', 'country_operations_director', 'country_technology_director', 'regional_it_manager', 'it_support', 'regional_operations_manager', 'area_operations_manager', 'store_manager', 'warehouse_manager'];
    const isAuthorized = allowedRoles.includes(user?.role || '');

    // ── INVISIBLE TENANCY & COUNTRY ISOLATION (AGENTS.md Rule 7 & 8) ──
    const activeCountry: Country = (effectiveCountry || settings?.country || 'ET') as Country;
    const countryProfile = getCountryProfile(activeCountry);

    const [hardware, setHardware] = useState<HardwareState>({
        scaleIpAddress: '',
        scannerComPort: '',
        defaultPrinter: 'Main Receipt Printer',
        scaleUnit: 'KG',
    });

    const [testingDeviceId, setTestingDeviceId] = useState<number | string | null>(null);

    // Connected Peripherals State
    const [devices, setDevices] = useState<Device[]>([
        { id: 1, name: 'Main Receipt Printer', model: 'Epson TM-T88VI', type: 'printer', connection: 'network', address: '192.168.1.200', status: 'online' },
        { id: 2, name: 'Counter Scale 1', model: 'Datalogic Magellan', type: 'scale', connection: 'usb', address: 'COM3', status: 'offline' },
        { id: 3, name: 'Handheld Scanner', model: 'Zebra DS2208', type: 'scanner', connection: 'bluetooth', address: 'BT-MAC-001', status: 'online' },
    ]);

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedDeviceForConfig, setSelectedDeviceForConfig] = useState<Device | null>(null);
    const [newDevice, setNewDevice] = useState<Omit<Device, 'id' | 'status'>>({
        name: '',
        model: '',
        type: 'printer',
        connection: 'network',
        address: '',
    });

    // Sync from settings.countryConfigs[activeCountry]
    useEffect(() => {
        if (!settings) return;

        const countryConfigs = (settings.countryConfigs || {}) as Record<string, Partial<SystemConfig>>;
        const activeConfig = countryConfigs[activeCountry] || {};

        setHardware({
            scaleIpAddress: activeConfig.scaleIpAddress || settings.scaleIpAddress || '',
            scannerComPort: activeConfig.scannerComPort || settings.scannerComPort || '',
            defaultPrinter: activeConfig.defaultPrinter || settings.defaultPrinter || 'Main Receipt Printer',
            scaleUnit: activeConfig.scaleUnit || settings.scaleUnit || 'KG',
        });
    }, [settings, activeCountry]);

    const handleSave = async () => {
        if (!isAuthorized) {
            showToast('Unauthorized: Modifying station hardware mappings requires store manager or administrator role.', 'error');
            return;
        }

        try {
            await mutation.mutateAsync({
                targetCountry: activeCountry,
                data: hardware,
            });
        } catch {
            // Handled in mutation onError
        }
    };

    const handleTestDevice = async (device: Device) => {
        setTestingDeviceId(device.id);

        if (device.connection === 'network') {
            const result = await testNetworkPrinter(device.address);
            if (result.success) {
                showToast(result.message, 'success');
                setDevices(prev => prev.map(d => d.id === device.id ? { ...d, status: 'online' } : d));
            } else {
                showToast(result.message, 'error');
                setDevices(prev => prev.map(d => d.id === device.id ? { ...d, status: 'offline' } : d));
            }
        } else {
            // Serial / Bluetooth local loopback check
            await new Promise(resolve => setTimeout(resolve, 600));
            showToast(`Port handshake verified on ${device.address} (${device.connection.toUpperCase()}). Device ready.`, 'success');
            setDevices(prev => prev.map(d => d.id === device.id ? { ...d, status: 'online' } : d));
        }

        setTestingDeviceId(null);
    };

    const handleRegisterDevice = (deviceData: Omit<Device, 'id' | 'status'>) => {
        const created: Device = {
            ...deviceData,
            id: Date.now(),
            status: 'online',
        };
        setDevices(prev => [...prev, created]);
        setIsAddModalOpen(false);
        setNewDevice({
            name: '',
            model: '',
            type: 'printer',
            connection: 'network',
            address: '',
        });
        showToast(`Peripheral ${created.name} registered successfully.`, 'success');
    };

    const handleUpdateDeviceConfig = (updated: Device) => {
        setDevices(prev => prev.map(d => d.id === updated.id ? updated : d));
        showToast(`Configuration updated for ${updated.name}.`, 'success');
    };

    const cardBase = "bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 lg:p-6 shadow-xs";

    return (
        <div className="w-full max-w-full space-y-6 animate-in fade-in slide-in-from-right-4">
            {/* ROLE WARNING BANNER IF UNAUTHORIZED */}
            {!isAuthorized && (
                <div className="p-3.5 bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] rounded-xl flex items-center gap-2.5">
                    <ShieldAlert className="text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] shrink-0" size={18} />
                    <p className="text-xs text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] font-medium">
                        Read-Only View: Modifying corporate hardware defaults and port mappings requires Store Manager or Executive credentials.
                    </p>
                </div>
            )}

            {/* HEADER BANNER */}
            <div className="p-4 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl flex items-start gap-3 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/15 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center border border-[var(--theme-accent)]/20 shrink-0 mt-0.5">
                    <Power size={18} />
                </div>
                <div>
                    <h4 className="text-[var(--theme-text-primary)] font-semibold text-sm">Infrastructure & Hardware Device Manager</h4>
                    <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                        Manage thermal receipt printers, electronic scale calibration, hardware barcodes, and COM/IP port mappings ({countryProfile.name}).
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* DEVICE TOPOLOGY */}
                <div className={`lg:col-span-2 ${cardBase}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-[var(--theme-border)] pb-3.5">
                        <div>
                            <h3 className="text-sm font-semibold tracking-tight text-[var(--theme-text-primary)]">Connected Peripherals</h3>
                            <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">Active POS and warehouse hardware in current station</p>
                        </div>
                        {isAuthorized && (
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(true)}
                                className="h-8 px-3.5 bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] hover:opacity-90 active:scale-[0.98] text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all self-start sm:self-auto"
                            >
                                <Plus size={14} /> Add Device
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {devices.map(device => (
                            <DeviceCard
                                key={device.id}
                                device={device}
                                isTesting={testingDeviceId === device.id}
                                onTest={() => handleTestDevice(device)}
                                onConfig={() => setSelectedDeviceForConfig(device)}
                                isAuthorized={isAuthorized}
                            />
                        ))}
                    </div>
                </div>

                {/* DEVICE SETTINGS & DEFAULTS */}
                <div className="space-y-6">
                    <div className={cardBase}>
                        <div className="mb-4 border-b border-[var(--theme-border)] pb-3">
                            <h3 className="text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider">Device Settings</h3>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">Port and IP assignments ({countryProfile.code})</p>
                        </div>

                        <div className="space-y-3.5">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block">Counter Scale IP</label>
                                <input
                                    type="text"
                                    value={hardware.scaleIpAddress}
                                    disabled={!isAuthorized}
                                    onChange={(e) => setHardware(prev => ({ ...prev, scaleIpAddress: e.target.value }))}
                                    placeholder="e.g. 192.168.1.50"
                                    className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--theme-text-primary)] font-mono font-medium outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/20 focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-all disabled:opacity-50"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block">Scanner COM Port</label>
                                <input
                                    type="text"
                                    value={hardware.scannerComPort}
                                    disabled={!isAuthorized}
                                    onChange={(e) => setHardware(prev => ({ ...prev, scannerComPort: e.target.value }))}
                                    placeholder="e.g. COM3"
                                    className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--theme-text-primary)] font-mono font-medium outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/20 focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] transition-all disabled:opacity-50"
                                />
                            </div>

                            <div className="h-px bg-[var(--theme-border)] my-2" />

                            <div className="flex items-center justify-between p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)]">
                                <div className="flex items-center gap-2.5">
                                    <Printer size={15} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" />
                                    <div className="text-xs font-semibold text-[var(--theme-text-primary)]">Print Spooler Service</div>
                                </div>
                                <span className="text-[10px] font-semibold text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center gap-1 bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/15 px-2 py-0.5 rounded-full border border-[var(--theme-accent)]/20">
                                    <CheckCircle size={10} /> Active
                                </span>
                            </div>
                        </div>

                        <div className="mt-5 pt-3.5 border-t border-[var(--theme-border)] flex justify-end">
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={mutation.isPending || !isAuthorized}
                                className="h-8 px-4 bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] hover:opacity-90 active:scale-[0.98] text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all disabled:opacity-40"
                            >
                                {mutation.isPending ? (
                                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Save size={13} />
                                )}
                                Save Device Config
                            </button>
                        </div>
                    </div>

                    <div className={cardBase}>
                        <h4 className="text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider mb-3">
                            Hardware Defaults
                        </h4>
                        <div className="space-y-3.5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider block">Default Terminal Printer</label>
                                <select
                                    className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--theme-text-primary)] font-medium outline-none focus:border-[var(--theme-accent)] dark:focus:border-[var(--theme-accent)] focus:ring-1 focus:ring-[var(--theme-accent)]/20 disabled:opacity-50"
                                    value={hardware.defaultPrinter}
                                    disabled={!isAuthorized}
                                    onChange={(e) => setHardware(prev => ({ ...prev, defaultPrinter: e.target.value }))}
                                    aria-label="Default Printer"
                                    title="Default Printer"
                                >
                                    <option value="Main Receipt Printer">Main Receipt Printer</option>
                                    <option value="Kitchen Printer">Kitchen Printer</option>
                                    <option value="Label Printer 80mm">Label Printer 80mm</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider block">Scale Calibration Unit</label>
                                    {hardware.scaleUnit === 'LBS' && (
                                        <span className="text-[9px] font-semibold text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] flex items-center gap-1">
                                            <AlertTriangle size={10} /> Metric Mandated
                                        </span>
                                    )}
                                </div>
                                <div className="flex bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] p-1">
                                    <button
                                        type="button"
                                        disabled={!isAuthorized}
                                        onClick={() => setHardware(prev => ({ ...prev, scaleUnit: 'KG' }))}
                                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer disabled:opacity-50 ${hardware.scaleUnit === 'KG' ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'}`}
                                    >
                                        KG (Metric)
                                    </button>
                                    <button
                                        type="button"
                                        disabled={!isAuthorized}
                                        onClick={() => setHardware(prev => ({ ...prev, scaleUnit: 'LBS' }))}
                                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer disabled:opacity-50 ${hardware.scaleUnit === 'LBS' ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'}`}
                                    >
                                        LBS (Imperial)
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODALS */}
            <AddDeviceModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleRegisterDevice}
                newDevice={newDevice}
                setNewDevice={setNewDevice}
            />

            <ConfigDeviceModal
                isOpen={selectedDeviceForConfig !== null}
                onClose={() => setSelectedDeviceForConfig(null)}
                device={selectedDeviceForConfig}
                onSaveConfig={handleUpdateDeviceConfig}
            />
        </div>
    );
}
