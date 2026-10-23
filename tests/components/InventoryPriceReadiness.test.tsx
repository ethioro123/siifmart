// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { InventoryPriceReadiness } from '../../components/inventory/components/InventoryPriceReadiness';
afterEach(cleanup);
describe('inventory retail price readiness', () => {
    it('reports missing selling price without claiming a product is in review', () => {
        render(<InventoryPriceReadiness price={0} />);
        expect(screen.getByText('Selling price not set')).toBeTruthy();
        expect(screen.queryByText(/Review/)).toBeNull();
    });
    it('does not show a readiness warning for a configured selling price', () => {
        const { container } = render(<InventoryPriceReadiness price={100} />);
        expect(container.textContent).toBe('');
    });
});
