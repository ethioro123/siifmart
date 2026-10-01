import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { discountCodesService } from '../services/discount-codes.service';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import type { DiscountCodeInput } from '../schemas/discount-code.schema';

export function useDiscountCodesQuery(targetCountry?: string) {
  const { effectiveCountry } = useData();
  const country = targetCountry || effectiveCountry || 'ET';

  return useQuery({
    queryKey: ['discountCodes', country],
    queryFn: () => discountCodesService.getAll(country),
    staleTime: 60 * 1000,
  });
}

export function useDiscountCodeMutations(targetCountry?: string) {
  const queryClient = useQueryClient();
  const { showToast } = useStore();
  const { effectiveCountry } = useData();
  const country = targetCountry || effectiveCountry || 'ET';

  const createMutation = useMutation({
    mutationFn: (input: DiscountCodeInput) => discountCodesService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discountCodes'] });
      showToast('Discount code created successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to create discount code', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<DiscountCodeInput> }) =>
      discountCodesService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discountCodes'] });
      showToast('Discount code updated successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to update discount code', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => discountCodesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discountCodes'] });
      showToast('Discount code deleted', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to delete discount code', 'error');
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    isPending: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
}
