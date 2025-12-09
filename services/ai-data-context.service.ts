/**
 * AI Data Context Service
 * Provides real-time data access for AI to answer data-aware questions
 */

import { productsService, employeesService, sitesService, purchaseOrdersService } from './supabase.service';

export interface DataContext {
    products: any[];
    employees: any[];
    orders: any[];
    jobs: any[];
    sites: any[];
    customers: any[];
    sales: any[];
}

class AIDataContextService {
    private dataCache: Partial<DataContext> = {};
    private cacheTimestamp: number = 0;
    private cacheDuration: number = 60000; // 1 minute

    /**
     * Get current data context for AI
     */
    async getDataContext(userRole: string, userSiteId: string): Promise<Partial<DataContext>> {
        // Check if cache is still valid
        const now = Date.now();
        if (now - this.cacheTimestamp < this.cacheDuration && Object.keys(this.dataCache).length > 0) {
            return this.dataCache;
        }

        // Fetch fresh data
        try {
            const context: Partial<DataContext> = {};

            // Fetch products
            const products = await productsService.getAll();
            context.products = products || [];

            // Fetch employees (if authorized)
            if (['super_admin', 'admin', 'hr', 'manager', 'warehouse_manager'].includes(userRole)) {
                const employees = await employeesService.getAll();
                context.employees = employees || [];
            }

            // Fetch sites
            const sites = await sitesService.getAll();
            context.sites = sites || [];

            // Fetch orders (if authorized)
            if (['super_admin', 'admin', 'procurement_manager', 'warehouse_manager'].includes(userRole)) {
                const orders = await purchaseOrdersService.getAll();
                context.orders = orders || [];
            }

            // Cache the data
            this.dataCache = context;
            this.cacheTimestamp = now;

            return context;
        } catch (error) {
            console.error('Failed to fetch data context:', error);
            return {};
        }
    }

    /**
     * Get data summary for AI prompts
     */
    getDataSummary(context: Partial<DataContext>): string {
        const summary: string[] = [];

        if (context.products) {
            const totalProducts = context.products.length;
            const lowStock = context.products.filter(p => p.stock < (p.reorder_point || 10)).length;
            const outOfStock = context.products.filter(p => p.stock === 0).length;

            summary.push(`Products: ${totalProducts} total, ${lowStock} low stock, ${outOfStock} out of stock`);
        }

        if (context.employees) {
            const totalEmployees = context.employees.length;
            const activeEmployees = context.employees.filter(e => e.status === 'Active').length;

            summary.push(`Employees: ${totalEmployees} total, ${activeEmployees} active`);
        }

        if (context.sites) {
            const totalSites = context.sites.length;
            const warehouses = context.sites.filter(s => s.type === 'Warehouse').length;
            const stores = context.sites.filter(s => s.type === 'Store').length;

            summary.push(`Sites: ${totalSites} total (${warehouses} warehouses, ${stores} stores)`);
        }

        if (context.orders) {
            const totalOrders = context.orders.length;
            const pendingOrders = context.orders.filter(o => o.status === 'Pending').length;

            summary.push(`Orders: ${totalOrders} total, ${pendingOrders} pending`);
        }

        return summary.join('\n');
    }

    /**
     * Answer data-specific questions
     */
    async answerDataQuestion(question: string, context: Partial<DataContext>): Promise<string | null> {
        const lowerQuestion = question.toLowerCase();

        // Product questions
        if (lowerQuestion.includes('how many products') || lowerQuestion.includes('total products')) {
            return `You have ${context.products?.length || 0} products in your inventory.`;
        }

        if (lowerQuestion.includes('low stock') || lowerQuestion.includes('low in stock')) {
            const lowStock = context.products?.filter(p => p.stock < (p.reorder_point || 10)) || [];
            if (lowStock.length === 0) {
                return 'No products are currently low in stock.';
            }
            const topLow = lowStock.slice(0, 5).map(p => `- ${p.name} (${p.stock} units)`).join('\n');
            return `You have ${lowStock.length} products low in stock:\n${topLow}${lowStock.length > 5 ? '\n...and more' : ''}`;
        }

        if (lowerQuestion.includes('out of stock') || lowerQuestion.includes('no stock')) {
            const outOfStock = context.products?.filter(p => p.stock === 0) || [];
            if (outOfStock.length === 0) {
                return 'No products are currently out of stock.';
            }
            const list = outOfStock.slice(0, 5).map(p => `- ${p.name}`).join('\n');
            return `You have ${outOfStock.length} products out of stock:\n${list}${outOfStock.length > 5 ? '\n...and more' : ''}`;
        }

        // Employee questions
        if (lowerQuestion.includes('how many employees') || lowerQuestion.includes('total employees')) {
            return `You have ${context.employees?.length || 0} employees in the system.`;
        }

        if (lowerQuestion.includes('warehouse staff') || lowerQuestion.includes('warehouse employees')) {
            const warehouseStaff = context.employees?.filter(e =>
                ['warehouse_manager', 'dispatcher', 'picker', 'driver', 'inventory_specialist'].includes(e.role)
            ) || [];
            return `You have ${warehouseStaff.length} warehouse employees.`;
        }

        // Site questions
        if (lowerQuestion.includes('how many sites') || lowerQuestion.includes('total sites')) {
            const warehouses = context.sites?.filter(s => s.type === 'Warehouse').length || 0;
            const stores = context.sites?.filter(s => s.type === 'Store').length || 0;
            return `You have ${context.sites?.length || 0} sites: ${warehouses} warehouses and ${stores} stores.`;
        }

        // Order questions
        if (lowerQuestion.includes('pending orders') || lowerQuestion.includes('pending po')) {
            const pending = context.orders?.filter(o => o.status === 'Pending') || [];
            return `You have ${pending.length} pending purchase orders.`;
        }

        return null; // Let AI handle it
    }

    /**
     * Clear cache (force refresh)
     */
    clearCache(): void {
        this.dataCache = {};
        this.cacheTimestamp = 0;
    }
}

export const aiDataContextService = new AIDataContextService();
