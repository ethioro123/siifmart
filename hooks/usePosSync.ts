import { useState, useEffect, useCallback, useRef } from 'react';
import { posDB } from '../services/db/pos.db';
import { salesService, customersService } from '../services/supabase.service';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error' | 'pending';

export interface UsePosSyncReturn {
    syncStatus: SyncStatus;
    pendingCount: number;
    lastSyncedAt: string | null;
    isOnline: boolean;
    latencyMs: number | null;
    triggerSync: () => Promise<void>;
    checkQueue: () => Promise<void>;
}

export const usePosSync = (onSyncComplete?: (count: number) => void): UsePosSyncReturn => {
    const [syncStatus, setSyncStatus] = useState<SyncStatus>(navigator.onLine ? 'synced' : 'offline');
    const [pendingCount, setPendingCount] = useState<number>(0);
    const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
    const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
    const [latencyMs, setLatencyMs] = useState<number | null>(null);
    const isSyncingRef = useRef<boolean>(false);

    // Active heartbeat to verify genuine internet reachability and measure latency
    const pingServer = useCallback(async (): Promise<boolean> => {
        if (!navigator.onLine) {
            setLatencyMs(null);
            return false;
        }
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 4000);
            const t0 = performance.now();
            const res = await fetch('/favicon.svg?ping=' + Date.now(), {
                method: 'HEAD',
                cache: 'no-store',
                signal: controller.signal
            });
            clearTimeout(timeout);
            const rtt = Math.round(performance.now() - t0);
            const isReachable = res.ok || res.status === 304;
            setLatencyMs(isReachable ? rtt : null);
            return isReachable;
        } catch {
            setLatencyMs(null);
            return false;
        }
    }, []);

    // Check queue status
    const checkQueue = useCallback(async () => {
        try {
            const pending = await posDB.getPendingOperations();
            setPendingCount(pending.length);

            setSyncStatus(prev => {
                if (pending.length > 0 && navigator.onLine && prev !== 'syncing') {
                    return 'pending';
                }
                if (!navigator.onLine) return 'offline';
                if (pending.length === 0 && prev !== 'syncing') return 'synced';
                return prev;
            });
        } catch (err: any) {
            if (err?.message?.includes('disabled')) return;
            logger.warn('usePosSync', 'POS sync queue check failed');
        }
    }, []);

    // Main Sync Process
    const processQueue = useCallback(async () => {
        if (isSyncingRef.current) return;

        if (!navigator.onLine) {
            setIsOnline(false);
            setSyncStatus('offline');
            return;
        }

        try {
            isSyncingRef.current = true;
            const pending = await posDB.getPendingOperations();
            setPendingCount(pending.length);

            if (pending.length === 0) {
                setSyncStatus('synced');
                setIsOnline(true);
                return;
            }

            // Verify live reachability before starting bulk sync
            const reachable = await pingServer();
            if (!reachable) {
                setIsOnline(false);
                setSyncStatus('offline');
                return;
            }

            setIsOnline(true);
            setSyncStatus('syncing');

            let successfulSyncs = 0;

            for (const op of pending) {
                try {
                    if (op.type === 'CREATE_SALE') {
                        const salePayload = op.payload;
                        const { items, ...saleData } = salePayload;

                        // 1. Send sale to Supabase
                        await salesService.create(saleData, items);

                        // 2. Atomic stock decrement per item
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
                                        logger.warn('usePosSync', `⚠️ Stock decrement failed for ${item.name || item.id}`);
                                    }
                                } catch (stockErr) {
                                    logger.warn('usePosSync', `⚠️ Stock decrement failed for ${item.name || item.id}`);
                                }
                            }
                        }

                        // 3. Customer loyalty points reconciliation
                        if (salePayload.customerId && salePayload.total) {
                            try {
                                const customer = await customersService.getById(salePayload.customerId);
                                if (customer) {
                                    const loyaltyRate = 100; // 1 point per 100 spent
                                    const earned = Math.floor(salePayload.total / loyaltyRate);
                                    const updatedPoints = (customer.loyaltyPoints || 0) + earned;
                                    await customersService.update(salePayload.customerId, {
                                        loyaltyPoints: updatedPoints,
                                        totalSpent: (customer.totalSpent || 0) + salePayload.total,
                                        lastVisit: salePayload.date || new Date().toISOString()
                                    });
                                }
                            } catch (custErr) {
                                logger.warn('usePosSync', 'Failed to update customer loyalty on sync');
                            }
                        }
                    }

                    // Remove from queue upon success
                    if (op.id) await posDB.removeOperation(op.id);
                    successfulSyncs++;

                } catch (err: any) {
                    logger.error('usePosSync', `Failed to sync POS op ${op.id}`, err);

                    // If it's a duplicate key or constraint error, gracefully remove
                    if (err?.code === '23505' || err?.message?.includes('duplicate key')) {
                        if (op.id) await posDB.removeOperation(op.id);
                        successfulSyncs++;
                    } else if (err?.code === '23502' || err?.code === '42501') {
                        if (op.id) await posDB.removeOperation(op.id);
                        successfulSyncs++;
                    }
                }
            }

            // Re-check status
            const remaining = await posDB.getPendingOperations();
            setPendingCount(remaining.length);
            setSyncStatus(remaining.length === 0 ? 'synced' : 'error');
            setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

            if (successfulSyncs > 0 && remaining.length === 0 && onSyncComplete) {
                onSyncComplete(successfulSyncs);
            }

        } catch (err: any) {
            if (err?.message?.includes('disabled')) {
                setSyncStatus('synced');
                return;
            }
            logger.error('usePosSync', 'Core POS sync process failed', err as Error);
            setSyncStatus('error');
        } finally {
            isSyncingRef.current = false;
        }
    }, [pingServer, onSyncComplete]);

    // Effect: Network Listeners & Periodic Sync
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setSyncStatus('pending');
            processQueue();
        };
        const handleOffline = () => {
            setIsOnline(false);
            setSyncStatus('offline');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        checkQueue();
        if (navigator.onLine) {
            processQueue();
        } else {
            setIsOnline(false);
            setSyncStatus('offline');
        }

        // Periodic sync check every 25s
        const interval = setInterval(() => {
            if (navigator.onLine) processQueue();
        }, 25000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, [checkQueue, processQueue]);

    const triggerSync = async () => {
        await processQueue();
    };

    return {
        syncStatus,
        pendingCount,
        lastSyncedAt,
        isOnline,
        latencyMs,
        triggerSync,
        checkQueue
    };
};

