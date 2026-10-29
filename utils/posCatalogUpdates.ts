import type { Product } from '../types';
export type CatalogUpdateKind = 'new' | 'price' | 'updated';
export interface CatalogUpdate { product: Product; kinds: CatalogUpdateKind[]; timestamp: number }
const WINDOW_MS = 7 * 86400000;
type UpdateProduct = Product & { updatedAt?: string; updated_at?: string; countryCode?: string; country_code?: string };
const timestamp = (value?: string) => value ? Date.parse(value) : NaN;
/** Observed catalog timestamps, not an inferred event feed or an unread/approval count. */
export function getPOSCatalogUpdates(products: Product[], siteId: string | undefined, country: string | undefined, now = Date.now()): CatalogUpdate[] {
  if (!siteId || !country) return [];
  const updates = new Map<string, CatalogUpdate>();
  for (const product of products as UpdateProduct[]) {
    if ((product.siteId || product.site_id) !== siteId) continue;
    const productCountry = product.countryCode || product.country_code;
    if (productCountry && productCountry.toUpperCase() !== country.toUpperCase()) continue;
    if (['pending', 'rejected', 'archived'].includes((product.approvalStatus || product.approval_status || '').toLowerCase())) continue;
    const events: Array<[CatalogUpdateKind, number]> = [
      ['new', timestamp(product.createdAt || product.created_at)],
      ['price', timestamp(product.priceUpdatedAt || product.price_updated_at)],
    ];
    const recent = events.filter(([, time]) => Number.isFinite(time) && time > now - WINDOW_MS && time <= now);
    const generic = timestamp(product.updatedAt || product.updated_at);
    if (!recent.length && Number.isFinite(generic) && generic > now - WINDOW_MS && generic <= now) recent.push(['updated', generic]);
    if (!recent.length) continue;
    const existing = updates.get(product.id);
    const kinds = [...new Set([...(existing?.kinds || []), ...recent.map(([kind]) => kind)])];
    const latest = Math.max(...recent.map(([, time]) => time), existing?.timestamp || 0);
    updates.set(product.id, { product, kinds, timestamp: latest });
  }
  return [...updates.values()].sort((a, b) => b.timestamp - a.timestamp || a.product.id.localeCompare(b.product.id));
}
