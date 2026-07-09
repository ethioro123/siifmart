import { useMemo } from 'react';
import { Product } from '../types';

// Helper for ABC Analysis
export const getABCClass = (product: Product, totalValue: number) => {
    const prodValue = product.price * product.stock;
    const share = prodValue / totalValue;
    if (share > 0.05) return 'A'; // High Value
    if (share > 0.02) return 'B'; // Medium Value
    return 'C'; // Low Value
};

export function useInventoryOverviewData({
    theme,
    serverMetrics,
    filteredProducts,
    totalInventoryValueCost
}: {
    theme: 'light' | 'dark';
    serverMetrics: any;
    filteredProducts: Product[];
    totalInventoryValueCost: number;
}) {
    // Category chart: use server-side value-based aggregation across ALL products (not just the current page)
    const categoryData = useMemo(() => {
        if (serverMetrics?.category_stats?.length) {
            return serverMetrics.category_stats.slice(0, 6);
        }
        // Fallback: count SKUs locally while server data loads
        const data: Record<string, number> = {};
        filteredProducts.forEach(p => {
            if (p.category) data[p.category] = (data[p.category] || 0) + 1;
        });
        return Object.entries(data)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);
    }, [serverMetrics, filteredProducts]);

    // ABC chart: use server-side classification across ALL products
    const abcData = useMemo(() => {
        const accent = theme === 'dark' ? '#A9CBA2' : '#2C5E3B';
        if (serverMetrics?.abc_stats?.length) {
            return serverMetrics.abc_stats.map((item: { name: string; value: number }, i: number) => ({
                ...item,
                color: i === 0 ? accent : i === 1 ? '#3b82f6' : '#f59e0b'
            }));
        }
        // Fallback: classify locally
        const data = { A: 0, B: 0, C: 0 };
        filteredProducts.forEach(p => {
            const grade = getABCClass(p, totalInventoryValueCost);
            if (grade) data[grade]++;
        });
        return [
            { name: 'Class A (High Value)', value: data.A, color: accent },
            { name: 'Class B (Medium Value)', value: data.B, color: '#3b82f6' },
            { name: 'Class C (Low Value)', value: data.C, color: '#f59e0b' },
        ];
    }, [serverMetrics, filteredProducts, totalInventoryValueCost, theme]);

    return { categoryData, abcData };
}
