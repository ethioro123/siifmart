vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn(), setQueryData: vi.fn() }) }));
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
        cacheProducts: vi.fn(),
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
        mockEnqueueOperation.mockResolvedValue(true);
        realtimeHandlers = {};
        vi.stubGlobal('navigator', { onLine: true });
    });

    it.each([88, 1])('deducts stock exactly once without issuing unconfirmed stock alerts (cached stock: %s)', async stock => {
        const initialProduct: Product = {
            id: 'prod-ugali-1',
            siteId: 'site-kileleshwa',
            name: 'Juma Ugali Flour 1kg',
            sku: 'KEGR001',
            category: 'Grains, Pasta & Rice',
            price: 150,
            costPrice: 110,
            stock,
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
        const addNotification = vi.fn();

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
            addNotification,
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
        expect(products[0].stock).toBe(stock - 1);
        expect(allProducts[0].stock).toBe(stock - 1);
        expect(addNotification).toHaveBeenCalledWith('info', 'Sale queued on this device for synchronization.');
        expect(addNotification).not.toHaveBeenCalledWith('success', expect.anything());
        expect(addNotification).not.toHaveBeenCalledWith('alert', expect.anything());

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
            stock: stock - 1,
            status: 'active'
        });
        realtimeHandlers.onStockChange('INSERT', {
            product_id: 'prod-ugali-1',
            type: 'OUT',
            quantity: 1
        });

        // Stock must remain 87 (deducted once), never 86 (2x) or 85 (3x)!
        expect(products[0].stock).toBe(stock - 1);
        expect(allProducts[0].stock).toBe(stock - 1);
    });

    it('does not report a completed sale when offline storage and the queue are unavailable', async () => {
        vi.stubGlobal('navigator', { onLine: false });
        mockEnqueueOperation.mockResolvedValue(false);
        const addNotification = vi.fn();
        const setSales = vi.fn();
        const actions = useSaleActions({
            activeSite: undefined, settings: { posBonusEnabled: false } as any,
            products: [], sites: [], employees: [], customers: [], storePoints: [],
            setSales, setAllSales: vi.fn(), setProducts: vi.fn(), setCustomers: vi.fn(),
            addNotification, logSystemEvent: vi.fn(), triggerSync: vi.fn(),
            posCheckQueue: vi.fn(), awardStorePoints: vi.fn()
        });
        await expect(actions.processSale([], 'Cash', 'Cashier', 0, 0)).rejects.toThrow('could not be queued');
        expect(setSales).not.toHaveBeenCalled();
        expect(addNotification).not.toHaveBeenCalledWith('success', expect.anything());
        expect(mockCreateSale).not.toHaveBeenCalled();
    });

    it.each([true, false])('requires a confirmed server save when the local queue is unavailable (save succeeds: %s)', async succeeds => {
        mockEnqueueOperation.mockResolvedValue(false);
        if (succeeds) mockCreateSale.mockResolvedValue({});
        else mockCreateSale.mockRejectedValue(new Error('Server save rejected'));
        const addNotification = vi.fn();
        const actions = useSaleActions({
            activeSite: undefined, settings: { posBonusEnabled: false } as any,
            products: [], sites: [], employees: [], customers: [], storePoints: [],
            setSales: vi.fn(), setAllSales: vi.fn(), setProducts: vi.fn(), setCustomers: vi.fn(),
            addNotification, logSystemEvent: vi.fn(), triggerSync: vi.fn(),
            posCheckQueue: vi.fn(), awardStorePoints: vi.fn()
        });
        const pending = actions.processSale([], 'Cash', 'Cashier', 0, 0);
        if (succeeds) {
            await pending;
            expect(addNotification).toHaveBeenCalledWith('success', 'Sale saved to the server.');
        } else {
            await expect(pending).rejects.toThrow('Server save rejected');
            expect(addNotification).not.toHaveBeenCalledWith('success', expect.anything());
        }
    });
});
