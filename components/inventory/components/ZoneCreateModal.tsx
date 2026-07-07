import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface ZoneCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {
        name: string;
        type: 'Dry' | 'Cold' | 'Secure';
        zoneType: string;
        capacity: number;
        temperature?: string;
        pickingPriority: number;
        allowPicking: boolean;
        allowPutaway: boolean;
    }) => Promise<void>;
    isLoading: boolean;
}

export const ZoneCreateModal: React.FC<ZoneCreateModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    isLoading
}) => {
    const { t } = useLanguage();

    const [zoneName, setZoneName] = useState('');
    const [zoneType, setZoneType] = useState<'Dry' | 'Cold' | 'Secure'>('Dry');
    const [zoneSubtype, setZoneSubtype] = useState('STANDARD');
    const [capacity, setCapacity] = useState<number>(5000);
    const [temperature, setTemperature] = useState('');
    const [pickingPriority, setPickingPriority] = useState<number>(10);
    const [allowPicking, setAllowPicking] = useState(true);
    const [allowPutaway, setAllowPutaway] = useState(true);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit({
            name: zoneName,
            type: zoneType,
            zoneType: zoneSubtype,
            capacity: capacity || 1000,
            temperature: zoneType === 'Cold' ? temperature || '4°C' : undefined,
            pickingPriority: pickingPriority || 10,
            allowPicking,
            allowPutaway
        });
        // Reset
        setZoneName('');
        setZoneType('Dry');
        setZoneSubtype('STANDARD');
        setCapacity(5000);
        setTemperature('');
        setPickingPriority(10);
        setAllowPicking(true);
        setAllowPutaway(true);
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
            <form onSubmit={handleSubmit} className="relative w-full max-w-lg rounded-3xl bg-[#FAF8F5] dark:bg-[#18201B] border border-[#E2DCCE] dark:border-white/10 shadow-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2DCCE]/50 dark:border-white/5 pb-3">
                    <h3 className="text-base font-black text-[#1E3F27] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Plus size={18} /> Create Storage Zone
                    </h3>
                    <button type="button" onClick={onClose} title="Close" aria-label="Close" className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-white/5 text-stone-400 cursor-pointer"><X size={18} /></button>
                </div>

                <div className="space-y-4 text-left">
                    <div className="space-y-1">
                        <label htmlFor="create-zone-name" className="text-[10px] text-stone-400 dark:text-gray-555 font-black uppercase tracking-wider block">Zone Name</label>
                        <input
                            type="text"
                            id="create-zone-name"
                            title="Zone Name"
                            required
                            value={zoneName}
                            onChange={(e) => setZoneName(e.target.value)}
                            placeholder="e.g. Zone D (Fresh Produce)"
                            className="w-full bg-[#FAF8F5] dark:bg-black/35 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#2C5E3B]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label htmlFor="create-storage-class" className="text-[10px] text-stone-400 dark:text-gray-555 font-black uppercase tracking-wider block">Storage Class</label>
                            <select
                                id="create-storage-class"
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
                            <label htmlFor="create-zone-subtype" className="text-[10px] text-stone-400 dark:text-gray-555 font-black uppercase tracking-wider block">Zone Type</label>
                            <input
                                type="text"
                                id="create-zone-subtype"
                                title="Zone Type"
                                required
                                value={zoneSubtype}
                                onChange={(e) => setZoneSubtype(e.target.value.toUpperCase())}
                                placeholder="e.g. PRODUCE, BULK, COLD"
                                className="w-full bg-[#FAF8F5] dark:bg-black/35 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white font-mono focus:outline-none focus:border-[#2C5E3B]"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label htmlFor="create-capacity" className="text-[10px] text-stone-400 dark:text-gray-555 font-black uppercase tracking-wider block">Item Capacity (Max)</label>
                            <input
                                type="number"
                                id="create-capacity"
                                title="Item Capacity (Max)"
                                placeholder="Item Capacity (Max)"
                                min="1"
                                required
                                value={capacity}
                                onChange={(e) => setCapacity(Math.max(1, parseInt(e.target.value) || 1000))}
                                className="w-full bg-[#FAF8F5] dark:bg-black/35 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white font-mono focus:outline-none focus:border-[#2C5E3B]"
                            />
                        </div>
                        <div className="space-y-1">
                            <label htmlFor="create-temperature" className="text-[10px] text-stone-400 dark:text-gray-555 font-black uppercase tracking-wider block">Target Temp (Cold only)</label>
                            <input
                                type="text"
                                id="create-temperature"
                                title="Target Temp"
                                disabled={zoneType !== 'Cold'}
                                value={temperature}
                                onChange={(e) => setTemperature(e.target.value)}
                                placeholder="e.g. 4°C or -18°C"
                                className="w-full bg-[#FAF8F5] dark:bg-black/35 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white disabled:opacity-30 focus:outline-none focus:border-[#2C5E3B]"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label htmlFor="create-picking-priority" className="text-[10px] text-stone-400 dark:text-gray-555 font-black uppercase tracking-wider block">Picking Priority (1-20)</label>
                            <input
                                type="number"
                                id="create-picking-priority"
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
                        {isLoading ? 'Creating...' : 'Create Zone'}
                    </button>
                </div>
            </form>
        </div>
    );
};
export default ZoneCreateModal;
