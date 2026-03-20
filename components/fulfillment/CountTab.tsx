import React, { useState } from 'react';
import { WMSJob, Product, StockMovement, User } from '../../types';
import { CountHeader } from './count/CountHeader';
import { CountOperations } from './count/CountOperations';
import { CountHistory } from './count/CountHistory';

interface CountTabProps {
    products: Product[];
    movements: StockMovement[];
    user: User | null;
    isSubmitting: boolean;
    setIsSubmitting: (v: boolean) => void;
    setSelectedJob: (job: any) => void;
    setIsDetailsOpen: (open: boolean) => void;
    inventoryRequestsService: any;
    addNotification: (type: 'alert' | 'success' | 'info', message: string) => void;
}

export const CountTab: React.FC<CountTabProps> = ({
    products, movements, user,
    isSubmitting, setIsSubmitting, setSelectedJob, setIsDetailsOpen,
    inventoryRequestsService, addNotification
}) => {
    // --- COUNT TAB STATE ---
    const [countViewMode, setCountViewMode] = useState<'Operations' | 'Reports'>('Operations');
    const [countSessionStatus, setCountSessionStatus] = useState<'Idle' | 'Active' | 'Review'>('Idle');
    const [countSessionType, setCountSessionType] = useState<'Cycle' | 'Spot'>('Cycle');
    const [countSessionItems, setCountSessionItems] = useState<{
        productId: string;
        systemQty: number;
        countedQty?: number;
        status: 'Pending' | 'Counted' | 'Approved' | 'Rejected';
        variance?: number;
    }[]>([]);

    return (
        <div className="flex-1 overflow-y-auto space-y-6">
            {/* Header */}
            <CountHeader
                countViewMode={countViewMode}
                setCountViewMode={setCountViewMode}
                countSessionStatus={countSessionStatus}
                setCountSessionStatus={setCountSessionStatus}
                setCountSessionItems={setCountSessionItems}
            />

            {/* OPERATIONS VIEW */}
            {countViewMode === 'Operations' && (
                <CountOperations
                    products={products}
                    user={user}
                    countSessionStatus={countSessionStatus}
                    setCountSessionStatus={setCountSessionStatus}
                    countSessionItems={countSessionItems}
                    setCountSessionItems={setCountSessionItems}
                    countSessionType={countSessionType}
                    setCountSessionType={setCountSessionType}
                    addNotification={addNotification}
                    inventoryRequestsService={inventoryRequestsService}
                />
            )}

            {/* REPORTS VIEW */}
            {countViewMode === 'Reports' && (
                <CountHistory
                    movements={movements}
                    products={products}
                    setSelectedJob={setSelectedJob}
                    setIsDetailsOpen={setIsDetailsOpen}
                />
            )}
        </div>
    );
};
