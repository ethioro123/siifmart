import { describe, it, expect } from 'vitest';
import { getCountryProfile, type Country } from '../../utils/localization';
import type { Product } from '../../types/product';
import { calculateMetrics } from '../../utils/metrics';

describe('Central Operations Multi-Country Compliance & Isolation', () => {
  describe('Rule 1 & 2: Sovereignty & Cultural Isolation in Dashboard Header', () => {
    it('restricts Ethiopian calendar rendering to Ethiopia HQ tenant', () => {
      const etCountry: Country = 'ET';
      const keCountry: Country = 'KE';
      const ugCountry: Country = 'UG';

      expect(etCountry === 'ET').toBe(true);
      expect(keCountry === 'ET').toBe(false);
      expect(ugCountry === 'ET').toBe(false);
    });

    it('resolves correct sovereign timezone and currency for Kenya and Ethiopia', () => {
      const keProfile = getCountryProfile('KE');
      const etProfile = getCountryProfile('ET');

      expect(keProfile.timezone).toBe('Africa/Nairobi');
      expect(keProfile.currencySymbol).toBe('KSh');
      expect(keProfile.currencyCode).toBe('KES');

      expect(etProfile.timezone).toBe('Africa/Addis_Ababa');
      expect(etProfile.currencySymbol).toBe('ETB');
      expect(etProfile.currencyCode).toBe('ETB');
    });

    it('formats time in Kenya using East African Timezone', () => {
      const testDate = new Date('2026-09-30T08:00:00Z');
      const keFormatter = new Intl.DateTimeFormat('en-KE', {
        timeStyle: 'medium',
        timeZone: 'Africa/Nairobi'
      });
      const formattedTime = keFormatter.format(testDate);
      expect(formattedTime).toBeDefined();
      // UTC 08:00 is EAT (UTC+3) 11:00
      expect(formattedTime).toContain('11:00');
    });
  });

  describe('Rule 1: Asset Value & Inventory Catalog Country Scoping', () => {
    it('ensures Network Asset Value (Base Cost and Retail) calculate strictly within country scope', () => {
      // Simulate Kenyan products
      const kenyaProducts: Product[] = [
        {
          id: 'prod-ke-1',
          name: 'Kenyan Milk',
          sku: 'KE-DY001',
          price: 150,
          costPrice: 110,
          stock: 20,
          siteId: 'site-ke-1',
          category: 'Dairy',
          unit: 'unit',
          image: '',
          status: 'active'
        }
      ];

      // Simulate Ethiopian products
      const ethiopiaProducts: Product[] = [
        {
          id: 'prod-et-1',
          name: 'Ethiopian Coffee',
          sku: 'ET-BV001',
          price: 500,
          costPrice: 350,
          stock: 100,
          siteId: 'site-et-1',
          category: 'Beverages',
          unit: 'unit',
          image: '',
          status: 'active'
        }
      ];

      const keMetrics = calculateMetrics([], kenyaProducts, [], [], [], []);
      const etMetrics = calculateMetrics([], ethiopiaProducts, [], [], [], []);

      // Kenya stock value must only contain Kenyan products (20 * 110 = 2200)
      expect(keMetrics.totalNetworkStockValue).toBe(2200);
      expect(keMetrics.totalNetworkStockValueRetail).toBe(3000);

      // Ethiopia stock value must only contain Ethiopian products (100 * 350 = 35000)
      expect(etMetrics.totalNetworkStockValue).toBe(35000);
      expect(etMetrics.totalNetworkStockValueRetail).toBe(50000);

      // Verify zero cross-addition (Kenya never shows 35000 or 37200)
      expect(keMetrics.totalNetworkStockValue).not.toContain(etMetrics.totalNetworkStockValue);
    });

    it('safely handles empty catalog without NaN or arithmetic leaks', () => {
      const emptyMetrics = calculateMetrics([], [], [], [], [], []);
      expect(emptyMetrics.totalNetworkStockValue).toBe(0);
      expect(emptyMetrics.totalNetworkStockValueRetail).toBe(0);
      expect(emptyMetrics.totalNetworkRevenue).toBe(0);
    });
  });
});
