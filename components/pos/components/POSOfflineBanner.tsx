import React from 'react';
import { WifiOff, RefreshCw, Zap, CheckCircle2 } from 'lucide-react';
import { useData } from '../../../contexts/DataContext';
import { useLanguage } from '../../../contexts/LanguageContext';

export const POSOfflineBanner: React.FC = () => {
    const { t } = useLanguage();
    const { posSyncStatus, posPendingSyncCount, triggerSync } = useData();
    const isOffline = posSyncStatus === 'offline' || !navigator.onLine;
    const hasPending = (posPendingSyncCount || 0) > 0;

    if (!isOffline && !hasPending && posSyncStatus !== 'syncing') {
        return null;
    }

    return (
        <div className={`w-full px-4 py-2 text-xs font-semibold flex items-center justify-between transition-all duration-300 ${
            posSyncStatus === 'syncing'
                ? 'bg-[var(--theme-status-info-bg)] border-b border-[var(--theme-status-info-border)] text-[var(--theme-status-info-text)]'
                : isOffline
                ? 'bg-[var(--theme-status-warning-bg)] border-b border-[var(--theme-status-warning-border)] text-[var(--theme-status-warning-text)]'
                : 'bg-[var(--theme-status-success-bg)] border-b border-[var(--theme-status-success-border)] text-[var(--theme-status-success-text)]'
        }`}>
            <div className="flex items-center gap-2.5">
                {posSyncStatus === 'syncing' ? (
                    <RefreshCw size={15} className="animate-spin text-[var(--theme-status-info)]" />
                ) : isOffline ? (
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--theme-status-warning)] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--theme-status-warning)]"></span>
                    </span>
                ) : (
                    <CheckCircle2 size={15} className="text-[var(--theme-status-success)]" />
                )}

                <div className="flex items-center gap-2">
                    <span className="font-bold uppercase tracking-wider text-xs px-2 py-0.5 rounded-md bg-[var(--theme-bg-card)] border border-[var(--theme-border-subtle)] text-[var(--theme-text-primary)]">
                        {posSyncStatus === 'syncing' ? t('pos.syncInProgress') : isOffline ? t('pos.offlineTerminal') : t('pos.readyToSync')}
                    </span>
                    <span>
                        {posSyncStatus === 'syncing'
                            ? t('pos.uploadingQueuedTransactions').replace('{count}', String(posPendingSyncCount || 0))
                            : isOffline
                            ? t('pos.posRunningOffline')
                            : t('pos.networkReconnected').replace('{count}', String(posPendingSyncCount || 0))}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {hasPending && (
                    <span className="text-xs font-mono bg-[var(--theme-bg-card)] border border-[var(--theme-border-subtle)] text-[var(--theme-text-primary)] px-2.5 py-0.5 rounded-full font-bold">
                        {posPendingSyncCount} {t('pos.queued')}
                    </span>
                )}
                {navigator.onLine && (
                    <button
                        onClick={() => triggerSync && triggerSync()}
                        disabled={posSyncStatus === 'syncing'}
                        className="px-2.5 py-1 rounded-lg bg-[var(--theme-primary)] hover:opacity-90 active:scale-95 text-[var(--theme-primary-text)] text-xs font-bold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                        <RefreshCw size={13} className={posSyncStatus === 'syncing' ? 'animate-spin' : ''} />
                        {t('pos.syncNow')}
                    </button>
                )}
            </div>
        </div>
    );
};
