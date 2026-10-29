import { supabase } from '../lib/supabase';
export interface CatalogRead { product_id: string; kind: 'new' | 'updated'; read_through: string }
export const posCatalogReadsService = {
  async list(userId: string, siteId: string, country: string, productIds: string[]): Promise<CatalogRead[]> {
    const rows: CatalogRead[] = [];
    for (let offset = 0; offset < productIds.length; offset += 100) {
      const { data, error } = await supabase.from('pos_catalog_update_reads').select('product_id,kind,read_through')
        .eq('reviewer_id', userId).eq('site_id', siteId).eq('country_code', country.toUpperCase())
        .in('product_id', productIds.slice(offset, offset + 100)).limit(200);
      if (error) throw error;
      rows.push(...(data || []) as CatalogRead[]);
    }
    return rows;
  },
  async mark(siteId: string, country: string, receipts: CatalogRead[]): Promise<void> {
    if (!receipts.length) return;
    const { data, error } = await supabase.rpc('mark_pos_catalog_updates_read', { p_site_id: siteId, p_country_code: country.toUpperCase(),
      p_updates: receipts.map(row => ({product_id: row.product_id, kind: row.kind, changed_at: row.read_through})) });
    if (error) throw error;
    if (Number(data) !== receipts.length) throw new Error('Catalog read receipts were not confirmed');
  }
};
