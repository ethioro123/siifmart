import { useMemo } from 'react';
import { Product } from '../types';

// Helper for ABC Analysis based on revenue / value contribution
export const getABCClass = (product: Product, totalValue: number) => {
    if (totalValue <= 0) return 'C';
    const prodValue = (product.price || 0) * (product.stock || 0);
    const share = prodValue / totalValue;
    if (share > 0.08) return 'A'; // High Value / Vital
    if (share > 0.02) return 'B'; // Medium Value / Important
    return 'C'; // Low Value / Standard
};

export function useInventoryOverviewData({
    theme,
    serverMetrics,
    filteredProducts,
    totalInventoryValueCost,
    totalInventoryValueRetail
}: {
    theme: 'light' | 'dark';
    serverMetrics: any;
    filteredProducts: Product[];
    totalInventoryValueCost: number;
    totalInventoryValueRetail: number;
}) {
    // Dynamic Stock Turnover Rate (Annualized ratio)
    const stockTurnoverRate = useMemo(() => {
        if (serverMetrics?.stock_turnover_rate && serverMetrics.stock_turnover_rate > 0) {
            return Number(serverMetrics.stock_turnover_rate.toFixed(1));
        }

        if (!filteredProducts.length) return 0;

        let weightedTurnover = 0;
        let totalStock = 0;

        filteredProducts.forEach(p => {
            const stock = p.stock || 0;
            if (stock <= 0) return;
            totalStock += stock;
            const velocityMultiplier = p.salesVelocity === 'High' ? 5.4 : p.salesVelocity === 'Medium' ? 2.8 : 0.9;
            weightedTurnover += stock * velocityMultiplier;
        });

        if (totalStock <= 0) return 0;
        return Number((weightedTurnover / totalStock).toFixed(1));
    }, [serverMetrics, filteredProducts]);

    // Dynamic Dead Stock Value (> 90 days slow moving / low velocity stock)
    const deadStockValue = useMemo(() => {
        if (serverMetrics?.dead_stock_value && serverMetrics.dead_stock_value > 0) {
            return serverMetrics.dead_stock_value;
        }

        return filteredProducts
            .filter(p => (p.stock || 0) > 0 && (p.salesVelocity === 'Low' || p.status === 'out_of_stock'))
            .reduce((sum, p) => sum + ((p.stock || 0) * (p.costPrice || (p.price || 0) * 0.7)), 0);
    }, [serverMetrics, filteredProducts]);

    // Dynamic Low Stock Count
    const lowStockCount = useMemo(() => {
        if (serverMetrics?.low_stock_count !== undefined) {
            return serverMetrics.low_stock_count;
        }
        return filteredProducts.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= (p.minStock || 10)).length;
    }, [serverMetrics, filteredProducts]);

    // Category chart: use server-side aggregation or calculate across filtered products
    const categoryData = useMemo(() => {
        if (serverMetrics?.category_stats?.length) {
            return serverMetrics.category_stats.slice(0, 6);
        }
        const data: Record<string, number> = {};
        filteredProducts.forEach(p => {
            const cat = p.category || 'General';
            const val = (p.price || 0) * (p.stock || 0);
            data[cat] = (data[cat] || 0) + val;
        });

        return Object.entries(data)
            .map(([name, value]) => ({ name, value: Math.round(value) }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);
    }, [serverMetrics, filteredProducts]);

    // ABC chart: Pareto classification across active inventory
    const abcData = useMemo(() => {
        const accent = theme === 'dark' ? '#A9CBA2' : '#2C5E3B';
        if (serverMetrics?.abc_stats?.length) {
            return serverMetrics.abc_stats.map((item: { name: string; value: number }, i: number) => ({
                ...item,
                color: i === 0 ? accent : i === 1 ? '#4D6E56' : '#d97706'
            }));
        }

        const totalVal = totalInventoryValueRetail || filteredProducts.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0);
        const data = { A: 0, B: 0, C: 0 };
        filteredProducts.forEach(p => {
            const grade = getABCClass(p, totalVal);
            data[grade]++;
        });

        return [
            { name: 'Class A (Vital)', value: data.A, color: accent },
            { name: 'Class B (Important)', value: data.B, color: '#4D6E56' },
            { name: 'Class C (Standard)', value: data.C, color: '#d97706' },
        ];
    }, [serverMetrics, filteredProducts, totalInventoryValueRetail, theme]);

    return {
        stockTurnoverRate,
        deadStockValue,
        lowStockCount,
        categoryData,
        abcData
    };
}
