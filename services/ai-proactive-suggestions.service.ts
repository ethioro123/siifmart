/**
 * AI Proactive Suggestions Service
 * Monitors data and provides intelligent suggestions
 */

import { aiDataContextService } from './ai-data-context.service';

export interface ProactiveSuggestion {
    id: string;
    type: 'warning' | 'info' | 'success' | 'alert';
    title: string;
    message: string;
    actions: SuggestionAction[];
    priority: number;
    timestamp: number;
    dismissed: boolean;
}

export interface SuggestionAction {
    label: string;
    action: string;
    params?: Record<string, any>;
}

class AIProactiveSuggestionsService {
    private suggestions: ProactiveSuggestion[] = [];
    private checkInterval: number = 300000; // 5 minutes
    private intervalId: any = null;

    /**
     * Start monitoring for suggestions
     */
    startMonitoring(userRole: string, userSiteId: string): void {
        if (this.intervalId) return; // Already monitoring

        // Initial check
        this.checkForSuggestions(userRole, userSiteId);

        // Periodic checks
        this.intervalId = setInterval(() => {
            this.checkForSuggestions(userRole, userSiteId);
        }, this.checkInterval);
    }

    /**
     * Stop monitoring
     */
    stopMonitoring(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * Check for suggestions (Public for manual triggering)
     */
    public async checkForSuggestions(userRole: string, userSiteId: string): Promise<void> {
        try {
            const context = await aiDataContextService.getDataContext(userRole, userSiteId);

            // Check low stock
            await this.checkLowStock(context);

            // Check pending PO approvals
            await this.checkPendingPOApprovals(context);

            // Check out of stock
            await this.checkOutOfStock(context);

            // Check unassigned jobs
            await this.checkUnassignedJobs(context);

            // Check pending orders (customer orders)
            await this.checkPendingOrders(context);

        } catch (error) {
            console.error('Failed to check for suggestions:', error);
        }
    }

    /**
     * Check for low stock products
     */
    private async checkLowStock(context: any): Promise<void> {
        if (!context.products) return;

        const lowStockProducts = context.products.filter((p: any) =>
            p.stock > 0 && p.stock < (p.reorder_point || 10)
        );

        if (lowStockProducts.length > 0) {
            const existingSuggestion = this.suggestions.find(s => s.id === 'low-stock');

            if (!existingSuggestion || !existingSuggestion.dismissed) {
                this.addSuggestion({
                    id: 'low-stock',
                    type: 'warning',
                    title: 'Low Stock Alert',
                    message: `${lowStockProducts.length} products are below reorder point`,
                    actions: [
                        {
                            label: 'View Products',
                            action: 'navigate',
                            params: { route: '/inventory?filter=low' }
                        },
                        {
                            label: 'Create POs',
                            action: 'navigate',
                            params: { route: '/procurement' }
                        },
                        {
                            label: 'Dismiss',
                            action: 'dismiss'
                        }
                    ],
                    priority: 8,
                    timestamp: Date.now(),
                    dismissed: false
                });
            }
        }
    }

    /**
     * Check for out of stock products
     */
    private async checkOutOfStock(context: any): Promise<void> {
        if (!context.products) return;

        const outOfStockProducts = context.products.filter((p: any) => p.stock === 0);

        if (outOfStockProducts.length > 0) {
            const existingSuggestion = this.suggestions.find(s => s.id === 'out-of-stock');

            if (!existingSuggestion || !existingSuggestion.dismissed) {
                this.addSuggestion({
                    id: 'out-of-stock',
                    type: 'alert',
                    title: 'Out of Stock Alert',
                    message: `${outOfStockProducts.length} products are completely out of stock`,
                    actions: [
                        {
                            label: 'View Products',
                            action: 'navigate',
                            params: { route: '/inventory?filter=out' }
                        },
                        {
                            label: 'Create Urgent PO',
                            action: 'navigate',
                            params: { route: '/procurement' }
                        },
                        {
                            label: 'Dismiss',
                            action: 'dismiss'
                        }
                    ],
                    priority: 10,
                    timestamp: Date.now(),
                    dismissed: false
                });
            }
        }
    }

    /**
     * Check for pending PO approvals
     */
    private async checkPendingPOApprovals(context: any): Promise<void> {
        if (!context.purchaseOrders) return;

        const draftPOs = context.purchaseOrders.filter((po: any) => po.status === 'Draft');

        if (draftPOs.length > 0) {
            const existingSuggestion = this.suggestions.find(s => s.id === 'pending-po-approvals');

            if (!existingSuggestion || !existingSuggestion.dismissed) {
                const totalValue = draftPOs.reduce((sum: number, po: any) => sum + (po.total_amount || 0), 0);

                this.addSuggestion({
                    id: 'pending-po-approvals',
                    type: 'warning',
                    title: 'Purchase Orders Awaiting Approval',
                    message: `${draftPOs.length} POs (${totalValue.toLocaleString()} ETB) need your review`,
                    actions: [
                        {
                            label: 'Review POs',
                            action: 'navigate',
                            params: { route: '/procurement?status=draft' }
                        },
                        {
                            label: 'Dismiss',
                            action: 'dismiss'
                        }
                    ],
                    priority: 9,
                    timestamp: Date.now(),
                    dismissed: false
                });
            }
        }
    }

    /**
     * Check for unassigned warehouse jobs
     */
    private async checkUnassignedJobs(context: any): Promise<void> {
        if (!context.jobs) return;

        const unassignedJobs = context.jobs.filter((job: any) =>
            job.status === 'Pending' && (!job.assignedTo || job.assignedTo === 'Unassigned')
        );

        if (unassignedJobs.length > 0) {
            const existingSuggestion = this.suggestions.find(s => s.id === 'unassigned-jobs');

            if (!existingSuggestion || !existingSuggestion.dismissed) {
                this.addSuggestion({
                    id: 'unassigned-jobs',
                    type: 'alert',
                    title: 'Unassigned Warehouse Jobs',
                    message: `${unassignedJobs.length} jobs need to be assigned to workers`,
                    actions: [
                        {
                            label: 'View Jobs',
                            action: 'navigate',
                            params: { route: '/wms-ops?tab=PICK' }
                        },
                        {
                            label: 'Dismiss',
                            action: 'dismiss'
                        }
                    ],
                    priority: 7,
                    timestamp: Date.now(),
                    dismissed: false
                });
            }
        }
    }

    /**
     * Check for pending orders
     */
    private async checkPendingOrders(context: any): Promise<void> {
        if (!context.orders) return;

        const pendingOrders = context.orders.filter((o: any) => o.status === 'Pending');

        if (pendingOrders.length > 5) {
            const existingSuggestion = this.suggestions.find(s => s.id === 'pending-orders');

            if (!existingSuggestion || !existingSuggestion.dismissed) {
                this.addSuggestion({
                    id: 'pending-orders',
                    type: 'info',
                    title: 'Pending Orders',
                    message: `You have ${pendingOrders.length} pending purchase orders`,
                    actions: [
                        {
                            label: 'View Orders',
                            action: 'navigate',
                            params: { route: '/procurement?status=pending' }
                        },
                        {
                            label: 'Dismiss',
                            action: 'dismiss'
                        }
                    ],
                    priority: 5,
                    timestamp: Date.now(),
                    dismissed: false
                });
            }
        }
    }

    /**
   * Add an external suggestion (e.g. from Anomaly Detector)
   */
    addExternalSuggestion(suggestion: ProactiveSuggestion): void {
        this.addSuggestion(suggestion);
    }

    /**
     * Add a suggestion
     */
    private addSuggestion(suggestion: ProactiveSuggestion): void {
        // Remove existing suggestion with same ID
        this.suggestions = this.suggestions.filter(s => s.id !== suggestion.id);

        // Add new suggestion
        this.suggestions.push(suggestion);

        // Keep only last 10 suggestions
        this.suggestions = this.suggestions
            .sort((a, b) => b.priority - a.priority)
            .slice(0, 10);
    }

    /**
     * Get all active suggestions
     */
    getSuggestions(): ProactiveSuggestion[] {
        return this.suggestions
            .filter(s => !s.dismissed)
            .sort((a, b) => b.priority - a.priority);
    }

    /**
     * Dismiss a suggestion
     */
    dismissSuggestion(id: string): void {
        const suggestion = this.suggestions.find(s => s.id === id);
        if (suggestion) {
            suggestion.dismissed = true;
        }
    }

    /**
     * Clear all suggestions
     */
    clearAll(): void {
        this.suggestions = [];
    }
}

export const aiProactiveSuggestionsService = new AIProactiveSuggestionsService();
