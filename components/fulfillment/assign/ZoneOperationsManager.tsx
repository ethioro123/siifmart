import React, { useState } from 'react';
import {
    Shield, Unlock, Lock, Plus, Trash2, CheckCircle, XCircle, AlertTriangle, Layers,
    ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import Button from '../../shared/Button';
import { WarehouseZone, WMSJob } from '../../../types'; // Assuming WMSJob exists
import { warehouseZonesService } from '../../../services/supabase.service';
import Modal from '../../../components/Modal'; // Correct path for Modal

interface ZoneOperationsManagerProps {
    zones: WarehouseZone[];
    jobs: WMSJob[]; // For calculating active jobs per zone
    activeSiteId: string;
    onZoneUpdate: () => void;
    addNotification: (type: any, message: string) => void;
    onClose: () => void;
}

export const ZoneOperationsManager: React.FC<ZoneOperationsManagerProps> = ({
    zones,
    jobs,
    activeSiteId,
    onZoneUpdate,
    addNotification,
    onClose
}) => {
    // --- State ---
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    // New Zone Form State
    const [newZoneName, setNewZoneName] = useState('');
    const [newZoneType, setNewZoneType] = useState<'Dry' | 'Cold' | 'Secure' | 'Bulk' | 'Forward' | 'Staging' | 'Damaged'>('Bulk');
    const [newZoneCapacity, setNewZoneCapacity] = useState(100);
    const [newZoneAllowPicking, setNewZoneAllowPicking] = useState(true);
    const [newZoneAllowPutaway, setNewZoneAllowPutaway] = useState(true);

    // --- Helpers ---
    const getActiveJobsCount = (zoneName: string) => {
        // Simple heuristic: job location starts with zone name
        return jobs.filter(j => j.location.startsWith(zoneName) && j.status !== 'Completed' && j.status !== 'Cancelled').length;
    };

    const getCapacityPercentage = (occupied: number, capacity: number) => {
        if (capacity === 0) return 0;
        return Math.min(100, Math.round((occupied / capacity) * 100));
    };

    // --- Handlers ---

    const handleToggleLock = async (zone: WarehouseZone) => {
        setIsProcessing(zone.id);
        try {
            await warehouseZonesService.update(zone.id, {
                isLocked: !zone.isLocked,
                lockReason: !zone.isLocked ? 'Manual Lock from Ops' : null,
                lockedAt: !zone.isLocked ? new Date().toISOString() : null,
                // We could track user here if we had it in props, but simple toggle for now
            });
            onZoneUpdate();
            addNotification('success', `Zone ${zone.name} ${!zone.isLocked ? 'Locked' : 'Unlocked'}`);
        } catch (err) {
            console.error(err);
            addNotification('alert', 'Failed to toggle lock');
        } finally {
            setIsProcessing(null);
        }
    };

    const handleToggleRule = async (zone: WarehouseZone, rule: 'picking' | 'putaway') => {
        setIsProcessing(zone.id);
        const updates: Partial<WarehouseZone> = {};
        if (rule === 'picking') updates.allowPicking = !zone.allowPicking;
        if (rule === 'putaway') updates.allowPutaway = !zone.allowPutaway;

        try {
            await warehouseZonesService.update(zone.id, updates);
            onZoneUpdate();
            addNotification('success', `Updated rules for ${zone.name}`);
        } catch (err) {
            console.error(err);
            addNotification('alert', 'Failed to update rule');
        } finally {
            setIsProcessing(null);
        }
    };

    const handleDeleteZone = async (zone: WarehouseZone) => {
        if (!window.confirm(`Are you sure you want to delete zone ${zone.name}? This cannot be undone.`)) return;

        // Check if occupied or active jobs (client-side check for now)
        if (zone.occupied > 0) {
            addNotification('warning', 'Cannot delete zone with inventory (Occupied > 0)');
            return;
        }
        const activeJobs = getActiveJobsCount(zone.name);
        if (activeJobs > 0) {
            addNotification('warning', `Cannot delete zone with ${activeJobs} active jobs`);
            return;
        }

        setIsProcessing(zone.id);
        try {
            await warehouseZonesService.delete(zone.id);
            onZoneUpdate();
            addNotification('success', `Zone ${zone.name} deleted`);
        } catch (err) {
            console.error(err);
            addNotification('alert', 'Failed to delete zone');
        } finally {
            setIsProcessing(null);
        }
    };

    const handleCreateZone = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing('new');
        try {
            await warehouseZonesService.create({
                name: newZoneName.toUpperCase(),
                type: newZoneType,
                capacity: newZoneCapacity,
                occupied: 0,
                siteId: activeSiteId,
                pickingPriority: 50, // Default mid-priority
                zoneType: 'STANDARD', // Default
                allowPicking: newZoneAllowPicking,
                allowPutaway: newZoneAllowPutaway
            });
            onZoneUpdate();
            addNotification('success', 'Zone created successfully');
            setIsAddModalOpen(false);
            // Reset form
            setNewZoneName('');
            setNewZoneCapacity(100);
        } catch (err) {
            console.error(err);
            addNotification('alert', 'Failed to create zone');
        } finally {
            setIsProcessing(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18201B]/40 dark:bg-black/80 backdrop-blur-md p-4 transition-colors duration-300">
            <div className="glass-panel w-full max-w-6xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">

                {/* HEADER */}
                <div className="p-6 border-b border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] flex items-center justify-between bg-stone-50/50 dark:bg-black/30 transition-colors">
                    <div>
                        <h2 className="text-2xl font-black text-stone-900 dark:text-white flex items-center gap-3 transition-colors">
                            <Layers className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                            ZONE OPERATIONS
                        </h2>
                        <p className="text-stone-500 dark:text-stone-400 text-sm mt-1 transition-colors">Manage capacity, locks, and movement rules</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="woody-btn-primary font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 text-white dark:text-[#18201B]"
                        >
                            <Plus size={18} />
                            ADD ZONE
                        </button>
                        <button
                            onClick={onClose}
                            aria-label="Close Zone Operations"
                            title="Close"
                            className="p-2 bg-stone-100 dark:bg-black/30 hover:bg-[#EAE5D9]/50 dark:hover:bg-[#EAE5D9]/10 rounded-full transition-all text-stone-500 dark:text-stone-450 hover:text-stone-900 dark:hover:text-white"
                        >
                            <XCircle size={24} />
                        </button>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="grid grid-cols-1 gap-4">
                        {/* TABLE HEADER */}
                        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-stone-100/50 dark:bg-black/20 rounded-t-xl border-x border-t border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] text-xs font-black text-stone-500 dark:text-stone-400 uppercase tracking-widest transition-colors">
                            <div className="col-span-3">Zone Name & Type</div>
                            <div className="col-span-3">Capacity</div>
                            <div className="col-span-2 text-center">Active Jobs</div>
                            <div className="col-span-2 text-center">Status</div>
                            <div className="col-span-2 text-right">Actions</div>
                        </div>

                        {/* ZONES LIST */}
                        <div className="space-y-2">
                            {zones.map(zone => {
                                const activeJobs = getActiveJobsCount(zone.name);
                                const capacityPct = getCapacityPercentage(zone.occupied, zone.capacity);
                                const isZoneLocked = zone.isLocked;

                                return (
                                    <div
                                        key={zone.id}
                                        className={`grid grid-cols-12 gap-4 items-center px-4 py-4 rounded-xl border transition-all duration-200 ${isZoneLocked
                                            ? 'bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20 shadow-sm dark:shadow-none'
                                            : 'bg-stone-50/50 dark:bg-[#1C2620]/30 border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] hover:border-[#2C5E3B]/30 dark:hover:border-[#A9CBA2]/20 shadow-sm dark:shadow-none'
                                            }`}
                                    >
                                        {/* NAME & TYPE */}
                                        <div className="col-span-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg transition-colors ${isZoneLocked ? 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/20 text-[#2C5E3B] dark:text-[#A9CBA2]'}`}>
                                                    <Layers size={20} />
                                                </div>
                                                <div>
                                                    <h3 className={`text-base font-black transition-colors ${isZoneLocked ? 'text-red-600 dark:text-red-400' : 'text-stone-900 dark:text-white'}`}>
                                                        {zone.name}
                                                    </h3>
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-stone-100 dark:bg-black/20 text-stone-500 dark:text-stone-400 rounded uppercase mt-0.5 inline-block border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] transition-colors">
                                                        {zone.type}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* CAPACITY */}
                                        <div className="col-span-3">
                                            <div className="flex justify-between text-xs mb-1.5 transition-colors">
                                                <span className="text-stone-500 dark:text-stone-450 font-medium">{zone.occupied} / {zone.capacity}</span>
                                                <span className={`font-bold transition-colors ${capacityPct > 90 ? 'text-red-600 dark:text-red-400' : 'text-[#2C5E3B] dark:text-[#A9CBA2]'}`}>{capacityPct}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-stone-150 dark:bg-black/40 rounded-full overflow-hidden transition-colors">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${capacityPct > 90 ? 'bg-red-500' : 'bg-[#2C5E3B] dark:bg-[#A9CBA2]'}`}
                                                    ref={el => { if (el) el.style.setProperty('width', `${capacityPct}%`); }}
                                                />
                                            </div>
                                        </div>

                                        {/* ACTIVE JOBS */}
                                        <div className="col-span-2 flex justify-center">
                                            {activeJobs > 0 ? (
                                                <span className="px-2 py-1 bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 rounded-md text-xs font-bold transition-colors">
                                                    {activeJobs}
                                                </span>
                                            ) : (
                                                <span className="text-stone-300 dark:text-stone-600 text-xs font-medium transition-colors">-</span>
                                            )}
                                        </div>

                                        {/* STATUS (LOCK) */}
                                        <div className="col-span-2 flex justify-center">
                                            <button
                                                onClick={() => handleToggleLock(zone)}
                                                disabled={!!isProcessing}
                                                className={`w-32 py-1.5 rounded-lg flex items-center justify-center gap-2 text-xs font-bold border transition-all ${isZoneLocked
                                                    ? 'bg-red-500 text-white border-red-500 hover:scale-[1.02]'
                                                    : 'bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 text-[#2C5E3B] dark:text-[#A9CBA2] border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 hover:bg-[#2C5E3B]/20 dark:hover:bg-[#A9CBA2]/20'
                                                    }`}
                                            >
                                                {isZoneLocked ? (
                                                    <><Lock size={14} /> LOCKED</>
                                                ) : (
                                                    <><Unlock size={14} /> ACTIVE</>
                                                )}
                                            </button>
                                        </div>

                                        {/* ACTIONS */}
                                        <div className="col-span-2 flex justify-end">
                                            <button
                                                onClick={() => handleDeleteZone(zone)}
                                                disabled={!!isProcessing}
                                                aria-label="Delete Zone"
                                                className="p-2 bg-stone-100 dark:bg-black/30 text-stone-400 dark:text-stone-500 hover:text-red-500 dark:hover:text-red-450 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] hover:border-red-300"
                                                title="Delete Zone"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* ADD ZONE MODAL */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Create New Zone"
            >
                <form onSubmit={handleCreateZone} className="space-y-6">
                    <div>
                        <label htmlFor="newZoneName" className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2 transition-colors">Zone Name</label>
                        <input
                            id="newZoneName"
                            type="text"
                            required
                            value={newZoneName}
                            onChange={e => setNewZoneName(e.target.value)}
                            placeholder="e.g. A-WING"
                            className="woody-input w-full rounded-xl px-4 py-3 outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] font-mono"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2 transition-colors">Type</label>
                            <div className="grid grid-cols-1 gap-2">
                                {['Bulk', 'Forward', 'Staging', 'Damaged', 'Dry', 'Cold', 'Secure'].map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setNewZoneType(type as any)}
                                        className={`p-3 rounded-xl border text-left transition-all text-xs font-bold ${newZoneType === type
                                            ? 'bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 border-[#2C5E3B] dark:border-[#A9CBA2] text-stone-900 dark:text-white shadow-sm'
                                            : 'bg-stone-50/50 dark:bg-[#1C2620]/30 border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] text-stone-500 dark:text-stone-400 hover:bg-stone-100/50 dark:hover:bg-[#EAE5D9]/10'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="newZoneCapacity" className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2 transition-colors">Capacity (Slots)</label>
                            <input
                                id="newZoneCapacity"
                                type="number"
                                min="1"
                                required
                                value={newZoneCapacity}
                                onChange={e => setNewZoneCapacity(parseInt(e.target.value))}
                                className="woody-input w-full rounded-xl px-4 py-3 outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] font-mono"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3 transition-colors">Default Rules</label>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setNewZoneAllowPicking(!newZoneAllowPicking)}
                                className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${newZoneAllowPicking
                                    ? 'bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 border-[#2C5E3B] dark:border-[#A9CBA2] text-[#2C5E3B] dark:text-[#A9CBA2] shadow-sm'
                                    : 'bg-stone-50/50 dark:bg-[#1C2620]/30 border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] text-stone-400 dark:text-stone-500'
                                    }`}
                            >
                                <ArrowUpRight size={16} /> Allow Picking
                            </button>
                            <button
                                type="button"
                                onClick={() => setNewZoneAllowPutaway(!newZoneAllowPutaway)}
                                className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${newZoneAllowPutaway
                                    ? 'bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 border-[#2C5E3B] dark:border-[#A9CBA2] text-[#2C5E3B] dark:text-[#A9CBA2] shadow-sm'
                                    : 'bg-stone-50/50 dark:bg-[#1C2620]/30 border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] text-stone-400 dark:text-stone-500'
                                    }`}
                            >
                                <ArrowDownLeft size={16} /> Allow Putaway
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-[#E2DCCE]/30 dark:border-[#A9CBA2]/[0.04] flex justify-end gap-3 transition-colors">
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(false)}
                            className="woody-btn-secondary px-6 py-3 rounded-xl font-bold text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isProcessing === 'new'}
                            className="woody-btn-primary font-bold px-8 py-3 rounded-xl text-white dark:text-[#18201B]"
                        >
                            {isProcessing === 'new' ? 'Creating...' : 'Create Zone'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
