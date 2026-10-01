import React from 'react';
import Modal from '../../Modal';
import Button from '../../shared/Button';
import type { Device } from './hardwareTypes';

interface AddDeviceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (device: Omit<Device, 'id' | 'status'>) => void;
    newDevice: Omit<Device, 'id' | 'status'>;
    setNewDevice: React.Dispatch<React.SetStateAction<Omit<Device, 'id' | 'status'>>>;
}

export const AddDeviceModal: React.FC<AddDeviceModalProps> = ({
    isOpen,
    onClose,
    onAdd,
    newDevice,
    setNewDevice,
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add Connected Peripheral"
            footer={(
                <div className="flex gap-3 justify-end">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button
                        variant="primary"
                        onClick={() => onAdd(newDevice)}
                        disabled={!newDevice.name.trim() || !newDevice.address.trim()}
                    >
                        Register Device
                    </Button>
                </div>
            )}
        >
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-stone-600 dark:text-gray-400 uppercase mb-1">
                        Device Name
                    </label>
                    <input
                        type="text"
                        value={newDevice.name}
                        onChange={(e) => setNewDevice(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Counter 2 Receipt Printer"
                        className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-[#1E3F27] dark:text-white font-bold outline-none focus:border-[#2C5E3B]"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-stone-600 dark:text-gray-400 uppercase mb-1">
                            Model
                        </label>
                        <input
                            type="text"
                            value={newDevice.model}
                            onChange={(e) => setNewDevice(prev => ({ ...prev, model: e.target.value }))}
                            placeholder="e.g. Epson TM-T88VI"
                            className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-[#1E3F27] dark:text-white font-bold outline-none focus:border-[#2C5E3B]"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-stone-600 dark:text-gray-400 uppercase mb-1">
                            Category
                        </label>
                        <select
                            value={newDevice.type}
                            onChange={(e) => setNewDevice(prev => ({ ...prev, type: e.target.value as Device['type'] }))}
                            className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-3 py-2.5 text-xs text-[#1E3F27] dark:text-white font-bold outline-none focus:border-[#2C5E3B]"
                        >
                            <option value="printer">Thermal Printer</option>
                            <option value="scale">Electronic Scale</option>
                            <option value="scanner">Barcode Scanner</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-stone-600 dark:text-gray-400 uppercase mb-1">
                            Connection
                        </label>
                        <select
                            value={newDevice.connection}
                            onChange={(e) => setNewDevice(prev => ({ ...prev, connection: e.target.value as Device['connection'] }))}
                            className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-3 py-2.5 text-xs text-[#1E3F27] dark:text-white font-bold outline-none focus:border-[#2C5E3B]"
                        >
                            <option value="network">Network (Ethernet/WiFi)</option>
                            <option value="usb">USB Port</option>
                            <option value="bluetooth">Bluetooth</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-stone-600 dark:text-gray-400 uppercase mb-1">
                            IP Address / COM Port
                        </label>
                        <input
                            type="text"
                            value={newDevice.address}
                            onChange={(e) => setNewDevice(prev => ({ ...prev, address: e.target.value }))}
                            placeholder={newDevice.connection === 'network' ? '192.168.1.200' : newDevice.connection === 'usb' ? 'COM3' : 'BT-MAC-001'}
                            className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-[#1E3F27] dark:text-white font-mono font-bold outline-none focus:border-[#2C5E3B]"
                        />
                    </div>
                </div>
            </div>
        </Modal>
    );
};

interface ConfigDeviceModalProps {
    isOpen: boolean;
    onClose: () => void;
    device: Device | null;
    onSaveConfig: (updatedDevice: Device) => void;
}

export const ConfigDeviceModal: React.FC<ConfigDeviceModalProps> = ({
    isOpen,
    onClose,
    device,
    onSaveConfig,
}) => {
    const [address, setAddress] = React.useState('');

    React.useEffect(() => {
        if (device) setAddress(device.address);
    }, [device]);

    if (!device) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Configure ${device.name}`}
            footer={(
                <div className="flex gap-3 justify-end">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button
                        variant="primary"
                        onClick={() => {
                            onSaveConfig({ ...device, address });
                            onClose();
                        }}
                        disabled={!address.trim()}
                    >
                        Save Configuration
                    </Button>
                </div>
            )}
        >
            <div className="space-y-4">
                <div className="p-3 bg-emerald-50 dark:bg-[#2C5E3B]/20 rounded-xl border border-emerald-200 dark:border-emerald-950/30">
                    <p className="text-xs font-bold text-[#1E3F27] dark:text-white">{device.name}</p>
                    <p className="text-[10px] text-stone-500 dark:text-gray-400 mt-0.5">Model: {device.model} ({device.type.toUpperCase()})</p>
                </div>

                <div>
                    <label className="block text-xs font-bold text-stone-600 dark:text-gray-400 uppercase mb-1">
                        Endpoint Address / COM Port
                    </label>
                    <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-[#1E3F27] dark:text-white font-mono font-bold outline-none focus:border-[#2C5E3B]"
                    />
                    <p className="text-[10px] text-stone-500 dark:text-gray-400 mt-1 ml-1">
                        {device.connection === 'network' ? 'Standard ESC/POS port 9100 will be used for network communication.' : 'Specify the OS serial port identifier.'}
                    </p>
                </div>
            </div>
        </Modal>
    );
};
