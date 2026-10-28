import { supabase } from '../lib/supabase';
import type { Product } from '../types';

export interface ShelfTagAuditRecord {
  id: string;
  siteId: string;
  productId: string;
  sku: string;
  productName: string;
  systemPrice: number;
  shelfPrice: number;
  variance: number;
  status: 'detected' | 'tag_queued' | 'printed' | 'verified';
  createdAt: string;
  updatedAt: string;
}

const AUDIT_STORAGE_PREFIX = 'siifmart_shelf_audit_records_';

export const shelfTagsService = {
  /**
   * Fetches the authoritative product record directly from Supabase for a given site & SKU,
   * bypassing stale client caches.
   */
  async fetchAuthoritativeProduct(siteId: string, skuOrBarcode: string): Promise<Product | null> {
    const cleanTerm = skuOrBarcode.trim();
    if (!cleanTerm) return null;

    let query = supabase
      .from('products')
      .select('id,site_id,sku,name,price,cost_price,sale_price,is_on_sale,category,shelf_position,custom_attributes,barcode,barcode_type')
      .or(`sku.ilike.${cleanTerm},barcode.eq.${cleanTerm}`);

    if (siteId) {
      query = query.eq('site_id', siteId);
    }

    const { data, error } = await query.limit(1).maybeSingle();
    if (error) throw error;
    if (!data) return null;

    const customAttrs = (data as any).custom_attributes || {};
    const cert = customAttrs.dietaryCert || customAttrs.dietary_cert;
    const isHalal = Boolean(
      customAttrs.isHalal ||
      customAttrs.is_halal ||
      customAttrs.halalVerified ||
      (typeof cert === 'string' && /^(100%\s*)?(certified[\s_-]*)?halal([\s_-]*certified)?$/i.test(cert.trim()))
    );

    return {
      id: data.id,
      siteId: data.site_id,
      sku: data.sku,
      name: data.name,
      price: Math.round(Number(data.price) || 0),
      costPrice: Math.round(Number(data.cost_price) || 0),
      salePrice: data.sale_price ? Math.round(Number(data.sale_price)) : undefined,
      isOnSale: Boolean(data.is_on_sale),
      category: data.category,
      shelfPosition: data.shelf_position,
      isHalal,
      dietaryCert: cert,
      customAttributes: customAttrs,
      barcode: data.barcode,
      barcodeType: data.barcode_type
    } as unknown as Product;
  },

  /**
   * Fetches authoritative POS prices for an array of product IDs prior to print dispatch.
   */
  async fetchAuthoritativeProducts(siteId: string, productIds: string[]): Promise<Map<string, Product>> {
    const map = new Map<string, Product>();
    if (productIds.length === 0) return map;

    let query = supabase
      .from('products')
      .select('id,site_id,sku,name,price,cost_price,sale_price,is_on_sale,category,shelf_position,custom_attributes,barcode,barcode_type')
      .in('id', productIds);

    if (siteId) {
      query = query.eq('site_id', siteId);
    }

    const { data, error } = await query;
    if (error) throw error;

    (data || []).forEach((row: any) => {
      const customAttrs = row.custom_attributes || {};
      const cert = customAttrs.dietaryCert || customAttrs.dietary_cert;
      const isHalal = Boolean(
        customAttrs.isHalal ||
        customAttrs.is_halal ||
        customAttrs.halalVerified ||
        (typeof cert === 'string' && /^(100%\s*)?(certified[\s_-]*)?halal([\s_-]*certified)?$/i.test(cert.trim()))
      );

      const prod: Product = {
        id: row.id,
        siteId: row.site_id,
        sku: row.sku,
        name: row.name,
        price: Math.round(Number(row.price) || 0),
        costPrice: Math.round(Number(row.cost_price) || 0),
        salePrice: row.sale_price ? Math.round(Number(row.sale_price)) : undefined,
        isOnSale: Boolean(row.is_on_sale),
        category: row.category,
        shelfPosition: row.shelf_position,
        isHalal,
        dietaryCert: cert,
        customAttributes: customAttrs,
        barcode: row.barcode,
        barcodeType: row.barcode_type
      } as unknown as Product;
      map.set(prod.id, prod);
    });

    return map;
  },

  /**
   * Manages local discrepancy lifecycle audit entries scoped by site and country.
   */
  getStoredAuditRecords(scopeKey: string): ShelfTagAuditRecord[] {
    try {
      if (typeof localStorage === 'undefined') return [];
      const raw = localStorage.getItem(`${AUDIT_STORAGE_PREFIX}${scopeKey}`);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveAuditRecord(scopeKey: string, record: Omit<ShelfTagAuditRecord, 'id' | 'createdAt' | 'updatedAt'>): ShelfTagAuditRecord {
    const list = this.getStoredAuditRecords(scopeKey);
    const existingIndex = list.findIndex(r => r.productId === record.productId && r.status !== 'verified');
    const now = new Date().toISOString();

    let saved: ShelfTagAuditRecord;
    if (existingIndex >= 0) {
      saved = {
        ...list[existingIndex],
        ...record,
        updatedAt: now
      };
      list[existingIndex] = saved;
    } else {
      saved = {
        ...record,
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: now,
        updatedAt: now
      };
      list.unshift(saved);
    }

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`${AUDIT_STORAGE_PREFIX}${scopeKey}`, JSON.stringify(list.slice(0, 100)));
      }
    } catch {
      // Storage quota fallback
    }
    return saved;
  },

  updateAuditStatus(scopeKey: string, auditId: string, status: ShelfTagAuditRecord['status']): void {
    const list = this.getStoredAuditRecords(scopeKey);
    const item = list.find(r => r.id === auditId);
    if (item) {
      item.status = status;
      item.updatedAt = new Date().toISOString();
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(`${AUDIT_STORAGE_PREFIX}${scopeKey}`, JSON.stringify(list));
        }
      } catch {
        // Ignored
      }
    }
  }
};
