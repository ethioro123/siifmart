import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { leaveRequestsService } from '../services/leave-requests.service';
import { payrollRunsService } from '../services/payroll-runs.service';
import { APPROVAL_INBOX_KEY } from '../utils/unifiedApprovalInbox';
export type PersonnelReview = 'leave' | 'attestation';
export function useLeaveAndAttestationReview(scope: { country: string; site: string; id: string; name: string; role: string }, kind: PersonnelReview, page: number, enabled: boolean) {
  const cache = useQueryClient(); const key = ['personnel-review', scope.id, scope.role, scope.country, scope.site, kind];
  const list = useQuery({ queryKey: [...key, page], enabled, queryFn: async () => kind === 'leave'
    ? { kind: 'leave' as const, rows: await leaveRequestsService.pendingPage(scope.country, scope.site, page) }
    : { kind: 'attestation' as const, rows: await payrollRunsService.pendingAttestation(scope.country, scope.site, page) }, staleTime: 15000 });
  const decision = useMutation({ mutationFn: async ({ id, reject, reason }: { id: string; reject: boolean; reason: string }) => {
    if (!enabled || list.isError || list.isFetching || !list.data?.rows.some(row => row.id === id)) throw new Error('Refresh the review evidence first.');
    if (kind === 'leave') {
      if (reject && !reason.trim()) throw new Error('A rejection reason is required.');
      const ok = await leaveRequestsService.reviewLeave(id, scope, reject ? 'Rejected' : 'Approved', reason);
      if (!ok) throw new Error('Decision was not confirmed.');
    } else {
      if (reject) throw new Error('Use payroll review for rejection.');
      await payrollRunsService.attestAsRegionalHR(id, reason);
    }
  }, onSuccess: async () => { await Promise.all([cache.invalidateQueries({ queryKey: key }), cache.invalidateQueries({ queryKey: [APPROVAL_INBOX_KEY, scope.id] })]); } });
  return { list, decision };
}
