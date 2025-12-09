/**
 * AI Report Generator Service
 * Generates detailed business reports based on system data
 */

import { salesService, productsService, employeesService, purchaseOrdersService } from './supabase.service';

export interface ReportRequest {
    type: 'sales' | 'inventory' | 'performance' | 'financial';
    period: 'today' | 'week' | 'month' | 'year' | 'all';
    format: 'summary' | 'detailed';
}

export interface GeneratedReport {
    title: string;
    summary: string;
    sections: {
        title: string;
        content: string;
        data?: any[];
    }[];
    timestamp: string;
}

class AIReportGeneratorService {

    /**
     * Generate a report based on the request
     */
    async generateReport(type: string): Promise<GeneratedReport> {
        if (type.includes('sales')) return this.generateSalesReport('Weekly');
        if (type.includes('inventory') || type.includes('stock')) return this.generateInventoryReport();
        if (type.includes('performance') || type.includes('staff')) return this.generatePerformanceReport();
        if (type.includes('forecast') || type.includes('predict')) {
            const subType = type.includes('inventory') ? 'inventory' : 'sales';
            return this.generateForecastReport(subType);
        }
        return this.generateSalesReport('General');
    }

    /**
     * Generate Forecast Report (Predictive Analytics)
     */
    private async generateForecastReport(type: 'sales' | 'inventory'): Promise<GeneratedReport> {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const nextWeek = days.map(d => `Next ${d}`);

        let data: any[] = [];
        let summary = '';
        let title = '';

        if (type === 'sales') {
            title = 'Sales Forecast (Next 7 Days)';
            // Simulate a 15% growth trend
            const baseValue = 2500;
            data = nextWeek.map((day, i) => ({
                name: day,
                value: Math.round(baseValue * (1 + (i * 0.05)) + (Math.random() * 500)),
                trend: Math.round(baseValue * (1 + (i * 0.05))) // Trend line
            }));
            summary = 'Based on current growth velocity, sales are projected to increase by 15% over the next week.';
        } else {
            title = 'Inventory Depletion Forecast';
            // Simulate stock depletion for a popular item
            const startStock = 500;
            data = nextWeek.map((day, i) => ({
                name: day,
                value: Math.max(0, Math.round(startStock - (i * 65) - (Math.random() * 20))),
                threshold: 100 // Reorder point
            }));
            summary = 'At current run rates, "Premium Rice 25kg" will hit reorder levels by Thursday.';
        }

        return {
            title,
            timestamp: new Date().toLocaleString(),
            summary,
            sections: [
                {
                    title: '7-Day Projection',
                    content: summary,
                    data: data
                },
                {
                    title: 'AI Recommendations',
                    content: type === 'sales'
                        ? '- Prepare logistics for higher volume on weekend.\n- Increase staff for dispatch.'
                        : '- Initiate PO #9921 immediately to prevent stockout.\n- Adjust safety stock levels.'
                }
            ]
        };
    }

    /**
     * Parse a natural language command into a report request
     */
    parseCommand(command: string): ReportRequest | null {
        const lower = command.toLowerCase();

        if (!lower.includes('report')) return null;

        let type: ReportRequest['type'] = 'sales'; // Default
        if (lower.includes('inventory') || lower.includes('stock')) type = 'inventory';
        else if (lower.includes('performance') || lower.includes('employee')) type = 'performance';
        else if (lower.includes('finance') || lower.includes('financial')) type = 'financial';

        let period: ReportRequest['period'] = 'month'; // Default
        if (lower.includes('today')) period = 'today';
        else if (lower.includes('week')) period = 'week';
        else if (lower.includes('year')) period = 'year';

        return { type, period, format: 'summary' };
    }

    /**
     * Generate Sales Report
     */
    private async generateSalesReport(period: string): Promise<GeneratedReport> {
        // Mocking data aggregation for now as we don't have full historical sales data in the mock services
        // In a real app, we would query salesService with date ranges

        const sales = await salesService.getAll();
        const totalSales = sales.reduce((sum: number, s: any) => sum + s.total_amount, 0);
        const totalOrders = sales.length;
        const averageOrder = totalOrders > 0 ? totalSales / totalOrders : 0;

        return {
            title: `Sales Report (${period})`,
            timestamp: new Date().toLocaleString(),
            summary: `Total sales for this period reached $${totalSales.toLocaleString()} across ${totalOrders} orders.`,
            sections: [
                {
                    title: 'Key Metrics',
                    content: `
- Total Revenue: $${totalSales.toLocaleString()}
- Total Orders: ${totalOrders}
- Average Order Value: $${averageOrder.toFixed(2)}
                    `
                },
                {
                    title: 'Sales Trend',
                    content: 'Visual representation of sales over time.',
                    data: [
                        { name: 'Mon', value: 4000 },
                        { name: 'Tue', value: 3000 },
                        { name: 'Wed', value: 2000 },
                        { name: 'Thu', value: 2780 },
                        { name: 'Fri', value: 1890 },
                        { name: 'Sat', value: 2390 },
                        { name: 'Sun', value: 3490 },
                    ]
                },
                {
                    title: 'Top Selling Categories',
                    content: '1. Beverages\n2. Electronics\n3. Home Goods'
                }
            ]
        };
    }

    /**
     * Generate Inventory Report
     */
    private async generateInventoryReport(): Promise<GeneratedReport> {
        const products = await productsService.getAll();
        const totalValue = products.reduce((sum: number, p: any) => sum + (p.price * p.stock), 0);
        const lowStock = products.filter((p: any) => p.stock < (p.reorder_point || 10));
        const outOfStock = products.filter((p: any) => p.stock === 0);
        const inStock = products.length - lowStock.length - outOfStock.length;

        return {
            title: 'Inventory Status Report',
            timestamp: new Date().toLocaleString(),
            summary: `Current inventory value is $${totalValue.toLocaleString()}. There are ${lowStock.length} low stock items and ${outOfStock.length} out of stock items.`,
            sections: [
                {
                    title: 'Stock Health',
                    content: `
- Total Products: ${products.length}
- Low Stock Alerts: ${lowStock.length}
- Out of Stock: ${outOfStock.length}
- Total Inventory Value: $${totalValue.toLocaleString()}
                    `,
                    data: [
                        { name: 'In Stock', value: inStock },
                        { name: 'Low Stock', value: lowStock.length },
                        { name: 'Out of Stock', value: outOfStock.length },
                    ]
                },
                {
                    title: 'Critical Items (Low Stock)',
                    content: lowStock.slice(0, 5).map((p: any) => `- ${p.name}: ${p.stock} units`).join('\n')
                }
            ]
        };
    }

    /**
     * Generate Performance Report
     */
    private async generatePerformanceReport(): Promise<GeneratedReport> {
        const employees = await employeesService.getAll();
        const active = employees.filter((e: any) => e.status === 'Active').length;
        const inactive = employees.length - active;

        return {
            title: 'Employee Performance Report',
            timestamp: new Date().toLocaleString(),
            summary: `There are currently ${active} active employees across ${employees.length} total records.`,
            sections: [
                {
                    title: 'Workforce Overview',
                    content: `
- Total Employees: ${employees.length}
- Active: ${active}
- On Leave: ${inactive}
                    `,
                    data: [
                        { name: 'Active', value: active },
                        { name: 'Inactive', value: inactive },
                    ]
                },
                {
                    title: 'Top Performers',
                    content: '1. Meron Yilma (Picker) - 98% Accuracy\n2. Sara Bekele (Manager) - 96 Rating'
                }
            ]
        };
    }
}

export const aiReportGeneratorService = new AIReportGeneratorService();
