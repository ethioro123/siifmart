import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { purchaseRequisitionsService } from '../services/purchase-requisitions.service';
import { APPROVAL_INBOX_KEY } from '../utils/unifiedApprovalInbox';
export function useRequisitionReviewWorkspace(scope: { country: string; site: string; actor: string }, page: number, id: string, enabled: boolean) {
  const client = useQueryClient();
  const key = ['requisition-review-workspace', scope.country, scope.site, scope.actor];
  const list = useQuery({ queryKey: [...key, 'list', page], enabled,
    queryFn: () => purchaseRequisitionsService.pendingPage(scope.country, scope.site, page), staleTime: 15_000 });
  const detail = useQuery({ queryKey: [...key, 'detail', id], enabled: enabled && !!id,
    queryFn: () => purchaseRequisitionsService.detail(id, scope.country, scope.site), staleTime: 0 });
  const decision = useMutation({ mutationFn: async (input: { decision: 'Approved' | 'Rejected'; reason: string }) => {
    if (!enabled || !id || !detail.data || detail.isFetching || detail.isError) throw new Error('Refresh the request evidence before deciding.');
    if (detail.data.status !== 'Submitted') throw new Error('This request is no longer pending.');
    if (detail.data.requester_employee_id === scope.actor) throw new Error('You cannot review your own request.');
    if (input.decision === 'Rejected' && !input.reason.trim()) throw new Error('A rejection reason is required.');
    const saved = await purchaseRequisitionsService.review(id, input.decision, input.reason);
    if (saved.status !== input.decision) throw new Error('The requested decision was not confirmed.');
    return saved;
  }, onSuccess: async () => {
    await Promise.all([client.invalidateQueries({ queryKey: key }), client.invalidateQueries({ queryKey: ['purchase-requisitions', scope.country] }), client.invalidateQueries({ queryKey: [APPROVAL_INBOX_KEY, scope.actor] })]);
  } });
  return { list, detail, decision };
}
