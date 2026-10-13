// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePOSProductFilters } from '../../components/pos/hooks/usePOSProductFilters';
import { Site, Product } from '../../types';

describe('usePOSProductFilters - Pending Master Product Isolation', () => {
  const mockStore: Site = {
    id: 'ST-001',
    code: 'ST-001',
    name: 'Nairobi Kileleshwa Store',
    type: 'Store',
    address: 'Kileleshwa, Nairobi',
    status: 'Active',
    country: 'KE',
    currency: 'KES'
  };

  const mockApprovedProduct: Product = {
    id: 'prod-001',
    name: 'Approved Flour 2kg',
    sku: 'KEGR001',
    category: 'Grains, Pasta & Rice',
    price: 150,
    stock: 25,
    siteId: 'ST-001',
    status: 'active',
    approvalStatus: 'approved',
    location: 'Aisle 1',
    image: 'https://images.unsplash.com/photo-flour'
  };

  const mockPendingProduct: Product = {
    id: 'prod-002',
    name: 'Newly Proposed Local Honey 500g',
    sku: 'KEHN001',
    category: 'Spreads & Condiments',
    price: 450,
    stock: 12,
    siteId: 'ST-001',
    status: 'active',
    approvalStatus: 'pending',
    location: 'Aisle 2',
    image: 'https://images.unsplash.com/photo-honey'
  };

  const mockRejectedProduct: Product = {
    id: 'prod-003',
    name: 'Rejected Defective Soda 1L',
    sku: 'KEBV001',
    category: 'Beverages',
    price: 90,
    stock: 10,
    siteId: 'ST-001',
    status: 'active',
    approvalStatus: 'rejected',
    location: 'Aisle 3',
    image: 'https://images.unsplash.com/photo-soda'
  };

  it('excludes pending and rejected products from the POS sales register while showing approved items', () => {
    const { result } = renderHook(() =>
      usePOSProductFilters({
        products: [mockApprovedProduct, mockPendingProduct, mockRejectedProduct],
        activeSite: mockStore,
        transfers: []
      })
    );

    const posItems = result.current.filteredProducts;
    expect(posItems.some(p => p.id === 'prod-001')).toBe(true);
    expect(posItems.some(p => p.id === 'prod-002')).toBe(false);
    expect(posItems.some(p => p.id === 'prod-003')).toBe(false);
  });
});
