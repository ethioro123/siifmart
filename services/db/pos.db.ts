import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { SaleRecord } from '../../types';
import type { HeldOrder } from '../../types';

// ⚠️ Set to true to completely disable IndexedDB (for debugging IDB issues)
const DISABLE_IDB = false;

export interface SyncOperation {
    id?: number;
    type: 'CREATE_SALE';
    payload: any;
    createdAt: string;
    status: 'PENDING' | 'SYNCING' | 'FAILED';
    retryCount: number;
}

interface POSDB extends DBSchema {
    sales: {
        key: string;
        value: SaleRecord;
        indexes: { 'by-date': string };
    };
    sync_queue: {
        key: number;
        value: SyncOperation;
        indexes: { 'by-status': string };
    };
    query_cache: {
        key: string;
        value: any;
    };
    held_orders: {
        key: string;
        value: HeldOrder;
        indexes: { 'by-time': string };
    };
}

const DB_NAME = 'siifmart-pos-db-v2';
const DB_VERSION = 3;

class POSDBService {
    private db: IDBPDatabase<POSDB> | null = null;
    private connectionPromise: Promise<IDBPDatabase<POSDB>> | null = null;
    private disabled: boolean = false;
    private failureCount: number = 0;
    private readonly MAX_FAILURES = 3;

