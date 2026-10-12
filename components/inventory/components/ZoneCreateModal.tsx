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
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <form onSubmit={handleSubmit} className="relative w-full max-w-lg rounded-3xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--theme-border)] pb-3">
                    <h3 className="text-base font-bold text-[var(--theme-text-primary)] uppercase tracking-wider flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20 flex items-center justify-center shrink-0">
                            <Plus size={16} />
                        </div>
                        <span>Create Storage Zone</span>
                    </h3>
                    <button type="button" onClick={onClose} title="Close" aria-label="Close" className="p-1.5 rounded-lg hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-muted)] cursor-pointer transition-colors"><X size={18} /></button>
                </div>

                <div className="space-y-4 text-left">
                    <div className="space-y-1.5">
                        <label htmlFor="create-zone-name" className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider block">Zone Name</label>
                        <input
                            type="text"
                            id="create-zone-name"
                            title="Zone Name"
                            required
                            value={zoneName}
                            onChange={(e) => setZoneName(e.target.value)}
                            placeholder="e.g. Zone D (Fresh Produce)"
                            className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)] font-medium"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label htmlFor="create-storage-class" className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider block">Storage Class</label>
                            <select
                                id="create-storage-class"
                                title="Storage Class"
                                aria-label="Storage Class"
                                value={zoneType}
                                onChange={(e) => setZoneType(e.target.value as any)}
                                className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)] cursor-pointer font-medium"
                            >
                                <option value="Dry">Dry Storage</option>
                                <option value="Cold">Cold Storage</option>
                                <option value="Secure">Secure (Locked)</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="create-zone-subtype" className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider block">Zone Type</label>
                            <input
                                type="text"
                                id="create-zone-subtype"
                                title="Zone Type"
                                required
                                value={zoneSubtype}
                                onChange={(e) => setZoneSubtype(e.target.value.toUpperCase())}
                                placeholder="e.g. PRODUCE, BULK, COLD"
                                className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--theme-text-primary)] font-mono uppercase focus:outline-none focus:border-[var(--theme-accent)] font-medium"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label htmlFor="create-capacity" className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider block">Item Capacity (Max)</label>
                            <input
                                type="number"
                                id="create-capacity"
                                title="Item Capacity (Max)"
                                placeholder="Item Capacity (Max)"
                                min="1"
                                required
                                value={capacity}
                                onChange={(e) => setCapacity(Math.max(1, parseInt(e.target.value) || 1000))}
                                className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--theme-text-primary)] font-mono tabular-nums focus:outline-none focus:border-[var(--theme-accent)] font-medium"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="create-temperature" className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider block">Target Temp (Cold only)</label>
                            <input
                                type="text"
                                id="create-temperature"
                                title="Target Temp"
                                disabled={zoneType !== 'Cold'}
                                value={temperature}
                                onChange={(e) => setTemperature(e.target.value)}
                                placeholder="e.g. 4°C or -18°C"
                                className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--theme-text-primary)] disabled:opacity-30 focus:outline-none focus:border-[var(--theme-accent)] font-medium"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label htmlFor="create-picking-priority" className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider block">Picking Priority (1-20)</label>
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
                                className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--theme-text-primary)] font-mono tabular-nums focus:outline-none focus:border-[var(--theme-accent)] font-medium"
                            />
                        </div>
                        <div className="flex items-center gap-6 pt-5">
                            <label className="flex items-center gap-2 text-xs font-semibold text-[var(--theme-text-secondary)] cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={allowPicking}
                                    onChange={(e) => setAllowPicking(e.target.checked)}
                                    className="rounded-md border-[var(--theme-border)] text-[var(--theme-accent)] focus:ring-[var(--theme-accent)] cursor-pointer"
                                />
                                Allow Pick
                            </label>
                            <label className="flex items-center gap-2 text-xs font-semibold text-[var(--theme-text-secondary)] cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={allowPutaway}
                                    onChange={(e) => setAllowPutaway(e.target.checked)}
                                    className="rounded-md border-[var(--theme-border)] text-[var(--theme-accent)] focus:ring-[var(--theme-accent)] cursor-pointer"
                                />
                                Allow Putaway
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 justify-end border-t border-[var(--theme-border)] pt-4 mt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-secondary)] font-semibold text-xs rounded-xl border border-[var(--theme-border)] transition-colors uppercase tracking-wider cursor-pointer shadow-xs"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 bg-[var(--theme-accent)] text-white font-semibold text-xs rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
                    >
                        {isLoading ? 'Creating...' : 'Create Zone'}
                    </button>
                </div>
            </form>
        </div>
    );
};
export default ZoneCreateModal;
