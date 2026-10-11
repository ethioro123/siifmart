import React, { useState } from 'react';
import {
    Layers, Plus, Trash2, Lock, Unlock, XCircle
} from 'lucide-react';
import { WarehouseZone, WMSJob } from '../../../types';
import { warehouseZonesService } from '../../../services/supabase.service';
import Modal from '../../../components/Modal';
import { logger } from '../../../utils/logger';

interface ZoneOperationsManagerProps {
    zones: WarehouseZone[];
    jobs: WMSJob[];
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
            });
            onZoneUpdate();
            addNotification('success', `Zone ${zone.name} ${!zone.isLocked ? 'Locked' : 'Unlocked'}`);
        } catch (err) {
            logger.error('ZoneOperationsManager', 'caught error', err as Error);
            addNotification('alert', 'Failed to toggle lock');
        } finally {
            setIsProcessing(null);
        }
    };

    const handleDeleteZone = async (zone: WarehouseZone) => {
        if (!window.confirm(`Are you sure you want to delete zone ${zone.name}? This cannot be undone.`)) return;

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
            logger.error('ZoneOperationsManager', 'caught error', err as Error);
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
                pickingPriority: 50,
                zoneType: 'STANDARD',
                allowPicking: newZoneAllowPicking,
                allowPutaway: newZoneAllowPutaway
            });
            onZoneUpdate();
            addNotification('success', 'Zone created successfully');
            setIsAddModalOpen(false);
            setNewZoneName('');
            setNewZoneCapacity(100);
        } catch (err) {
            logger.error('ZoneOperationsManager', 'caught error', err as Error);
            addNotification('alert', 'Failed to create zone');
        } finally {
            setIsProcessing(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 transition-colors">
            <div className="w-full max-w-6xl max-h-[90vh] rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] overflow-hidden shadow-2xl flex flex-col">

                {/* HEADER */}
                <div className="p-6 border-b border-[var(--theme-border)] flex items-center justify-between bg-[var(--theme-bg-subtle)]">
                    <div>
                        <h2 className="text-xl font-bold text-[var(--theme-text-primary)] flex items-center gap-3">
                            <Layers className="text-primary" size={24} />
                            ZONE OPERATIONS
                        </h2>
                        <p className="text-[var(--theme-text-secondary)] text-xs mt-1">Manage capacity, locks, and movement rules</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="min-h-[44px] bg-primary text-white font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all touch-manipulation text-xs"
                        >
                            <Plus size={16} />
                            ADD ZONE
                        </button>
                        <button
                            onClick={onClose}
                            aria-label="Close Zone Operations"
                            title="Close"
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] rounded-full transition-colors text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] touch-manipulation"
                        >
                            <XCircle size={20} />
                        </button>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="grid grid-cols-1 gap-4">
                        {/* TABLE HEADER */}
                        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-[var(--theme-bg-subtle)] rounded-t-xl border-x border-t border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">
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
                                        className={`grid grid-cols-12 gap-4 items-center px-4 py-4 rounded-xl border transition-colors ${isZoneLocked
                                            ? 'bg-red-500/5 border-red-500/20'
                                            : 'bg-[var(--theme-bg-card)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-subtle)]'
                                            }`}
                                    >
                                        {/* NAME & TYPE */}
                                        <div className="col-span-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-xl transition-colors ${isZoneLocked ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
                                                    <Layers size={18} />
                                                </div>
                                                <div>
                                                    <h3 className={`text-sm font-semibold transition-colors ${isZoneLocked ? 'text-red-500' : 'text-[var(--theme-text-primary)]'}`}>
                                                        {zone.name}
                                                    </h3>
                                                    <span className="text-[11px] font-semibold px-2 py-0.5 bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] rounded-md uppercase mt-0.5 inline-block border border-[var(--theme-border)] font-mono">
                                                        {zone.type}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* CAPACITY */}
                                        <div className="col-span-3">
                                            <div className="flex justify-between text-xs mb-1.5 font-mono tabular-nums">
                                                <span className="text-[var(--theme-text-secondary)] font-medium">{zone.occupied} / {zone.capacity}</span>
                                                <span className={`font-semibold ${capacityPct > 90 ? 'text-red-500' : 'text-primary'}`}>{capacityPct}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-[var(--theme-bg-subtle)] rounded-full overflow-hidden border border-[var(--theme-border)]">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${capacityPct > 90 ? 'bg-red-500' : 'bg-primary'}`}
                                                    ref={el => { if (el) el.style.setProperty('width', `${capacityPct}%`); }}
                                                />
                                            </div>
                                        </div>

                                        {/* ACTIVE JOBS */}
                                        <div className="col-span-2 flex justify-center">
                                            {activeJobs > 0 ? (
                                                <span className="px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-md text-xs font-mono tabular-nums font-semibold">
                                                    {activeJobs}
                                                </span>
                                            ) : (
                                                <span className="text-[var(--theme-text-muted)] text-xs font-medium">-</span>
                                            )}
                                        </div>

                                        {/* STATUS (LOCK) */}
                                        <div className="col-span-2 flex justify-center">
                                            <button
                                                onClick={() => handleToggleLock(zone)}
                                                disabled={!!isProcessing}
                                                className={`w-32 min-h-[44px] rounded-xl flex items-center justify-center gap-2 text-xs font-semibold border transition-all touch-manipulation ${isZoneLocked
                                                    ? 'bg-red-500 text-white border-red-500 hover:opacity-90'
                                                    : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
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
                                                className="min-h-[44px] min-w-[44px] flex items-center justify-center bg-[var(--theme-bg-subtle)] text-[var(--theme-text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors border border-[var(--theme-border)] hover:border-red-300 touch-manipulation"
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
                        <label htmlFor="newZoneName" className="block text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wide mb-2">Zone Name</label>
                        <input
                            id="newZoneName"
                            type="text"
                            required
                            value={newZoneName}
                            onChange={e => setNewZoneName(e.target.value)}
                            placeholder="e.g. A-WING"
                            className="woody-input w-full rounded-xl px-4 py-3 min-h-[44px] border border-[var(--theme-border)] bg-[var(--theme-bg-app)] text-[var(--theme-text-primary)] font-mono text-xs"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wide mb-2">Type</label>
                            <div className="grid grid-cols-1 gap-2">
                                {(['Bulk', 'Forward', 'Staging', 'Damaged', 'Dry', 'Cold', 'Secure'] as const).map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setNewZoneType(type)}
                                        className={`p-3 min-h-[44px] rounded-xl border text-left transition-colors text-xs font-semibold touch-manipulation ${newZoneType === type
                                            ? 'bg-primary text-white border-primary shadow-sm'
                                            : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="newZoneCapacity" className="block text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wide mb-2">Capacity (Slots)</label>
                            <input
                                id="newZoneCapacity"
                                type="number"
                                min="1"
                                required
                                value={newZoneCapacity}
                                onChange={e => setNewZoneCapacity(parseInt(e.target.value))}
                                className="woody-input w-full rounded-xl px-4 py-3 min-h-[44px] border border-[var(--theme-border)] bg-[var(--theme-bg-app)] text-[var(--theme-text-primary)] font-mono text-xs"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wide mb-3">Default Rules</label>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setNewZoneAllowPicking(!newZoneAllowPicking)}
                                className={`flex-1 p-3 min-h-[44px] rounded-xl border flex items-center justify-center gap-2 transition-colors text-xs font-semibold touch-manipulation ${newZoneAllowPicking
                                    ? 'bg-primary/10 border-primary text-primary'
                                    : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-muted)]'
                                    }`}
                            >
                                Allow Picking
                            </button>
                            <button
                                type="button"
                                onClick={() => setNewZoneAllowPutaway(!newZoneAllowPutaway)}
                                className={`flex-1 p-3 min-h-[44px] rounded-xl border flex items-center justify-center gap-2 transition-colors text-xs font-semibold touch-manipulation ${newZoneAllowPutaway
                                    ? 'bg-primary/10 border-primary text-primary'
                                    : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-muted)]'
                                    }`}
                            >
                                Allow Putaway
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-[var(--theme-border)] flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(false)}
                            className="min-h-[44px] px-6 py-2.5 rounded-xl font-semibold text-xs border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] touch-manipulation"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isProcessing === 'new'}
                            className="min-h-[44px] font-semibold px-8 py-2.5 rounded-xl bg-primary text-white hover:opacity-90 active:scale-95 transition-all text-xs touch-manipulation"
                        >
                            {isProcessing === 'new' ? 'Creating...' : 'Create Zone'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
