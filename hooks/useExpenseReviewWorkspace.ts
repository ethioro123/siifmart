import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { expensesService } from '../services/expenses.service';
import { APPROVAL_INBOX_KEY } from '../utils/unifiedApprovalInbox';
export function useExpenseReviewWorkspace(scope: { actor: string; name: string; role: string; country: string; site: string }, page: number, enabled: boolean) {
  const cache = useQueryClient();
  const key = ['expense-review-workspace', scope.actor, scope.country, scope.site];
  const list = useQuery({ queryKey: [...key, page], enabled, queryFn: () => expensesService.getAll(scope.site, 25, (page - 1) * 25, { countryCode: scope.country, status: 'Pending' }), staleTime: 15_000 });
  const decision = useMutation({ mutationFn: async (input: { id: string; action: 'approve' | 'reject'; reason: string }) => {
    const expense = list.data?.data.find(row => row.id === input.id);
    if (!expense || !enabled || list.isFetching || list.isError) throw new Error('Refresh the request before reviewing.');
    if (!input.reason.trim()) throw new Error('A decision reason is required.');
    if (expense.siteId !== scope.site || expense.countryCode !== scope.country) throw new Error('Expense scope changed.');
    if (input.action === 'approve') return expensesService.approve(input.id, { id: scope.actor, name: scope.name, role: scope.role, countryCode: scope.country, notes: input.reason });
    return expensesService.reject(input.id, { id: scope.actor, name: scope.name, role: scope.role, reason: input.reason });
  }, onSuccess: async () => {
    await Promise.all([cache.invalidateQueries({ queryKey: key }), cache.invalidateQueries({ queryKey: [APPROVAL_INBOX_KEY, scope.actor] }), cache.invalidateQueries({ queryKey: ['expenses'] })]);
  } });
  return { list, decision };
}
