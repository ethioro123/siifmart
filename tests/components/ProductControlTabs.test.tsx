// @vitest-environment jsdom
import React from 'react';
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProductControlModal } from '../../components/merchandising/ProductControlModal';
import { StockTab } from '../../components/merchandising/product-control/StockTab';
import type { Product } from '../../types';
const session = vi.hoisted(() => ({ country: 'ET', role: 'regional_operations_manager' }));
const actions = { isSaving: false, lastSubmitted: null, clearFeedback: vi.fn(), saveProfile: vi.fn(), saveUnit: vi.fn(), saveStock: vi.fn(), preparePricing: vi.fn(), confirmPricing: vi.fn(), priceBatch: null, batchFailures: [], cancelPricing: vi.fn() };
vi.mock('../../components/products/ProductMasterReference', () => ({ ProductMasterReference: () => <p>Country catalog reference</p> }));
vi.mock('../../hooks/useProductWorkspaceRecord', () => ({ useProductWorkspaceRecord: (product: Product) => ({ data: product }) }));
vi.mock('../../hooks/useProductChanges', () => ({ useProductChanges: () => ({ pending: { data: { data: [], totalCount: 0 } }, history: {}, prices: {}, decision: {} }) }));
vi.mock('../../hooks/useProductControlProposals', () => ({ useProductControlProposals: () => actions }));
vi.mock('../../contexts/CentralStore', () => ({ useStore: () => ({ user: { role: session.role } }) }));
vi.mock('../../contexts/DataContext', () => ({ useData: () => ({ sites: [{ id: 'site', name: 'CMC Summit', type: 'Store' }], allProducts: [], movements: [], effectiveCountry: session.country, settings: {} }) }));
const product = { id: 'milk', siteId: 'site', name: 'Milk 1L', sku: 'ETDY001', unit: 'UNIT', size: '1L', price: 100, salePrice: 75, isOnSale: true, costPrice: 70, stock: 23, category: 'Dairy', barcode: '123', barcodes: ['123', '456'], location: 'A-01-01', status: 'active', image: '', minStock: 0, maxStock: 20 } as Product;
afterEach(() => { cleanup(); session.country = 'ET'; session.role = 'regional_operations_manager'; });
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
    it('uses one overview for Inventory with sale prices and readonly specifications', () => {
        render(<ProductControlModal product={product} isOpen onClose={vi.fn()} initialTab="overview" readOnly />);
        expect(screen.getByRole('tab', { name: 'Overview' }).getAttribute('aria-selected')).toBe('true');
        expect(screen.queryByRole('tab', { name: 'Pricing' })).toBeNull();
        expect(screen.getAllByText('ETB 75').length).toBeGreaterThan(0);
        fireEvent.click(screen.getByRole('tab', { name: 'Specifications & Packaging' }));
        expect(screen.queryByRole('button', { name: 'Submit unit proposal' })).toBeNull();
    });
    it('closes an existing product workspace when the central country changes', () => {
        const close = vi.fn();
        const view = render(<ProductControlModal product={product} isOpen onClose={close} />);
        session.country = 'KE';
        view.rerender(<ProductControlModal product={product} isOpen onClose={close} />);
        expect(close).toHaveBeenCalledOnce();
    });
    it('portals above parent panels and keeps Escape from closing the underlying workflow', () => {
        const close = vi.fn(); const parentKey = vi.fn();
        document.addEventListener('keydown', parentKey);
        const view = render(<ProductControlModal product={product} isOpen onClose={close} />);
        expect(view.container.querySelector('[role=dialog]')).toBeNull();
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(close).toHaveBeenCalledOnce(); expect(parentKey).not.toHaveBeenCalled();
        document.removeEventListener('keydown', parentKey);
    });
    it('shows above-maximum stock and can repair invalid recorded limits without crashing', () => {
        const view = render(<StockTab product={product} stockCfg={{ minStock: '0', maxStock: '20' }} setStockCfg={vi.fn()} handleSaveStock={vi.fn()} isSaving={false} sellUnit="UNIT" />);
        expect(screen.getAllByText('Above maximum').length).toBeGreaterThan(0);
        view.rerender(<StockTab product={{ ...product, minStock: 50, maxStock: 20 }} stockCfg={{ minStock: '10', maxStock: '30' }} setStockCfg={vi.fn()} handleSaveStock={vi.fn()} isSaving={false} sellUnit="UNIT" />);
        expect(screen.getByText('Recorded limits need review')).toBeTruthy();
        expect((screen.getByRole('button', { name: 'Submit stock policy proposal' }) as HTMLButtonElement).disabled).toBe(false);
    });
});

it.each(['regional_finance_manager','regional_hr_manager','regional_it_manager','regional_security_manager','transport_fleet_manager'])('keeps unrelated role %s read-only', role => {
    session.role = role;
    render(<ProductControlModal product={product} isOpen onClose={vi.fn()} />);
    expect(screen.queryByRole('tab', { name: 'Pricing' })).toBeNull();
    expect(screen.queryByRole('tab', { name: 'Stock Policy' })).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'Specifications & Packaging' }));
    expect(screen.queryByRole('button', { name: 'Submit profile proposal' })).toBeNull();
});
it('enables existing proposal controls for merchandising specialists', () => {
    session.role = 'merchandising_specialist';
    render(<ProductControlModal product={product} isOpen onClose={vi.fn()} />);
    expect(screen.getByRole('tab', { name: 'Pricing' })).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Specifications & Packaging' }));
    expect(screen.getByRole('button', { name: 'Submit profile proposal' })).toBeTruthy();
});
