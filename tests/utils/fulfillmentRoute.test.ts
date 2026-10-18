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

    it('correctly parses SIIFMART canonical ZONE-AISLE-BAY locations', () => {
        const coords = parseLocationCoordinates('A-02-05');
        expect(coords.zone).toBe('A');
        expect(coords.aisle).toBe(2);
        expect(coords.section).toBe(5);
        expect(coords.level).toBe(1);

        const verboseCoords = parseLocationCoordinates('Zone B - Aisle 03 - Bay 07');
        expect(verboseCoords.zone).toBe('B');
        expect(verboseCoords.aisle).toBe(3);
        expect(verboseCoords.section).toBe(7);
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

    it('enforces Zone-First routing to prevent staff bouncing between warehouse chambers', () => {
        const mockItems = [
            { id: '1', sku: 'CHILLED-MILK', location: 'B-01-02' }, // Zone B (Chilled)
            { id: '2', sku: 'DRY-RICE', location: 'A-01-05' },    // Zone A (Dry)
            { id: '3', sku: 'DRY-PASTA', location: 'A-02-04' },   // Zone A (Dry)
            { id: '4', sku: 'CHILLED-CHEESE', location: 'B-02-01' } // Zone B (Chilled)
        ];

        const sorted = sortPickItemsByOptimalRoute(mockItems, item => item.location);

        // All Zone A items must be picked first, followed by Zone B
        expect(sorted[0].id).toBe('2'); // Zone A Aisle 1
        expect(sorted[1].id).toBe('3'); // Zone A Aisle 2
        expect(sorted[2].id).toBe('1'); // Zone B Aisle 1
        expect(sorted[3].id).toBe('4'); // Zone B Aisle 2
    });

    it('sorts heavy items first at the same bay to protect fragile items', () => {
        const mockItems = [
            { id: '1', name: 'Eggs 30pk', location: 'A-01-05', weightKg: 1.5 },
            { id: '2', name: 'Cooking Oil 20L', location: 'A-01-05', weightKg: 18.0 },
            { id: '3', name: 'Flour 10kg', location: 'A-01-05', weightKg: 10.0 }
        ];

        const sorted = sortPickItemsByOptimalRoute(
            mockItems,
            item => item.location,
            item => item.weightKg
        );

        // Heaviest first: 18kg -> 10kg -> 1.5kg
        expect(sorted[0].id).toBe('2'); // Oil 20L (18kg)
        expect(sorted[1].id).toBe('3'); // Flour 10kg (10kg)
        expect(sorted[2].id).toBe('1'); // Eggs (1.5kg)
    });

    it('handles items with null or missing locations safely', () => {
        const mockItems = [
            { id: '1', location: null },
            { id: '2', location: 'A-01-02' }
        ];

        const sorted = sortPickItemsByOptimalRoute(mockItems, item => item.location);
        expect(sorted[0].id).toBe('2');
        expect(sorted[1].id).toBe('1'); // Unlocated item placed at the end
    });
});
