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
        zones, zonesLoading, zonesError, refreshJobs
    } = useFulfillment();

    return (
        <div className="flex-1 overflow-y-auto space-y-6">
            {activeSite?.id ? (
                <>
                {zonesError && <button type="button" onClick={refreshJobs} className="min-h-[44px] px-4 rounded-xl border border-[var(--theme-border)] text-[var(--theme-text-primary)]">{t('warehouse.recoveryRetry')}</button>}
                <AssignLabelHub
                    key={activeSite.id}
                    filteredProducts={filteredProducts}
                    addNotification={addNotification}
                    t={t}
                    zones={zones || []}
                    zoneLoadState={zonesError ? 'error' : zonesLoading ? 'loading' : 'ready'}
                    onZoneUpdate={() => {}}
                    user={user}
                    activeSite={activeSite}
                />
                </>
            ) : (
                <p className="p-4 text-sm text-[var(--theme-text-secondary)]">
                    {t('warehouse.selectFacilityToPrepareLabels')}
                </p>
            )}
        </div>
    );
};
