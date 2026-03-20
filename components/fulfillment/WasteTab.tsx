import React, { useState } from 'react';
import { StockMovement } from '../../types';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { inventoryRequestsService } from '../../services/supabase.service';
import { WasteHeader } from './waste/WasteHeader';
import { WasteLog } from './waste/WasteLog';
import { WasteHistory } from './waste/WasteHistory';

interface WasteTabProps {
    filteredMovements: StockMovement[];
    setSelectedJob: (job: any) => void;
    setIsDetailsOpen: (open: boolean) => void;
}

export const WasteTab: React.FC<WasteTabProps> = ({
    filteredMovements, setSelectedJob, setIsDetailsOpen
}) => {
    const { products, addNotification } = useData();
    const { user } = useStore();

    // --- WASTE-SPECIFIC STATE ---
    const [wasteViewMode, setWasteViewMode] = useState<'Log' | 'History'>('Log');

    return (
        <div className="flex-1 overflow-y-auto space-y-6">
            {/* Header */}
            <WasteHeader
                wasteViewMode={wasteViewMode}
                setWasteViewMode={setWasteViewMode}
            />

            {/* LOG WASTE VIEW */}
            {wasteViewMode === 'Log' && (
                <WasteLog
                    products={products}
                    user={user}
                    addNotification={addNotification}
                    inventoryRequestsService={inventoryRequestsService}
                />
            )}

            {/* HISTORY VIEW */}
            {wasteViewMode === 'History' && (
                <WasteHistory
                    movements={filteredMovements}
                    products={products}
                    setSelectedJob={setSelectedJob}
                    setIsDetailsOpen={setIsDetailsOpen}
                />
            )}
        </div>
    );
};
