import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
    Thermometer, Shield, Box, Plus, Settings2, Trash2, CheckCircle2, 
    Lock, Unlock, ShieldAlert, Layers, Play, AlertCircle, RefreshCw, X
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { useLanguage } from '../../contexts/LanguageContext';
import { warehouseZonesService } from '../../services/supabase.service';
import { WarehouseZone, Product } from '../../types';

interface ZoneWithProducts extends WarehouseZone {
    assignedProducts: Product[];
}

export const InventoryZones: React.FC = () => {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    const { activeSite, allProducts, refreshData } = useData();
    const { user, showToast } = useStore();

    // Local States
    const [zones, setZones] = useState<ZoneWithProducts[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedZone, setSelectedZone] = useState<ZoneWithProducts | null>(null);

    // Form States
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

    // Fetch and enrich zones
    const fetchZones = async () => {
        if (!activeSite?.id) return;
        setIsLoading(true);
        try {
            const dbZones = await warehouseZonesService.getAll(activeSite.id);
            
            // Map products to zones
            const enriched = dbZones.map((z: WarehouseZone) => {
                const assigned = allProducts.filter(p => 
                    (p.zoneId === z.id || p.zone_id === z.id) &&
                    (p.siteId === activeSite.id || p.site_id === activeSite.id)
                );
                
                // Calculate actual occupied space if product stock exists
                const totalStock = assigned.reduce((sum, p) => sum + (p.stock || 0), 0);

                return {
                    ...z,
                    occupied: totalStock,
                    assignedProducts: assigned
                };
            });
            setZones(enriched);
        } catch (err) {
            console.error(err);
            showToast('Failed to load zones', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchZones();
    }, [activeSite?.id, allProducts]);

    // Handle Initialization of default zones
    const handleInitializeDefaults = async () => {
        if (!activeSite?.id) return;
        setIsLoading(true);
        try {
            let defaults: Omit<WarehouseZone, 'id'>[] = [];
            const siteType = (activeSite.type || 'Store') as string;

            if (siteType === 'Warehouse') {
                defaults = [
                    { name: 'Zone A (Receiving Dock)', siteId: activeSite.id, type: 'Dry', zoneType: 'RECEIVING', pickingPriority: 1, capacity: 2000, allowPicking: false, allowPutaway: true, status: 'Active', occupied: 0 },
                    { name: 'Zone B (Cold Freezer)', siteId: activeSite.id, type: 'Cold', zoneType: 'FREEZER', pickingPriority: 10, capacity: 5000, allowPicking: true, allowPutaway: true, status: 'Active', occupied: 0, temperature: '-18°C' },
                    { name: 'Zone C (Chilled Room)', siteId: activeSite.id, type: 'Cold', zoneType: 'CHILLED', pickingPriority: 8, capacity: 5000, allowPicking: true, allowPutaway: true, status: 'Active', occupied: 0, temperature: '4°C' },
                    { name: 'Zone D (Bulk Pallet Rack)', siteId: activeSite.id, type: 'Dry', zoneType: 'BULK', pickingPriority: 12, capacity: 15000, allowPicking: true, allowPutaway: true, status: 'Active', occupied: 0 },
                    { name: 'Zone E (High Value Vault)', siteId: activeSite.id, type: 'Secure', zoneType: 'HIGH_VALUE', pickingPriority: 5, capacity: 1000, allowPicking: true, allowPutaway: true, status: 'Active', occupied: 0 }
                ];
            } else if (siteType === 'Distribution Center') {
                defaults = [
                    { name: 'Zone A (Unloading Dock)', siteId: activeSite.id, type: 'Dry', zoneType: 'RECEIVING', pickingPriority: 1, capacity: 3000, allowPicking: false, allowPutaway: true, status: 'Active', occupied: 0 },
                    { name: 'Zone B (Cross-Dock Stage)', siteId: activeSite.id, type: 'Dry', zoneType: 'CROSS_DOCK', pickingPriority: 5, capacity: 5000, allowPicking: true, allowPutaway: true, status: 'Active', occupied: 0 },
                    { name: 'Zone C (Bulk Storage)', siteId: activeSite.id, type: 'Dry', zoneType: 'BULK', pickingPriority: 10, capacity: 20000, allowPicking: true, allowPutaway: true, status: 'Active', occupied: 0 },
                    { name: 'Zone D (Cold Staging)', siteId: activeSite.id, type: 'Cold', zoneType: 'COLD_ROOM', pickingPriority: 7, capacity: 4000, allowPicking: true, allowPutaway: true, status: 'Active', occupied: 0, temperature: '2°C' },
                    { name: 'Zone E (Outbound Dock)', siteId: activeSite.id, type: 'Dry', zoneType: 'SHIPPING', pickingPriority: 2, capacity: 3000, allowPicking: true, allowPutaway: false, status: 'Active', occupied: 0 }
                ];
            } else {
                // Default Store/Retail Zones
                defaults = [
                    { name: 'Fresh Produce Section', siteId: activeSite.id, type: 'Dry', zoneType: 'PRODUCE', pickingPriority: 5, capacity: 2000, allowPicking: true, allowPutaway: true, status: 'Active', occupied: 0 },
                    { name: 'Dairy & Chilled Fridge', siteId: activeSite.id, type: 'Cold', zoneType: 'CHILLED', pickingPriority: 6, capacity: 3000, allowPicking: true, allowPutaway: true, status: 'Active', occupied: 0, temperature: '4°C' },
                    { name: 'Bakery & Deli Display', siteId: activeSite.id, type: 'Dry', zoneType: 'DELI', pickingPriority: 4, capacity: 1000, allowPicking: true, allowPutaway: true, status: 'Active', occupied: 0 },
                    { name: 'Glass Door Freezers', siteId: activeSite.id, type: 'Cold', zoneType: 'FREEZER', pickingPriority: 8, capacity: 2000, allowPicking: true, allowPutaway: true, status: 'Active', occupied: 0, temperature: '-20°C' },
                    { name: 'Dry Grocery Aisles', siteId: activeSite.id, type: 'Dry', zoneType: 'SHELVES', pickingPriority: 10, capacity: 10000, allowPicking: true, allowPutaway: true, status: 'Active', occupied: 0 },
                    { name: 'Front Checkout Counter', siteId: activeSite.id, type: 'Dry', zoneType: 'CHECKOUT', pickingPriority: 2, capacity: 800, allowPicking: true, allowPutaway: true, status: 'Active', occupied: 0 }
                ];
            }

            for (const z of defaults) {
                await warehouseZonesService.create(z);
            }

            showToast(`Initialized default zones for ${activeSite.name}`, 'success');
            queryClient.invalidateQueries({ queryKey: ['zones'] });
            await fetchZones();
        } catch (err) {
            console.error(err);
            showToast('Failed to initialize default zones', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Create Zone Submit
    const handleCreateZone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeSite?.id) return;
        setIsLoading(true);
        try {
            await warehouseZonesService.create({
                name: zoneName,
                siteId: activeSite.id,
                type: zoneType,
                zoneType: zoneSubtype,
                capacity: capacity || 1000,
                temperature: zoneType === 'Cold' ? temperature || '4°C' : undefined,
                pickingPriority: pickingPriority || 10,
                allowPicking,
                allowPutaway,
                status: 'Active',
                occupied: 0
            });
            showToast('Zone created successfully', 'success');
            setIsCreateOpen(false);
            // Reset
            setZoneName('');
            setZoneType('Dry');
            setZoneSubtype('STANDARD');
            setCapacity(5000);
            setTemperature('');
            setPickingPriority(10);
            setAllowPicking(true);
            setAllowPutaway(true);
            
            await fetchZones();
        } catch (err: any) {
            showToast(err.message || 'Failed to create zone', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Edit Zone Submit
    const handleUpdateZone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedZone) return;
        setIsLoading(true);
        try {
            await warehouseZonesService.update(selectedZone.id, {
                name: zoneName,
                type: zoneType,
                zoneType: zoneSubtype,
                capacity: capacity || 1000,
                temperature: zoneType === 'Cold' ? temperature || '4°C' : undefined,
                pickingPriority: pickingPriority || 10,
                allowPicking,
                allowPutaway,
                isLocked,
                lockReason: isLocked ? lockReason : undefined,
                lockedAt: isLocked ? new Date().toISOString() : undefined,
                lockedBy: isLocked ? user?.name || 'Admin' : undefined
            });
            showToast('Zone updated successfully', 'success');
            setIsEditOpen(false);
            setSelectedZone(null);
            await fetchZones();
        } catch (err: any) {
            showToast(err.message || 'Failed to update zone', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Delete Zone
    const handleDeleteZone = async (zone: ZoneWithProducts) => {
        if (zone.assignedProducts.length > 0) {
            showToast(`Cannot delete Zone. There are still ${zone.assignedProducts.length} products assigned here.`, 'error');
            return;
        }
        const confirm = window.confirm(`Are you sure you want to delete "${zone.name}" permanently?`);
        if (!confirm) return;

        setIsLoading(true);
        try {
            await warehouseZonesService.delete(zone.id);
            showToast('Zone deleted successfully', 'success');
            await fetchZones();
        } catch (err: any) {
            showToast(err.message || 'Failed to delete zone', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to open Edit Modal
    const openEditModal = (zone: ZoneWithProducts) => {
        setSelectedZone(zone);
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
        setIsEditOpen(true);
    };

    const totalCapacity = zones.reduce((sum, z) => sum + (z.capacity || 0), 0);
    const totalOccupied = zones.reduce((sum, z) => sum + (z.occupied || 0), 0);
    const totalUtilization = totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0;

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header Control Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 dark:bg-[#18201B]/40 p-5 rounded-3xl border border-[#E2DCCE] dark:border-emerald-950/20 backdrop-blur-md shadow-sm">
                <div className="space-y-1">
                    <h2 className="text-xl font-black text-[#1E3F27] dark:text-[#EAE5D9] tracking-tight uppercase">
                        {activeSite?.name || 'Location'} Zones
                    </h2>
                    <p className="text-xs text-stone-400 dark:text-gray-500 font-bold uppercase tracking-wider">
                        Configure storage zones, temperature limits, and operational capacity for this {activeSite?.type || 'site'}.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {zones.length === 0 && !isLoading && (
                        <button
                            onClick={handleInitializeDefaults}
                            className="px-4 py-2.5 bg-gradient-to-br from-[#2C5E3B] to-[#224429] hover:from-[#1E3F27] hover:to-[#17301F] text-white text-xs font-black rounded-xl border border-transparent transition-all shadow-sm flex items-center gap-1.5 active:scale-95 uppercase tracking-wider"
                        >
                            <RefreshCw size={14} /> Initialize Default Zones
                        </button>
                    )}
                    {(user?.role === 'super_admin' || user?.role === 'warehouse_manager' || user?.role === 'store_manager') && (
                        <button
                            onClick={() => setIsCreateOpen(true)}
                            className="px-4 py-2.5 bg-gradient-to-br from-[#2C5E3B] to-[#224429] hover:from-[#1E3F27] hover:to-[#17301F] text-white text-xs font-black rounded-xl border border-transparent transition-all shadow-sm flex items-center gap-1.5 active:scale-95 uppercase tracking-wider"
                        >
                            <Plus size={14} /> Add New Zone
                        </button>
                    )}
                </div>
            </div>

            {/* Capacity Statistics Dashboard */}
            {zones.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white/70 dark:bg-[#18201B]/30 rounded-2xl border border-[#E2DCCE] dark:border-emerald-950/20 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[10px] text-stone-400 dark:text-gray-500 font-black uppercase tracking-wider">Active Zones</p>
                            <p className="text-2xl font-black font-mono mt-1 text-[#1E3F27] dark:text-[#EAE5D9]">{zones.length}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                            <Layers size={20} />
                        </div>
                    </div>
                    <div className="p-4 bg-white/70 dark:bg-[#18201B]/30 rounded-2xl border border-[#E2DCCE] dark:border-emerald-950/20 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[10px] text-stone-400 dark:text-gray-500 font-black uppercase tracking-wider">Global Capacity Utilization</p>
                            <p className="text-2xl font-black font-mono mt-1 text-[#1E3F27] dark:text-[#EAE5D9]">
                                {totalOccupied.toLocaleString()} / {totalCapacity.toLocaleString()}
                            </p>
                        </div>
                        <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <Box size={20} />
                        </div>
                    </div>
                    <div className="p-4 bg-white/70 dark:bg-[#18201B]/30 rounded-2xl border border-[#E2DCCE] dark:border-emerald-950/20 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] text-stone-400 dark:text-gray-500 font-black uppercase tracking-wider">Average Capacity Filled</p>
                            <span className="text-sm font-black font-mono text-[#1E3F27] dark:text-[#EAE5D9]">{totalUtilization.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-stone-250 dark:bg-black/40 h-2.5 rounded-full mt-2.5 overflow-hidden border border-[#E2DCCE]/50 dark:border-white/5 relative">
                            <div 
                                className={`h-full transition-all duration-1000 ${totalUtilization > 90 ? 'bg-red-500' : totalUtilization > 70 ? 'bg-amber-500' : 'bg-[#2C5E3B]'}`}
                                style={{ width: `${Math.min(100, totalUtilization)}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Zones Grid */}
            {isLoading && zones.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center bg-white/50 dark:bg-[#18201B]/20 rounded-3xl border border-[#E2DCCE] dark:border-emerald-950/10 shadow-sm">
                    <RefreshCw className="animate-spin text-[#2C5E3B] mb-3" size={32} />
                    <p className="text-sm text-stone-400 dark:text-gray-500 font-bold uppercase tracking-wider">Loading storage zones from database...</p>
                </div>
            ) : zones.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 text-center bg-white/70 dark:bg-[#18201B]/30 rounded-3xl border border-[#E2DCCE] dark:border-emerald-950/20 shadow-sm space-y-4">
                    <AlertCircle size={48} className="text-amber-500" />
                    <div>
                        <h3 className="text-lg font-black text-[#1E3F27] dark:text-[#EAE5D9] uppercase">No Zones Configured</h3>
                        <p className="text-sm text-stone-400 dark:text-gray-500 mt-1 max-w-md">
                            There are currently no zones defined for this location. Click "Initialize Default Zones" or use "Add New Zone" to define the layout.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {zones.map((zone) => {
                        const usagePercent = zone.capacity > 0 ? (zone.occupied / zone.capacity) * 100 : 0;
                        let progressColorClass = "bg-[#2C5E3B] dark:bg-[#A9CBA2]";
                        if (usagePercent > 90) progressColorClass = "bg-red-500";
                        else if (usagePercent > 70) progressColorClass = "bg-amber-500";

                        const isLockedState = zone.isLocked;

                        return (
                            <div 
                                key={zone.id} 
                                className={`glass-panel p-6 relative overflow-hidden group border transition-all duration-300 rounded-3xl shadow-sm ${
                                    isLockedState 
                                        ? 'border-red-500/20 bg-red-500/5 hover:border-red-500/35' 
                                        : 'hover:border-[#2C5E3B]/25 dark:hover:border-[#A9CBA2]/25 hover:scale-[1.005] hover:shadow-md'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-5 relative z-10">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3.5 rounded-2xl border ${
                                            isLockedState
                                                ? 'bg-red-500/10 text-red-500 border-red-500/25'
                                                : zone.type === 'Cold' 
                                                    ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' 
                                                    : zone.type === 'Secure' 
                                                        ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' 
                                                        : 'bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2] border-[#2C5E3B]/20'
                                        }`}>
                                            {isLockedState ? <Lock size={22} /> : zone.type === 'Cold' ? <Thermometer size={22} /> : zone.type === 'Secure' ? <Shield size={22} /> : <Box size={22} />}
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-gray-900 dark:text-white text-base flex items-center gap-1.5">
                                                {zone.name}
                                                {isLockedState && (
                                                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-red-500 text-white animate-pulse">
                                                        LOCKED
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="text-[10px] text-stone-400 dark:text-gray-500 font-black uppercase tracking-widest mt-0.5">
                                                {zone.type} Storage • Type: {zone.zoneType || 'STANDARD'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-xl font-black font-mono ${usagePercent > 90 ? 'text-red-500' : 'text-[#1E3F27] dark:text-[#EAE5D9]'}`}>
                                            {usagePercent.toFixed(1)}%
                                        </span>
                                        <p className="text-[9px] text-stone-400 dark:text-gray-500 font-bold uppercase mt-0.5">Space Utilized</p>
                                    </div>
                                </div>

                                {/* Rules and Restrictions Badges */}
                                <div className="flex flex-wrap gap-1.5 mb-4 relative z-10">
                                    {zone.pickingPriority !== undefined && (
                                        <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-stone-500 dark:text-gray-400">
                                            Priority {zone.pickingPriority}
                                        </span>
                                    )}
                                    {zone.allowPicking === false && (
                                        <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/25">
                                            No Picking
                                        </span>
                                    )}
                                    {zone.allowPutaway === false && (
                                        <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                                            No Putaway
                                        </span>
                                    )}
                                    {zone.assignedProducts.length > 0 && (
                                        <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-green-500/10 text-green-600 border border-green-500/25">
                                            {zone.assignedProducts.length} Products
                                        </span>
                                    )}
                                </div>

                                {/* Capacity Bar */}
                                <div className="space-y-1.5 relative z-10">
                                    <div className="w-full bg-stone-200 dark:bg-black/45 h-3 rounded-full overflow-hidden border border-[#E2DCCE]/50 dark:border-white/5 relative">
                                        <div
                                            className={`h-full transition-all duration-1000 ${progressColorClass}`}
                                            style={{ width: `${Math.min(100, usagePercent)}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-stone-400 dark:text-gray-500 font-mono font-bold">
                                        <span>Occupied: {zone.occupied.toLocaleString()} items</span>
                                        <span>Capacity: {zone.capacity.toLocaleString()} items</span>
                                    </div>
                                </div>

                                {/* Temperature Gauge if applicable */}
                                {zone.temperature && (
                                    <div className="mt-3 flex items-center gap-1.5 text-blue-500 dark:text-blue-400 text-[10px] font-black bg-blue-500/5 px-2.5 py-1.5 rounded-lg border border-blue-500/10 w-fit relative z-10">
                                        <Thermometer size={12} />
                                        <span>TARGET TEMP: {zone.temperature}</span>
                                    </div>
                                )}

                                {/* Lock Reason Display */}
                                {isLockedState && zone.lockReason && (
                                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-[11px] rounded-xl flex items-start gap-2 relative z-10">
                                        <ShieldAlert size={14} className="flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-black uppercase text-[9px] tracking-wide">Lock Reason</p>
                                            <p className="mt-0.5 leading-relaxed font-bold">{zone.lockReason}</p>
                                            <p className="mt-1 text-[8px] opacity-75 uppercase">Locked by {zone.lockedBy} at {new Date(zone.lockedAt || '').toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Actions Footer */}
                                {(user?.role === 'super_admin' || user?.role === 'warehouse_manager' || user?.role === 'store_manager') && (
                                    <div className="mt-5 pt-4 border-t border-[#E2DCCE]/50 dark:border-white/5 flex items-center justify-between relative z-10 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openEditModal(zone)}
                                            className="p-2 text-stone-500 dark:text-stone-300 hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2] bg-stone-100 dark:bg-white/5 hover:bg-[#2C5E3B]/10 rounded-xl border border-stone-200 dark:border-white/10 transition-all flex items-center gap-1 text-[10px] font-black uppercase"
                                        >
                                            <Settings2 size={12} /> Configure
                                        </button>
                                        <button
                                            onClick={() => handleDeleteZone(zone)}
                                            disabled={zone.assignedProducts.length > 0}
                                            className={`p-2 rounded-xl transition-all flex items-center gap-1 text-[10px] font-black uppercase ${
                                                zone.assignedProducts.length > 0
                                                    ? 'text-stone-400 bg-stone-50 border border-stone-200 dark:bg-white/5 dark:border-white/5 cursor-not-allowed opacity-30'
                                                    : 'text-rose-600 bg-rose-500/5 hover:bg-rose-500/15 border border-rose-500/10 hover:border-rose-500/25'
                                            }`}
                                            title={zone.assignedProducts.length > 0 ? "Cannot delete zone containing products" : "Delete Zone"}
                                        >
                                            <Trash2 size={12} /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── CREATE ZONE MODAL ── */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
                    <form onSubmit={handleCreateZone} className="relative w-full max-w-lg rounded-3xl bg-[#FAF8F5] dark:bg-[#18201B] border border-[#E2DCCE] dark:border-white/10 shadow-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-[#E2DCCE]/50 dark:border-white/5 pb-3">
                            <h3 className="text-base font-black text-[#1E3F27] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                <Plus size={18} /> Create Storage Zone
                            </h3>
                            <button type="button" onClick={() => setIsCreateOpen(false)} className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-white/5 text-stone-400"><X size={18} /></button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] text-stone-400 dark:text-gray-500 font-black uppercase tracking-wider block">Zone Name</label>
                                <input
                                    type="text"
                                    required
                                    value={zoneName}
                                    onChange={(e) => setZoneName(e.target.value)}
                                    placeholder="e.g. Zone D (Fresh Produce)"
                                    className="w-full bg-[#FAF8F5] dark:bg-black/35 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#2C5E3B]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-stone-400 dark:text-gray-500 font-black uppercase tracking-wider block">Storage Class</label>
                                    <select
                                        value={zoneType}
                                        onChange={(e) => setZoneType(e.target.value as any)}
                                        className="w-full bg-[#FAF8F5] dark:bg-black/35 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#2C5E3B]"
                                    >
                                        <option value="Dry">Dry Storage</option>
                                        <option value="Cold">Cold Storage</option>
                                        <option value="Secure">Secure (Locked)</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-stone-400 dark:text-gray-500 font-black uppercase tracking-wider block">Zone Type</label>
                                    <input
                                        type="text"
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
                                    <label className="text-[10px] text-stone-400 dark:text-gray-500 font-black uppercase tracking-wider block">Item Capacity (Max)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={capacity}
                                        onChange={(e) => setCapacity(Math.max(1, parseInt(e.target.value) || 1000))}
                                        className="w-full bg-[#FAF8F5] dark:bg-black/35 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white font-mono focus:outline-none focus:border-[#2C5E3B]"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-stone-400 dark:text-gray-500 font-black uppercase tracking-wider block">Target Temp (Cold only)</label>
                                    <input
                                        type="text"
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
                                    <label className="text-[10px] text-stone-400 dark:text-gray-500 font-black uppercase tracking-wider block">Picking Priority (1-20)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        required
                                        value={pickingPriority}
                                        onChange={(e) => setPickingPriority(Math.max(1, Math.min(20, parseInt(e.target.value) || 10)))}
                                        className="w-full bg-[#FAF8F5] dark:bg-black/35 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white font-mono focus:outline-none focus:border-[#2C5E3B]"
                                    />
                                </div>
                                <div className="flex items-center gap-6 pt-5">
                                    <label className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={allowPicking}
                                            onChange={(e) => setAllowPicking(e.target.checked)}
                                            className="rounded border-[#E2DCCE] text-[#2C5E3B] focus:ring-[#2C5E3B]"
                                        />
                                        Allow Pick
                                    </label>
                                    <label className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={allowPutaway}
                                            onChange={(e) => setAllowPutaway(e.target.checked)}
                                            className="rounded border-[#E2DCCE] text-[#2C5E3B] focus:ring-[#2C5E3B]"
                                        />
                                        Allow Putaway
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end border-t border-[#E2DCCE]/50 dark:border-white/5 pt-4 mt-2">
                            <button
                                type="button"
                                onClick={() => setIsCreateOpen(false)}
                                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-white/5 dark:hover:bg-white/10 text-stone-500 dark:text-stone-300 font-bold text-xs rounded-xl border border-[#E2DCCE] dark:border-white/10 transition-colors uppercase tracking-wider"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-gradient-to-br from-[#2C5E3B] to-[#224429] hover:from-[#1E3F27] hover:to-[#17301F] text-white font-black text-xs rounded-xl transition-all shadow-sm uppercase tracking-wider"
                            >
                                Create Zone
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── EDIT ZONE MODAL ── */}
            {isEditOpen && selectedZone && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
                    <form onSubmit={handleUpdateZone} className="relative w-full max-w-lg rounded-3xl bg-[#FAF8F5] dark:bg-[#18201B] border border-[#E2DCCE] dark:border-white/10 shadow-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-[#E2DCCE]/50 dark:border-white/5 pb-3">
                            <h3 className="text-base font-black text-[#1E3F27] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                <Settings2 size={18} /> Configure Zone: {selectedZone.name}
                            </h3>
                            <button type="button" onClick={() => setIsEditOpen(false)} className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-white/5 text-stone-400"><X size={18} /></button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] text-stone-400 dark:text-gray-500 font-black uppercase tracking-wider block">Zone Name</label>
                                <input
                                    type="text"
                                    required
                                    value={zoneName}
                                    onChange={(e) => setZoneName(e.target.value)}
                                    className="w-full bg-[#FAF8F5] dark:bg-black/35 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#2C5E3B]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-stone-400 dark:text-gray-500 font-black uppercase tracking-wider block">Storage Class</label>
                                    <select
                                        value={zoneType}
                                        onChange={(e) => setZoneType(e.target.value as any)}
                                        className="w-full bg-[#FAF8F5] dark:bg-black/35 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#2C5E3B]"
                                    >
                                        <option value="Dry">Dry Storage</option>
                                        <option value="Cold">Cold Storage</option>
                                        <option value="Secure">Secure (Locked)</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-stone-400 dark:text-gray-500 font-black uppercase tracking-wider block">Zone Type</label>
                                    <input
                                        type="text"
                                        required
                                        value={zoneSubtype}
                                        onChange={(e) => setZoneSubtype(e.target.value.toUpperCase())}
                                        className="w-full bg-[#FAF8F5] dark:bg-black/35 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white font-mono focus:outline-none focus:border-[#2C5E3B]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-stone-400 dark:text-gray-500 font-black uppercase tracking-wider block">Item Capacity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={capacity}
                                        onChange={(e) => setCapacity(Math.max(1, parseInt(e.target.value) || 1000))}
                                        className="w-full bg-[#FAF8F5] dark:bg-black/35 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white font-mono focus:outline-none focus:border-[#2C5E3B]"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-stone-400 dark:text-gray-500 font-black uppercase tracking-wider block">Target Temp</label>
                                    <input
                                        type="text"
                                        disabled={zoneType !== 'Cold'}
                                        value={temperature}
                                        onChange={(e) => setTemperature(e.target.value)}
                                        className="w-full bg-[#FAF8F5] dark:bg-black/35 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white disabled:opacity-30 focus:outline-none focus:border-[#2C5E3B]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-stone-400 dark:text-gray-500 font-black uppercase tracking-wider block">Picking Priority (1-20)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        required
                                        value={pickingPriority}
                                        onChange={(e) => setPickingPriority(Math.max(1, Math.min(20, parseInt(e.target.value) || 10)))}
                                        className="w-full bg-[#FAF8F5] dark:bg-black/35 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white font-mono focus:outline-none focus:border-[#2C5E3B]"
                                    />
                                </div>
                                <div className="flex items-center gap-6 pt-5">
                                    <label className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={allowPicking}
                                            onChange={(e) => setAllowPicking(e.target.checked)}
                                            className="rounded border-[#E2DCCE] text-[#2C5E3B] focus:ring-[#2C5E3B]"
                                        />
                                        Allow Pick
                                    </label>
                                    <label className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={allowPutaway}
                                            onChange={(e) => setAllowPutaway(e.target.checked)}
                                            className="rounded border-[#E2DCCE] text-[#2C5E3B] focus:ring-[#2C5E3B]"
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
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isLocked}
                                            onChange={(e) => setIsLocked(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-stone-300 dark:bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500"></div>
                                    </label>
                                </div>
                                {isLocked && (
                                    <div className="space-y-1 animate-in fade-in duration-200">
                                        <label className="text-[9px] text-stone-400 dark:text-gray-500 font-black uppercase tracking-wider block">Lock Reason</label>
                                        <input
                                            type="text"
                                            required={isLocked}
                                            value={lockReason}
                                            onChange={(e) => setLockReason(e.target.value)}
                                            placeholder="e.g., Annual physical inventory audit in progress"
                                            className="w-full bg-[#FAF8F5] dark:bg-black/45 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#2C5E3B]"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end border-t border-[#E2DCCE]/50 dark:border-white/5 pt-4 mt-2">
                            <button
                                type="button"
                                onClick={() => setIsEditOpen(false)}
                                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-white/5 dark:hover:bg-white/10 text-stone-500 dark:text-stone-300 font-bold text-xs rounded-xl border border-[#E2DCCE] dark:border-white/10 transition-colors uppercase tracking-wider"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-gradient-to-br from-[#2C5E3B] to-[#224429] hover:from-[#1E3F27] hover:to-[#17301F] text-white font-black text-xs rounded-xl transition-all shadow-sm uppercase tracking-wider"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};
