import type { Product } from '../types';
import type { ProductSalesMetrics } from './merchandisingAnalytics';
import type { ProposedPlanogramMove } from '../components/merchandising/planogram/types';

/** Never fall back to a different site's catalog when a store is empty. */
export function planogramStoreProducts(products: Product[], siteId: string): Product[] {
  if (!siteId) return [];
  return products.filter(product => (product.siteId || product.site_id) === siteId && product.status !== 'archived');
}

/** Sales identify review candidates; physical placement needs an in-store assessment. */
export function suggestPlanogramMoves(products: Product[], metrics: Map<string, ProductSalesMetrics>, pending: Set<string>): ProposedPlanogramMove[] {
  return products.flatMap(product => {
    const sales = metrics.get(product.id);
    if (pending.has(product.id) || !sales?.hasOrderHistory) return [];
    const target = product.shelfPosition === 'Bottom Shelf' && sales.unitsSold7d >= 10
      ? 'Eye Level'
      : product.shelfPosition === 'Eye Level' && sales.unitsSold7d <= 2 ? 'Bottom Shelf' : null;
    if (!target) return [];
    return [{
      productId: product.id, productName: product.name, productSku: product.sku,
      currentPosition: product.shelfPosition as 'Eye Level' | 'Bottom Shelf', targetPosition: target,
      unitsSold7d: Math.round(sales.unitsSold7d),
      reason: 'Recorded sales suggest reviewing this placement. Check product weight, shelf space, storage needs and category fit in store.',
      constraints: { weightSafe: false, capacityOk: false, categoryCompatible: false }, selected: false
    }];
  });
}
