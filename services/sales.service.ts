import { fulfillmentReturnsService } from './fulfillment-returns.service';
import { supabase } from '../lib/supabase';
import type { SaleRecord, FulfillmentPlan, CartItem } from '../types';
import { productsService } from './products.service';
import { wmsJobsService, generateReadableJobNumber } from './wms-jobs.service';
import { customersService } from './customers.service';
function mapSaleRow(s: any): any {
    return {
        ...s,
        siteId: s.site_id,
        date: s.sale_date,
        method: s.payment_method,
        amountTendered: s.amount_tendered,
        cashierName: s.cashier_name,
        customerId: s.customer_id,
        receiptNumber: s.receipt_number,
        offlineReceiptNumber: s.offline_receipt_number || undefined,
        offline_receipt_number: s.offline_receipt_number || undefined,
        mobilePaymentChannel: s.mobile_payment_channel, mobileTransactionRef: s.mobile_transaction_ref, customerPhone: s.customer_phone,
        customerName: s.customers?.name,
        itemCount: Array.isArray(s.sale_items)
            ? (s.sale_items[0]?.count !== undefined ? Number(s.sale_items[0].count) : s.sale_items.length)
            : 0,
        type: s.type || 'In-Store',
        items: Array.isArray(s.sale_items)
            ? s.sale_items.map((i: any) => ({
                ...i,
                id: i.product_id,
                name: i.product_name,
                costPrice: i.cost_price,
                sku: i.products?.sku || i.sku,
                category: i.products?.category || i.category
            }))
            : []
    };
}

export const salesService = {
    async getAll(siteId?: string, limit: number = 25, offset: number = 0, filters?: any) {
        // RULE 10: Lazy loading — list views default to receipt header columns only.
        // Nested sale_items and deep product joins are loaded on-demand via getById().
        const selectFields = filters?.forecast
            ? 'id,site_id,sale_date,status,country_code,sale_items(product_id,product_name,quantity,price,products(sku))'
            : filters?.includeItems
            ? '*, sale_items(*, products(category)), customers!left(*)'
            : 'id, site_id, customer_id, sale_date, subtotal, tax, total, payment_method, status, amount_tendered, change, cashier_name, receipt_number, offline_receipt_number, fulfillment_status, release_status, country_code, currency, created_at, mobile_payment_channel, mobile_transaction_ref, customer_phone, sale_items(count), customers!left(name)';

        let query = supabase
            .from('sales')
            .select(selectFields, { count: 'exact' });

        if (filters?.siteIds && Array.isArray(filters.siteIds)) {
            if (filters.siteIds.length === 0) return { data: [], count: 0 };
            query = query.in('site_id', filters.siteIds);
        } else if (siteId) {
            query = query.eq('site_id', siteId);
        }

        // Apply Filters
        if (filters) {
            if (filters.status && filters.status !== 'All') {
                query = query.eq('status', filters.status);
            }
            if (filters.countryCode) {
                query = query.eq('country_code', filters.countryCode.toUpperCase());
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
                const term = String(filters.search).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
                const clauses = [
                    `receipt_number.ilike."%${term}%"`,
                    `offline_receipt_number.ilike."%${term}%"`,
                    `cashier_name.ilike."%${term}%"`,
                    `customers.name.ilike."%${term}%"`
                ];
                if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(filters.search))) {
                    clauses.push(`id.eq.${filters.search}`);
                }
                query = query.or(clauses.join(','));
            }
        }

        // Apply Sort and Pagination
        query = query
            .order('sale_date', { ascending: false }).order('id')
            .range(offset, offset + limit - 1);

        const { data, error, count } = await query;
        if (error) throw error;
        return { data: data.map(mapSaleRow), count: count || 0 };
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('sales')
            .select('*, sale_items(*, products(category)), customers(*)')
            .eq('id', id)
            .single();

        if (error) throw error;
        return mapSaleRow(data);
    },

    async create(sale: Omit<SaleRecord, 'created_at' | 'updated_at'>, items: any[], discountCodeId?: string | null) {
        const { data, error } = await supabase.rpc('create_pos_sale_atomic', {
            p_sale: {
                id: sale.id,
                site_id: sale.siteId,
                customer_id: sale.customerId,
                payment_method: sale.method,
                amount_tendered: sale.amountTendered,
                total: sale.total,
                type: sale.type,
                receipt_number: sale.receiptNumber,
                offline_receipt_number: sale.offlineReceiptNumber || sale.offline_receipt_number,
                mobile_payment_channel: sale.mobilePaymentChannel, mobile_transaction_ref: sale.mobileTransactionRef, customer_phone: sale.customerPhone,
                discount_code_id: discountCodeId || null
            },
            p_items: items.map(item => ({
                product_id: item.productId || item.id,
                quantity: item.quantity
            }))
        });

        if (error) throw error;
        if (!data) throw new Error('Sale RPC returned no result');

        const result = data as any;
        const itemsWithSaleId = (Array.isArray(result.items) ? result.items : []).map((item: any) => ({
            id: item.product_id,
            product_id: item.product_id,
            product_name: item.product_name,
            name: item.product_name,
            quantity: item.quantity,
            price: item.price,
            cost_price: item.cost_price,
            costPrice: item.cost_price
        }));

        // The sale RPC posts store stock atomically; delivery stock remains owned by WMS picking.

        return {
            ...result,
            id: result.id,
            siteId: result.site_id,
            customerId: result.customer_id,
            date: result.sale_date,
            subtotal: result.subtotal,
            tax: result.tax,
            total: result.total,
            method: result.payment_method,
            status: result.status,
            amountTendered: result.amount_tendered,
            change: result.change,
            cashierName: result.cashier_name,
            receiptNumber: result.receipt_number,
            offlineReceiptNumber: result.offline_receipt_number || undefined,
            offline_receipt_number: result.offline_receipt_number || undefined,
            items: itemsWithSaleId
        };
    },

    async refund(id: string, items: Array<{product_id:string;quantity:number}>, _refundAmount: number) {
        return fulfillmentReturnsService.requestByProduct(id,items);
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
