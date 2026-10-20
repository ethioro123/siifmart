import { useCallback } from 'react';
import { useCreateInventoryRequestMutation } from './useInventoryRequestMutations';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import type { Product } from '../types';

export function useSubmitMerchandisingChanges(countryCode: string) {
  const { user } = useStore();
  const { addNotification } = useData();
  const createRequest = useCreateInventoryRequestMutation();

  const submitPlanogram = useCallback(async (changes: Array<{ product: Product; shelfPosition: string }>) => {
    for (const { product, shelfPosition } of changes) {
      const siteId = product.siteId || (product as Product & { site_id?: string }).site_id;
      if (!siteId || !['Top Shelf', 'Eye Level', 'Bottom Shelf'].includes(shelfPosition)) {
        throw new Error('Select a product and a valid shelf position.');
      }
      await createRequest.mutateAsync({
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        siteId,
        countryCode,
        changeType: 'edit',
        requestedBy: user?.name || user?.email || 'Unknown',
        requestedAt: new Date().toISOString(),
        status: 'pending',
        proposedChanges: { shelfPosition: shelfPosition as Product['shelfPosition'] },
        adjustmentReason: 'MERCHANDISING: planogram proposal'
      });
    }
    addNotification('success', `${changes.length} planogram proposal${changes.length === 1 ? '' : 's'} submitted for lead approval.`);
  }, [countryCode, createRequest, user, addNotification]);

  return { submitPlanogram };
}
