import { PersistedClient, Persister } from '@tanstack/react-query-persist-client';
import { posDB } from './pos.db';

/**
 * Creates an IndexedDB persister for React Query using the existing POS DB connection.
 */
export const createIDBPersister = (key: string = 'REACT_QUERY_OFFLINE_CACHE'): Persister => {
    let timeout: NodeJS.Timeout | null = null;
    let lastClient: PersistedClient | null = null;

    const doPersist = async (client: PersistedClient) => {
        try {
            // Strip non-clonable values (like functions/promises)
            const serialized = JSON.parse(JSON.stringify(client));
            await posDB.saveQueryCache(key, serialized);
        } catch (err) {
            console.error('POSDB: Failed to save React Query cache to IndexedDB:', err);
        }
    };

    return {
        persistClient: (client: PersistedClient) => {
            lastClient = client;

            if (!timeout) {
                timeout = setTimeout(async () => {
                    if (lastClient) {
                        const clientToPersist = lastClient;
                        lastClient = null;
                        await doPersist(clientToPersist);
                    }
                    timeout = null;
                }, 2000); // 2-second debounce window to prevent mobile freeze during high-frequency updates
            }
        },
        restoreClient: async () => {
            try {
                // Fail-safe 800ms race timeout to prevent IndexedDB stalls from blocking app initialization on mobile
                const timeoutPromise = new Promise<undefined>((resolve) =>
                    setTimeout(() => resolve(undefined), 800)
                );
                const fetchPromise = posDB.getQueryCache(key).catch(() => undefined);
                const client = await Promise.race([fetchPromise, timeoutPromise]);
                return client as PersistedClient | undefined;
            } catch (err) {
                console.warn('POSDB: Non-blocking error restoring query cache, mounting fresh:', err);
                return undefined;
            }
        },
        removeClient: async () => {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            lastClient = null;
            await posDB.removeQueryCache(key);
        },
    };
};
