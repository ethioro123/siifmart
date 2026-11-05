/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ProcurementDashboard } from '../../../components/procurement/ProcurementDashboard';

describe('ProcurementDashboard charts', () => {
    it('renders charts with positive initial dimensions and without dimension warnings', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const sampleMetrics = {
            totalSpend: 150000,
            openPO: 4,
            pendingValue: 45000,
            potentialRevenue: 60000,
            categoryData: [
                { name: 'Beverages', value: 50000 },
                { name: 'Grains', value: 100000 },
            ],
            trendData: [
                { name: 'Jan', spend: 20000 },
                { name: 'Feb', spend: 30000 },
            ],
        };

        const { container } = render(
            <ProcurementDashboard
                metrics={sampleMetrics}
                dateRange="This Month"
                setDateRange={() => {}}
                suppliers={[]}
                currencySymbol="ETB"
            />
        );

        expect(container).toBeDefined();

        const chartDimensionWarnings = warnSpy.mock.calls.filter(args =>
            args.some(arg => typeof arg === 'string' && arg.includes('width(-1) and height(-1) of chart should be greater than 0'))
        );

        expect(chartDimensionWarnings).toHaveLength(0);
        warnSpy.mockRestore();
    });
});
