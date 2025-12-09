/**
 * Analytics & Forecasting Utilities
 * Predictive analytics for sales and inventory
 */

import { SaleRecord, Product } from '../types';

export interface TrendData {
    date: string;
    value: number;
    label: string;
}

export interface ForecastResult {
    predicted: number;
    confidence: number;
    trend: 'up' | 'down' | 'stable';
    change: number;
}

/**
 * Calculate 7-day revenue trend
 */
export function calculateRevenueTrend(sales: SaleRecord[]): TrendData[] {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
        const daySales = sales.filter(s => {
            const saleDate = new Date(s.date).toISOString().split('T')[0];
            return saleDate === date;
        });

        const revenue = daySales.reduce((sum, s) => sum + s.total, 0);
        const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });

        return {
            date,
            value: revenue,
            label: dayName
        };
    });
}

/**
 * Simple linear regression for sales forecasting
 */
export function forecastSales(sales: SaleRecord[], daysAhead: number = 7): ForecastResult {
    // Get last 30 days of data
    const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return date.toISOString().split('T')[0];
    });

    const dailyRevenue = last30Days.map((date, index) => {
        const daySales = sales.filter(s => {
            const saleDate = new Date(s.date).toISOString().split('T')[0];
            return saleDate === date;
        });
        return {
            x: index,
            y: daySales.reduce((sum, s) => sum + s.total, 0)
        };
    });

    // Calculate linear regression
    const n = dailyRevenue.length;
    const sumX = dailyRevenue.reduce((sum, p) => sum + p.x, 0);
    const sumY = dailyRevenue.reduce((sum, p) => sum + p.y, 0);
    const sumXY = dailyRevenue.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumX2 = dailyRevenue.reduce((sum, p) => sum + p.x * p.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict future value
    const predicted = slope * (n + daysAhead) + intercept;

    // Calculate confidence (R-squared)
    const meanY = sumY / n;
    const ssTotal = dailyRevenue.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0);
    const ssResidual = dailyRevenue.reduce((sum, p) => {
        const predictedY = slope * p.x + intercept;
        return sum + Math.pow(p.y - predictedY, 2);
    }, 0);
    const rSquared = 1 - (ssResidual / ssTotal);

    // Determine trend
    const currentAvg = dailyRevenue.slice(-7).reduce((sum, p) => sum + p.y, 0) / 7;
    const change = ((predicted - currentAvg) / currentAvg) * 100;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (change > 5) trend = 'up';
    else if (change < -5) trend = 'down';

    return {
        predicted: Math.max(0, predicted),
        confidence: Math.max(0, Math.min(100, rSquared * 100)),
        trend,
        change
    };
}

/**
 * Predict stock depletion date
 */
export function predictStockDepletion(
    product: Product,
    sales: SaleRecord[]
): { daysUntilEmpty: number; depletionDate: string; dailyRate: number } | null {
    if (product.stock === 0) return null;

    // Calculate average daily sales for this product (last 30 days)
    const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return date.toISOString().split('T')[0];
    });

    const dailySales = last30Days.map(date => {
        const daySales = sales.filter(s => {
            const saleDate = new Date(s.date).toISOString().split('T')[0];
            return saleDate === date;
        });

        return daySales.reduce((sum, sale) => {
            const item = sale.items.find(i => i.id === product.id);
            return sum + (item?.quantity || 0);
        }, 0);
    });

    const totalSold = dailySales.reduce((sum, qty) => sum + qty, 0);
    const avgDailyRate = totalSold / 30;

    if (avgDailyRate === 0) return null;

    const daysUntilEmpty = Math.ceil(product.stock / avgDailyRate);
    const depletionDate = new Date();
    depletionDate.setDate(depletionDate.getDate() + daysUntilEmpty);

    return {
        daysUntilEmpty,
        depletionDate: depletionDate.toISOString().split('T')[0],
        dailyRate: avgDailyRate
    };
}

/**
 * Calculate category distribution
 */
export function calculateCategoryDistribution(products: Product[]): { name: string; value: number; count: number }[] {
    const categoryMap = new Map<string, { value: number; count: number }>();

    products.forEach(product => {
        const category = product.category || 'Uncategorized';
        const existing = categoryMap.get(category) || { value: 0, count: 0 };
        categoryMap.set(category, {
            value: existing.value + (product.price * product.stock),
            count: existing.count + 1
        });
    });

    return Array.from(categoryMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.value - a.value);
}

/**
 * Calculate moving average
 */
export function calculateMovingAverage(data: number[], window: number = 7): number[] {
    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
        const start = Math.max(0, i - window + 1);
        const subset = data.slice(start, i + 1);
        const avg = subset.reduce((sum, val) => sum + val, 0) / subset.length;
        result.push(avg);
    }
    return result;
}

/**
 * Detect anomalies in sales data
 */
export function detectAnomalies(sales: SaleRecord[]): { date: string; value: number; isAnomaly: boolean }[] {
    const dailyRevenue = calculateRevenueTrend(sales);
    const values = dailyRevenue.map(d => d.value);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const stdDev = Math.sqrt(
        values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
    );

    return dailyRevenue.map(d => ({
        date: d.date,
        value: d.value,
        isAnomaly: Math.abs(d.value - mean) > 2 * stdDev
    }));
}
