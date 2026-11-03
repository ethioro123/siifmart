// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { ViewPOModal } from '../../../components/procurement/ViewPOModal';
import type { PurchaseOrder } from '../../../types';

vi.mock('../../../contexts/CentralStore', () => ({
    useStore: () => ({
        user: { role: 'regional_manager', name: 'Gemechu Wirtu', country: 'ET' },
        showToast: vi.fn()
    })
}));

vi.mock('../../../contexts/DataContext', () => ({
    useData: () => ({
        allProducts: [
            {
                id: 'prod-1',
                sku: 'ETSA001',
                name: 'SunGold Pure Sunflower Cooking Oil 3L',
                category: 'Cooking Oils & Culinary Fats',
                price: 100,
                costPrice: 80
            }
        ],
        sites: [
            { id: 'site-1', name: 'Adama Central Distribution Center', country: 'ET', currency: 'ETB' }
        ],
        settings: { country: 'ET' },
        regions: []
    })
}));

vi.mock('../../../hooks/usePOFinanceReview', () => ({
    useClearPOFinance: () => ({ mutateAsync: vi.fn() })
}));

const samplePO: PurchaseOrder = {
    id: 'po-1',
    poNumber: 'AAA0001',
    supplierName: 'Adama Agro-Industrial Enterprise',
    status: 'Approved',
    priority: 'Normal',
    orderDate: '2026-10-20',
    requestedBy: 'Bontu Megersa',
    approvedBy: 'Gemechu Wirtu',
    approvedAt: '2026-10-21T12:37:00Z',
    siteId: 'site-1',
    totalAmount: 48000,
    currency: 'ETB',
    lineItems: [
        {
            productId: 'prod-1',
            productName: 'SunGold Pure Sunflower Cooking Oil 3L',
            sku: 'ETSA001',
            quantity: 100,
            unitCost: 480,
            totalCost: 48000,
            unit: 'Carton',
            packQuantity: 6,
            customAttributes: {
                identity: {
                    brand: 'SunGold',
                    subcategory: 'Cooking Oils & Culinary Fats'
                },
                packaging: {
                    packageType: 'Carton',
                    caseSize: '6',
                    packQty: '6'
                },
                physical: {
                    netWeight: '3L',
                    sizeType: 'bottle'
                }
            }
        }
    ]
};

describe('ViewPOModal Row Simplification', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders a simplified, clean table row by default without cluttered attribute strips', () => {
        render(
            <ViewPOModal
                isOpen={true}
                onClose={vi.fn()}
                po={samplePO}
                onEdit={vi.fn()}
                onSuccess={vi.fn()}
            />
        );

        // Header and PO details in interactive view
        expect(screen.getByText('Order Payload')).toBeTruthy();
        expect(screen.getAllByText('ETSA001').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('SunGold Pure Sunflower Cooking Oil 3L').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('View details')).toBeTruthy();

        // The collapsed row should not render the expanded attribute section
        expect(screen.queryByText('Product Specifications & Attributes')).toBeNull();
    });

    it('expands product details and attribute specifications only when the row is clicked', () => {
        render(
            <ViewPOModal
                isOpen={true}
                onClose={vi.fn()}
                po={samplePO}
                onEdit={vi.fn()}
                onSuccess={vi.fn()}
            />
        );

        const viewDetailsBtn = screen.getByText('View details');
        const row = viewDetailsBtn.closest('tr');
        expect(row).toBeTruthy();

        // Click to expand
        fireEvent.click(row!);

        // Expanded view details now visible
        expect(screen.getByText('Product Specifications & Attributes')).toBeTruthy();
        expect(screen.getByText('Hide details')).toBeTruthy();

        // Click again to collapse
        fireEvent.click(row!);
        expect(screen.queryByText('Product Specifications & Attributes')).toBeNull();
        expect(screen.getByText('View details')).toBeTruthy();
    });
});
