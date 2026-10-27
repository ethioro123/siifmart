// @vitest-environment jsdom
import React from 'react';
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProductControlModal } from '../../components/merchandising/ProductControlModal';
import { StockTab } from '../../components/merchandising/product-control/StockTab';
import type { Product } from '../../types';
const actions = { isSaving: false, lastSubmitted: null, clearFeedback: vi.fn(), saveProfile: vi.fn(), saveUnit: vi.fn(), saveStock: vi.fn(), preparePricing: vi.fn(), confirmPricing: vi.fn(), priceBatch: null, batchFailures: [], cancelPricing: vi.fn() };
vi.mock('../../hooks/useProductWorkspaceRecord', () => ({ useProductWorkspaceRecord: (product: Product) => ({ data: product }) }));
vi.mock('../../hooks/useProductChanges', () => ({ useProductChanges: () => ({ pending: { data: { data: [], totalCount: 0 } }, history: {}, prices: {}, decision: {} }) }));
vi.mock('../../hooks/useProductControlProposals', () => ({ useProductControlProposals: () => actions }));
vi.mock('../../contexts/CentralStore', () => ({ useStore: () => ({ user: { role: 'regional_operations_manager' } }) }));
vi.mock('../../contexts/DataContext', () => ({ useData: () => ({ sites: [{ id: 'site', name: 'CMC Summit', type: 'Store' }], allProducts: [], effectiveCountry: 'ET', settings: {} }) }));
const product = { id: 'milk', siteId: 'site', name: 'Milk 1L', sku: 'ETDY001', unit: 'UNIT', size: '1L', price: 100, salePrice: 75, isOnSale: true, costPrice: 70, stock: 23, category: 'Dairy', barcode: '123', barcodes: ['123', '456'], location: 'A-01-01', status: 'active', image: '', minStock: 0, maxStock: 20 } as Product;
afterEach(cleanup);
describe('Product control tabs', () => {
    it('offers named accessible tabs and shows the effective proposed sale margin', () => {
        render(<ProductControlModal product={product} isOpen onClose={vi.fn()} />);
        expect(screen.getByRole('dialog', { name: product.name })).toBeTruthy();
        expect(screen.getAllByRole('tab')).toHaveLength(5);
        expect(screen.getByRole('tab', { name: 'Pricing' }).getAttribute('aria-selected')).toBe('true');
        expect(screen.getByText('6.7%')).toBeTruthy();
        expect(screen.getByText('Required below 15% margin')).toBeTruthy();
    });
    it('retains all product barcodes and disables an invalid profile submission', () => {
        render(<ProductControlModal product={product} isOpen onClose={vi.fn()} />);
        fireEvent.click(screen.getByRole('tab', { name: 'Specifications & Packaging' }));
        expect(screen.getByText('123 · 456')).toBeTruthy();
        fireEvent.change(screen.getByRole('textbox', { name: 'Product name' }), { target: { value: '' } });
        expect((screen.getByRole('button', { name: 'Submit profile proposal' }) as HTMLButtonElement).disabled).toBe(true);
    });
    it('shows above-maximum stock and can repair invalid recorded limits without crashing', () => {
        const view = render(<StockTab product={product} stockCfg={{ minStock: '0', maxStock: '20' }} setStockCfg={vi.fn()} handleSaveStock={vi.fn()} isSaving={false} sellUnit="UNIT" />);
        expect(screen.getAllByText('Above maximum').length).toBeGreaterThan(0);
        view.rerender(<StockTab product={{ ...product, minStock: 50, maxStock: 20 }} stockCfg={{ minStock: '10', maxStock: '30' }} setStockCfg={vi.fn()} handleSaveStock={vi.fn()} isSaving={false} sellUnit="UNIT" />);
        expect(screen.getByText('Recorded limits need review')).toBeTruthy();
        expect((screen.getByRole('button', { name: 'Submit stock policy proposal' }) as HTMLButtonElement).disabled).toBe(false);
    });
});
