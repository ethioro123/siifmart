import { describe, it, expect } from 'vitest';
import { accountsPayableService } from '../../services/accounts-payable.service';

describe('Accounts Payable 3-Way Match Engine', () => {
    it('evaluates clean 3-way match when PO, Dock Received, and Invoiced quantities & prices align', () => {
        const items = [
            {
                productId: 'PRD-001',
                sku: 'ET-DY001',
                itemName: 'Pasteurized Milk 1L',
                poQuantity: 100,
                receivedQuantity: 100,
                invoicedQuantity: 100,
                poUnitPrice: 65.0,
                invoicedUnitPrice: 65.0,
                taxRate: 15,
                totalPrice: 6500.0
            }
        ];

        const result = accountsPayableService.evaluateThreeWayMatch(items);
        expect(result.status).toBe('Matched');
        expect(result.evaluatedItems[0].matchVariancePct).toBe(0);
    });

    it('detects Discrepancy_Quantity when vendor bills for unreceived goods', () => {
        const items = [
            {
                productId: 'PRD-002',
                sku: 'ET-GR002',
                itemName: 'Cooking Oil 5L',
                poQuantity: 50,
                receivedQuantity: 40, // Warehouse only accepted 40 units!
                invoicedQuantity: 50, // Vendor billed full 50 units!
                poUnitPrice: 450.0,
                invoicedUnitPrice: 450.0,
                taxRate: 15,
                totalPrice: 22500.0
            }
        ];

        const result = accountsPayableService.evaluateThreeWayMatch(items);
        expect(result.status).toBe('Discrepancy_Quantity');
        expect(result.notes).toContain('Invoiced quantity (50) exceeds received dock count (40)');
    });

    it('detects Discrepancy_Price when vendor bills at higher unit price than authorized PO', () => {
        const items = [
            {
                productId: 'PRD-003',
                sku: 'ET-BV003',
                itemName: 'Mineral Water 2L Case',
                poQuantity: 200,
                receivedQuantity: 200,
                invoicedQuantity: 200,
                poUnitPrice: 180.0, // Authorized PO rate
                invoicedUnitPrice: 210.0, // Vendor billed higher rate!
                taxRate: 15,
                totalPrice: 42000.0
            }
        ];

        const result = accountsPayableService.evaluateThreeWayMatch(items);
        expect(result.status).toBe('Discrepancy_Price');
        expect(result.notes).toContain('Invoiced unit price (210) exceeds authorized PO unit price (180)');
        expect(result.evaluatedItems[0].matchVariancePct).toBeCloseTo(16.67, 1);
    });
});
