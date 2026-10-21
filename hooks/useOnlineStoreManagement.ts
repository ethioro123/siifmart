import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { OnlineOrderIntake, onlineStoreService } from '../services/online-store.service';

export function useOnlineStoreManagement(siteId: string | undefined, includeOrders: boolean, countryCode?: string, userId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ['online-operations', userId, countryCode, siteId, includeOrders];
  const data = useQuery({
    queryKey,
    queryFn: () => onlineStoreService.getManagementData(siteId!, includeOrders),
    enabled: Boolean(siteId && countryCode && userId && includeOrders),
    staleTime: 30_000,
  });

  const intakeMutation = useMutation({
    mutationFn: (order: OnlineOrderIntake) => onlineStoreService.createOrder(siteId!, order),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
  const orderMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: 'accepted' | 'rejected' }) =>
      onlineStoreService.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  return { ...data, intakeMutation, orderMutation };
}
