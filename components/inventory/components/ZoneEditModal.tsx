import React, { useState, useEffect } from 'react';
import { Settings2, X, Lock } from 'lucide-react';
import { WarehouseZone, Product } from '../../../types';

interface ZoneWithProducts extends WarehouseZone {
    assignedProducts: Product[];
}

interface ZoneEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    zone: ZoneWithProducts | null;
    onSubmit: (id: string, data: {
        name: string;
        type: 'Dry' | 'Cold' | 'Secure';
        zoneType: string;
        capacity: number;
        temperature?: string;
        pickingPriority: number;
        allowPicking: boolean;
        allowPutaway: boolean;
        isLocked: boolean;
        lockReason?: string;
    }) => Promise<void>;
    isLoading: boolean;
}

export const ZoneEditModal: React.FC<ZoneEditModalProps> = ({
    isOpen,
    onClose,
    zone,
    onSubmit,
    isLoading
}) => {
    const [zoneName, setZoneName] = useState('');
    const [zoneType, setZoneType] = useState<'Dry' | 'Cold' | 'Secure'>('Dry');
    const [zoneSubtype, setZoneSubtype] = useState('STANDARD');
    const [capacity, setCapacity] = useState<number>(5000);
    const [temperature, setTemperature] = useState('');
    const [pickingPriority, setPickingPriority] = useState<number>(10);
    const [allowPicking, setAllowPicking] = useState(true);
    const [allowPutaway, setAllowPutaway] = useState(true);
    const [isLocked, setIsLocked] = useState(false);
    const [lockReason, setLockReason] = useState('');

    useEffect(() => {
        if (zone) {
            setZoneName(zone.name);
            setZoneType(zone.type as any || 'Dry');
            setZoneSubtype(zone.zoneType || 'STANDARD');
            setCapacity(zone.capacity || 5000);
            setTemperature(zone.temperature || '');
            setPickingPriority(zone.pickingPriority || 10);
            setAllowPicking(zone.allowPicking ?? true);
            setAllowPutaway(zone.allowPutaway ?? true);
            setIsLocked(zone.isLocked ?? false);
            setLockReason(zone.lockReason || '');
        }
    }, [zone]);

    if (!isOpen || !zone) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(zone.id, {
            name: zoneName,
            type: zoneType,
            zoneType: zoneSubtype,
            capacity: capacity || 1000,
            temperature: zoneType === 'Cold' ? temperature || '4°C' : undefined,
            pickingPriority: pickingPriority || 10,
            allowPicking,
            allowPutaway,
            isLocked,
            lockReason: isLocked ? lockReason : undefined
        });
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
            <form onSubmit={handleSubmit} className="relative w-full max-w-lg rounded-3xl bg-[#FAF8F5] dark:bg-[#18201B] border border-[#E2DCCE] dark:border-white/10 shadow-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2DCCE]/50 dark:border-white/5 pb-3">
                    <h3 className="text-base font-black text-[#1E3F27] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Settings2 size={18} /> Configure Zone: {zone.name}
                    </h3>
                    <button type="button" onClick={onClose} title="Close" aria-label="Close" className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-white/5 text-stone-400 cursor-pointer"><X size={18} /></button>
                </div>

                <div className="space-y-4 text-left">
                    <div className="space-y-1">
                        <label htmlFor="edit-zone-name" className="text-[10px] text-stone-400 dark:text-gray-555 font-black uppercase tracking-wider block">Zone Name</label>
                        <input
                            type="text"
                            id="edit-zone-name"
                            title="Zone Name"
                            placeholder="Zone Name"
                            required
                            value={zoneName}
                            onChange={(e) => setZoneName(e.target.value)}
                            className="w-full bg-[#FAF8F5] dark:bg-black/35 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#2C5E3B]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label htmlFor="edit-storage-class" className="text-[10px] text-stone-400 dark:text-gray-555 font-black uppercase tracking-wider block">Storage Class</label>
                            <select
                                id="edit-storage-class"
                                title="Storage Class"
                                aria-label="Storage Class"
                                value={zoneType}
                                onChange={(e) => setZoneType(e.target.value as any)}
                                className="w-full bg-[#FAF8F5] dark:bg-black/35 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#2C5E3B] cursor-pointer"
                            >
                                <option value="Dry">Dry Storage</option>
                                <option value="Cold">Cold Storage</option>
                                <option value="Secure">Secure (Locked)</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label htmlFor="edit-zone-subtype" className="text-[10px] text-stone-400 dark:text-gray-555 font-black uppercase tracking-wider block">Zone Type</label>
                            <input
                                type="text"
                                id="edit-zone-subtype"
                                title="Zone Type"
                                placeholder="Zone Type"
                                required
                                value={zoneSubtype}
                                onChange={(e) => setZoneSubtype(e.target.value.toUpperCase())}
                                className="w-full bg-[#FAF8F5] dark:bg-black/35 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white font-mono focus:outline-none focus:border-[#2C5E3B]"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label htmlFor="edit-capacity" className="text-[10px] text-stone-400 dark:text-gray-555 font-black uppercase tracking-wider block">Item Capacity</label>
                            <input
                                type="number"
                                id="edit-capacity"
                                title="Item Capacity"
                                placeholder="Item Capacity"
                                min="1"
                                required
                                value={capacity}
                                onChange={(e) => setCapacity(Math.max(1, parseInt(e.target.value) || 1000))}
                                className="w-full bg-[#FAF8F5] dark:bg-black/35 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white font-mono focus:outline-none focus:border-[#2C5E3B]"
                            />
                        </div>
                        <div className="space-y-1">
                            <label htmlFor="edit-temperature" className="text-[10px] text-stone-400 dark:text-gray-555 font-black uppercase tracking-wider block">Target Temp</label>
                            <input
                                type="text"
                                id="edit-temperature"
                                title="Target Temp"
                                placeholder="e.g. 4°C"
                                disabled={zoneType !== 'Cold'}
                                value={temperature}
                                onChange={(e) => setTemperature(e.target.value)}
                                className="w-full bg-[#FAF8F5] dark:bg-black/35 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white disabled:opacity-30 focus:outline-none focus:border-[#2C5E3B]"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label htmlFor="edit-picking-priority" className="text-[10px] text-stone-400 dark:text-gray-555 font-black uppercase tracking-wider block">Picking Priority (1-20)</label>
                            <input
                                type="number"
                                id="edit-picking-priority"
                                title="Picking Priority (1-20)"
                                placeholder="Picking Priority (1-20)"
                                min="1"
                                max="20"
                                required
                                value={pickingPriority}
                                onChange={(e) => setPickingPriority(Math.max(1, Math.min(20, parseInt(e.target.value) || 10)))}
                                className="w-full bg-[#FAF8F5] dark:bg-black/35 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white font-mono focus:outline-none focus:border-[#2C5E3B]"
                            />
                        </div>
                        <div className="flex items-center gap-6 pt-5">
                            <label className="flex items-center gap-2 text-xs font-bold text-gray-750 dark:text-gray-300 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={allowPicking}
                                    onChange={(e) => setAllowPicking(e.target.checked)}
                                    className="rounded border-[#E2DCCE] text-[#2C5E3B] focus:ring-[#2C5E3B] cursor-pointer"
                                />
                                Allow Pick
                            </label>
                            <label className="flex items-center gap-2 text-xs font-bold text-gray-750 dark:text-gray-300 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={allowPutaway}
                                    onChange={(e) => setAllowPutaway(e.target.checked)}
                                    className="rounded border-[#E2DCCE] text-[#2C5E3B] focus:ring-[#2C5E3B] cursor-pointer"
                                />
                                Allow Putaway
                            </label>
                        </div>
                    </div>

                    {/* Operational Lock Controls */}
                    <div className="p-4 bg-stone-50 dark:bg-black/25 rounded-2xl border border-[#E2DCCE]/60 dark:border-white/5 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white">
                                <Lock size={14} className="text-red-500" />
                                <span>Maintenance / Security Lock</span>
                            </div>
                            <label htmlFor="edit-zone-locked" className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    id="edit-zone-locked"
                                    title="Maintenance / Security Lock"
                                    aria-label="Maintenance / Security Lock"
                                    checked={isLocked}
                                    onChange={(e) => setIsLocked(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-stone-300 dark:bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500"></div>
                            </label>
                        </div>
                        {isLocked && (
                            <div className="space-y-1 animate-in fade-in duration-200">
                                <label htmlFor="edit-lock-reason" className="text-[9px] text-stone-400 dark:text-gray-555 font-black uppercase tracking-wider block">Lock Reason</label>
                                <input
                                    type="text"
                                    id="edit-lock-reason"
                                    title="Lock Reason"
                                    required={isLocked}
                                    value={lockReason}
                                    onChange={(e) => setLockReason(e.target.value)}
                                    placeholder="e.g., Physical inventory audit in progress"
                                    className="w-full bg-[#FAF8F5] dark:bg-black/45 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#2C5E3B]"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-3 justify-end border-t border-[#E2DCCE]/50 dark:border-white/5 pt-4 mt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-white/5 dark:hover:bg-white/10 text-stone-500 dark:text-stone-300 font-bold text-xs rounded-xl border border-[#E2DCCE] dark:border-white/10 transition-colors uppercase tracking-wider cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 bg-gradient-to-br from-[#2C5E3B] to-[#224429] hover:from-[#1E3F27] hover:to-[#17301F] text-white font-black text-xs rounded-xl transition-all shadow-sm uppercase tracking-wider cursor-pointer disabled:opacity-50"
                    >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};
export default ZoneEditModal;
