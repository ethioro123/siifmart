// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { generateShelfTagsHTML, isProductHalal } from '../../utils/labels/ShelfTagGenerator';
import { generateUnifiedBatchLabelsHTML } from '../../utils/labels/ProductLabelGenerator';
import { Product } from '../../types';

describe('Label Generation & Thermal Print Standardization', () => {
    describe('ShelfTagGenerator', () => {
        it('renders shelf tags with 3-column layout and price formatting', () => {
            const html = generateShelfTagsHTML([{
                id: 'p-1',
                name: 'Pure Sunflower Oil 1L',
                sku: 'KE-OIL-01',
                regularPrice: 250,
                isHalal: true
            }], { currency: 'KSh' });

            expect(html).toContain('shelf-grid');
            expect(html).toContain('shelf-tag');
            expect(html).toContain('<span class="currency">KSh</span> 250');
            expect(html).toContain('HALAL');
        });

        it('conditionally controls HALAL badge based on verified product status', () => {
            const halalProd: Product = {
                id: 'p-1',
                sku: 'KE-OIL-01',
                name: 'Halal Certified Cooking Oil',
                price: 200,
                isHalal: true
            } as any;

            const nonHalalProd: Product = {
                id: 'p-2',
                sku: 'KE-CLEAN-01',
                name: 'Laundry Detergent Powder',
                price: 150,
                isHalal: false
            } as any;

            expect(isProductHalal(halalProd)).toBe(true);
            expect(isProductHalal(nonHalalProd)).toBe(false);

            const nonHalalHtml = generateShelfTagsHTML([{
                id: nonHalalProd.id,
                name: nonHalalProd.name,
                sku: nonHalalProd.sku,
                regularPrice: nonHalalProd.price,
                isHalal: false
            }], { currency: 'ETB' });

            expect(nonHalalHtml).not.toContain('HALAL');
            expect(nonHalalHtml).toContain('<span class="currency">ETB</span> 150');
        });

        it('escapes dangerous HTML characters in product names and categories', () => {
            const html = generateShelfTagsHTML([{
                id: 'p-inject',
                name: '<script>alert("hack")</script> & "Cookies"',
                sku: 'KE-XSS-01',
                category: 'Snacks & Treat',
                regularPrice: 99.99
            }], { currency: 'KSh' });

            expect(html).not.toContain('<script>alert("hack")</script>');
            expect(html).toContain('&lt;script&gt;alert(&quot;hack&quot;)&lt;/script&gt;');
            expect(html).toContain('SNACKS &amp; TREAT');
        });
    });

    describe('ProductLabelGenerator', () => {
        it('preserves hyphens in SKU and barcodes without mutating scanner format', async () => {
            const html = await generateUnifiedBatchLabelsHTML([{
                value: 'KE-OIL-PREMIUM-01',
                label: 'Sunflower Oil 2L',
                sku: 'KE-OIL-PREMIUM-01',
                price: '450.00',
                currency: 'KSh'
            }], {
                size: 'Small',
                format: 'Barcode',
                currency: 'KSh'
            });

            // Hyphens must not be stripped
            expect(html).toContain('KE-OIL-PREMIUM-01');
            expect(html).not.toContain('KEOILPREMIUM01');
            expect(html).toContain('size: 50.8mm 25.4mm;');
        });

        it('supports multi-country currency sovereignty (ETB vs KSh)', async () => {
            const keHtml = await generateUnifiedBatchLabelsHTML([{
                value: 'KE-FLOUR-01',
                label: 'Maize Flour 2kg',
                price: '180.00',
                currency: 'KSh'
            }], {
                size: 'Medium',
                format: 'Barcode',
                currency: 'KSh',
                showPrice: true
            });
            expect(keHtml).toContain('KSh 180.00');
            expect(keHtml).toContain('size: 76.2mm 50.8mm;');

            const etHtml = await generateUnifiedBatchLabelsHTML([{
                value: 'ET-COFFEE-01',
                label: 'Yirgacheffe Coffee 500g',
                price: '650.00',
                currency: 'ETB'
            }], {
                size: 'Large',
                format: 'Barcode',
                currency: 'ETB',
                showPrice: true
            });
            expect(etHtml).toContain('ETB 650.00');
            expect(etHtml).toContain('size: 101.6mm 76.2mm;');
        });

        it('escapes special characters in product name and category', async () => {
            const html = await generateUnifiedBatchLabelsHTML([{
                value: 'TEST-SKU-01',
                label: 'Tom & Jerry Juice <500ml>',
                category: 'Beverages & Soft Drinks "Chilled"'
            }], {
                size: 'Medium',
                format: 'Barcode',
                showCategory: true
            });

            expect(html).toContain('Tom &amp; Jerry Juice &lt;500ml&gt;');
            expect(html).toContain('BEVERAGES &amp; SOFT DRINKS &quot;CHILLED&quot;');
        });
    });
});
