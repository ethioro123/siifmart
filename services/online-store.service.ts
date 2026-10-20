import { Product } from '../types';
import { supabase } from '../lib/supabase';
import { productsService } from './products.service';

export type CatalogListing = { product_id: string; is_published: boolean };
export type StoreOrder = {
  id: string;
  order_number: string;
  country_code: string;
  currency: string;
  customer_name: string;
  customer_phone: string;
  fulfillment_method: 'delivery' | 'pickup';
  delivery_address: string | null;
  payment_method: string;
  payment_status: string;
  status: 'awaiting_confirmation' | 'accepted' | 'rejected';
  merchandise_subtotal: number;
  created_at: string;
  status_updated_at: string | null;
  status_updated_by: string | null;
  pick_job_id: string | null;
};
export type StoreOrderJob = {
  id: string;
  order_ref: string;
  type: string;
  status: string;
  transfer_status: string | null;
};
export type StoreDelivery = { customer_name: string; customer_phone: string; delivery_address: string | null };
export type StoreOrderItem = {
  order_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  line_subtotal: number;
};
export type OnlineStoreManagementData = {
  products: Product[];
  listings: CatalogListing[];
  orders: StoreOrder[];
  items: StoreOrderItem[];
  jobs: StoreOrderJob[];
};

export function canPublishOnlineProduct(product: Product) {
  return product.status === 'active' &&
    (product.approvalStatus || product.approval_status) === 'approved' &&
    product.stock > 0;
}

export const onlineStoreService = {
  async getManagementData(siteId: string, includeOrders: boolean): Promise<OnlineStoreManagementData> {
    const [productResult, catalogResult, orderResult] = await Promise.all([
      supabase.from('products')
        .select('id,site_id,name,sku,category,price,sale_price,is_on_sale,stock,status,approval_status,image,brand,size,description')
        .eq('site_id', siteId).neq('status', 'archived').order('name').limit(500),
      supabase.from('storefront_catalog').select('product_id,is_published').eq('site_id', siteId).limit(500),
      includeOrders ? supabase.from('storefront_orders')
        .select('id,order_number,country_code,currency,customer_name,customer_phone,fulfillment_method,delivery_address,payment_method,payment_status,status,merchandise_subtotal,created_at,status_updated_at,status_updated_by,pick_job_id')
        .eq('site_id', siteId).order('created_at', { ascending: false }).limit(50)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (productResult.error) throw productResult.error;
    if (catalogResult.error) throw catalogResult.error;
    if (orderResult.error) throw orderResult.error;

    const orders = (orderResult.data || []) as StoreOrder[];
    const itemsResult = orders.length
      ? await supabase.from('storefront_order_items')
        .select('order_id,product_name,sku,quantity,unit_price,line_subtotal')
        .in('order_id', orders.map((order) => order.id)).limit(1000)
      : { data: [], error: null };
    if (itemsResult.error) throw itemsResult.error;
    const jobsResult = orders.length
      ? await supabase.from('wms_jobs')
        .select('id,order_ref,type,status,transfer_status')
        .eq('site_id', siteId).in('order_ref', orders.map((order) => order.id))
        .in('type', ['PICK', 'PACK', 'DISPATCH']).limit(150)
      : { data: [], error: null };
    if (jobsResult.error) throw jobsResult.error;
    return {
      listings: (catalogResult.data || []) as CatalogListing[],
      products: (productResult.data || []).map((row) => productsService._mapProduct(row)),
      orders,
      items: (itemsResult.data || []) as StoreOrderItem[],
      jobs: (jobsResult.data || []) as StoreOrderJob[],
    };
  },

  async setProductPublished(siteId: string, product: Product, published: boolean) {
    if (product.siteId !== siteId) throw new Error('Product is outside the selected site.');
    if (published && !canPublishOnlineProduct(product)) throw new Error('Only active, approved products with stock can be published.');
    const result = published
      ? await supabase.from('storefront_catalog').upsert({ site_id: siteId, product_id: product.id, is_published: true }, { onConflict: 'site_id,product_id' })
      : await supabase.from('storefront_catalog').delete().eq('site_id', siteId).eq('product_id', product.id);
    if (result.error) throw result.error;
  },

  async updateOrderStatus(orderId: string, status: 'accepted' | 'rejected') {
    const { error } = await supabase.rpc('decide_storefront_order', {
      p_order_id: orderId,
      p_decision: status,
    });
    if (error) throw error;
  },

  async getDeliveryDetails(orderId: string, siteId: string, countryCode: string): Promise<StoreDelivery | null> {
    const { data, error } = await supabase.from('storefront_orders')
      .select('customer_name,customer_phone,delivery_address')
      .eq('id', orderId).eq('site_id', siteId).eq('country_code', countryCode)
      .maybeSingle();
    if (error) throw error;
    return data as StoreDelivery | null;
  },

  async isOnlinePickJob(jobId: string, siteId: string, countryCode: string): Promise<boolean> {
    const { data, error } = await supabase.from('storefront_orders')
      .select('id').eq('pick_job_id', jobId).eq('site_id', siteId)
      .eq('country_code', countryCode).maybeSingle();
    if (error) throw error;
    return Boolean(data);
  },
};
