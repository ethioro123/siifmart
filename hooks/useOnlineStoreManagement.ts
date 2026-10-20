import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Product } from '../types';
import { onlineStoreService } from '../services/online-store.service';

export function useOnlineStoreManagement(siteId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ['online-store-management', siteId];
  const data = useQuery({
    queryKey,
    queryFn: () => onlineStoreService.getManagementData(siteId!),
    enabled: Boolean(siteId),
    staleTime: 30_000,
  });

  const publishMutation = useMutation({
    mutationFn: ({ product, published }: { product: Product; published: boolean }) =>
      onlineStoreService.setProductPublished(siteId!, product, published),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
  const orderMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: 'accepted' | 'rejected' }) =>
      onlineStoreService.updateOrderStatus(orderId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { ...data, publishMutation, orderMutation };
}
