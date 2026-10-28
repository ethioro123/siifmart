// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PricingProductsTable } from '../../components/merchandising/components/PricingProductsTable';
import { LocationPriceEditor } from '../../components/merchandising/components/LocationPriceEditor';
import type { Product } from '../../types';
const mocks = vi.hoisted(() => ({ preview: vi.fn(), select: vi.fn() }));
const product = { id: 'p1', sku: 'ETCO001', name: 'Coffee', category: 'Pantry', price: 100, costPrice: 70, siteId: 'site1', price_group: { locationCount: 100, recordCount: 120, minPrice: 80, maxPrice: 100, priceVariants: 2, saleLocations: 4, minMargin: 20, maxMargin: 30 } };
vi.mock('../../components/merchandising/MerchandisingContext', () => ({ useMerchandising: () => ({
    filteredProducts: [product], selectedIds: new Set(), toggleSelection: mocks.select,
    toggleSelectAll: vi.fn(), sortConfig: { key: 'name', direction: 'asc' }, handleSort: vi.fn(),
    currencySymbol: 'ETB', previewLocationPrice: mocks.preview,
}) }));
vi.mock('../../components/merchandising/components/PriceGroupLocations', () => ({ PriceGroupLocations: () => <p>Loaded location detail records</p> }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
describe('Grouped Price Manager', () => {
    it('shows one product with all-location summaries and defers location detail', () => {
        render(<PricingProductsTable />);
        expect(screen.getAllByRole('button', { name: /Coffee.*ETCO001/ })).toHaveLength(1);
        expect(screen.getByText('100')).toBeTruthy(); expect(screen.getByText('120 records')).toBeTruthy();
        expect(screen.getByText('ETB 80–100')).toBeTruthy(); expect(screen.getByText('20–30%')).toBeTruthy();
        expect(screen.queryByText('Loaded location detail records')).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Review locations for Coffee' }));
        expect(screen.getByText('Loaded location detail records')).toBeTruthy();
        fireEvent.click(screen.getByRole('checkbox', { name: 'Select Coffee' }));
        expect(mocks.select).toHaveBeenCalledWith('p1');
    });
    it('previews an actual location record while retaining recorded cost', () => {
        render(<LocationPriceEditor product={product as unknown as Product} onClose={vi.fn()} />);
        fireEvent.change(screen.getByRole('spinbutton', { name: 'Location regular price' }), { target: { value: '110' } });
        fireEvent.click(screen.getByRole('button', { name: 'Preview price proposal' }));
        expect(mocks.preview).toHaveBeenCalledWith({ product, proposal: expect.objectContaining({ price: 110, costPrice: 70 }) });
    });
});
