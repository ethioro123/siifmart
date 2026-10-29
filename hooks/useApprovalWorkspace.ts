import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useData } from '../contexts/DataContext';
import { useStore } from '../contexts/CentralStore';
import { inventoryRequestsService } from '../services/inventory-requests.service';
import { barcodeApprovalsService } from '../services/barcode-approvals.service';
import { APPROVAL_INBOX_KEY } from '../utils/unifiedApprovalInbox';
export type WorkspaceQueue = 'product' | 'barcode' | 'inventory';
export function useApprovalWorkspace(queue: WorkspaceQueue, page: number, enabled: boolean) {
  const { user } = useStore();
  const { effectiveCountry, activeSite } = useData();
  const cache = useQueryClient();
  const country = effectiveCountry || user?.country_code || user?.country || '';
  const site = activeSite?.id;
  const scope = [user?.id, country, site, user?.role];
  const records = useQuery({ queryKey: ['approval-workspace', ...scope, queue, page],
    enabled: enabled && !!user?.id && !!country && !!site,
    queryFn: async () => {
      if (queue === 'barcode') return { kind: 'barcode' as const, data: (await barcodeApprovalsService.getAuditLog(site, country, 25, page, true)).filter(row => row.status === 'pending') };
      if (queue === 'inventory') return { kind: 'inventory' as const, data: (await inventoryRequestsService.getAll(site, country, 25, undefined, page, true)).filter(row => row.status === 'pending' && row.changeType !== 'edit') };
      return { kind: 'product' as const, ...(await inventoryRequestsService.getMerchandisingRequests(country, { siteId: site, page, limit: 25, status: 'pending' })) };
    }, staleTime: 15_000 });
  const decision = useMutation({ mutationFn: async (input: { id: string; action: 'approve' | 'reject'; reason: string }) => {
    if (!user?.id) throw new Error('Sign in to review requests.');
    if (queue === 'barcode') {
      if (input.action === 'approve') await barcodeApprovalsService.approve(input.id, user.id);
      else await barcodeApprovalsService.reject(input.id, user.id, input.reason);
      return { applied: input.action === 'approve' };
    }
    if (queue !== 'product') throw new Error('Use the inventory review workflow.');
    if (input.action === 'approve') return inventoryRequestsService.approveProductEdit(input.id);
    await inventoryRequestsService.rejectProductEdit(input.id, input.reason);
    return { applied: false };
  }, onSuccess: async () => {
    await Promise.all(['approval-workspace', APPROVAL_INBOX_KEY, 'barcode_approvals', 'inventory_requests', 'merchandising_reviews', 'products'].map(key => cache.invalidateQueries({ queryKey: [key] })));
  } });
  return { records, decision, user, country, site };
}
