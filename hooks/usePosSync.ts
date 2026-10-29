import { useState, useEffect, useCallback, useRef } from 'react';
import { posDB } from '../services/db/pos.db';
import { salesService, customersService } from '../services/supabase.service';
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
    const onSyncCompleteRef = useRef(onSyncComplete);
    onSyncCompleteRef.current = onSyncComplete;

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
            const isFileProtocol = typeof window !== 'undefined' && window.location?.protocol === 'file:';
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
            const pingUrl = isFileProtocol && supabaseUrl
                ? `${supabaseUrl}/rest/v1/`
                : 'favicon.svg?ping=' + Date.now();
            const res = await fetch(pingUrl, {
                method: 'HEAD',
                cache: 'no-store',
                headers: isFileProtocol && supabaseKey ? { apikey: supabaseKey } : undefined,
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
            setSyncStatus('error');
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
                        const { items, pointsRedeemed, loyaltyRate, enableLoyalty, discountCodeId, ...saleData } = salePayload;

                        // 1. Send sale to Supabase
                        const persistedSale = await salesService.create(saleData, items, discountCodeId);
                        await posDB.updateSale({ ...salePayload, ...persistedSale, items });

                        // 3. Customer loyalty points reconciliation
                        if (salePayload.customerId && salePayload.total && enableLoyalty !== false) {
                            try {
                                const customer = await customersService.getById(salePayload.customerId);
                                if (customer) {
                                    const rate = typeof loyaltyRate === 'number' && loyaltyRate > 0 ? loyaltyRate : 100;
                                    const baseAmount = typeof salePayload.subtotal === 'number' ? salePayload.subtotal : salePayload.total;
                                    const earned = Math.floor(baseAmount / rate);
                                    const redeemed = typeof pointsRedeemed === 'number' ? pointsRedeemed : 0;
                                    const updatedPoints = Math.max(0, (customer.loyaltyPoints || 0) + earned - redeemed);
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
                    logger.error('usePosSync', `POS operation ${op.id} remains queued after a failed save`, err);
                }
            }

            // Re-check status
            const remaining = await posDB.getPendingOperations();
            setPendingCount(remaining.length);
            setSyncStatus(remaining.length === 0 ? 'synced' : 'error');
            if (successfulSyncs > 0) setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

            if (successfulSyncs > 0 && remaining.length === 0 && onSyncCompleteRef.current) {
                onSyncCompleteRef.current(successfulSyncs);
            }

        } catch (err: any) {
            logger.error('usePosSync', 'Core POS sync process failed', err as Error);
            setSyncStatus('error');
        } finally {
            isSyncingRef.current = false;
        }
    }, [pingServer]);

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

