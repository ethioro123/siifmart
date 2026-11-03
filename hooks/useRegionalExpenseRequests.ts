import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { expensesService } from '../services/expenses.service';

export function useRegionalExpenseRequests(scope: {
  actorId: string; actorName: string; role: string; countryCode: string;
  regionCode: string; siteIds: string[];
}, page: number, enabled: boolean) {
  const cache = useQueryClient();
  const siteIds = [...scope.siteIds].sort();
  const key = ['regional-expenses', scope.actorId, scope.countryCode, scope.regionCode, siteIds];
  const list = useQuery({
    queryKey: [...key, page],
    queryFn: () => expensesService.getAll(undefined, 25, (page - 1) * 25, {
      countryCode: scope.countryCode, siteIds, status: 'Pending'
    }),
    enabled: enabled && Boolean(scope.actorId && scope.regionCode),
    staleTime: 15_000
  });
  const approve = useMutation({
    mutationFn: async (id: string) => {
      const expense = list.data?.data.find(row => row.id === id);
      if (!expense || list.isFetching || list.isError || !siteIds.includes(expense.siteId))
        throw new Error('Refresh this request before approving it.');
      return expensesService.approve(id, {
        id: scope.actorId, name: scope.actorName, role: scope.role,
        countryCode: scope.countryCode, notes: 'Regional expense approval'
      });
    },
    onSuccess: async () => {
      await cache.invalidateQueries({ queryKey: key });
      await cache.invalidateQueries({ queryKey: ['expenses'] });
    }
  });
  return { list, approve };
}
