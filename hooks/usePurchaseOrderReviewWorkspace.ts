import { useQuery, useQueryClient } from '@tanstack/react-query';
import { purchaseOrdersService } from '../services/purchase-orders.service';
import type { PurchaseOrder } from '../types';
import { APPROVAL_INBOX_KEY } from '../utils/unifiedApprovalInbox';
export function usePurchaseOrderReviewWorkspace(scope: { country: string; site: string; actor: string }, page: number, id: string | null, enabled: boolean) {
  const client = useQueryClient();
  const key = ['purchase-order-review-workspace', scope.actor, scope.country, scope.site];
  const list = useQuery({ queryKey: [...key, 'list', page], enabled,
    queryFn: async () => {
      const result = await purchaseOrdersService.getAll(scope.site, 25, (page - 1) * 25, { countryCode: scope.country, status: 'Pending' });
      return { data: result.data as PurchaseOrder[], count: result.count || 0 };
    }, staleTime: 15_000 });
  const detail = useQuery({ queryKey: [...key, 'detail', id], enabled: enabled && !!id,
    queryFn: async () => {
      const po = await purchaseOrdersService.getById(id!);
      if (!po || po.siteId !== scope.site || (po.country_code || po.countryCode) !== scope.country) throw new Error('Order is outside the active review scope.');
      return po;
    }, staleTime: 0 });
  const refresh = () => Promise.all([client.invalidateQueries({ queryKey: key }), client.invalidateQueries({ queryKey: [APPROVAL_INBOX_KEY, scope.actor] }), client.invalidateQueries({ queryKey: ['purchase_orders'] })]);
  return { list, detail, refresh };
}
