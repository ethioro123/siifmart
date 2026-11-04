import { expect, it, vi } from 'vitest';
import { generateLocationLabelHTML } from '../../utils/labels/LocationLabelGenerator';
import { locationSpecializations } from '../../utils/labels/locationSpecializations';
import type { WarehouseZone } from '../../types';

vi.mock('../../utils/barcodeGenerator', () => ({ generateBarcodeSVG: (code: string) => `<svg data-code="${code}"></svg>` }));
const qr = vi.hoisted(() => vi.fn(async (_options: { data: string; size: number }) => '<svg data-qr="location"></svg>'));
vi.mock('../../utils/qrCodeGenerator', () => ({ generateQRCode: qr }));
const item = { humanLabel: 'B-01-02', barcode: '123456789012345', zone: 'B', aisle: '01', bay: '02',
    zoneSpecialization: 'Fresh Produce', aisleSpecialization: 'Leafy <Greens>' };
it('prints separate escaped descriptions alongside the unchanged barcode in every supported size and format', async () => {
    for (const size of ['Medium', 'Large', 'XL']) for (const format of ['Barcode', 'QR', 'Both']) {
        const html = await generateLocationLabelHTML([item], { size, format });
        expect(html).toContain('Fresh Produce');
        expect(html).toContain('Leafy &lt;Greens&gt;');
        expect(html).not.toContain('Leafy <Greens>');
        expect(html).toContain('B-01-02');
        expect(html).toContain('123456789012345');
        expect(html).toContain('<b>Zone B:</b>');
        expect(html).toContain('<b>Aisle 01:</b>');
    }
    expect(JSON.parse(qr.mock.calls[0][0].data).loc).toBe('B-01-02');
    expect(JSON.parse(qr.mock.calls[0][0].data).code).toBe('123456789012345');
});
it('prevents unreadable specialty labels on tiny and small paper', async () => {
    for (const size of ['Tiny', 'Small']) await expect(generateLocationLabelHTML([item], { size, format: 'Barcode' })).rejects.toThrow('Medium');
});
it('resolves only the selected facility, zone and aisle', () => {
    const zones = [
        { siteId: 'other', name: 'Zone B', specialization: 'Wrong facility' },
        { siteId: 'active', name: 'Zone B', specialization: 'Produce', aisleSpecializations: { '01': 'Greens', '02': 'Fruit' } }
    ] as WarehouseZone[];
    expect(locationSpecializations(zones, 'active', 'B', '2')).toEqual({ zoneSpecialization: 'Produce', aisleSpecialization: 'Fruit' });
    expect(locationSpecializations(zones, 'active', 'A', '1')).toEqual({ zoneSpecialization: '', aisleSpecialization: '' });
});
