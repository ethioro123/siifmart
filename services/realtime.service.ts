/**
 * Supabase Real-time Service
 * Live updates for products, sales, and inventory
 */

import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface RealtimeSubscription {
    channel: RealtimeChannel;
    unsubscribe: () => void;
}

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

export const realtimeService = {
    /**
     * Subscribe to product changes
     */
    subscribeToProducts(
        callback: (event: string, payload: any) => void,
        siteId?: string
    ): RealtimeSubscription {
        const channel = supabase
            .channel('products-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'products',
                    filter: siteId ? `site_id=eq.${siteId}` : undefined
                },
                (payload) => {
                    console.log('Product change:', payload);
                    callback(payload.eventType, payload.new || payload.old);
                }
            )
            .subscribe();

        return {
            channel,
            unsubscribe: () => channel.unsubscribe()
        };
    },

    /**
     * Subscribe to sales changes
     */
    subscribeToSales(
        callback: (event: string, payload: any) => void,
        siteId?: string
    ): RealtimeSubscription {
        const channel = supabase
            .channel('sales-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'sales',
                    filter: siteId ? `site_id=eq.${siteId}` : undefined
                },
                (payload) => {
                    console.log('Sale change:', payload);
                    callback(payload.eventType, payload.new || payload.old);
                }
            )
            .subscribe();

        return {
            channel,
            unsubscribe: () => channel.unsubscribe()
        };
    },

    /**
     * Subscribe to stock movements
     */
    subscribeToStockMovements(
        callback: (event: string, payload: any) => void,
        siteId?: string
    ): RealtimeSubscription {
        const channel = supabase
            .channel('stock-movements-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'stock_movements',
                    filter: siteId ? `site_id=eq.${siteId}` : undefined
                },
                (payload) => {
                    console.log('Stock movement:', payload);
                    callback(payload.eventType, payload.new || payload.old);
                }
            )
            .subscribe();

        return {
            channel,
            unsubscribe: () => channel.unsubscribe()
        };
    },

    /**
     * Subscribe to customer changes
     */
    subscribeToCustomers(
        callback: (event: string, payload: any) => void
    ): RealtimeSubscription {
        const channel = supabase
            .channel('customers-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'customers'
                },
                (payload) => {
                    console.log('Customer change:', payload);
                    callback(payload.eventType, payload.new || payload.old);
                }
            )
            .subscribe();

        return {
            channel,
            unsubscribe: () => channel.unsubscribe()
        };
    },

    /**
     * Subscribe to WMS jobs
     */
    subscribeToWMSJobs(
        callback: (event: string, payload: any) => void,
        siteId?: string
    ): RealtimeSubscription {
        const channel = supabase
            .channel('wms-jobs-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'wms_jobs',
                    filter: siteId ? `site_id=eq.${siteId}` : undefined
                },
                (payload) => {
                    console.log('WMS job change:', payload);
                    callback(payload.eventType, payload.new || payload.old);
                }
            )
            .subscribe();

        return {
            channel,
            unsubscribe: () => channel.unsubscribe()
        };
    },

    /**
     * Subscribe to purchase orders
     */
    subscribeToPurchaseOrders(
        callback: (event: string, payload: any) => void,
        siteId?: string
    ): RealtimeSubscription {
        const channel = supabase
            .channel('purchase-orders-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'purchase_orders',
                    filter: siteId ? `site_id=eq.${siteId}` : undefined
                },
                (payload) => {
                    console.log('Purchase order change:', payload);
                    callback(payload.eventType, payload.new || payload.old);
                }
            )
            .subscribe();

        return {
            channel,
            unsubscribe: () => channel.unsubscribe()
        };
    },

    /**
     * Subscribe to employees
     */
    subscribeToEmployees(
        callback: (event: string, payload: any) => void,
        siteId?: string
    ): RealtimeSubscription {
        const channel = supabase
            .channel('employees-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'employees',
                    filter: siteId ? `site_id=eq.${siteId}` : undefined
                },
                (payload) => {
                    console.log('Employee change:', payload);
                    callback(payload.eventType, payload.new || payload.old);
                }
            )
            .subscribe();

        return {
            channel,
            unsubscribe: () => channel.unsubscribe()
        };
    },

    /**
     * Subscribe to all changes for a site
     */
    subscribeToSite(
        siteId: string,
        callbacks: {
            onProductChange?: (event: string, payload: any) => void;
            onSaleChange?: (event: string, payload: any) => void;
            onStockChange?: (event: string, payload: any) => void;
            onCustomerChange?: (event: string, payload: any) => void;
            onWMSJobChange?: (event: string, payload: any) => void;
        }
    ): RealtimeSubscription[] {
        const subscriptions: RealtimeSubscription[] = [];

        if (callbacks.onProductChange) {
            subscriptions.push(this.subscribeToProducts(callbacks.onProductChange, siteId));
        }

        if (callbacks.onSaleChange) {
            subscriptions.push(this.subscribeToSales(callbacks.onSaleChange, siteId));
        }

        if (callbacks.onStockChange) {
            subscriptions.push(this.subscribeToStockMovements(callbacks.onStockChange, siteId));
        }

        if (callbacks.onCustomerChange) {
            subscriptions.push(this.subscribeToCustomers(callbacks.onCustomerChange));
        }

        if (callbacks.onWMSJobChange) {
            subscriptions.push(this.subscribeToWMSJobs(callbacks.onWMSJobChange, siteId));
        }

        return subscriptions;
    },

    /**
     * Unsubscribe from all channels
     */
    unsubscribeAll(subscriptions: RealtimeSubscription[]) {
        subscriptions.forEach(sub => sub.unsubscribe());
    },

    /**
     * Broadcast a custom event
     */
    async broadcast(channel: string, event: string, payload: any) {
        const ch = supabase.channel(channel);
        await ch.send({
            type: 'broadcast',
            event,
            payload
        });
    },

    /**
     * Subscribe to presence (who's online)
     */
    subscribeToPresence(
        channel: string,
        userId: string,
        userName: string,
        onJoin?: (user: any) => void,
        onLeave?: (user: any) => void
    ): RealtimeChannel {
        const ch = supabase.channel(channel, {
            config: {
                presence: {
                    key: userId
                }
            }
        });

        ch.on('presence', { event: 'sync' }, () => {
            const state = ch.presenceState();
            console.log('Online users:', state);
        });

        ch.on('presence', { event: 'join' }, ({ key, newPresences }) => {
            console.log('User joined:', key, newPresences);
            if (onJoin) onJoin(newPresences[0]);
        });

        ch.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            console.log('User left:', key, leftPresences);
            if (onLeave) onLeave(leftPresences[0]);
        });

        ch.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await ch.track({
                    user_id: userId,
                    user_name: userName,
                    online_at: new Date().toISOString()
                });
            }
        });

        return ch;
    }
};

// ============================================================================
// REAL-TIME HOOKS (for React components)
// ============================================================================

export function useRealtimeProducts(siteId?: string) {
    const [products, setProducts] = React.useState<any[]>([]);

    React.useEffect(() => {
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
    const [sales, setSales] = React.useState<any[]>([]);

    React.useEffect(() => {
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

// Note: React import is for type checking only
// In actual use, import React in the component file
declare const React: any;
