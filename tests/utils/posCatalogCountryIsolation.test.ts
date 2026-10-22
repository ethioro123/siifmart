// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCountryScoping } from '../../contexts/hooks/useCountryScoping';
import { getCountryProfile } from '../../utils/localization';
import { CURRENCY_SYMBOL } from '../../constants/categories';
import { Site, Employee, Product } from '../../types';

describe('POS Catalog & Staff Market Sovereignty (Amina Ali Case)', () => {
  const mockAminaAli: Employee = {
    id: 'EMP-036',
    code: 'SIIF-036',
    siteId: 'ST-007',
    name: 'Amina Ali',
    role: 'store_manager',
    email: 'siif-0036@siifmart.com',
    phone: '+251 911 000 036',
    status: 'Active',
    joinDate: '2022-01-01',
    department: 'Retail Operations',
    avatar: 'https://ui-avatars.com/api/?name=Amina+Ali',
    performanceScore: 94
  };

  const mockMerkatoStore: Site = {
    id: 'ST-007',
    code: 'ST-007',
    name: 'Merkato Retail Store',
    type: 'Store',
    address: 'Merkato, Addis Ababa',
    status: 'Active',
    manager: 'Amina Ali',
    country: 'ET',
    currency: 'ETB'
  };

  const mockEastleighStore: Site = {
    id: 'KE-001',
    code: 'KE-001',
    name: 'Eastleigh Retail Store',
    type: 'Store',
    address: 'Eastleigh, Nairobi',
    status: 'Active',
    manager: 'Juma Mwangi',
    country: 'KE',
    currency: 'KES'
  };

  const mockProducts: Product[] = [
    {
      id: 'prod-et-1',
      name: 'Ringo Biscuits (Ethiopia)',
      sku: 'ET-BK001',
      category: 'Bakery',
      price: 520,
      stock: 3,
      siteId: 'ST-007',
      image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35',
      status: 'active'
    },
    {
      id: 'prod-et-2',
      name: 'Rehmat Cookies (Ethiopia)',
      sku: 'ET-BK002',
      category: 'Bakery',
      price: 585,
      stock: 10,
      siteId: 'ST-007',
      image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35',
      status: 'active'
    },
    {
      id: 'prod-ke-1',
      name: 'Kenyan Biscuits',
      sku: 'KE-BK001',
      category: 'Bakery',
      price: 520,
      stock: 15,
      siteId: 'KE-001',
      image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35',
      status: 'active'
    }
  ];

  it('locks Amina Ali strictly to Ethiopia and resolves currency to ETB', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() =>
      useCountryScoping({
        country: 'KE', // Even if global setting was left on Kenya
        user: mockAminaAli,
        sites: [mockMerkatoStore, mockEastleighStore],
        activeSiteId: 'ST-007',
        setActiveSiteId: () => {},
        allOrders: [],
        allSales: [],
        employees: [mockAminaAli],
        movements: [],
        shifts: [],
        expenses: [],
        allProducts: mockProducts,
        products: mockProducts,
        suppliers: []
      }),
      { wrapper }
    );

    // 1. Non-CEO staff locked to Ethiopia
    expect(result.current.effectiveCountry).toBe('ET');
    expect(result.current.isCeo).toBe(false);

    // 2. Global CURRENCY_SYMBOL is synchronized to ETB
    const prof = getCountryProfile(result.current.effectiveCountry);
    expect(prof.currencySymbol).toBe('ETB');
    expect(CURRENCY_SYMBOL).toBe('ETB');

    // 3. Scoped products reject foreign Kenyan SKUs (KE-BK001)
    expect(result.current.scopedProducts.length).toBe(2);
    expect(result.current.scopedProducts.some(p => p.sku === 'KE-BK001')).toBe(false);
    expect(result.current.scopedProducts.map(p => p.sku)).toEqual(['ET-BK001', 'ET-BK002']);
  });
});
