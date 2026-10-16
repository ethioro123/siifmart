/**
 * Supabase Real-time Service
 * Live websocket updates for warehouse jobs, assignments, procurement, products, transfers, and inventory
 */

import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface RealtimeSubscription {
    channel: RealtimeChannel;
    unsubscribe: () => void;
}

/**
 * Creates a unique scoped channel subscription with automatic cleanup via supabase.removeChannel
 */
function createScopedSubscription(
    table: string,
    callback: (event: string, payload: any) => void,
    siteId?: string,
    filterPredicate?: (data: any) => boolean
): RealtimeSubscription {
    const channelId = `${table}-${siteId || 'all'}-${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase
        .channel(channelId)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table
            },
            (payload) => {
                const data = (payload.new || payload.old) as any;
                if (filterPredicate) {
                    if (filterPredicate(data)) {
                        callback(payload.eventType, data);
                    }
                } else if (!siteId || data.site_id === siteId || data.siteId === siteId) {
                    callback(payload.eventType, data);
                }
            }
        )
        .subscribe();

    return {
        channel,
        unsubscribe: () => {
            try {
                supabase.removeChannel(channel);
            } catch {
                channel.unsubscribe();
            }
        }
    };
}

// ============================================================================
// REAL-TIME SERVICE
// ============================================================================

export const realtimeService = {
    /**
     * Subscribe to product changes
     */
    subscribeToProducts(
        callback: (event: string, payload: any) => void,
        siteId?: string
    ): RealtimeSubscription {
        return createScopedSubscription('products', callback, siteId);
    },

    /**
     * Subscribe to sales changes
     */
    subscribeToSales(
        callback: (event: string, payload: any) => void,
        siteId?: string
    ): RealtimeSubscription {
        return createScopedSubscription('sales', callback, siteId);
    },

    /**
     * Subscribe to stock movements
     */
    subscribeToStockMovements(
        callback: (event: string, payload: any) => void,
        siteId?: string
    ): RealtimeSubscription {
        return createScopedSubscription('stock_movements', callback, siteId);
    },

    /**
     * Subscribe to customer changes
     */
    subscribeToCustomers(
        callback: (event: string, payload: any) => void
    ): RealtimeSubscription {
        return createScopedSubscription('customers', callback, undefined, () => true);
    },

    /**
     * Subscribe to WMS jobs (supports dual-site: source site OR destination site)
     */
    subscribeToWMSJobs(
        callback: (event: string, payload: any) => void,
        siteId?: string
    ): RealtimeSubscription {
        return createScopedSubscription('wms_jobs', callback, siteId, (data) => {
            return !siteId || 
                data.site_id === siteId || 
                data.dest_site_id === siteId || 
                data.source_site_id === siteId || 
                data.siteId === siteId || 
                data.destSiteId === siteId || 
                data.sourceSiteId === siteId;
        });
    },

    /**
     * Subscribe to transfers (supports dual-site: source site OR destination site)
     */
    subscribeToTransfers(
        callback: (event: string, payload: any) => void,
        siteId?: string
    ): RealtimeSubscription {
        return createScopedSubscription('transfers', callback, siteId, (data) => {
            return !siteId || 
                data.source_site_id === siteId || 
                data.dest_site_id === siteId || 
                data.sourceSiteId === siteId || 
                data.destSiteId === siteId;
        });
    },

    /**
     * Subscribe to purchase orders
     */
    subscribeToPurchaseOrders(
        callback: (event: string, payload: any) => void,
        siteId?: string
    ): RealtimeSubscription {
        return createScopedSubscription('purchase_orders', callback, siteId);
    },

    /**
     * Subscribe to employees
     */
    subscribeToEmployees(
        callback: (event: string, payload: any) => void,
        siteId?: string
    ): RealtimeSubscription {
        return createScopedSubscription('employees', callback, siteId);
    },

    /**
     * Subscribe to job assignments
     */
    subscribeToJobAssignments(
        callback: (event: string, payload: any) => void,
        siteId?: string
    ): RealtimeSubscription {
        return createScopedSubscription('job_assignments', callback, siteId, () => true);
    },

    /**
     * Subscribe to inventory requests (Pending Approvals for Count, Waste, Returns)
     */
    subscribeToInventoryRequests(
        callback: (event: string, payload: any) => void,
        siteId?: string
    ): RealtimeSubscription {
        return createScopedSubscription('inventory_requests', callback, siteId);
    },

    /**
     * Subscribe to barcode approvals (Labels and Barcode Audits)
     */
    subscribeToBarcodeApprovals(
        callback: (event: string, payload: any) => void,
        siteId?: string
    ): RealtimeSubscription {
        return createScopedSubscription('barcode_approvals', callback, siteId);
    },

    /**
     * Subscribe to cashier shifts and drawer sessions
     */
    subscribeToShifts(
        callback: (event: string, payload: any) => void,
        siteId?: string
    ): RealtimeSubscription {
        return createScopedSubscription('shifts', callback, siteId, (data) => {
            return !siteId || data.site_id === siteId || data.home_site_id === siteId || data.siteId === siteId;
        });
    },

    /**
     * Subscribe to mid-shift cash drops to store safe
     */
    subscribeToCashDrops(
        callback: (event: string, payload: any) => void,
        siteId?: string
    ): RealtimeSubscription {
        return createScopedSubscription('pos_cash_drops', callback, siteId);
    },

    /**
     * Subscribe to supervisory overrides (voids, price overrides, drawer kicks)
     */
    subscribeToSupervisoryOverrides(
        callback: (event: string, payload: any) => void,
        siteId?: string
    ): RealtimeSubscription {
        return createScopedSubscription('pos_supervisory_overrides', callback, siteId);
    },

    /**
     * Subscribe to all operational changes for a site
     */
    subscribeToSite(
        siteId: string,
        callbacks: {
            onProductChange?: (event: string, payload: any) => void;
            onSaleChange?: (event: string, payload: any) => void;
            onStockChange?: (event: string, payload: any) => void;
            onCustomerChange?: (event: string, payload: any) => void;
            onWMSJobChange?: (event: string, payload: any) => void;
            onJobAssignmentChange?: (event: string, payload: any) => void;
            onTransferChange?: (event: string, payload: any) => void;
            onPurchaseOrderChange?: (event: string, payload: any) => void;
            onInventoryRequestChange?: (event: string, payload: any) => void;
            onBarcodeApprovalChange?: (event: string, payload: any) => void;
            onShiftChange?: (event: string, payload: any) => void;
            onCashDropChange?: (event: string, payload: any) => void;
            onOverrideChange?: (event: string, payload: any) => void;
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
        if (callbacks.onJobAssignmentChange) {
            subscriptions.push(this.subscribeToJobAssignments(callbacks.onJobAssignmentChange, siteId));
        }
        if (callbacks.onTransferChange) {
            subscriptions.push(this.subscribeToTransfers(callbacks.onTransferChange, siteId));
        }
        if (callbacks.onPurchaseOrderChange) {
            subscriptions.push(this.subscribeToPurchaseOrders(callbacks.onPurchaseOrderChange, siteId));
        }
        if (callbacks.onInventoryRequestChange) {
            subscriptions.push(this.subscribeToInventoryRequests(callbacks.onInventoryRequestChange, siteId));
        }
        if (callbacks.onBarcodeApprovalChange) {
            subscriptions.push(this.subscribeToBarcodeApprovals(callbacks.onBarcodeApprovalChange, siteId));
        }
        if (callbacks.onShiftChange) {
            subscriptions.push(this.subscribeToShifts(callbacks.onShiftChange, siteId));
        }
        if (callbacks.onCashDropChange) {
            subscriptions.push(this.subscribeToCashDrops(callbacks.onCashDropChange, siteId));
        }
        if (callbacks.onOverrideChange) {
            subscriptions.push(this.subscribeToSupervisoryOverrides(callbacks.onOverrideChange, siteId));
        }

        return subscriptions;
    },

    /**
     * Unsubscribe and safely release all channels
     */
    unsubscribeAll(subscriptions: RealtimeSubscription[]) {
        if (!subscriptions) return;
        subscriptions.forEach(sub => {
            try {
                if (sub?.unsubscribe) sub.unsubscribe();
                else if (sub?.channel) supabase.removeChannel(sub.channel);
            } catch {
                // ignore cleanup errors
            }
        });
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
            ch.presenceState();
        });

        ch.on('presence', { event: 'join' }, ({ newPresences }) => {
            if (onJoin) onJoin(newPresences[0]);
        });

        ch.on('presence', { event: 'leave' }, ({ leftPresences }) => {
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