    constructor() {
        // Ensure clean shutdown on page reload/close
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => {
                if (this.db) {
                    this.db.close();
                    this.db = null;
                }
            });
        }
    }

    private checkDisabled() {
        if (this.disabled) {
            throw new Error('POS DB disabled due to persistent failures');
        }
    }

    private async _openDB(isRetry: boolean = false): Promise<IDBPDatabase<POSDB>> {
        // HMR / Singleton Check:
        // Use a global variable to track the connection across HMR updates
        const globalDB = (window as any).__SIFMART_POS_DB__;

        // If we have a local reference, use it
        if (this.db) return this.db;

        // If a connection attempt is already in progress, return that promise
        if (this.connectionPromise) return this.connectionPromise;

        this.connectionPromise = (async () => {
            // 1. CLEANUP PREVIOUS CONNECTIONS (Critical for HMR)
            if (globalDB) {
                console.warn('POSDB: Closing orphaned connection from previous session/HMR...');
                try {
                    globalDB.close();
                } catch (e) { console.warn('Error closing old DB', e); }
                (window as any).__SIFMART_POS_DB__ = undefined;
            }

            // 2. OPEN NEW CONNECTION
            try {
                return await openDB<POSDB>(DB_NAME, DB_VERSION, {
                    upgrade(db) {
                        // Sales Store
                        if (!db.objectStoreNames.contains('sales')) {
                            const salesStore = db.createObjectStore('sales', { keyPath: 'id' });
                            salesStore.createIndex('by-date', 'date');
                        }
                        // Sync Queue Store
                        if (!db.objectStoreNames.contains('sync_queue')) {
                            const queueStore = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
                            queueStore.createIndex('by-status', 'status');
                        }
                        // Query Cache Store (React Query)
                        if (!db.objectStoreNames.contains('query_cache')) {
                            db.createObjectStore('query_cache'); // Key-value store
                        }
                        // Held Orders Store (persists held carts across reloads/restarts)
                        if (!db.objectStoreNames.contains('held_orders')) {
                            const holdStore = db.createObjectStore('held_orders', { keyPath: 'id' });
                            holdStore.createIndex('by-time', 'time');
                        }
                    },
                    blocked: () => {
                        console.warn('POSDB: Connection is blocked. Attempting to force close...');
                    },
                    blocking: () => {
                        console.warn('POSDB: This connection is blocking a newer version. Closing...');
                        // Close automatically to allow upgrade
                        if (this.db) {
                            this.db.close();
                            this.db = null;
                            (window as any).__SIFMART_POS_DB__ = undefined;
                        }
                    },
                    terminated: () => {
                        console.warn('POSDB: Connection terminated by browser.');
                        this.db = null;
                        (window as any).__SIFMART_POS_DB__ = undefined;
                    }
                });
            } catch (err: any) {
                // DETECT CORRUPTION OR BROWSER STORAGE ERROR
                const isInternalError = 
                    err?.name === 'UnknownError' || 
                    err?.message?.includes('Internal error') || 
                    err?.message?.includes('backing store');

                if (isInternalError && !isRetry) {
                    console.warn('POSDB: Detected internal storage error. Attempting database reset...', err);
                    try {
                        // Use native API to delete the database
                        await new Promise<void>((resolve, reject) => {
                            const req = indexedDB.deleteDatabase(DB_NAME);
                            req.onsuccess = () => resolve();
                            req.onerror = () => reject(new Error('Failed to delete corrupted database'));
                            req.onblocked = () => {
                                console.warn('POSDB: Delete blocked by other tabs. Closing them might help.');
                                resolve(); // Proceed anyway, openDB might still fail but we tried
                            };
                        });
                        console.log('POSDB: Database reset initiated. Retrying open...');
                        return await this._openDB(true); // Retry once
                    } catch (resetErr) {
                        console.warn('POSDB: Failed to reset database:', resetErr);
                    }
                }
                
                // If not internal error, or reset failed, or already retried
                throw err;
            }
        })();

        try {
            this.db = await this.connectionPromise;
            // Store globally for HMR survival
            (window as any).__SIFMART_POS_DB__ = this.db;
            this.failureCount = 0; // Reset on success
            return this.db;
        } catch (error) {
            console.warn('POSDB: Failed to open database', error);
            this.connectionPromise = null;
            this.failureCount++;
            
            if (this.failureCount >= this.MAX_FAILURES) {
                console.warn('POSDB: Persistent failures detected. Disabling IndexedDB for this session.');
                this.disabled = true;
            }
            throw error;
        } finally {
            // Clear promise so subsequent calls check this.db or try again
            this.connectionPromise = null;
        }
    }

    private async getDB(timeoutMs: number = 10000): Promise<IDBPDatabase<POSDB>> {
        this.checkDisabled();
        try {
            // Race the connection opening against a timeout
            const dbPromise = this._openDB();
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('IndexedDB operation timed out')), timeoutMs)
            );

            return await Promise.race([dbPromise, timeoutPromise]);
        } catch (err) {
            // If we timed out or failed, ensure we reset state so we can retry next time
            if (this.connectionPromise) this.connectionPromise = null;
            console.warn('POSDB: DB Connection unavailable:', (err as any)?.message);
            throw err;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // SALES OPERATIONS
    // ═══════════════════════════════════════════════════════════════

    async saveSale(sale: SaleRecord) {
        if (DISABLE_IDB || this.disabled) return;
        try {
            const db = await this.getDB();
            await db.put('sales', sale);
        } catch (err) {
            console.warn('POSDB: Gracefully skipping saveSale due to DB error');
        }
    }

    async getRecentSales(limit: number = 50): Promise<SaleRecord[]> {
        if (DISABLE_IDB || this.disabled) return [];
        try {
            const db = await this.getDB();
            const sales = await db.getAll('sales');
            return sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit);
        } catch (err) {
            console.warn('POSDB: Gracefully returning empty array for getRecentSales');
            return [];
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // SYNC QUEUE OPERATIONS
    // ═══════════════════════════════════════════════════════════════

    async enqueueOperation(type: 'CREATE_SALE', payload: any) {
        if (DISABLE_IDB || this.disabled) return;
        try {
            const db = await this.getDB();
            await db.add('sync_queue', {
                type,
                payload,
                createdAt: new Date().toISOString(),
                status: 'PENDING',
                retryCount: 0
            });
        } catch (err) {
            console.warn('POSDB: Gracefully skipping enqueueOperation due to DB error');
        }
    }

    async getPendingOperations(): Promise<SyncOperation[]> {
        if (DISABLE_IDB || this.disabled) return [];
        try {
            const db = await this.getDB();
            return await db.getAll('sync_queue');
        } catch (err) {
            console.warn('POSDB: Gracefully returning empty array for getPendingOperations');
            return [];
        }
    }

    async removeOperation(id: number) {
        if (DISABLE_IDB || this.disabled) return;
        try {
            const db = await this.getDB();
            await db.delete('sync_queue', id);
        } catch (err) {
            console.warn('POSDB: Gracefully skipping removeOperation due to DB error');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // QUERY CACHE (React Query)
    // ═══════════════════════════════════════════════════════════════

    async getQueryCache(key: string): Promise<any> {
        if (DISABLE_IDB || this.disabled) return undefined;
        try {
            const db = await this.getDB();
            return await db.get('query_cache', key);
        } catch (err) {
            console.warn(`POSDB: Gracefully skipping getQueryCache for ${key}`);
            return undefined;
        }
    }

    async saveQueryCache(key: string, value: any) {
        if (DISABLE_IDB || this.disabled) return;
        try {
            const db = await this.getDB();
            await db.put('query_cache', value, key);
        } catch (err) {
            console.warn(`POSDB: Gracefully skipping saveQueryCache for ${key}`);
        }
    }

    async removeQueryCache(key: string) {
        if (DISABLE_IDB || this.disabled) return;
        try {
            const db = await this.getDB();
            await db.delete('query_cache', key);
        } catch (err) {
            console.warn(`POSDB: Gracefully skipping removeQueryCache for ${key}`);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // HELD ORDERS (persisted carts — survive device restarts offline)
    // ═══════════════════════════════════════════════════════════════

    /** Replaces the entire held orders list with the provided array */
    async saveHeldOrders(orders: HeldOrder[]) {
        if (DISABLE_IDB || this.disabled) return;
        try {
            const db = await this.getDB();
            const tx = db.transaction('held_orders', 'readwrite');
            // Clear old entries then write the current list
            await tx.store.clear();
            for (const order of orders) {
                await tx.store.put(order);
            }
            await tx.done;
        } catch (err) {
            console.warn('POSDB: Gracefully skipping saveHeldOrders due to DB error');
        }
    }

    /** Returns all held orders sorted newest-first */
    async getHeldOrders(): Promise<HeldOrder[]> {
        if (DISABLE_IDB || this.disabled) return [];
        try {
            const db = await this.getDB();
            const all = await db.getAll('held_orders');
            return all.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        } catch (err) {
            console.warn('POSDB: Gracefully returning [] for getHeldOrders');
            return [];
        }
    }

    /** Removes a single held order by ID */
    async removeHeldOrder(id: string) {
        if (DISABLE_IDB || this.disabled) return;
        try {
            const db = await this.getDB();
            await db.delete('held_orders', id);
        } catch (err) {
            console.warn(`POSDB: Gracefully skipping removeHeldOrder(${id})`);
        }
    }
}


export const posDB = new POSDBService();
