import { describe, it, expect } from 'vitest';
import {
    generateInboundPutawayLabelHTML,
    InboundPutawayLabelItem
} from '../../utils/labels/InboundPutawayLabelGenerator';

describe('Inbound Putaway & Carton LPN Label Generator', () => {
    const mockItems: InboundPutawayLabelItem[] = [
        {
            sku: 'KE-FD001',
            productName: 'Juma Premium Maize Flour 1kg',
            barcode: '6161100001234',
            poNumber: 'PO-2026-0089',
            quantity: 24,
            packQuantity: 24,
            unit: 'KG',
            batchNumber: 'LOT-20261003-KEFD001-01',
            expiryDate: '2027-08-15',
            targetLocation: 'BAY-A-04-2',
            targetZone: 'AMBIENT-DRY',
            receivedBy: 'Musyoka Kioko',
            receiverCode: 'KE-SIIF0043',
            siteName: 'Nairobi Central Distribution Hub',
            condition: 'QC-PASSED'
        }
    ];

    it('generates valid printable HTML with barcode and putaway target bay', async () => {
        const html = await generateInboundPutawayLabelHTML(mockItems, {
            size: 'Medium',
            format: 'Both'
        });

        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('SIIFMART WMS');
        expect(html).toContain('INBOUND LPN');
        expect(html).toContain('BAY-A-04-2');
        expect(html).toContain('AMBIENT-DRY');
        expect(html).toContain('LOT-20261003-KEFD001-01');
        expect(html).toContain('2027-08-15');
        expect(html).toContain('PO-2026-0089');
        expect(html).toContain('KE-SIIF0043');
        expect(html).toContain('QC-PASSED');
        expect(html).toContain('CASE OF 24 UNITS');
    });

    it('does not contain hardcoded shelf price indicators in warehouse LPN mode', async () => {
        const html = await generateInboundPutawayLabelHTML(mockItems, {
            size: 'Medium',
            format: 'Barcode'
        });

        // Must not render retail shelf price indicators
        expect(html).not.toContain('VAT Inclusive');
        expect(html).not.toContain('Retail Price');
    });

    it('supports multiple thermal label sizes (Small, Medium, Large, XL)', async () => {
        const smallHtml = await generateInboundPutawayLabelHTML(mockItems, {
            size: 'Small',
            format: 'Barcode'
        });
        expect(smallHtml).toContain('74.1mm');

        const largeHtml = await generateInboundPutawayLabelHTML(mockItems, {
            size: 'Large',
            format: 'QR'
        });
        expect(largeHtml).toContain('130mm');
    });
});
