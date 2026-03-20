import { supabase } from '../lib/supabase';
import type { SaleRecord, FulfillmentPlan, CartItem } from '../types';
import { productsService } from './products.service';
import { wmsJobsService, generateReadableJobNumber } from './wms-jobs.service';
import { customersService } from './customers.service';

export const salesService = {
    async getAll(siteId?: string, limit: number = 50, offset: number = 0, filters?: any) {
        let query = supabase
            .from('sales')
            .select('*, sale_items(*, products(category)), customers!left(*)', { count: 'exact' });

        if (siteId) {
            query = query.eq('site_id', siteId);
        }

        // Apply Filters
        if (filters) {
            if (filters.status && filters.status !== 'All') {
                query = query.eq('status', filters.status);
            }
            if (filters.method && filters.method !== 'All') {
                query = query.eq('payment_method', filters.method);
            }
            if (filters.startDate) {
                query = query.gte('sale_date', filters.startDate);
            }
            if (filters.endDate) {
                query = query.lte('sale_date', `${filters.endDate}T23:59:59`);
            }
            if (filters.search) {
                const term = filters.search;
                query = query.or(`receipt_number.ilike.%${term}%,cashier_name.ilike.%${term}%`);
            }
        }

        // Apply Sort and Pagination
        query = query
            .order('sale_date', { ascending: false })
            .range(offset, offset + limit - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        const mappedData = data.map((s: any) => ({
            ...s,
            siteId: s.site_id,
            date: s.sale_date,
            method: s.payment_method,
            amountTendered: s.amount_tendered,
            cashierName: s.cashier_name,
            customerId: s.customer_id,
            items: s.sale_items.map((i: any) => ({
                ...i,
                id: i.product_id,
                name: i.product_name,
                costPrice: i.cost_price,
                category: i.products?.category || i.category
            })),
            receiptNumber: s.receipt_number,
            customerName: s.customers?.name
        }));

        return { data: mappedData, count: count || 0 };
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('sales')
            .select('*, sale_items(*, products(category)), customers(*)')
            .eq('id', id)
            .single();

        if (error) throw error;
        return {
            ...data,
            siteId: data.site_id,
            date: data.sale_date,
            method: data.payment_method,
            amountTendered: data.amount_tendered,
            cashierName: data.cashier_name,
            customerId: data.customer_id,
            items: data.sale_items.map((i: any) => ({
                ...i,
                id: i.product_id,
                name: i.product_name,
                costPrice: i.cost_price,
                category: i.products?.category || i.category
            }))
        };
    },

    async create(sale: Omit<SaleRecord, 'created_at' | 'updated_at'>, items: any[]) {
        // Create sale
        const dbSale = {
            id: sale.id, // Use provided ID if available
            site_id: sale.siteId,
            customer_id: sale.customerId,
            sale_date: sale.date || new Date().toISOString(),
            subtotal: sale.subtotal,
            tax: sale.tax,
            total: sale.total,
            payment_method: sale.method,
            status: sale.status,
            amount_tendered: sale.amountTendered,
            change: sale.change,
            cashier_name: sale.cashierName,
            receipt_number: (sale as any).receiptNumber // Will be populated below if not present
        };

        // Generate receipt number if not provided by the POS client
        if (!(dbSale as any).receipt_number) {
            const now = new Date();
            const dp = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
            const tp = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
            (dbSale as any).receipt_number = `SRV-${dp}-${tp}`;
        }

        const { data: saleData, error: saleError } = await supabase
            .from('sales')
            .insert(dbSale)
            .select()
            .single();

        if (saleError) throw saleError;

        // Create sale items
        const itemsWithSaleId = items.map(item => ({
            sale_id: saleData.id,
            product_id: item.id,
            product_name: item.name,
            quantity: item.quantity,
            price: item.price,
            cost_price: item.costPrice
        }));

        const { error: itemsError } = await supabase
            .from('sale_items')
            .insert(itemsWithSaleId);

        if (itemsError) throw itemsError;

        // NOTE: Stock is NOT deducted here. Stock is deducted during the PICK process
        // in WarehouseOperations.tsx when items are physically picked from shelves.
        // This is proper WMS flow: Sale → PICK Job → Physical Pick → Stock Deducted

        // Update customer if provided - wrapped in try-catch to prevent blocking
        if ((sale as any).customer_id) {
            try {
                const customerId = (sale as any).customer_id;
                const customer = await customersService.getById(customerId);
                if (customer) {
                    await customersService.update(customerId, {
                        total_spent: (customer.totalSpent || 0) + sale.total,
                        last_visit: new Date().toISOString().split('T')[0]
                    } as any);
                }
            } catch (customerError) {
                console.warn('Failed to update customer stats (non-blocking):', customerError);
                // Non-critical: sale still completes even if customer update fails
            }
        }

        return {
            ...saleData,
            id: saleData.id,
            siteId: saleData.site_id,
            customerId: saleData.customer_id,
            date: saleData.sale_date,
            subtotal: saleData.subtotal,
            tax: saleData.tax,
            total: saleData.total,
            method: saleData.payment_method,
            status: saleData.status,
            amountTendered: saleData.amount_tendered,
            change: saleData.change,
            cashierName: saleData.cashier_name,
            receiptNumber: saleData.receipt_number,
            items: itemsWithSaleId.map(i => ({
                id: i.product_id,
                name: i.product_name,
                quantity: i.quantity,
                price: i.price,
                costPrice: i.cost_price
            }))
        };
    },

    async refund(id: string, items: any[], refundAmount: number) {
        // Update sale status
        await supabase
            .from('sales')
            .update({ status: 'Refunded' })
            .eq('id', id);

        // Restore stock for refunded items
        for (const item of items) {
            await productsService.adjustStock(item.product_id, item.quantity, 'IN');
        }

        return true;
    },

    async update(id: string, updates: Partial<SaleRecord>) {
        const dbUpdates: any = { ...updates };
        if (updates.fulfillmentStatus !== undefined) {
            dbUpdates.fulfillment_status = updates.fulfillmentStatus;
            delete dbUpdates.fulfillmentStatus;
        }

        const { data, error } = await supabase
            .from('sales')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            siteId: data.site_id,
            date: data.sale_date,
            method: data.payment_method,
            amountTendered: data.amount_tendered,
            cashierName: data.cashier_name,
            customerId: data.customer_id,
            fulfillmentStatus: data.fulfillment_status
        };
    },

    async getTodaySales(siteId?: string) {
        const today = new Date().toISOString().split('T')[0];

        let query = supabase
            .from('sales')
            .select('*')
            .gte('sale_date', today);

        if (siteId) {
            query = query.eq('site_id', siteId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async calculateFulfillmentPlan(requestingSiteId: string, cart: any[]): Promise<FulfillmentPlan[]> {
        // 1. Fetch requesting site to get its strategy
        const { data: requestingSite, error: siteError } = await supabase
            .from('sites')
            .select('*')
            .eq('id', requestingSiteId)
            .single();

        if (siteError) throw siteError;

        const strategy = requestingSite.fulfillment_strategy || 'NEAREST';

        // 2. Fetch all active candidate nodes
        const { data: candidates, error: candError } = await supabase
            .from('sites')
            .select('*')
            .eq('status', 'Active')
            .or('type.eq.Warehouse,is_fulfillment_node.eq.true');

        if (candError) throw candError;

        // 3. Distance calculation helper (Haversine)
        const getDistance = (lat1?: number, lon1?: number, lat2?: number, lon2?: number): number => {
            if (!lat1 || !lon1 || !lat2 || !lon2) return 99999;
            const R = 6371;
            const dLat = (lat2 - lat1) * (Math.PI / 180);
            const dLon = (lon2 - lon1) * (Math.PI / 180);
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        };

        const sortedCandidates = candidates.map((wh: any) => ({
            ...wh,
            distance: getDistance(requestingSite.latitude, requestingSite.longitude, wh.latitude, wh.longitude)
        })).sort((a, b) => a.distance - b.distance);

        // 4. Helper: Stock check across specific site
        const checkSiteStock = async (siteId: string, productId: string, requestedQty: number): Promise<boolean> => {
            const { data, error } = await supabase
                .from('products')
                .select('stock')
                .eq('id', productId)
                .eq('site_id', siteId)
                .single();

            if (error || !data) return false;
            return data.stock >= requestedQty;
        };

        let plan: FulfillmentPlan[] = [];

        // 5. Strategy Implementation
        if (strategy === 'LOCAL_ONLY') {
            plan.push({
                siteId: requestingSiteId,
                isSplit: false,
                strategy: 'LOCAL_ONLY',
                items: cart.map((i: any) => ({
                    productId: i.id || i.productId,
                    sku: i.sku || 'UNK',
                    name: i.name,
                    quantity: i.quantity,
                    sourceSiteId: requestingSiteId
                }))
            });
        }
        else if (strategy === 'NEAREST' || strategy === 'MANUAL') {
            let bestWhId = requestingSiteId;
            for (const cand of sortedCandidates) {
                let allItemsAvailable = true;
                for (const item of cart) {
                    const hasStock = await checkSiteStock(cand.id, item.id || item.productId, item.quantity);
                    if (!hasStock) {
                        allItemsAvailable = false;
                        break;
                    }
                }
                if (allItemsAvailable) {
                    bestWhId = cand.id;
                    break;
                }
            }

            plan.push({
                siteId: requestingSiteId,
                isSplit: false,
                strategy: strategy as any,
                items: cart.map((i: any) => ({
                    productId: i.id || i.productId,
                    sku: i.sku || 'UNK',
                    name: i.name,
                    quantity: i.quantity,
                    sourceSiteId: bestWhId
                }))
            });
        }
        else if (strategy === 'SPLIT') {
            const siteMap = new Map<string, any[]>();

            for (const item of cart) {
                let foundSource = false;
                for (const cand of sortedCandidates) {
                    if (await checkSiteStock(cand.id, item.id || item.productId, item.quantity)) {
                        const existing = siteMap.get(cand.id) || [];
                        siteMap.set(cand.id, [...existing, {
                            productId: item.id || item.productId,
                            sku: item.sku || 'UNK',
                            name: item.name,
                            quantity: item.quantity,
                            sourceSiteId: cand.id
                        }]);
                        foundSource = true;
                        break;
                    }
                }
                if (!foundSource) {
                    const existing = siteMap.get(requestingSiteId) || [];
                    siteMap.set(requestingSiteId, [...existing, {
                        productId: item.id || item.productId,
                        sku: item.sku || 'UNK',
                        name: item.name,
                        quantity: item.quantity,
                        sourceSiteId: requestingSiteId
                    }]);
                }
            }

            siteMap.forEach((items, sourceId) => {
                plan.push({
                    siteId: requestingSiteId,
                    isSplit: siteMap.size > 1,
                    strategy: 'SPLIT',
                    items
                });
            });
        }

        return plan;
    },

    async releaseOrder(saleId: string) {
        // 1. Fetch sale with items
        const { data: sale, error: saleError } = await supabase
            .from('sales')
            .select(`
                *,
                sale_items (*)
            `)
            .eq('id', saleId)
            .single();

        if (saleError) throw saleError;

        const cartItems = sale.sale_items.map((si: any) => ({
            productId: si.product_id,
            name: si.product_name,
            sku: si.product_sku || 'UNK',
            quantity: si.quantity
        }));

        // 2. Calculate fulfillment plan
        const plans = await this.calculateFulfillmentPlan(sale.site_id, cartItems);

        // 3. Create WMS Jobs for each plan
        for (const plan of plans) {
            const warehouseId = plan.items[0]?.sourceSiteId || sale.site_id;

            // Find best zone in that warehouse
            const { data: zones } = await supabase
                .from('warehouse_zones')
                .select('*')
                .eq('site_id', warehouseId)
                .order('picking_priority', { ascending: true })
                .limit(1);

            const primaryZone = zones?.[0];

            // Generate a shared job number for both PICK and PACK
            const sharedJobNumber = generateReadableJobNumber(6);

            // Create PICK Job
            const pickJob = {
                siteId: warehouseId,
                type: 'PICK' as const,
                status: 'Pending' as const,
                priority: 'High' as const,
                location: primaryZone?.name || '',
                items: plan.items.length,
                lineItems: plan.items.map(i => ({
                    productId: i.productId,
                    name: i.name,
                    sku: i.sku,
                    expectedQty: i.quantity,
                    pickedQty: 0,
                    status: 'Pending' as const
                })),
                orderRef: sale.id,
                sourceSiteId: warehouseId,
                destSiteId: sale.site_id,
                createdAt: new Date().toISOString(),
                jobNumber: sharedJobNumber
            };

            await wmsJobsService.create(pickJob as any);

            // Create PACK Job if cross-site or for delivery/pickup
            if (warehouseId !== sale.site_id || sale.type !== 'In-Store') {
                const packJob = {
                    siteId: warehouseId,
                    type: 'PACK' as const,
                    status: 'Pending' as const,
                    priority: 'Normal' as const,
                    location: 'Packing Station 1',
                    items: plan.items.length,
                    lineItems: plan.items.map(i => ({
                        productId: i.productId,
                        name: i.name,
                        sku: i.sku,
                        expectedQty: i.quantity,
                        pickedQty: 0,
                        status: 'Pending' as const
                    })),
                    orderRef: sale.id,
                    sourceSiteId: warehouseId,
                    destSiteId: sale.site_id,
                    createdAt: new Date().toISOString(),
                    jobNumber: sharedJobNumber
                };
                await wmsJobsService.create(packJob as any);
            }
        }

        // 4. Update sale status
        const { error: updateError } = await supabase
            .from('sales')
            .update({ release_status: 'RELEASED' })
            .eq('id', saleId);

        if (updateError) throw updateError;

        return true;
    }
};
