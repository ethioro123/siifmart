import { describe, expect, it } from 'vitest';
import { generatePackLabelHTML } from '../../utils/labels/PackLabelGenerator';

const labelData = {
    orderRef: 'PACK-001',
    customerName: 'Market & Store <North>',
    shippingAddress: '12 Main Street',
    itemCount: 2,
    packageNumber: 1,
    totalPackages: 1,
    trackingNumber: 'TRK-001',
    lineItems: [
        { name: 'Milk & Cream <1L>', sku: 'MILK-1L', quantity: 2, unit: 'pk' },
    ],
};

describe('PackLabelGenerator', () => {
    it('uses the standard 4 × 6 label dimensions and displays one parcel', async () => {
        const html = await generatePackLabelHTML(labelData, { size: 'XL', format: 'Both' });

        expect(html).toContain('size: 101.6mm 152.4mm;');
        expect(html).toContain('PARCEL 1 OF 1');
        expect(html).not.toContain('2 PACKAGES');
    });

    it('escapes recipient and item text before placing it in printable HTML', async () => {
        const html = await generatePackLabelHTML(labelData, { size: 'Medium', format: 'Both' });

        expect(html).toContain('Market &amp; Store &lt;North&gt;');
        expect(html).toContain('Milk &amp; Cream &lt;1L&gt;');
        expect(html).not.toContain('<North>');
        expect(html).not.toContain('<1L>');
    });

    it('maps unsupported tiny parcel reprints to the compact supported layout', async () => {
        const html = await generatePackLabelHTML(labelData, { size: 'Tiny', format: 'Barcode' });

        expect(html).toContain('size: 50.8mm 25.4mm;');
        expect(html).toContain('SIIFMART EXPRESS');
    });
});
