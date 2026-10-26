import React from 'react';
import { useFulfillment } from './FulfillmentContext';
import { AssignLabelHub } from './assign/AssignLabelHub';

export const LabelsTab: React.FC = () => {
    const {
        filteredProducts,
        addNotification,
        t,
        user,
        activeSite, zones
    } = useFulfillment();

    return (
        <div className="flex-1 overflow-y-auto space-y-6">
            {activeSite?.id ? <AssignLabelHub
                key={activeSite.id}
                filteredProducts={filteredProducts}
                addNotification={addNotification}
                t={t}
                zones={zones}
                onZoneUpdate={() => {}}
                user={user}
                activeSite={activeSite}
            /> : <p className="p-4 text-sm text-[var(--theme-text-secondary)]">Select a facility to prepare labels.</p>}
        </div>
    );
};
