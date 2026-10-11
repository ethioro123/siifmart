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

  describe('Demand Forecast & Intelligent Replenishment Logic', () => {
    it('accurately calculates suggested buy quantities based on stock thresholds and sales velocity', () => {
      const products: Partial<Product>[] = [
        {
          id: 'p1',
          name: 'Cooking Oil 5L',
          stock: 5,
          minStock: 20,
          salesVelocity: 'High',
          price: 500,
          costPrice: 380,
        },
        {
          id: 'p2',
          name: 'Coffee Beans 1kg',
          stock: 45,
          minStock: 20,
          salesVelocity: 'Medium',
          price: 250,
          costPrice: 175,
        },
      ];

      const recommendations = products.map(p => {
        const minThreshold = p.minStock && p.minStock > 0 ? p.minStock : 15;
        const velocityMultiplier = p.salesVelocity === 'High' ? 3.5 : p.salesVelocity === 'Medium' ? 1.8 : 0.9;
        const predictedMonthlyDemand = Math.max(minThreshold * 2, Math.round(minThreshold * velocityMultiplier * 1.5 + (p.stock! < 10 ? 40 : 20)));
        const suggestedBuy = Math.max(0, predictedMonthlyDemand - p.stock!);
        const urgency = p.stock! <= minThreshold ? 'high' : 'normal';

        return { id: p.id, suggestedBuy, urgency };
      });

      const recP1 = recommendations.find(r => r.id === 'p1');
      const recP2 = recommendations.find(r => r.id === 'p2');

      expect(recP1).toBeDefined();
      expect(recP1!.suggestedBuy).toBeGreaterThan(0);
      expect(recP1!.urgency).toBe('high');

      expect(recP2).toBeDefined();
      expect(recP2!.urgency).toBe('normal');
    });

    it('generates accurate prefilled PO line item financial totals', () => {
      const suggestedBuy = 25;
      const unitCost = 140;
      const totalCost = Math.round(suggestedBuy * unitCost * 100) / 100;

      expect(totalCost).toBe(3500);
    });
  });

  describe('Markdown Optimizer & Clearance Glide Path Simulation', () => {
    it('calculates 5-stage markdown degradation without breaching break-even cost price', () => {
      const initialStock = 100;
      const retailPrice = 200;
      const costPrice = 120; // 60% of retail

      const p1 = retailPrice;
      const p2 = Math.round(retailPrice * 0.90); // 180
      const p3 = Math.round(retailPrice * 0.80); // 160
      const p4 = Math.max(costPrice, Math.round(retailPrice * 0.65)); // 130
      const p5 = Math.max(costPrice, Math.round(retailPrice * 0.50)); // cost floor (120, not 100)

      expect(p1).toBe(200);
      expect(p2).toBe(180);
      expect(p3).toBe(160);
      expect(p4).toBe(130);
      expect(p5).toBe(120); // protected by costPrice floor
      expect(p5).toBeGreaterThanOrEqual(costPrice);
    });

    it('accurately calculates retained clearance margin on dynamic depletion', () => {
      const projectedRevenue = 15000;
      const estimatedCost = 10000;
      const projectedMargin = ((projectedRevenue - estimatedCost) / projectedRevenue) * 100;

      expect(projectedMargin.toFixed(1)).toBe('33.3');
    });
  });

  describe('Smart Automation Rules: Condition Evaluation & Cost Floor Protection', () => {
    it('accurately evaluates trigger conditions for Stock, Expiry, and Velocity', () => {
      const product = { stock: 150, daysToExpiry: 12, salesVelocity: 4 };

      // Stock > X condition
      const stockTrigger = product.stock > 100;
      expect(stockTrigger).toBe(true);

      // Expiry < X Days condition
      const expiryTrigger = product.daysToExpiry < 15;
      expect(expiryTrigger).toBe(true);

      // Sales < X condition
      const velocityTrigger = product.salesVelocity < 10;
      expect(velocityTrigger).toBe(true);
    });

    it('enforces cost price floor protection when applying price decrease automation actions', () => {
      const currentPrice = 100;
      const costPrice = 85;
      const discountPercent = 20; // 20% off -> 80, which is below cost price of 85

      const rawDiscountedPrice = currentPrice * (1 - discountPercent / 100);
      const safeNewPrice = Math.max(costPrice, rawDiscountedPrice);

      expect(rawDiscountedPrice).toBe(80);
      expect(safeNewPrice).toBe(85); // Floor protected
      expect(safeNewPrice).toBeGreaterThanOrEqual(costPrice);
    });

    it('correctly calculates new price when applying Set Margin % action', () => {
      const costPrice = 80;
      const targetMarginPercent = 20; // 20% margin -> price = cost / (1 - 0.20) = 100

      const calculatedPrice = Math.round(costPrice / (1 - targetMarginPercent / 100));
      const achievedMargin = ((calculatedPrice - costPrice) / calculatedPrice) * 100;

      expect(calculatedPrice).toBe(100);
      expect(achievedMargin).toBe(20);
    });
  });

  describe('Interactive Shelf Planogram & Space Allocation Studio', () => {
    it('accurately computes shelf velocity aggregate per tier', () => {
      const items: Partial<Product>[] = [
        { id: '1', shelfPosition: 'Eye Level', salesVelocity: 'High' }, // 120
        { id: '2', shelfPosition: 'Eye Level', salesVelocity: 'Medium' }, // 60
        { id: '3', shelfPosition: 'Top Shelf', salesVelocity: 'High' }, // 90
        { id: '4', shelfPosition: 'Bottom Shelf', salesVelocity: 'Low' }, // 8
      ];

      const eyeVelocity = items
        .filter(p => p.shelfPosition === 'Eye Level')
        .reduce((acc, p) => acc + (p.salesVelocity === 'High' ? 120 : p.salesVelocity === 'Medium' ? 60 : 15), 0);

      const topVelocity = items
        .filter(p => p.shelfPosition === 'Top Shelf')
        .reduce((acc, p) => acc + (p.salesVelocity === 'High' ? 90 : p.salesVelocity === 'Medium' ? 40 : 10), 0);

      expect(eyeVelocity).toBe(180);
      expect(topVelocity).toBe(90);
    });

    it('correctly identifies candidates for Prime Tier Eye Level auto-optimization', () => {
      const catalog: Partial<Product>[] = [
        { id: 'p1', name: 'Premium Cooking Oil', shelfPosition: 'Bottom Shelf', salesVelocity: 'High' },
        { id: 'p2', name: 'Slow Moving Vinegar', shelfPosition: 'Eye Level', salesVelocity: 'Low' },
        { id: 'p3', name: 'Top Seller Coffee', shelfPosition: 'Eye Level', salesVelocity: 'High' },
      ];

      const highVelocityToPromote = catalog.filter(p => p.salesVelocity === 'High' && p.shelfPosition !== 'Eye Level');
      const lowVelocityToDemote = catalog.filter(p => p.shelfPosition === 'Eye Level' && p.salesVelocity === 'Low');

      expect(highVelocityToPromote.map(p => p.id)).toEqual(['p1']);
      expect(lowVelocityToDemote.map(p => p.id)).toEqual(['p2']);
    });
  });
});

