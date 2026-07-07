import { supabase } from '../lib/supabase';
import type { Product } from '../types';
import { _mapProduct, _calculateStatus } from './products/products-helpers';
import { handleAutoReplenish } from './products/products-replenish';
import {
    createProduct,
    updateProduct,
    deleteProduct,
    cascadeDeleteProduct,
    clearLocationForEmptyProducts,
    adjustStock
} from './products/products-mutations';

export const productsService = {
    // Re-export helper methods for backward compatibility / context usages
    _mapProduct,
    _calculateStatus,
    handleAutoReplenish,

    async getAll(siteId?: string, limit?: number, offset?: number, filters?: any, sort?: { key: string, direction: 'asc' | 'desc' }) {
        let query = supabase
            .from('products')
            .select('*', { count: 'exact' });

        if (sort && sort.key) {
            let column = sort.key;
            if (sort.key === 'createdAt') column = 'created_at';
            else if (sort.key === 'costPrice') column = 'cost_price';
            else if (sort.key === 'salePrice') column = 'sale_price';
            else if (sort.key === 'siteId') column = 'site_id';
            if (sort.key === 'assetValue') {
                column = 'cost_price';
            } else if (sort.key === 'abc') {
                column = 'price';
            }
            query = query.order(column, { ascending: sort.direction === 'asc' });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        if (siteId && siteId !== 'All') {
            query = query.eq('site_id', siteId);
        }

        if (filters) {
            if (filters.search) {
                const search = filters.search;
                query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,location.ilike.%${search}%,barcode.eq.${search}`);
            }
            if (filters.category && filters.category !== 'All') {
                query = query.eq('category', filters.category);
            }
            if (filters.status && filters.status !== 'All') {
                if (filters.status === 'Active') query = query.eq('status', 'active');
                else if (filters.status === 'Low Stock') query = query.eq('status', 'low_stock');
                else if (filters.status === 'Out of Stock') query = query.eq('status', 'out_of_stock');
            }
        }

        if (limit) {
            const from = offset || 0;
            const to = from + limit - 1;
            query = query.range(from, to);
        }

        const { data, error, count } = await query;
        if (error) throw error;

        const mappedData = data.map((p: any) => this._mapProduct(p));
        return { data: mappedData, count: count || 0 };
    },

    async getMetrics(siteId?: string) {
        const { data, error } = await supabase.rpc('get_inventory_metrics', {
            p_site_id: siteId && siteId !== 'All' ? siteId : null
        });
        if (error) throw error;
        return data;
    },

    async getFinancialMetrics(siteId?: string, startDate?: string, endDate?: string) {
        const { data, error } = await supabase.rpc('get_financial_metrics', {
            p_site_id: siteId && siteId !== 'All' ? siteId : null,
            p_start_date: startDate,
            p_end_date: endDate
        });
        if (error) throw error;
        return data;
    },

    async getByBarcode(barcode: string, siteId?: string) {
        let query = supabase.from('products').select('*');
        if (siteId) {
            query = query.eq('site_id', siteId);
        }
        const { data, error } = await query.or(`barcode.eq.${barcode},barcodes.cs.{${barcode}}`);
        if (error) throw error;
        return data.map((p: any) => this._mapProduct(p));
    },

    async search(term: string, siteId?: string, limit: number = 20) {
        let query = supabase
            .from('products')
            .select('*')
            .or(`name.ilike.%${term}%,sku.ilike.%${term}%`)
            .limit(limit);

        if (siteId) {
            query = query.eq('site_id', siteId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data.map((p: any) => this._mapProduct(p));
    },

    async getById(id: string, siteId?: string) {
        let query = supabase.from('products').select('*').eq('id', id);
        if (siteId) {
            query = query.eq('site_id', siteId);
        }
        const { data, error } = await query.single();
        if (error) throw error;
        return this._mapProduct(data);
    },

    async getBySKU(sku: string, siteId?: string) {
        let query = supabase.from('products').select('*').eq('sku', sku);
        if (siteId) {
            query = query.eq('site_id', siteId);
        }
        const { data, error } = await query.maybeSingle();
        if (error) throw error;
        return data ? this._mapProduct(data) : null;
    },

    async getBySkuAndLocation(sku: string, location: string, siteId: string) {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('sku', sku)
            .eq('site_id', siteId)
            .ilike('location', location)
            .maybeSingle();

        if (error) throw error;
        return data ? this._mapProduct(data) : null;
    },

    async findAllBySKU(sku: string) {
        if (!sku || sku === 'N/A' || sku === 'TEMP') return [];
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .ilike('sku', sku.trim());

        if (error) throw error;
        return data.map(p => this._mapProduct(p));
    },

    async updatePricesBySKU(sku: string, updates: { price: number; costPrice?: number; salePrice?: number; isOnSale?: boolean }) {
        if (!sku || sku === 'N/A') throw new Error('Cannot sync prices for products without a valid SKU');
        const targets = await this.findAllBySKU(sku);
        if (targets.length === 0) {
            console.warn(`⚠️ Global Sync: No products found for SKU "${sku}".`);
            return [];
        }
        const updatePromises = targets.map(p => this.update(p.id, updates));
        const results = await Promise.all(updatePromises);
        return results;
    },

    async updatePrice(id: string, newPrice: number) {
        const { data: current, error: fetchError } = await supabase
            .from('products')
            .select('price')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        const updates: any = {
            price: newPrice,
            old_price: current.price,
            price_updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return this._mapProduct(data);
    },

    async getLowStock(threshold: number = 10, siteId?: string) {
        let query = supabase
            .from('products')
            .select('*')
            .lte('stock', threshold)
            .order('stock', { ascending: true });

        if (siteId) {
            query = query.eq('site_id', siteId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async getLowStockAcrossSites() {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .not('status', 'eq', 'archived');

        if (error) throw error;
        return data
            .map(p => this._mapProduct(p))
            .filter(p => p.stock < (p.minStock || 10));
    },

    async getWarehouseStock(sku: string) {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('sku', sku)
            .gt('stock', 0);

        if (error) throw error;
        return data.map((p: any) => this._mapProduct(p));
    },

    // Mutations - delegating implementation
    create: createProduct,
    update: updateProduct,
    delete: deleteProduct,
    cascadeDelete: cascadeDeleteProduct,
    clearLocationForEmptyProducts,
    adjustStock
};
