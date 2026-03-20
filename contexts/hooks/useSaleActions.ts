import { useCallback } from 'react';
import type {
    CartItem, SaleRecord, Site, Product, Customer, SystemConfig,
    PaymentMethod, ReturnItem, SystemLog, StorePoints
} from '../../types';
import { customersService, productsService } from '../../services/supabase.service';
import { posDB } from '../../services/db/pos.db';

interface UseSaleActionsDeps {
    activeSite: Site | undefined;
    settings: SystemConfig;
    products: Product[];
    sites: Site[];
    employees: any[];
    customers: Customer[];
    storePoints: StorePoints[];
    setSales: React.Dispatch<React.SetStateAction<SaleRecord[]>>;
    setAllSales: React.Dispatch<React.SetStateAction<SaleRecord[]>>;
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
    addNotification: (type: 'alert' | 'success' | 'info', message: string) => void;
    logSystemEvent: (action: string, details: string, user: string, module: SystemLog['module']) => void;
    triggerSync: () => void;
    posCheckQueue: () => Promise<void>;
    awardStorePoints: (siteId: string, points: number, revenue: number, transactionCount?: number) => void;
}

export function useSaleActions(deps: UseSaleActionsDeps) {
    const {
        activeSite, settings, products, customers,
        setSales, setAllSales, setProducts, setCustomers,
        addNotification, triggerSync, awardStorePoints, posCheckQueue
    } = deps;

    const processSale = useCallback(async (
        cart: CartItem[],
        method: PaymentMethod,
        user: string,
        tendered: number,
        change: number,
        customerId?: string,
        pointsRedeemed?: number,
        type: 'In-Store' | 'Delivery' | 'Pickup' = 'In-Store',
        taxBreakdown: { name: string; rate: number; amount: number; compound: boolean }[] = [],
        receiptNumber?: string,
        roundedTotal?: number
    ): Promise<{ saleId: string; pointsResult?: any }> => {
        try {
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const taxRate = settings.taxRate || 0;
            const tax = subtotal * (taxRate / 100);
            // Use the rounded total from POS if provided (includes rounding-to-5 adjustment)
            const total = roundedTotal !== undefined ? roundedTotal : subtotal + tax;
            const saleId = crypto.randomUUID();

            const sanitizedItems = cart.map(item => ({
                id: item.id,
                siteId: item.siteId,
                name: item.name,
                sku: item.sku,
                price: item.price,
                quantity: item.quantity,
                status: item.status,
                stock: item.stock,
                category: item.category,
                unit: item.unit,
                size: item.size,
                brand: item.brand,
                image: ''
            })) as CartItem[];

            const saleRecord: SaleRecord = {
                id: saleId,
                siteId: activeSite?.id || '',
                customerId: customerId,
                date: new Date().toISOString(),
                items: sanitizedItems,
                subtotal,
                tax,
                taxBreakdown,
                total,
                method: method,
                status: 'Completed',
                amountTendered: tendered,
                change,
                cashierName: user,
                type,
                fulfillmentStatus: type === 'In-Store' ? 'Delivered' : 'Picking',
                receiptNumber: receiptNumber || `TX-${Date.now()}`
            };

            // 1. Offline Save
            await posDB.saveSale(saleRecord);
            await posDB.enqueueOperation('CREATE_SALE', saleRecord);
            posCheckQueue();

            // 2. Optimistic Update
            const uiSaleRecord: SaleRecord = { ...saleRecord, items: cart };
            setSales(prev => [uiSaleRecord, ...prev]);
            setAllSales(prev => [uiSaleRecord, ...prev]);

            // 3. Trigger Sync (if online)
            if (navigator.onLine) {
                triggerSync();
            }

            // 4. Gamification Logic
            let pointsResult = null;
            if (settings.posBonusEnabled !== false && activeSite?.id) {
                const storeRules = settings.posPointRules || [];
                let totalStorePoints = 0;
                const pointsBreakdown: { item: string; rule: string; points: number }[] = [];

                cart.forEach(item => {
                    let itemPoints = 0;
                    let appliedRuleName = 'none';

                    const categoryRule = storeRules.find(r => r.enabled && r.type === 'category' && r.categoryId === item.category);
                    const productRule = storeRules.find(r => r.enabled && r.type === 'product' && r.productSku === item.sku);
                    const activeRule = productRule || categoryRule;

                    if (activeRule) {
                        itemPoints = item.quantity * (activeRule.pointsPerUnit || 1);
                        if (activeRule.multiplier) itemPoints *= activeRule.multiplier;
                        if (activeRule.minQuantity && item.quantity < activeRule.minQuantity) itemPoints = 0;
                        if (activeRule.maxPointsPerTransaction && itemPoints > activeRule.maxPointsPerTransaction) itemPoints = activeRule.maxPointsPerTransaction;
                        appliedRuleName = activeRule.name;
                    }

                    if (itemPoints > 0) {
                        pointsBreakdown.push({ item: item.name, rule: appliedRuleName, points: Math.floor(itemPoints) });
                        totalStorePoints += Math.floor(itemPoints);
                    }
                });

                const revenueRule = storeRules.find(r => r.type === 'revenue' && r.enabled);
                if (revenueRule && revenueRule.revenueThreshold) {
                    const revenuePoints = Math.floor((subtotal / revenueRule.revenueThreshold) * (revenueRule.pointsPerRevenue || 1));
                    totalStorePoints += revenuePoints;
                    pointsBreakdown.push({ item: 'Revenue Bonus', rule: revenueRule.name, points: revenuePoints });
                }

                if (totalStorePoints > 0) {
                    awardStorePoints(activeSite.id, totalStorePoints, total, 1);
                    pointsResult = { points: totalStorePoints, storePoints: totalStorePoints, breakdown: pointsBreakdown };
                }
            }

            // 5. Loyalty (Online Only for now)
            if (customerId && settings.enableLoyalty !== false && navigator.onLine) {
                try {
                    const customer = customers.find(c => c.id === customerId);
                    if (customer) {
                        const loyaltyRate = settings.loyaltyPointsRate || 0;
                        const pointsEarned = loyaltyRate > 0 ? Math.floor(subtotal / loyaltyRate) : 0;
                        const currentPoints = customer.loyaltyPoints || 0;
                        const redeemed = pointsRedeemed || 0;
                        const newLoyaltyPoints = Math.max(0, currentPoints + pointsEarned - redeemed);

                        await customersService.update(customerId, {
                            loyaltyPoints: newLoyaltyPoints,
                            totalSpent: (customer.totalSpent || 0) + total,
                            lastVisit: new Date().toISOString()
                        });

                        setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, loyaltyPoints: newLoyaltyPoints, totalSpent: (c.totalSpent || 0) + total, lastVisit: new Date().toISOString() } : c));
                    }
                } catch (e) {
                    console.error("Loyalty update failed", e);
                }
            }

            // 6. Stock Decrement & Alerts
            for (const item of cart) {
                const product = products.find(p => p.id === item.id);
                if (product) {
                    const newStock = Math.max(0, product.stock - item.quantity);
                    const newStatus = newStock === 0 ? 'out_of_stock' : newStock < settings.lowStockThreshold ? 'low_stock' : 'active';

                    console.log('📦 Stock update:', { productId: item.id, name: product.name, oldStock: product.stock, newStock, newStatus });

                    setProducts(prev => prev.map(p =>
                        p.id === item.id ? { ...p, stock: newStock, status: newStatus as any } : p
                    ));

                    if (navigator.onLine) {
                        try {
                            await productsService.update(item.id, { stock: newStock, status: newStatus });
                        } catch (e) {
                            console.error('Stock update failed (will retry)', e);
                        }
                    } else {
                        console.warn('⚠️ Offline: Transfer stock update skipped (Strict Online Mode)');
                    }

                    if (newStock <= settings.lowStockThreshold && newStock > 0) {
                        addNotification('alert', `Low Stock: ${product.name} (${newStock} remaining)`);
                    } else if (newStock === 0) {
                        addNotification('alert', `Out of Stock: ${product.name}`);
                    }
                }
            }

            addNotification('success', 'Sale processed successfully');
            return { saleId, pointsResult };

        } catch (error) {
            console.error("Process Sale Failed:", error);
            addNotification('alert', 'Failed to process sale');
            throw error;
        }
    }, [
        activeSite, settings, addNotification, triggerSync, products,
        customers, awardStorePoints
    ]);

    const processReturn = useCallback(async (saleId: string, items: ReturnItem[], totalRefund: number, user: string) => {
        console.log('Processing return', { saleId, items, totalRefund, user });
        addNotification('info', 'Return processed (Stub)');
    }, [addNotification]);

    const releaseOrder = useCallback(async (saleId: string) => {
        console.log('Releasing order', saleId);
        addNotification('info', 'Order released (Stub)');
    }, [addNotification]);

    return { processSale, processReturn, releaseOrder };
}
