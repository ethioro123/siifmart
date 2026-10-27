import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { inventoryRequestsService } from '../services/inventory-requests.service';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import type { Product, ShelfPosition } from '../types';

export const VALID_SHELF_POSITIONS: ShelfPosition[] = [
  'Eye Level',
  'Top Shelf',
  'Bottom Shelf',
  'End Cap',
  'Checkout',
  'Back Aisle',
  'Secure'
];

export function useSubmitMerchandisingChanges(countryCode: string) {
  const { user } = useStore();
  const { addNotification } = useData();
  const queryClient = useQueryClient();

  const submitPlanogram = useCallback(async (
    changes: Array<{ product: Product; shelfPosition: string }>,
    customReason?: string
  ) => {
    if (!changes || changes.length === 0) {
      throw new Error('No product moves specified for planogram layout revision.');
    }

    const payloadChanges: Array<{ productId: string; shelfPosition: string }> = [];
    let commonSiteId: string | null = null;

    for (const { product, shelfPosition } of changes) {
      const siteId = product.siteId || (product as Product & { site_id?: string }).site_id;
      if (!siteId) {
        throw new Error(`Product ${product.name} (${product.sku}) lacks a valid site reference.`);
      }
      if (!VALID_SHELF_POSITIONS.includes(shelfPosition as ShelfPosition)) {
        throw new Error(`Invalid shelf position "${shelfPosition}". Allowed positions: ${VALID_SHELF_POSITIONS.join(', ')}`);
      }
      if (!commonSiteId) {
        commonSiteId = siteId;
      } else if (commonSiteId !== siteId) {
        throw new Error('All products in a single layout revision must belong to the same physical store site.');
      }

      payloadChanges.push({
        productId: product.id,
        shelfPosition
      });
    }

    const reason = customReason || (
      payloadChanges.length === 2
        ? 'MERCHANDISING: atomic shelf position swap'
        : `MERCHANDISING: planogram layout revision (${payloadChanges.length} items)`
    );

    // Submit complete layout revision as a single atomic transaction
    const result = await inventoryRequestsService.submitPlanogramLayoutRevision(
      commonSiteId!,
      countryCode,
      payloadChanges,
      reason
    );

    await queryClient.invalidateQueries({ queryKey: ['inventory_requests'] });
    await queryClient.invalidateQueries({ queryKey: ['merchandising_reviews'] });

    addNotification(
      'success',
      `Layout revision (${result.count} product${result.count === 1 ? '' : 's'}) submitted atomically for regional lead approval.`
    );

    return result;
  }, [countryCode, addNotification, queryClient]);

  return { submitPlanogram };
}
