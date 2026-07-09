import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { realtimeService } from '../services/realtime.service';

// ============================================================================
// REAL-TIME HOOKS (for React components)
// ============================================================================

export function useRealtimeProducts(siteId?: string) {
    const [products, setProducts] = useState<any[]>([]);

    useEffect(() => {
        const subscription = realtimeService.subscribeToProducts(
            (event, payload) => {
                if (event === 'INSERT') {
                    setProducts(prev => [payload, ...prev]);
                } else if (event === 'UPDATE') {
                    setProducts(prev => prev.map(p => p.id === payload.id ? payload : p));
                } else if (event === 'DELETE') {
                    setProducts(prev => prev.filter(p => p.id !== payload.id));
                }
            },
            siteId
        );

        return () => subscription.unsubscribe();
    }, [siteId]);

    return products;
}

export function useRealtimeSales(siteId?: string) {
    const [sales, setSales] = useState<any[]>([]);

    useEffect(() => {
        const subscription = realtimeService.subscribeToSales(
            (event, payload) => {
                if (event === 'INSERT') {
                    setSales(prev => [payload, ...prev]);
                } else if (event === 'UPDATE') {
                    setSales(prev => prev.map(s => s.id === payload.id ? payload : s));
                } else if (event === 'DELETE') {
                    setSales(prev => prev.filter(s => s.id !== payload.id));
                }
            },
            siteId
        );

        return () => subscription.unsubscribe();
    }, [siteId]);

    return sales;
}

// ============================================================================
// PRESENCE HOOK — Real-time Online Status
// ============================================================================

/**
 * usePresence: Broadcasts the current user as online and returns a Set of
 * currently online employee IDs. Uses Supabase Realtime Presence on a global
 * 'siifmart:presence' channel.
 *
 * @param userId  - The authenticated employee/user ID to broadcast
 * @param userName - Display name to broadcast alongside
 */
export function usePresence(userId?: string, userName?: string): Set<string> {
    const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!userId) return;

        const channel = supabase.channel('siifmart:presence', {
            config: { presence: { key: userId } }
        });

        // On sync: rebuild the full online set from presence state
        channel.on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState<{ user_id: string }>();
            const ids = new Set<string>(
                Object.values(state)
                    .flat()
                    .map((p: any) => p.user_id)
                    .filter(Boolean)
            );
            setOnlineIds(ids);
        });

        channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.track({
                    user_id: userId,
                    user_name: userName || '',
                    online_at: new Date().toISOString()
                });
            }
        });

        return () => {
            channel.untrack();
            supabase.removeChannel(channel);
        };
    }, [userId, userName]);

    return onlineIds;
}
