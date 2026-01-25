import { PersistedClient, Persister } from '@tanstack/react-query-persist-client';
import { posDB } from './pos.db';

/**
 * Creates an IndexedDB persister for React Query using the existing POS DB connection.
 */
export const createIDBPersister = (key: string = 'REACT_QUERY_OFFLINE_CACHE'): Persister => {
    return {
        persistClient: async (client: PersistedClient) => {
            // Strip non-clonable values (like functions/promises)
            const serialized = JSON.parse(JSON.stringify(client));
            await posDB.saveQueryCache(key, serialized);
        },
        restoreClient: async () => {
            const client = await posDB.getQueryCache(key);
            return client as PersistedClient | undefined;
        },
        removeClient: async () => {
            await posDB.removeQueryCache(key);
        },
    };
};
