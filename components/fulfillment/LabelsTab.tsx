import React, { useState, useEffect, useCallback } from 'react';
import { useFulfillment } from './FulfillmentContext';
import { AssignLabelHub } from './assign/AssignLabelHub';
import { warehouseZonesService } from '../../services/supabase.service';
import { WarehouseZone } from '../../types';

export const LabelsTab: React.FC = () => {
    const {
        filteredProducts,
        addNotification,
        t,
        user,
        activeSite
    } = useFulfillment();

    const [zones, setZones] = useState<WarehouseZone[]>([]);

    const loadZones = useCallback(async () => {
        if (!activeSite?.id) return;
        try {
            const data = await warehouseZonesService.getAll(activeSite.id);
            setZones(data);
        } catch (error) {
            console.error('Failed to load zones for LabelsTab:', error);
        }
    }, [activeSite?.id]);

    useEffect(() => {
        if (activeSite?.id) {
            loadZones();
        }
    }, [activeSite?.id, loadZones]);

    return (
        <div className="flex-1 overflow-y-auto space-y-6">
            <AssignLabelHub
                filteredProducts={filteredProducts}
                addNotification={addNotification}
                t={t}
                zones={zones}
                onZoneUpdate={loadZones}
                user={user}
                activeSite={activeSite}
            />
        </div>
    );
};
