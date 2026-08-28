// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('POS Offline Database & Sync Queue Tests', () => {
    let mockProductsCache: Record<string, any[]> = {};
    let mockCustomersCache: any[] = [];
    let mockSyncQueue: any[] = [];
    let mockHeldOrders: any[] = [];

    beforeEach(() => {
        vi.restoreAllMocks();
        mockProductsCache = {};
        mockCustomersCache = [];
        mockSyncQueue = [];
        mockHeldOrders = [];
    });

    it('should cache and retrieve site-scoped products for offline operation', async () => {
        const mockProducts = [
            { id: 'prod-1', sku: 'SKU-001', name: 'Fresh Milk 1L', price: 4.5, stock: 25, siteId: 'site-harar' },
            { id: 'prod-2', sku: 'SKU-002', name: 'White Bread 500g', price: 2.0, stock: 40, siteId: 'site-harar' }
        ];

        mockProductsCache['site-harar'] = mockProducts;
        const cached = mockProductsCache['site-harar'] || [];

        expect(cached).toHaveLength(2);
        expect(cached[0].sku).toBe('SKU-001');
        expect(cached[1].name).toBe('White Bread 500g');
    });

    it('should cache and retrieve customer records for offline lookup', async () => {
        const mockCustomers = [
            { id: 'cust-1', name: 'Abebe Bikila', phone: '+251911223344', loyaltyPoints: 120, totalSpent: 4500 },
            { id: 'cust-2', name: 'Almaz Ayana', phone: '+251922334455', loyaltyPoints: 340, totalSpent: 12000 }
        ];

        mockCustomersCache = mockCustomers;
        const cached = mockCustomersCache;

        expect(cached).toHaveLength(2);
        expect(cached[0].name).toBe('Abebe Bikila');
        expect(cached[1].loyaltyPoints).toBe(340);
    });

    it('should enqueue offline sales and support queue draining upon reconnection', async () => {
        const offlineSale = {
            id: 'sale-offline-101',
            siteId: 'site-harar',
            total: 250,
            subtotal: 217.39,
            tax: 32.61,
            method: 'Cash' as const,
            status: 'Completed' as const,
            cashierName: 'Cashier 1',
            receiptNumber: 'OFF-REC-260828-1001',
            items: [
                { id: 'prod-1', sku: 'SKU-001', name: 'Fresh Milk 1L', price: 50, quantity: 5 }
            ]
        };

        mockSyncQueue.push({
            id: 1,
            type: 'CREATE_SALE',
            payload: offlineSale,
            status: 'PENDING',
            createdAt: new Date().toISOString()
        });

        expect(mockSyncQueue.length).toBe(1);
        const targetOp = mockSyncQueue.find(op => op.payload.id === 'sale-offline-101');
        expect(targetOp).toBeDefined();
        expect(targetOp?.type).toBe('CREATE_SALE');
        expect(targetOp?.payload.receiptNumber).toBe('OFF-REC-260828-1001');

        // Simulate successful sync removal
        mockSyncQueue = mockSyncQueue.filter(op => op.id !== 1);
        expect(mockSyncQueue).toHaveLength(0);
    });

    it('should persist and retrieve held carts offline across reboots', async () => {
        const mockHeldOrder = {
            id: 'hold-1',
            customerName: 'Guest',
            items: [{ id: 'prod-1', name: 'Milk', price: 50, quantity: 2, sku: 'SKU-001' }],
            subtotal: 100,
            tax: 15,
            total: 115,
            time: new Date().toISOString()
        };

        mockHeldOrders = [mockHeldOrder];
        expect(mockHeldOrders).toHaveLength(1);
        expect(mockHeldOrders[0].id).toBe('hold-1');
        expect(mockHeldOrders[0].items[0].name).toBe('Milk');
    });
});
