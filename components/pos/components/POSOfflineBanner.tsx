import React from 'react';
import { WifiOff, RefreshCw, Zap, CheckCircle2 } from 'lucide-react';
import { useData } from '../../../contexts/DataContext';

export const POSOfflineBanner: React.FC = () => {
    const { posSyncStatus, posPendingSyncCount, triggerSync } = useData();
    const isOffline = posSyncStatus === 'offline' || !navigator.onLine;
    const hasPending = (posPendingSyncCount || 0) > 0;

    if (!isOffline && !hasPending && posSyncStatus !== 'syncing') {
        return null;
    }

    return (
        <div className={`w-full px-4 py-2 text-xs font-semibold flex items-center justify-between transition-all duration-300 ${
            posSyncStatus === 'syncing'
                ? 'bg-blue-500/15 border-b border-blue-500/30 text-blue-700 dark:text-blue-300'
                : isOffline
                ? 'bg-amber-500/15 border-b border-amber-500/30 text-amber-800 dark:text-amber-300'
                : 'bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
        }`}>
            <div className="flex items-center gap-2.5">
                {posSyncStatus === 'syncing' ? (
                    <RefreshCw size={15} className="animate-spin text-blue-600 dark:text-blue-400" />
                ) : isOffline ? (
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                    </span>
                ) : (
                    <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" />
                )}

                <div className="flex items-center gap-2">
                    <span className="font-bold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10">
                        {posSyncStatus === 'syncing' ? 'Sync in progress' : isOffline ? 'Offline Terminal' : 'Ready to Sync'}
                    </span>
                    <span>
                        {posSyncStatus === 'syncing'
                            ? `Uploading ${posPendingSyncCount || 0} queued offline transaction${posPendingSyncCount !== 1 ? 's' : ''} to cloud...`
                            : isOffline
                            ? `POS running offline. Barcode scanning, receipt printing, and sales are fully operational.`
                            : `Network reconnected. ${posPendingSyncCount || 0} offline transaction${posPendingSyncCount !== 1 ? 's' : ''} ready to sync.`}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {hasPending && (
                    <span className="text-[11px] font-mono bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full font-bold">
                        {posPendingSyncCount} Queued
                    </span>
                )}
                {navigator.onLine && (
                    <button
                        onClick={() => triggerSync && triggerSync()}
                        disabled={posSyncStatus === 'syncing'}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[11px] font-bold shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                        <RefreshCw size={12} className={posSyncStatus === 'syncing' ? 'animate-spin' : ''} />
                        Sync Now
                    </button>
                )}
            </div>
        </div>
    );
};
