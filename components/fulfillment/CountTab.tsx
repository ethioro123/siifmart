import React, { useCallback, useEffect, useState } from 'react';
import type { Product, StockMovement, User } from '../../types';
import { CountHeader } from './count/CountHeader';
import { CountOperations } from './count/CountOperations';
import { CountHistory } from './count/CountHistory';
import { wmsCountsService, type WMSCountSession } from '../../services/wms-counts.service';
import { logger } from '../../utils/logger';
import { useLanguage } from '../../contexts/LanguageContext';

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
    products, movements, user, isSubmitting, setIsSubmitting,
    setSelectedJob, setIsDetailsOpen, addNotification,
}) => {
    const { t } = useLanguage();
    const [countViewMode, setCountViewMode] = useState<'Operations' | 'Reports'>('Operations');
    const [session, setSession] = useState<WMSCountSession | null>(null);
    const [sessionLoading, setSessionLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    const refreshSession = useCallback(async (sessionId?: string) => {
        const active = sessionId
            ? await wmsCountsService.getSession(sessionId)
            : await wmsCountsService.getActiveSession();
        setSession(active?.status === 'Active' ? active : null);
        return active;
    }, []);

    useEffect(() => {
        let active = true;
        setSessionLoading(true);
        wmsCountsService.getActiveSession()
            .then((current) => { if (active) setSession(current); })
            .catch((error) => {
                logger.error('CountTab', 'Failed to restore count session', error);
                if (active) setLoadError(true);
            })
            .finally(() => { if (active) setSessionLoading(false); });
        return () => { active = false; };
    }, [user?.id, user?.siteId]);

    const startSession = async (type: WMSCountSession['countType']) => {
        if (!user?.siteId) throw new Error(t('warehouse.noAssignedSite'));
        setIsSubmitting(true);
        setSessionLoading(true);
        try {
            const next = await wmsCountsService.startSession(user.siteId, type);
            setSession(next);
            setLoadError(false);
        } finally {
            setIsSubmitting(false);
            setSessionLoading(false);
        }
    };

    const recordCount = async (productId: string, quantity: number) => {
        if (!session) throw new Error(t('warehouse.noActiveCountSession'));
        await wmsCountsService.recordCount(session.id, productId, quantity);
        await refreshSession(session.id);
    };

    const completeSession = async () => {
        if (!session) return;
        setIsSubmitting(true);
        try {
            const result = await wmsCountsService.finishSession(session.id);
            setSession(null);
            addNotification('success', result.varianceCount
                ? t('warehouse.varianceRequestsSentHQ', { count: result.varianceCount })
                : t('warehouse.blindCountCompletedNoVariance'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const cancelSession = async () => {
        if (!session) return;
        setIsSubmitting(true);
        try {
            await wmsCountsService.cancelSession(session.id);
            setSession(null);
            addNotification('info', t('warehouse.sessionCancelledAuditHistory'));
        } catch (error) {
            addNotification('alert', error instanceof Error ? error.message : t('warehouse.unableToCancelCountSession'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const countStatus = session ? 'Active' : 'Idle';

    return (
        <div className="flex-1 space-y-2 overflow-y-auto sm:space-y-4">
            <CountHeader
                countViewMode={countViewMode}
                setCountViewMode={setCountViewMode}
                countSessionStatus={countStatus}
                onCancelSession={cancelSession}
                isSubmitting={isSubmitting}
            />
            {loadError && <p role="alert" className="rounded-xl border border-[var(--theme-status-danger-border)] bg-[var(--theme-status-danger-bg)] p-3 text-sm text-[var(--theme-text-primary)]">{t('warehouse.couldNotRestoreActiveCount')}</p>}
            {countViewMode === 'Operations' ? (
                <CountOperations
                    products={products}
                    user={user}
                    session={session}
                    isLoading={sessionLoading || isSubmitting}
                    onStart={startSession}
                    onRecordCount={recordCount}
                    onComplete={completeSession}
                    addNotification={addNotification}
                />
            ) : (
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

export default CountTab;
