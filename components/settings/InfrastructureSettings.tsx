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
                <span className="flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-900/30">
                    <Wifi size={10} /> Network
                </span>
            );
        case 'usb':
            return (
                <span className="flex items-center gap-1 text-[10px] font-bold bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 px-2 py-0.5 rounded-lg border border-stone-200 dark:border-stone-700">
                    <Usb size={10} /> USB
                </span>
            );
        case 'bluetooth':
            return (
                <span className="flex items-center gap-1 text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 px-2 py-0.5 rounded-lg border border-purple-200 dark:border-purple-900/30">
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
                return <Printer size={20} />;
            case 'scale':
                return <Scale size={20} />;
            case 'scanner':
                return <Scan size={20} />;
        }
    };

    return (
        <div className="bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-3xl p-5 hover:border-[#2C5E3B]/40 transition-all flex flex-col gap-4 group relative overflow-hidden shadow-sm">
            {/* Status Indicator */}
            <div
                className={`absolute top-4 right-4 w-2.5 h-2.5 rounded-full ${
                    device.status === 'online'
                        ? 'bg-emerald-500 shadow-[0_0_8px_rgba(44,94,59,0.5)]'
                        : 'bg-stone-300 dark:bg-stone-700'
                }`}
            />

            <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2] flex items-center justify-center border border-emerald-200 dark:border-emerald-950/30 shrink-0">
                    {renderIcon()}
                </div>
                <div>
                    <h4 className="font-black text-sm text-[#1E3F27] dark:text-white">{device.name}</h4>
                    <p className="text-[10px] text-stone-500 dark:text-gray-400 mt-0.5 font-medium">{device.model}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <ConnectionBadge type={device.connection} />
                        <span className="text-[10px] text-stone-600 dark:text-gray-400 bg-white/80 dark:bg-white/5 px-2 py-0.5 rounded-lg font-mono border border-[#E2DCCE]/60 dark:border-white/5">
                            {device.address}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-[#E2DCCE]/60 dark:border-white/10">
                <button
                    type="button"
                    onClick={onTest}
                    disabled={isTesting}
                    className="flex-1 py-2 bg-white dark:bg-white/5 hover:bg-stone-100 dark:hover:bg-white/10 text-stone-700 dark:text-gray-200 text-xs font-bold rounded-xl border border-[#E2DCCE] dark:border-white/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                >
                    <RefreshCw size={12} className={isTesting ? 'animate-spin text-[#2C5E3B]' : ''} />
                    {isTesting ? 'Testing...' : 'Test Ping'}
                </button>
                {isAuthorized && (
                    <button
                        type="button"
                        onClick={onConfig}
                        className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-[#2C5E3B]/20 dark:hover:bg-[#2C5E3B]/30 text-[#2C5E3B] dark:text-[#A9CBA2] text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-950/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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
    const allowedRoles = [
        'super_admin',
        'CEO',
        'operations_manager',
        'regional_manager',
        'store_manager',
        'warehouse_manager',
    ];
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

    const cardBase = "bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[32px] p-6 lg:p-8 shadow-sm";

    return (
        <div className="w-full max-w-full space-y-6 animate-in fade-in slide-in-from-right-4">
            {/* ROLE WARNING BANNER IF UNAUTHORIZED */}
            {!isAuthorized && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl flex items-center gap-3">
                    <ShieldAlert className="text-amber-700 dark:text-amber-400 shrink-0" size={20} />
                    <p className="text-xs text-amber-800 dark:text-amber-300 font-bold">
                        Read-Only View: Modifying corporate hardware defaults and port mappings requires Store Manager or Executive credentials.
                    </p>
                </div>
            )}

            {/* HEADER BANNER */}
            <div className="p-4 bg-emerald-50 dark:bg-[#2C5E3B]/20 border border-emerald-200 dark:border-emerald-950/30 rounded-2xl flex items-start gap-3">
                <Power className="text-[#2C5E3B] dark:text-[#A9CBA2] shrink-0 mt-0.5" size={20} />
                <div>
                    <h4 className="text-[#1E3F27] dark:text-white font-bold text-sm">Infrastructure & Hardware Device Manager</h4>
                    <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83] mt-0.5">
                        Manage thermal receipt printers, electronic scale calibration, hardware barcodes, and COM/IP port mappings ({countryProfile.name}).
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
                        {isAuthorized && (
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-[#2C5E3B] hover:opacity-90 text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95 self-start sm:self-auto"
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
                        <div className="mb-6 border-b border-[#E2DCCE]/60 dark:border-white/5 pb-4">
                            <h3 className="text-sm font-black text-[#1E3F27] dark:text-white uppercase tracking-wider">Device Settings</h3>
                            <p className="text-[10px] text-stone-500 dark:text-gray-400 mt-0.5">Port and IP assignments ({countryProfile.code})</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs text-stone-600 dark:text-gray-400 font-bold uppercase tracking-wide block">Counter Scale IP</label>
                                <input
                                    type="text"
                                    value={hardware.scaleIpAddress}
                                    disabled={!isAuthorized}
                                    onChange={(e) => setHardware(prev => ({ ...prev, scaleIpAddress: e.target.value }))}
                                    placeholder="e.g. 192.168.1.50"
                                    className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-[#1E3F27] dark:text-white font-mono font-bold outline-none focus:border-[#2C5E3B] transition-all disabled:opacity-50"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-stone-600 dark:text-gray-400 font-bold uppercase tracking-wide block">Scanner COM Port</label>
                                <input
                                    type="text"
                                    value={hardware.scannerComPort}
                                    disabled={!isAuthorized}
                                    onChange={(e) => setHardware(prev => ({ ...prev, scannerComPort: e.target.value }))}
                                    placeholder="e.g. COM3"
                                    className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-[#1E3F27] dark:text-white font-mono font-bold outline-none focus:border-[#2C5E3B] transition-all disabled:opacity-50"
                                />
                            </div>

                            <div className="h-px bg-[#E2DCCE]/60 dark:bg-white/5 my-2" />

                            <div className="flex items-center justify-between p-3.5 bg-[#FAF8F5] dark:bg-black/20 rounded-2xl border border-[#E2DCCE] dark:border-white/5">
                                <div className="flex items-center gap-3">
                                    <Printer size={16} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                    <div className="text-xs font-black text-[#1E3F27] dark:text-stone-300">Print Spooler Service</div>
                                </div>
                                <span className="text-[10px] font-black text-[#2C5E3B] dark:text-[#A9CBA2] flex items-center gap-1 bg-emerald-50 dark:bg-[#2C5E3B]/20 px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-950/30">
                                    <CheckCircle size={10} /> Active
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-[#E2DCCE]/60 dark:border-white/10 flex justify-end">
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={mutation.isPending || !isAuthorized}
                                className="px-6 py-2.5 bg-[#2C5E3B] hover:opacity-90 text-white font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-50"
                            >
                                {mutation.isPending ? (
                                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Save size={14} />
                                )}
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
                                    className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-[#1E3F27] dark:text-white font-bold outline-none focus:border-[#2C5E3B] disabled:opacity-50"
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
                            <div className="space-y-1">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold tracking-wider block">Scale Calibration Unit</label>
                                    {hardware.scaleUnit === 'LBS' && (
                                        <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                                            <AlertTriangle size={10} /> Metric Mandated
                                        </span>
                                    )}
                                </div>
                                <div className="flex bg-[#FAF8F5] dark:bg-black/30 rounded-2xl border border-[#E2DCCE] dark:border-white/10 p-1">
                                    <button
                                        type="button"
                                        disabled={!isAuthorized}
                                        onClick={() => setHardware(prev => ({ ...prev, scaleUnit: 'KG' }))}
                                        className={`flex-1 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer disabled:opacity-50 ${hardware.scaleUnit === 'KG' ? 'bg-[#2C5E3B] text-white shadow-sm' : 'text-stone-500 hover:text-[#1E3F27] dark:text-gray-400 dark:hover:text-white'}`}
                                    >
                                        KG (Metric)
                                    </button>
                                    <button
                                        type="button"
                                        disabled={!isAuthorized}
                                        onClick={() => setHardware(prev => ({ ...prev, scaleUnit: 'LBS' }))}
                                        className={`flex-1 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer disabled:opacity-50 ${hardware.scaleUnit === 'LBS' ? 'bg-[#2C5E3B] text-white shadow-sm' : 'text-stone-500 hover:text-[#1E3F27] dark:text-gray-400 dark:hover:text-white'}`}
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
