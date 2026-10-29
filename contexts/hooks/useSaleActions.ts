import { useCallback } from 'react';
import type {
    CartItem, SaleRecord, Site, Product, Customer, SystemConfig,
    PaymentMethod, ReturnItem, SystemLog, StorePoints
} from '../../types';
import { DEFAULT_STORE_POINT_RULES } from '../../types';
import { customersService, productsService, salesService } from '../../services/supabase.service';
import { posDB } from '../../services/db/pos.db';
import { CURRENCY_SYMBOL } from '../../constants';
import { logger } from '../../utils/logger';
import { audioFeedback } from '../../utils/audioFeedback';

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
    setAllProducts?: React.Dispatch<React.SetStateAction<Product[]>>;
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
        setSales, setAllSales, setProducts, setAllProducts, setCustomers,
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
        roundedTotal?: number,
        discountCodeId?: string | null,
        mobileDetails?: {channel?: string; ref?: string; phone?: string}
    ): Promise<{ saleId: string; receiptNumber: string; offlineReceiptNumber?: string; pointsResult?: any }> => {
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

            const isOfflineSale = !navigator.onLine;
            const regionCode = (activeSite?.regionCode || activeSite?.region_code || '').trim().toUpperCase();
            if (!/^[A-Z]{3}$/.test(regionCode)) {
                throw new Error('This site needs a valid three-letter region code before it can record sales.');
            }
            const offlineReceiptReference = isOfflineSale
                ? `OFF-${regionCode}-${saleId.toUpperCase()}`
                : undefined;
            const finalReceiptNumber = receiptNumber || offlineReceiptReference || `PENDING-${regionCode}-${saleId.toUpperCase()}`;

            let saleRecord: SaleRecord & { discountCodeId?: string | null } = {
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
                discountCodeId: discountCodeId || null,
                mobilePaymentChannel: mobileDetails?.channel, mobileTransactionRef: mobileDetails?.ref, customerPhone: mobileDetails?.phone,
                fulfillmentStatus: type === 'In-Store' ? 'Delivered' : 'Picking',
                receiptNumber: finalReceiptNumber,
                offlineReceiptNumber: offlineReceiptReference
            };

            await posDB.saveSale(saleRecord);
            const queued = await posDB.enqueueOperation('CREATE_SALE', {
                ...saleRecord,
                pointsRedeemed: pointsRedeemed || 0,
                loyaltyRate: settings.loyaltyPointsRate || 0,
                enableLoyalty: settings.enableLoyalty !== false
            });
            if (!queued && !navigator.onLine) {
                throw new Error('Sale could not be queued for synchronization while offline.');
            }
            if (!queued) {
                const persistedSale = await salesService.create(saleRecord, sanitizedItems, discountCodeId);
                saleRecord = { ...saleRecord, ...persistedSale, items: sanitizedItems };
                await posDB.saveSale(saleRecord);
            }
            posCheckQueue();

            // 2. Optimistic Sale Record Update
            const uiSaleRecord: SaleRecord = { ...saleRecord, items: cart };
            setSales(prev => [uiSaleRecord, ...prev]);
            setAllSales(prev => [uiSaleRecord, ...prev]);

            // 3. Optimistic Stock Decrement & Alerts (Single pass per product)
            const qtyByProductId = new Map<string, number>();
            for (const item of cart) {
                qtyByProductId.set(item.id, (qtyByProductId.get(item.id) || 0) + item.quantity);
            }

            setProducts(prev => {
                const next = prev.map(p => {
                    const soldQty = qtyByProductId.get(p.id);
                    if (soldQty === undefined) return p;
                    const newStock = Math.max(0, p.stock - soldQty);
                    const newStatus = newStock === 0 ? 'out_of_stock' : newStock < settings.lowStockThreshold ? 'low_stock' : 'active';
                    return { ...p, stock: newStock, status: newStatus as any };
                });
                if (activeSite?.id) {
                    void posDB.cacheProducts(activeSite.id, next);
                }
                return next;
            });

            setAllProducts?.(prev => prev.map(p => {
                const soldQty = qtyByProductId.get(p.id);
                if (soldQty === undefined) return p;
                const newStock = Math.max(0, p.stock - soldQty);
                const newStatus = newStock === 0 ? 'out_of_stock' : newStock < settings.lowStockThreshold ? 'low_stock' : 'active';
                return { ...p, stock: newStock, status: newStatus as any };
            }));

            for (const [productId, soldQty] of qtyByProductId.entries()) {
                const product = products.find(p => p.id === productId);
                if (product) {
                    const newStock = Math.max(0, product.stock - soldQty);
                    const newStatus = newStock === 0 ? 'out_of_stock' : newStock < settings.lowStockThreshold ? 'low_stock' : 'active';
                    logger.debug('useSaleActions', 'Stock update:', { productId, name: product.name, oldStock: product.stock, newStock, newStatus });

                    // Cached optimistic balances are not evidence for stock alerts.
                }
            }

            // 4. Loyalty Points (Optimistic local calculation; DB write handled by usePosSync unless queue unavailable)
            if (customerId && settings.enableLoyalty !== false) {
                const customer = customers.find(c => c.id === customerId);
                if (customer) {
                    const loyaltyRate = settings.loyaltyPointsRate || 0;
                    const pointsEarned = loyaltyRate > 0 ? Math.floor(subtotal / loyaltyRate) : 0;
                    const currentPoints = customer.loyaltyPoints || 0;
                    const redeemed = pointsRedeemed || 0;
                    const newLoyaltyPoints = Math.max(0, currentPoints + pointsEarned - redeemed);
                    const newTotalSpent = (customer.totalSpent || 0) + total;

                    setCustomers(prev => prev.map(c =>
                        c.id === customerId ? { ...c, loyaltyPoints: newLoyaltyPoints, totalSpent: newTotalSpent, lastVisit: new Date().toISOString() } : c
                    ));

                    if (!queued && navigator.onLine) {
                        try {
                            await customersService.update(customerId, {
                                loyaltyPoints: newLoyaltyPoints,
                                totalSpent: newTotalSpent,
                                lastVisit: new Date().toISOString()
                            });
                        } catch (e) {
                            logger.warn('useSaleActions', 'Fallback loyalty sync failed', { error: String(e) });
                        }
                    }
                }
            }

            if (queued && navigator.onLine) void triggerSync();

            // 6. Gamification Logic
            let pointsResult = null;
            const siteBonusAllowed = activeSite?.bonusEnabled !== false && (activeSite as any)?.bonus_enabled !== false;
            if (settings.posBonusEnabled !== false && siteBonusAllowed && activeSite?.id) {
                const storeRules = (settings.posPointRules && settings.posPointRules.length > 0)
                    ? settings.posPointRules
                    : DEFAULT_STORE_POINT_RULES;
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

            audioFeedback.playSaleComplete();
            if (queued) {
                addNotification('info', 'Sale queued on this device for synchronization.');
            } else {
                addNotification('success', 'Sale saved to the server.');
            }
            return { saleId, receiptNumber: saleRecord.receiptNumber || finalReceiptNumber, offlineReceiptNumber: offlineReceiptReference, pointsResult };

        } catch (error) {
            logger.error('useSaleActions', "Process Sale Failed:", error);
            addNotification('alert', 'Failed to process sale');
            throw error;
        }
    }, [
        activeSite, settings, addNotification, triggerSync, products,
        customers, awardStorePoints, posCheckQueue, setProducts, setAllProducts,
        setSales, setAllSales, setCustomers
    ]);

    const processReturn = useCallback(async (saleId: string, items: ReturnItem[], totalRefund: number, user: string) => {
        try {
            if (!navigator.onLine) throw new Error('Return intake requires an internet connection.');
            const result=await salesService.refund(saleId,items.map(ri=>({product_id:ri.productId,quantity:ri.quantity})),totalRefund);
            return;

        } catch (error: any) {
            logger.error('useSaleActions', 'processReturn failed:', error);
            throw error;
        }
    }, [addNotification, setProducts, setSales, setAllSales, deps.products, deps.settings]);

    const releaseOrder = useCallback(async (saleId: string) => {
        try {
            if (navigator.onLine) {
                await salesService.update(saleId, { fulfillmentStatus: 'Delivered' });
            }
            setSales(prev => prev.map(s => s.id === saleId ? { ...s, fulfillmentStatus: 'Delivered' } : s));
            setAllSales(prev => prev.map(s => s.id === saleId ? { ...s, fulfillmentStatus: 'Delivered' } : s));
            addNotification('success', 'Order marked as delivered');
        } catch (error: any) {
            logger.error('useSaleActions', 'releaseOrder failed:', error);
            addNotification('alert', `Failed to release order: ${error?.message || 'Unknown error'}`);
        }
    }, [addNotification, setSales, setAllSales]);

    return { processSale, processReturn, releaseOrder };
}
