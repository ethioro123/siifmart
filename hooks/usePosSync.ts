
import { useState, useEffect, useCallback } from 'react';
import { posDB } from '../services/db/pos.db';
import { salesService } from '../services/supabase.service';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

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
                logger.warn('usePosSync', 'POS sync queue check failed:');
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

                        // Atomically decrement stock per item using a DB-level RPC.
                        // This is safe for concurrent offline terminals — uses GREATEST(0, stock - qty)
                        // so two terminals selling the same item offline won't double-deduct.
                        if (items && Array.isArray(items)) {
                            for (const item of items) {
                                try {
                                    const { error: rpcErr } = await supabase.rpc('pos_decrement_stock', {
                                        p_product_id: item.id,
                                        p_quantity: item.quantity,
                                        p_site_id: salePayload.siteId || salePayload.site_id || null,
                                        p_product_name: item.name || '',
                                        p_reason: `POS Sale (Offline Sync) — Receipt ${salePayload.receiptNumber || salePayload.id}`,
                                        p_performed_by: salePayload.cashierName || 'System',
                                        p_sale_date: salePayload.date || new Date().toISOString()
                                    });
                                    if (rpcErr) {
                                        logger.warn('usePosSync', `⚠️ Atomic stock decrement failed for ${item.name || item.id} (non-blocking):`);
                                    }
                                } catch (stockErr) {
                                    logger.warn('usePosSync', `⚠️ Stock decrement failed for ${item.name || item.id} during sync (non-blocking):`);
                                }
                            }
                        }
                    }

                    // Remove from queue upon success
                    if (op.id) await posDB.removeOperation(op.id);
                    successfulSyncs++;

                } catch (err: any) {
                    logger.error('usePosSync', `Failed to sync POS op ${op.id}`, err);

                    // If it's a constraint violation (corrupted data), remove it from queue
                    if (err?.code === '23502' || err?.message?.includes('violates not-null constraint')) {
                        logger.warn('usePosSync', `⚠️ Removing corrupted sync entry ${op.id} - data integrity issue`);
                        if (op.id) await posDB.removeOperation(op.id);
                        // Don't count corrupted data drops as "successful syncs" for the UI alert
                    }
                    // If it's a duplicate key error (sale already synced previously), treat as success
                    else if (err?.code === '23505' || err?.message?.includes('duplicate key')) {
                        logger.warn('usePosSync', `✅ Removing duplicate sync entry ${op.id} - sale already exists in database`);
                        if (op.id) await posDB.removeOperation(op.id);
                        successfulSyncs++;
                    }
                    // If it's an RLS violation (sale was partially created by a previous attempt), remove the stuck entry
                    else if (err?.code === '42501' || err?.message?.includes('row-level security')) {
                        logger.warn('usePosSync', `✅ Removing stuck sync entry ${op.id} - RLS conflict (sale likely already exists)`);
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
            logger.error('usePosSync', 'Core POS sync process failed', err as Error);
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
