import React from 'react';
import { useFulfillment } from './FulfillmentContext';
import { AssignLabelHub } from './assign/AssignLabelHub';
import { useLanguage } from '../../contexts/LanguageContext';

export const LabelsTab: React.FC = () => {
    const { t } = useLanguage();
    const {
        filteredProducts,
        addNotification,
        user,
        activeSite,
        zones
    } = useFulfillment();

    return (
        <div className="flex-1 overflow-y-auto space-y-6">
            {activeSite?.id ? (
                <AssignLabelHub
                    key={activeSite.id}
                    filteredProducts={filteredProducts}
                    addNotification={addNotification}
                    t={t}
                    zones={zones || []}
                    onZoneUpdate={() => {}}
                    user={user}
                    activeSite={activeSite}
                />
            ) : (
                <p className="p-4 text-sm text-[var(--theme-text-secondary)]">
                    {t('warehouse.selectFacilityToPrepareLabels')}
                </p>
            )}
        </div>
    );
};
