import React, { useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useTransferVariance } from '../../../hooks/useTransferVariance';
export function TransferVariancePanel({ jobId }: { jobId: string }) {
    const { t } = useLanguage();
    const { query, sign } = useTransferVariance(jobId);
    const [reason, setReason] = useState('');
    const control = 'min-h-11 rounded-lg border border-[var(--theme-border)] px-3 py-2 text-sm disabled:opacity-50';
    if (query.isPending) return <p role="status">{t('warehouse.varianceLoading')}</p>;
    if (query.isError) return <div role="alert">{t('warehouse.varianceLoadFailed')} <button type="button" className={control} onClick={() => void query.refetch()}>{t('warehouse.receiptRefresh')}</button></div>;
    const state = query.data;
    if (!state?.needed) return null;
    const act = async (action: 'driver' | 'supervisor') => {
        try { await sign.mutateAsync({ job: state.jobId, action, fingerprint: state.fingerprint, reason }); setReason(''); } catch { /* Render the mutation error below. */ }
    };
    return <section aria-label={t('warehouse.varianceTitle')} className="space-y-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-4 text-[var(--theme-text-primary)]">
        <h4 className="font-semibold">{t('warehouse.varianceTitle')}</h4>
        <p className="text-sm">{t('warehouse.varianceHold')}</p>
        <ul className="space-y-1 text-sm">{state.items.map((item, i) => <li key={i}>{item.sku} · {t('warehouse.varianceCount')}: {item.quantity} · {t(item.condition === 'Damaged' ? 'warehouse.damaged' : item.condition === 'Short' ? 'warehouse.short' : 'warehouse.good')}</li>)}</ul>
        <p className="text-sm">{t(state.driverSigned ? 'warehouse.varianceDriverDone' : 'warehouse.varianceDriverWaiting')}</p>
        <p className="text-sm">{t(state.approved ? 'warehouse.varianceSupervisorDone' : 'warehouse.varianceSupervisorWaiting')}</p>
        {state.driverSigned && state.approved && <p role="status" className="text-sm">{t('warehouse.varianceReady')}</p>}
        {((state.canDriver && !state.driverSigned) || (state.canApprove && !state.approved)) && <>
            <label className="block text-sm">{t('warehouse.varianceReason')}<textarea className={`${control} mt-1 w-full bg-[var(--theme-bg-card)]`} maxLength={1200} value={reason} onChange={e => setReason(e.target.value)} disabled={sign.isPending} /></label>
            <div className="flex flex-wrap gap-2">
                {state.canDriver && !state.driverSigned && <button type="button" className={control} disabled={sign.isPending || reason.trim().length < 10} onClick={() => void act('driver')}>{t('warehouse.varianceDriverSign')}</button>}
                {state.canApprove && !state.approved && <button type="button" className={control} disabled={sign.isPending || reason.trim().length < 10} onClick={() => void act('supervisor')}>{t('warehouse.varianceApprove')}</button>}
            </div>
        </>}
        {sign.isError && <p role="alert">{t('warehouse.varianceSaveFailed')}</p>}
        <button type="button" className={control} disabled={query.isFetching || sign.isPending} onClick={() => void query.refetch()}>{t('warehouse.receiptRefresh')}</button>
    </section>;
}
