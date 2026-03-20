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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#121212] w-full max-w-6xl max-h-[90vh] rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* HEADER */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                    <div>
                        <h2 className="text-2xl font-black text-white flex items-center gap-3">
                            <Layers className="text-cyber-primary" />
                            ZONE OPERATIONS
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">Manage capacity, locks, and movement rules</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => setIsAddModalOpen(true)}
                            icon={<Plus size={18} />}
                            className="bg-cyber-primary text-black hover:bg-cyber-primary/90 font-bold"
                        >
                            ADD ZONE
                        </Button>
                        <button
                            onClick={onClose}
                            aria-label="Close Zone Operations"
                            title="Close"
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                        >
                            <XCircle size={24} />
                        </button>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="grid grid-cols-1 gap-4">
                        {/* TABLE HEADER */}
                        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-white/5 rounded-t-xl border-x border-t border-white/10 text-xs font-black text-gray-400 uppercase tracking-widest">
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
                                            ? 'bg-red-500/5 border-red-500/20'
                                            : 'bg-black/40 border-white/5 hover:border-white/20'
                                            }`}
                                    >
                                        {/* NAME & TYPE */}
                                        <div className="col-span-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${isZoneLocked ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                                    <Layers size={20} />
                                                </div>
                                                <div>
                                                    <h3 className={`text-base font-black ${isZoneLocked ? 'text-red-400' : 'text-white'}`}>
                                                        {zone.name}
                                                    </h3>
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-white/10 text-gray-300 rounded uppercase mt-0.5 inline-block">
                                                        {zone.type}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* CAPACITY */}
                                        <div className="col-span-3">
                                            <div className="flex justify-between text-xs mb-1.5">
                                                <span className="text-gray-400 font-medium">{zone.occupied} / {zone.capacity}</span>
                                                <span className={`font-bold ${capacityPct > 90 ? 'text-red-400' : 'text-cyber-primary'}`}>{capacityPct}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${capacityPct > 90 ? 'bg-red-500' : 'bg-cyber-primary'}`}
                                                    ref={el => { if (el) el.style.setProperty('width', `${capacityPct}%`); }}
                                                />
                                            </div>
                                        </div>

                                        {/* ACTIVE JOBS */}
                                        <div className="col-span-2 flex justify-center">
                                            {activeJobs > 0 ? (
                                                <span className="px-2 py-1 bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/20 rounded-md text-xs font-bold">
                                                    {activeJobs}
                                                </span>
                                            ) : (
                                                <span className="text-gray-600 text-xs font-medium">-</span>
                                            )}
                                        </div>

                                        {/* STATUS (LOCK) */}
                                        <div className="col-span-2 flex justify-center">
                                            <button
                                                onClick={() => handleToggleLock(zone)}
                                                disabled={!!isProcessing}
                                                className={`w-32 py-1.5 rounded-lg flex items-center justify-center gap-2 text-xs font-bold border transition-all ${isZoneLocked
                                                    ? 'bg-red-500 text-black border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
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
                                                className="p-2 bg-white/5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
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
                        <label htmlFor="newZoneName" className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Zone Name</label>
                        <input
                            id="newZoneName"
                            type="text"
                            required
                            value={newZoneName}
                            onChange={e => setNewZoneName(e.target.value)}
                            placeholder="e.g. A-WING"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyber-primary transition-all font-mono"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Type</label>
                            <div className="grid grid-cols-1 gap-2">
                                {['Bulk', 'Forward', 'Staging', 'Damaged', 'Dry', 'Cold', 'Secure'].map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setNewZoneType(type as any)}
                                        className={`p-3 rounded-xl border text-left transition-all text-xs font-bold ${newZoneType === type
                                            ? 'bg-cyber-primary/10 border-cyber-primary text-white'
                                            : 'bg-black/40 border-white/10 text-gray-400 hover:bg-white/5'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="newZoneCapacity" className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Capacity (Slots)</label>
                            <input
                                id="newZoneCapacity"
                                type="number"
                                min="1"
                                required
                                value={newZoneCapacity}
                                onChange={e => setNewZoneCapacity(parseInt(e.target.value))}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyber-primary transition-all font-mono"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Default Rules</label>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setNewZoneAllowPicking(!newZoneAllowPicking)}
                                className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${newZoneAllowPicking
                                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                                    : 'bg-black/40 border-white/10 text-gray-500'
                                    }`}
                            >
                                <ArrowUpRight size={16} /> Allow Picking
                            </button>
                            <button
                                type="button"
                                onClick={() => setNewZoneAllowPutaway(!newZoneAllowPutaway)}
                                className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${newZoneAllowPutaway
                                    ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                                    : 'bg-black/40 border-white/10 text-gray-500'
                                    }`}
                            >
                                <ArrowDownLeft size={16} /> Allow Putaway
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setIsAddModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            loading={isProcessing === 'new'}
                            className="bg-cyber-primary text-black hover:bg-cyber-primary/90 font-bold px-8"
                        >
                            Create Zone
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
