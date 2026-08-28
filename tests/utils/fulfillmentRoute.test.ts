import { describe, it, expect } from 'vitest';
import { parseLocationCoordinates, sortPickItemsByOptimalRoute } from '../../utils/fulfillmentRoute';

describe('Warehouse Serpentine Route Optimizer', () => {
    it('correctly parses complex location strings into 3D bay coordinates', () => {
        const coords = parseLocationCoordinates('A02-S05-L03-B01');
        expect(coords.aisle).toBe(2);
        expect(coords.section).toBe(5);
        expect(coords.level).toBe(3);
        expect(coords.bin).toBe(1);
    });

    it('sorts even aisles ascending and odd aisles descending (serpentine path)', () => {
        const mockPickItems = [
            { id: '1', sku: 'SKU-A', location: 'A01-S01-L01' },
            { id: '2', sku: 'SKU-B', location: 'A01-S05-L01' },
            { id: '3', sku: 'SKU-C', location: 'A02-S08-L01' },
            { id: '4', sku: 'SKU-D', location: 'A02-S02-L01' },
        ];

        const sorted = sortPickItemsByOptimalRoute(mockPickItems, item => item.location);

        // Aisle 1 (odd) should descend sections: S05 then S01
        expect(sorted[0].id).toBe('2'); // A01-S05
        expect(sorted[1].id).toBe('1'); // A01-S01

        // Aisle 2 (even) should ascend sections: S02 then S08
        expect(sorted[2].id).toBe('4'); // A02-S02
        expect(sorted[3].id).toBe('3'); // A02-S08
    });

    it('handles items with null or missing locations safely', () => {
        const mockItems = [
            { id: '1', location: null },
            { id: '2', location: 'A01-S02' }
        ];

        const sorted = sortPickItemsByOptimalRoute(mockItems, item => item.location);
        expect(sorted[0].id).toBe('2');
        expect(sorted[1].id).toBe('1'); // Unlocated item placed at the end
    });
});
