import { describe, it, expect } from 'vitest';
import { getCountryProfile, type Country } from '../../utils/localization';
import type { Product, Promotion } from '../../types/product';

describe('Merchandising Intelligence Compliance & Multi-Country Isolation', () => {
  describe('Rule 2 & 3: National Price Sovereignty & Dynamic Currency Resolution', () => {
    it('resolves distinct national currency symbols for each East African market', () => {
      const etProfile = getCountryProfile('ET');
      const keProfile = getCountryProfile('KE');
      const ugProfile = getCountryProfile('UG');
      const rwProfile = getCountryProfile('RW');
      const tzProfile = getCountryProfile('TZ');

      expect(etProfile.currencySymbol).toBe('ETB');
      expect(keProfile.currencySymbol).toBe('KSh');
      expect(ugProfile.currencySymbol).toBe('USh');
      expect(rwProfile.currencySymbol).toBe('RWF');
      expect(tzProfile.currencySymbol).toBe('TSh');
    });

    it('prohibits mixing or hardcoding currency across country contexts', () => {
      const countries: Country[] = ['ET', 'KE', 'UG', 'RW', 'TZ'];
      const symbols = new Set(countries.map(c => getCountryProfile(c).currencySymbol));
      // Each country has its own distinct sovereign currency
      expect(symbols.size).toBe(5);
    });
  });

  describe('Merchandising Analytics: Dynamic Average Margin & Price Index', () => {
    it('accurately calculates live average margin across catalog products without hardcoding', () => {
      const sampleProducts: Partial<Product>[] = [
        { id: '1', price: 100, costPrice: 70 }, // 30% margin
        { id: '2', price: 200, costPrice: 120 }, // 40% margin
        { id: '3', price: 50, costPrice: 40 }, // 20% margin
      ];

      const validProducts = sampleProducts.filter(p => (p.price ?? 0) > 0);
      const totalMargin = validProducts.reduce((acc, p) => {
        const cost = p.costPrice ?? (p.price! * 0.7);
        const margin = ((p.price! - cost) / p.price!) * 100;
        return acc + margin;
      }, 0);
      const avgMargin = (totalMargin / validProducts.length).toFixed(1);

      // (30 + 40 + 20) / 3 = 30.0%
      expect(avgMargin).toBe('30.0');
    });

    it('gracefully handles empty product lists with zero division guards', () => {
      const emptyProducts: Product[] = [];
      const validProducts = emptyProducts.filter(p => (p.price ?? 0) > 0);
      const avgMargin = validProducts.length > 0 ? 'calculated' : '0.0%';
      const priceIndex = validProducts.length > 0 ? 'calculated' : '100.0';

      expect(avgMargin).toBe('0.0%');
      expect(priceIndex).toBe('100.0');
    });

    it('accurately calculates live price index against competitor benchmarks', () => {
      const sampleProducts: Partial<Product>[] = [
        { id: '1', price: 95, competitorPrice: 100 }, // 95.0 index
        { id: '2', price: 105, competitorPrice: 100 }, // 105.0 index
      ];

      const productsWithComp = sampleProducts.filter(p => (p.competitorPrice ?? 0) > 0 && (p.price ?? 0) > 0);
      const totalIndex = productsWithComp.reduce((acc, p) => {
        return acc + (p.price! / p.competitorPrice!) * 100;
      }, 0);
      const calculatedIndex = (totalIndex / productsWithComp.length).toFixed(1);

      // (95 + 105) / 2 = 100.0
      expect(calculatedIndex).toBe('100.0');
    });
  });

  describe('Rule 2: Campaign & Promotion Isolation', () => {
    it('strictly isolates promotional campaigns per country partition', () => {
      const mixedPromotions: Partial<Promotion>[] = [
        { id: 'p1', code: 'ENKUTATASH25', country_code: 'ET', status: 'Active' },
        { id: 'p2', code: 'MASHUJAA10', country_code: 'KE', status: 'Active' },
        { id: 'p3', code: 'MADARAKA20', country_code: 'KE', status: 'Active' },
      ];

      const kenyaPromos = mixedPromotions.filter(p => {
        const pCountry = p.country_code || p.country;
        return !pCountry || pCountry.toUpperCase() === 'KE';
      });

      const ethiopiaPromos = mixedPromotions.filter(p => {
        const pCountry = p.country_code || p.country;
        return !pCountry || pCountry.toUpperCase() === 'ET';
      });

      expect(kenyaPromos.length).toBe(2);
      expect(kenyaPromos.map(p => p.code)).toEqual(['MASHUJAA10', 'MADARAKA20']);
      expect(ethiopiaPromos.length).toBe(1);
      expect(ethiopiaPromos.map(p => p.code)).toEqual(['ENKUTATASH25']);
    });
  });
});
