import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { SaleRecord } from '../../types';

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
}

const DB_NAME = 'siifmart-pos-db-v2';
const DB_VERSION = 2;

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

    private async _openDB(): Promise<IDBPDatabase<POSDB>> {
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
            return openDB<POSDB>(DB_NAME, DB_VERSION, {
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
                    console.error('POSDB: Connection terminated.');
                    this.db = null;
                    (window as any).__SIFMART_POS_DB__ = undefined;
                }
            });
        })();

        try {
            this.db = await this.connectionPromise;
            // Store globally for HMR survival
            (window as any).__SIFMART_POS_DB__ = this.db;
            return this.db;
        } catch (error) {
            console.error('POSDB: Failed to open database', error);
            this.connectionPromise = null;
            throw error;
        } finally {
            // Clear promise so subsequent calls check this.db or try again
            this.connectionPromise = null;
        }
    }

    private async getDB(timeoutMs: number = 10000): Promise<IDBPDatabase<POSDB>> {
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
            console.error('Failed to get POS DB connection:', err);
            throw err;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // SALES OPERATIONS
    // ═══════════════════════════════════════════════════════════════

    async saveSale(sale: SaleRecord) {
        if (DISABLE_IDB) return; // No-op when disabled
        const db = await this.getDB();
        await db.put('sales', sale);
    }

    async getRecentSales(limit: number = 50): Promise<SaleRecord[]> {
        if (DISABLE_IDB) return []; // Return empty when disabled
        const db = await this.getDB();
        const sales = await db.getAll('sales');
        // Sort in memory for now (newest first)
        return sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit);
    }

    // ═══════════════════════════════════════════════════════════════
    // SYNC QUEUE OPERATIONS
    // ═══════════════════════════════════════════════════════════════

    async enqueueOperation(type: 'CREATE_SALE', payload: any) {
        if (DISABLE_IDB) return; // No-op when disabled
        const db = await this.getDB();
        await db.add('sync_queue', {
            type,
            payload,
            createdAt: new Date().toISOString(),
            status: 'PENDING',
            retryCount: 0
        });
    }

    async getPendingOperations(): Promise<SyncOperation[]> {
        if (DISABLE_IDB) return []; // Return empty when disabled
        const db = await this.getDB();
        return db.getAll('sync_queue');
    }

    async removeOperation(id: number) {
        if (DISABLE_IDB) return; // No-op when disabled
        const db = await this.getDB();
        await db.delete('sync_queue', id);
    }

    // ═══════════════════════════════════════════════════════════════
    // QUERY CACHE (React Query)
    // ═══════════════════════════════════════════════════════════════

    async getQueryCache(key: string): Promise<any> {
        if (DISABLE_IDB) return undefined;
        const db = await this.getDB();
        return db.get('query_cache', key);
    }

    async saveQueryCache(key: string, value: any) {
        if (DISABLE_IDB) return;
        const db = await this.getDB();
        await db.put('query_cache', value, key);
    }

    async removeQueryCache(key: string) {
        if (DISABLE_IDB) return;
        const db = await this.getDB();
        await db.delete('query_cache', key);
    }
}

export const posDB = new POSDBService();
