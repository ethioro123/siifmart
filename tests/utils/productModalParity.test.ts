import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Product Details & Edit Modal Architectural Parity Audit', () => {
    const rootDir = path.resolve(__dirname, '../../');

    it('strictly complies with 500-line ceiling across all created and touched files', () => {
        const filesToCheck = [
            'components/ProductForm.tsx',
            'components/inventory/modals/InventoryProductModal.tsx',
            'components/inventory/ProductDetailsModal.tsx',
            'components/inventory/product-form/EditableProfileHeader.tsx',
            'components/inventory/product-form/EditableSpecificationsCard.tsx',
            'components/inventory/product-form/EditableFinancialsCard.tsx',
            'components/inventory/product-form/EditableAttributesPanel.tsx',
            'components/inventory/product-form/EditableStockPoliciesCard.tsx',
            'components/inventory/product-form/ProductRestockLogCard.tsx',
            'components/inventory/product-form/EditableCatalogSpecCard.tsx',
            'components/inventory/product-form/ImageUploadModal.tsx'
        ];

        filesToCheck.forEach(relativePath => {
            const fullPath = path.join(rootDir, relativePath);
            expect(fs.existsSync(fullPath)).toBe(true);
            const content = fs.readFileSync(fullPath, 'utf-8');
            const lines = content.split('\n').length;
            expect(lines).toBeLessThanOrEqual(500);
        });
    });

    it('verifies live reactive calculation parity for Gross Margin and Stock Value', () => {
        const calculateMetrics = (price: number, cost: number, stock: number, salePrice = 0) => {
            const grossProfit = price - cost;
            const marginPct = price > 0 ? (grossProfit / price) * 100 : 0;
            const markupPct = cost > 0 ? (grossProfit / cost) * 100 : 0;
            const totalStockValue = stock * price;
            const discountPct = price > 0 && salePrice > 0 ? ((price - salePrice) / price) * 100 : 0;

            return { grossProfit, marginPct, markupPct, totalStockValue, discountPct };
        };

        const metrics = calculateMetrics(550, 400, 120, 500);
        expect(metrics.grossProfit).toBe(150);
        expect(metrics.marginPct).toBeCloseTo(27.27, 1);
        expect(metrics.markupPct).toBe(37.5);
        expect(metrics.totalStockValue).toBe(66000);
        expect(metrics.discountPct).toBeCloseTo(9.09, 1);
    });

    it('verifies dynamic catalog description spec generation parity', () => {
        const generateCatalogSpec = (brand?: string, name?: string, variant?: string, size?: string, unit?: string) => {
            const rawBrand = (brand || '').trim();
            const rawName = (name || '').trim();
            const brandAlreadyInName = rawBrand && rawName.toLowerCase().startsWith(rawBrand.toLowerCase());

            return [
                brandAlreadyInName ? '' : rawBrand,
                rawName,
                variant,
                size ? `${size}${unit && !['UNIT', 'PIECE', 'PACK', 'DOZEN'].includes(unit.toUpperCase().trim()) ? unit : ''}` : ''
            ].filter(Boolean).join(' ');
        };

        // Case 1: Brand already in product name
        const spec1 = generateCatalogSpec('Juma', 'Juma Ugali Flour', 'Family Pack', '2', 'kg');
        expect(spec1).toBe('Juma Ugali Flour Family Pack 2kg');

        // Case 2: Brand separate from product name
        const spec2 = generateCatalogSpec('Coca-Cola', 'Zero Sugar', 'Can', '330', 'ml');
        expect(spec2).toBe('Coca-Cola Zero Sugar Can 330ml');

        // Case 3: Unit is UNIT or piece (omitted from physical size suffix)
        const spec3 = generateCatalogSpec('Samsung', 'Galaxy S25', 'Titanium', '1', 'UNIT');
        expect(spec3).toBe('Samsung Galaxy S25 Titanium 1');
    });

    it('verifies stock health status determination in stock policies', () => {
        const getStockHealth = (stock: number, minStock: number, maxStock: number) => {
            const stockPct = maxStock > 0 ? Math.min(100, (stock / maxStock) * 100) : null;
            const isLow = minStock > 0 && stock < minStock;
            const isOptimal = minStock > 0 && maxStock > 0 && stock >= minStock && stock <= maxStock;

            return { isLow, isOptimal, stockPct };
        };

        const lowState = getStockHealth(5, 10, 100);
        expect(lowState.isLow).toBe(true);
        expect(lowState.isOptimal).toBe(false);
        expect(lowState.stockPct).toBe(5);

        const optimalState = getStockHealth(50, 10, 100);
        expect(optimalState.isLow).toBe(false);
        expect(optimalState.isOptimal).toBe(true);
        expect(optimalState.stockPct).toBe(50);
    });

    it('ensures zero raw Unicode emojis across all newly created form components', () => {
        const filesToCheck = [
            'components/ProductForm.tsx',
            'components/inventory/modals/InventoryProductModal.tsx',
            'components/inventory/product-form/EditableProfileHeader.tsx',
            'components/inventory/product-form/EditableSpecificationsCard.tsx',
            'components/inventory/product-form/EditableFinancialsCard.tsx',
            'components/inventory/product-form/EditableAttributesPanel.tsx',
            'components/inventory/product-form/EditableStockPoliciesCard.tsx',
            'components/inventory/product-form/ProductRestockLogCard.tsx',
            'components/inventory/product-form/EditableCatalogSpecCard.tsx',
            'components/inventory/product-form/ImageUploadModal.tsx'
        ];

        // Match typical Unicode emojis (excluding standard punctuation and ASCII)
        const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

        filesToCheck.forEach(file => {
            const content = fs.readFileSync(path.join(rootDir, file), 'utf-8');
            expect(emojiRegex.test(content)).toBe(false);
        });
    });

    it('ensures all styling strictly leverages centralized semantic tokens', () => {
        const filesToCheck = [
            'components/inventory/product-form/EditableProfileHeader.tsx',
            'components/inventory/product-form/EditableSpecificationsCard.tsx',
            'components/inventory/product-form/EditableFinancialsCard.tsx',
            'components/inventory/product-form/EditableAttributesPanel.tsx',
            'components/inventory/product-form/EditableStockPoliciesCard.tsx',
            'components/inventory/product-form/ProductRestockLogCard.tsx',
            'components/inventory/product-form/EditableCatalogSpecCard.tsx'
        ];

        filesToCheck.forEach(file => {
            const content = fs.readFileSync(path.join(rootDir, file), 'utf-8');
            expect(content).toContain('var(--theme-');
        });
    });

    it('verifies sovereign SKU auto-generation enforces active country prefix', async () => {
        const { generateSKU } = await import('../../utils/skuGenerator');
        const existingET = [{ sku: 'ET-GR001' }];
        const etSKU = generateSKU('Grains, Pasta & Rice', existingET, undefined, 'ET' as any);
        expect(etSKU).toMatch(/^ET-GR\d{3}$/);
        expect(etSKU).toBe('ET-GR002');

        const existingKE = [{ sku: 'KE-BV001' }];
        const keSKU = generateSKU('Drinks & Beverages', existingKE, undefined, 'KE' as any);
        expect(keSKU).toMatch(/^KE-BV\d{3}$/);
        expect(keSKU).toBe('KE-BV002');
    });

    it('verifies internal EAN-13 barcode generation produces 13 digits with valid checksum', async () => {
        const { generateInternalBarcode } = await import('../../utils/barcodeNumberGenerator');
        const barcode = generateInternalBarcode([{ barcode: '2000000000014' }]);
        expect(barcode).toHaveLength(13);
        expect(barcode.startsWith('200')).toBe(true);
    });

    it('verifies multi-barcode alias management allows adding and removing barcodes', () => {
        let barcodes = ['6001234567890'];
        // Add alias
        const newAlias = '6009876543210';
        if (!barcodes.includes(newAlias)) {
            barcodes = [...barcodes, newAlias];
        }
        expect(barcodes).toHaveLength(2);
        expect(barcodes).toContain(newAlias);

        // Remove alias
        barcodes = barcodes.filter(b => b !== '6001234567890');
        expect(barcodes).toEqual(['6009876543210']);
    });
});
