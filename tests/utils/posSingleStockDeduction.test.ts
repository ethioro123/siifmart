import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSaleActions } from '../../contexts/hooks/useSaleActions';
import { useRealtimeUpdates } from '../../contexts/hooks/useRealtimeUpdates';
import type { Product, SaleRecord, Customer, CartItem } from '../../types';

vi.mock('react', async () => {
    const actual = await vi.importActual<typeof import('react')>('react');
    return {
        ...actual,
        useCallback: (fn: any) => fn,
        useEffect: (fn: any) => { fn(); }
    };
});

const mockUpdateProduct = vi.fn().mockResolvedValue({});
const mockUpdateCustomer = vi.fn().mockResolvedValue({});
const mockCreateSale = vi.fn().mockResolvedValue({});
const mockEnqueueOperation = vi.fn().mockResolvedValue(true);
const mockSaveSale = vi.fn().mockResolvedValue(undefined);

let realtimeHandlers: any = {};

vi.mock('../../services/supabase.service', () => ({
    productsService: {
        update: (...args: any[]) => mockUpdateProduct(...args)
    },
    customersService: {
        update: (...args: any[]) => mockUpdateCustomer(...args),
        getById: vi.fn()
    },
    salesService: {
        create: (...args: any[]) => mockCreateSale(...args),
        getById: vi.fn().mockResolvedValue(null)
    },
    purchaseOrdersService: {
        getById: vi.fn().mockResolvedValue(null)
    }
}));

vi.mock('../../services/db/pos.db', () => ({
    posDB: {
        saveSale: (...args: any[]) => mockSaveSale(...args),
        enqueueOperation: (...args: any[]) => mockEnqueueOperation(...args)
    }
}));

vi.mock('../../services/realtime.service', () => ({
    realtimeService: {
        subscribeToSite: vi.fn((_siteId: string, handlers: any) => {
            realtimeHandlers = handlers;
            return [{ unsubscribe: vi.fn() }];
        }),
        unsubscribeAll: vi.fn()
    }
}));

vi.mock('../../utils/audioFeedback', () => ({
    audioFeedback: {
        playSaleComplete: vi.fn()
    }
}));

describe('POS Single Stock Deduction (No 2x / 3x Deduction)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        realtimeHandlers = {};
        vi.stubGlobal('navigator', { onLine: true });
    });

    it('deducts stock exactly once across optimistic update, sync queue, and realtime events', async () => {
        const initialProduct: Product = {
            id: 'prod-ugali-1',
            siteId: 'site-kileleshwa',
            name: 'Juma Ugali Flour 1kg',
            sku: 'KEGR001',
            category: 'Grains, Pasta & Rice',
            price: 150,
            costPrice: 110,
            stock: 88,
            status: 'active',
            image: ''
        };

        let products: Product[] = [initialProduct];
        let allProducts: Product[] = [initialProduct];
        let sales: SaleRecord[] = [];
        let allSales: SaleRecord[] = [];
        let customers: Customer[] = [];

        const setProducts = (updater: any) => {
            products = typeof updater === 'function' ? updater(products) : updater;
        };
        const setAllProducts = (updater: any) => {
            allProducts = typeof updater === 'function' ? updater(allProducts) : updater;
        };
        const setSales = (updater: any) => {
            sales = typeof updater === 'function' ? updater(sales) : updater;
        };
        const setAllSales = (updater: any) => {
            allSales = typeof updater === 'function' ? updater(allSales) : updater;
        };
        const setCustomers = (updater: any) => {
            customers = typeof updater === 'function' ? updater(customers) : updater;
        };

        const triggerSync = vi.fn();
        const posCheckQueue = vi.fn().mockResolvedValue(undefined);

        useRealtimeUpdates({
            activeSiteId: 'site-kileleshwa',
            setProducts,
            setAllProducts,
            setSales,
            setCustomers,
            setOrders: vi.fn()
        });

        const saleActions = useSaleActions({
            activeSite: { id: 'site-kileleshwa', name: 'Kileleshwa' } as any,
            settings: { lowStockThreshold: 10, taxRate: 0, posBonusEnabled: false } as any,
            products,
            sites: [],
            employees: [],
            customers,
            storePoints: [],
            setSales,
            setAllSales,
            setProducts,
            setAllProducts,
            setCustomers,
            addNotification: vi.fn(),
            logSystemEvent: vi.fn(),
            triggerSync,
            posCheckQueue,
            awardStorePoints: vi.fn()
        });

        const cartItem: CartItem = {
            ...initialProduct,
            quantity: 1
        };

        // Step 1: Cashier sells 1 unit at POS
        await saleActions.processSale(
            [cartItem],
            'Cash',
            'Cashier',
            150,
            0
        );

        // Optimistic state must be 87 (88 - 1), NOT 86 or 85
        expect(products[0].stock).toBe(87);
        expect(allProducts[0].stock).toBe(87);

        // Because the sale was queued into posDB for usePosSync (which runs pos_decrement_stock),
        // useSaleActions must NOT also call productsService.update directly!
        expect(mockEnqueueOperation).toHaveBeenCalledTimes(1);
        expect(mockUpdateProduct).not.toHaveBeenCalled();
        expect(triggerSync).toHaveBeenCalledTimes(1);

        // Step 2: Simulate Supabase Realtime events emitted when `pos_decrement_stock` runs:
        // Event A: `products` UPDATE with the authoritative DB stock (87)
        // Event B: `stock_movements` INSERT with type='OUT', quantity=1
        realtimeHandlers.onProductChange('UPDATE', {
            id: 'prod-ugali-1',
            site_id: 'site-kileleshwa',
            name: 'Juma Ugali Flour 1kg',
            sku: 'KEGR001',
            stock: 87,
            status: 'active'
        });
        realtimeHandlers.onStockChange('INSERT', {
            product_id: 'prod-ugali-1',
            type: 'OUT',
            quantity: 1
        });

        // Stock must remain 87 (deducted once), never 86 (2x) or 85 (3x)!
        expect(products[0].stock).toBe(87);
        expect(allProducts[0].stock).toBe(87);
    });
});
