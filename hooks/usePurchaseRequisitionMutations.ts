import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { purchaseRequisitionsService } from '../services/purchase-requisitions.service';
import type { PurchaseRequisitionItem } from '../types/purchaseRequisition';

export function usePurchaseRequisitions(countryCode: string, cacheScope: string) {
  const queryClient = useQueryClient();
  const queryKey = ['purchase-requisitions', countryCode, cacheScope];
  const requests = useQuery({ queryKey, queryFn: () => purchaseRequisitionsService.list(countryCode), staleTime: 30_000 });
  const refresh = () => queryClient.invalidateQueries({ queryKey });
  const submit = useMutation({
    mutationFn: (input: Parameters<typeof purchaseRequisitionsService.create>[0]) => purchaseRequisitionsService.create(input),
    onSuccess: refresh
  });
  const review = useMutation({
    mutationFn: (input: { id: string; decision: 'Approved' | 'Rejected'; reason: string }) =>
      purchaseRequisitionsService.review(input.id, input.decision, input.reason),
    onSuccess: refresh
  });
  return { requests, submit, review, refresh };
}

export type { PurchaseRequisitionItem };
