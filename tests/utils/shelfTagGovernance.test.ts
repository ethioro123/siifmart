import { describe, it, expect } from 'vitest';
import {
   isProductHalal,
   generateShelfTagsHTML,
   ShelfTagItem
} from '../../utils/labels/ShelfTagGenerator';

describe('Shelf Tag Generator & Halal Proof Governance', () => {
   it('correctly identifies Halal from affirmative evidence', () => {
      expect(isProductHalal({ isHalal: true } as any)).toBe(true);
      expect(isProductHalal({ halalVerified: true } as any)).toBe(true);
      expect(isProductHalal({ dietaryCert: 'HALAL' } as any)).toBe(true);
      expect(isProductHalal({ dietaryCert: 'certified_halal' } as any)).toBe(true);
      expect(isProductHalal({ dietaryCert: '100% Halal Certified' } as any)).toBe(true);
      expect(isProductHalal({ dietaryCert: '100% Certified Halal' } as any)).toBe(true);
      expect(isProductHalal({ customAttributes: { dietaryCert: '100% Halal Certified' } } as any)).toBe(true);
      expect(isProductHalal({ halalCompliance: 'compliant' } as any)).toBe(true);
      expect(isProductHalal({ storage: { halalVerified: true } } as any)).toBe(true);
   });

   it('rejects loose string matches that are not affirmative Halal proof', () => {
      // Loose string containing 'halal' as a substring like 'not halal' or 'non-halal' must fail
      expect(isProductHalal({ dietaryCert: 'non-halal' } as any)).toBe(false);
      expect(isProductHalal({ dietaryCert: 'not halal' } as any)).toBe(false);
      expect(isProductHalal({ halalCompliance: 'unverified' } as any)).toBe(false);
      expect(isProductHalal({} as any)).toBe(false);
   });

   it('does not print fake "VERIFIED" claim badges when Halal evidence is absent', () => {
      const items: ShelfTagItem[] = [
         {
            id: 'p-1',
            name: 'Sunflower Oil 1L',
            sku: 'ET-OIL-01',
            regularPrice: 250,
            category: 'Pantry'
         }
      ];

      const html = generateShelfTagsHTML(items, { currency: 'ETB' });
      // When Halal is absent, it must NOT print 'VERIFIED' badge
      expect(html).not.toContain('tag-badge tag-std');
      expect(html).not.toContain('>VERIFIED<');
      expect(html).not.toContain('HALAL CERTIFIED');
   });

   it('prints "HALAL CERTIFIED" only when affirmative evidence is present', () => {
      const items: ShelfTagItem[] = [
         {
            id: 'p-halal',
            name: 'Pure Halal Honey 500g',
            sku: 'ET-HONEY-01',
            regularPrice: 400,
            isHalal: true
         }
      ];

      const html = generateShelfTagsHTML(items, { currency: 'ETB' });
      expect(html).toContain('HALAL CERTIFIED');
      expect(html).toContain('tag-badge tag-halal');
   });

   it('strictly formats merchandising prices as whole numbers (no fractions or decimals)', () => {
      const items: ShelfTagItem[] = [
         {
            id: 'p-price',
            name: 'Harar Coffee Beans 1kg',
            sku: 'ET-COF-01',
            regularPrice: 450.75, // Fractional
            salePrice: 399.4,     // Fractional
            isOnSale: true
         }
      ];

      const html = generateShelfTagsHTML(items, { currency: 'ETB' });
      // Whole numbers: Math.round(450.75) = 451, Math.round(399.4) = 399
      expect(html).toContain('451');
      expect(html).toContain('399');
      expect(html).not.toContain('450.75');
      expect(html).not.toContain('399.40');
      expect(html).not.toContain('.00');
   });

   it('supports different media sizes in HTML output', () => {
      const items: ShelfTagItem[] = [
         {
            id: 'p-size',
            name: 'Red Lentils 1kg',
            sku: 'ET-LEN-01',
            regularPrice: 120
         }
      ];

      const htmlCompact = generateShelfTagsHTML(items, { currency: 'ETB', mediaSize: 'compact-30x20' });
      expect(htmlCompact).toContain('size-compact-30x20');
      expect(htmlCompact).toContain('compact-30x20');

      const htmlLarge = generateShelfTagsHTML(items, { currency: 'ETB', mediaSize: 'large-70x40' });
      expect(htmlLarge).toContain('size-large-70x40');
      expect(htmlLarge).toContain('large-70x40');
   });
});
