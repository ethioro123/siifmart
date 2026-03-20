
import { useState, useEffect, useCallback } from 'react';
import { posDB } from '../services/db/pos.db';
import { salesService, productsService } from '../services/supabase.service';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error' | 'pending';

export const usePosSync = (onSyncComplete?: (count: number) => void) => {
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
    const [pendingCount, setPendingCount] = useState(0);

    // Check queue status
    const checkQueue = useCallback(async () => {
        try {
            const pending = await posDB.getPendingOperations();
            setPendingCount(pending.length);

            setSyncStatus(prev => {
                if (pending.length > 0 && navigator.onLine && prev !== 'syncing') {
                    return 'pending';
                }
                return prev;
            });
        } catch (err: any) {
            // If DB is disabled, silently ignore
            if (err?.message?.includes('disabled')) {
                return;
            }
            // Otherwise log only once (not on every interval)
            if (Math.random() < 0.1) { // 10% sampling to reduce spam
                console.warn('POS sync queue check failed:', err?.message);
            }
        }
    }, []);

    // Main Sync Process
    const processQueue = useCallback(async () => {
        if (!navigator.onLine) {
            setSyncStatus('offline');
            return;
        }

        try {
            const pending = await posDB.getPendingOperations();
            if (pending.length === 0) {
                setSyncStatus('synced');
                return;
            }

            setSyncStatus('syncing');

            let successfulSyncs = 0;

            for (const op of pending) {
                try {
                    if (op.type === 'CREATE_SALE') {
                        // Extract payload
                        const salePayload = op.payload;
                        const { items, ...saleData } = salePayload;

                        // Send sale to Supabase
                        await salesService.create(saleData, items);

                        // Deduct stock for each item (was skipped when offline)
                        if (items && Array.isArray(items)) {
                            for (const item of items) {
                                try {
                                    await productsService.adjustStock(item.id, item.quantity, 'OUT');
                                } catch (stockErr) {
                                    console.warn(`⚠️ Stock deduction failed for ${item.name || item.id} during sync (non-blocking):`, stockErr);
                                }
                            }
                        }
                    }

                    // Remove from queue upon success
                    if (op.id) await posDB.removeOperation(op.id);
                    successfulSyncs++;

                } catch (err: any) {
                    console.error(`Failed to sync POS op ${op.id}`, err);

                    // If it's a constraint violation (corrupted data), remove it from queue
                    if (err?.code === '23502' || err?.message?.includes('violates not-null constraint')) {
                        console.warn(`⚠️ Removing corrupted sync entry ${op.id} - data integrity issue`);
                        if (op.id) await posDB.removeOperation(op.id);
                        // Don't count corrupted data drops as "successful syncs" for the UI alert
                    }
                    // If it's a duplicate key error (sale already synced previously), treat as success
                    else if (err?.code === '23505' || err?.message?.includes('duplicate key')) {
                        console.warn(`✅ Removing duplicate sync entry ${op.id} - sale already exists in database`);
                        if (op.id) await posDB.removeOperation(op.id);
                        successfulSyncs++;
                    }
                    // If it's an RLS violation (sale was partially created by a previous attempt), remove the stuck entry
                    else if (err?.code === '42501' || err?.message?.includes('row-level security')) {
                        console.warn(`✅ Removing stuck sync entry ${op.id} - RLS conflict (sale likely already exists)`);
                        if (op.id) await posDB.removeOperation(op.id);
                        successfulSyncs++;
                    }
                }
            }

            // Re-check status
            const remaining = await posDB.getPendingOperations();
            setPendingCount(remaining.length);
            setSyncStatus(remaining.length === 0 ? 'synced' : 'error');

            if (successfulSyncs > 0 && remaining.length === 0 && onSyncComplete) {
                onSyncComplete(successfulSyncs);
            }

        } catch (err: any) {
            // If DB is disabled, silently set to synced (online-only mode)
            if (err?.message?.includes('disabled')) {
                setSyncStatus('synced');
                return;
            }
            console.error('Core POS sync process failed:', err);
            setSyncStatus('error');
        }
    }, []);

    // Effect: Network Listeners
    useEffect(() => {
        const handleOnline = () => {
            setSyncStatus('pending');
            processQueue();
        };
        const handleOffline = () => setSyncStatus('offline');

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial check
        checkQueue();
        if (navigator.onLine) {
            processQueue();
        } else {
            setSyncStatus('offline');
        }

        // Periodic check (every 30s)
        const interval = setInterval(() => {
            if (navigator.onLine) processQueue();
        }, 30000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, [checkQueue, processQueue]);

    // Force Sync function
    const triggerSync = () => {
        if (navigator.onLine) processQueue();
    };

    return {
        syncStatus,
        pendingCount,
        triggerSync,
        checkQueue
    };
};
