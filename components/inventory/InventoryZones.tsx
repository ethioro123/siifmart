import React, { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { useLanguage } from '../../contexts/LanguageContext';
import { warehouseZonesService } from '../../services/supabase.service';
import { WarehouseZone, Product } from '../../types';

// --- Subcomponents ---
import { ZoneHeader } from './components/ZoneHeader';
import { ZoneStats } from './components/ZoneStats';
import { ZoneCard } from './components/ZoneCard';
import { ZoneCreateModal } from './components/ZoneCreateModal';
import { ZoneEditModal } from './components/ZoneEditModal';

interface ZoneWithProducts extends WarehouseZone {
    assignedProducts: Product[];
}

export const InventoryZones: React.FC = () => {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    const { activeSite, allProducts } = useData();
    const { user, showToast } = useStore();

    // Local States
    const [zones, setZones] = useState<ZoneWithProducts[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedZone, setSelectedZone] = useState<ZoneWithProducts | null>(null);

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
    const handleCreateZoneSubmit = async (data: any) => {
        if (!activeSite?.id) return;
        setIsLoading(true);
        try {
            await warehouseZonesService.create({
                ...data,
                siteId: activeSite.id,
                status: 'Active',
                occupied: 0
            });
            showToast('Zone created successfully', 'success');
            setIsCreateOpen(false);
            await fetchZones();
        } catch (err: any) {
            showToast(err.message || 'Failed to create zone', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Edit Zone Submit
    const handleUpdateZoneSubmit = async (id: string, data: any) => {
        setIsLoading(true);
        try {
            await warehouseZonesService.update(id, {
                ...data,
                lockedAt: data.isLocked ? new Date().toISOString() : undefined,
                lockedBy: data.isLocked ? user?.name || 'Admin' : undefined
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

    const totalCapacity = useMemo(() => zones.reduce((sum, z) => sum + (z.capacity || 0), 0), [zones]);
    const totalOccupied = useMemo(() => zones.reduce((sum, z) => sum + (z.occupied || 0), 0), [zones]);
    const totalUtilization = useMemo(() => totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0, [totalCapacity, totalOccupied]);

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header Control Bar */}
            <ZoneHeader
                activeSite={activeSite}
                zonesCount={zones.length}
                isLoading={isLoading}
                onInitializeDefaults={handleInitializeDefaults}
                onCreateOpen={() => setIsCreateOpen(true)}
                userRole={user?.role}
            />

            {/* Capacity Statistics Dashboard */}
            {zones.length > 0 && (
                <ZoneStats
                    zonesCount={zones.length}
                    totalCapacity={totalCapacity}
                    totalOccupied={totalOccupied}
                    totalUtilization={totalUtilization}
                />
            )}

            {/* Zones Grid List */}
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
                    {zones.map((zone) => (
                        <ZoneCard
                            key={zone.id}
                            zone={zone}
                            userRole={user?.role}
                            onConfigure={(z) => {
                                setSelectedZone(z);
                                setIsEditOpen(true);
                            }}
                            onDelete={handleDeleteZone}
                        />
                    ))}
                </div>
            )}

            {/* Create dialog popup */}
            <ZoneCreateModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSubmit={handleCreateZoneSubmit}
                isLoading={isLoading}
            />

            {/* Edit dialog popup */}
            <ZoneEditModal
                isOpen={isEditOpen}
                onClose={() => {
                    setIsEditOpen(false);
                    setSelectedZone(null);
                }}
                zone={selectedZone}
                onSubmit={handleUpdateZoneSubmit}
                isLoading={isLoading}
            />
        </div>
    );
};
export default InventoryZones;
