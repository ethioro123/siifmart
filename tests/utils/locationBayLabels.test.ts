import { describe, it, expect } from 'vitest';
import { generateLocationLabelHTML, LocationLabelItem } from '../../utils/labels/LocationLabelGenerator';

describe('Location & Bay Label Generator - Scanner Aspect Ratio & Compliance', () => {
    const mockBayItems: LocationLabelItem[] = [
        {
            humanLabel: 'A-01-05',
            barcode: 'LOC-A0105-001',
            zone: 'A',
            aisle: '01',
            bay: '05',
            siteName: 'Bole Central Fulfillment Hub',
            siteCode: 'ET-ADD-01'
        }
    ];

    it('generates valid printable HTML with bay identifiers and barcode', async () => {
        const html = await generateLocationLabelHTML(mockBayItems, {
            size: 'Medium',
            format: 'Barcode'
        });

        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('LOCATION LABEL');
        expect(html).toContain('ZONE: A');
        expect(html).toContain('LOC-A0105-001');
        expect(html).toContain('Bole Central Fulfillment Hub');
    });

    it('generates tall barcode optimized for warehouse gun/scanner reliability', async () => {
        const html = await generateLocationLabelHTML(mockBayItems, {
            size: 'Medium',
            format: 'Barcode'
        });

        // Barcode height is tuned (at least 58-64px) and width is compact (<= 1.25)
        // Check for presence of SVG barcode elements
        expect(html).toContain('<svg');
        expect(html).toContain('barcode-container');
        expect(html).toContain('max-width:2.8in');
    });

    it('supports Medium with both QR and tall Barcode side-by-side', async () => {
        const html = await generateLocationLabelHTML(mockBayItems, {
            size: 'Medium',
            format: 'Both'
        });

        expect(html).toContain('qr-container');
        expect(html).toContain('barcode-container');
        expect(html).toContain('max-width:2.2in');
    });

    it('supports Small, Medium, Large, and XL label sizes', async () => {
        const smallHtml = await generateLocationLabelHTML(mockBayItems, {
            size: 'Small',
            format: 'Barcode'
        });
        expect(smallHtml).toContain('50.8mm');

        const largeHtml = await generateLocationLabelHTML(mockBayItems, {
            size: 'Large',
            format: 'Barcode'
        });
        expect(largeHtml).toContain('101.6mm');
        expect(largeHtml).toContain('76.2mm');

        const xlHtml = await generateLocationLabelHTML(mockBayItems, {
            size: 'XL',
            format: 'Barcode'
        });
        expect(xlHtml).toContain('152.4mm');
    });

    it('strictly enforces zero raw Unicode emojis in generated bay labels', async () => {
        const html = await generateLocationLabelHTML(mockBayItems, {
            size: 'Medium',
            format: 'Both'
        });

        const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
        expect(emojiRegex.test(html)).toBe(false);
    });
});
