import { useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersService, type SupplierDraft } from '../services/suppliers.service';

export function useSupplierMutations() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['suppliers'] });
  const createSupplier = useMutation({
    mutationFn: (draft: SupplierDraft) => suppliersService.create(draft),
    onSuccess: refresh
  });
  const verifySupplier = useMutation({
    mutationFn: ({ id, employeeId }: { id: string; employeeId: string }) =>
      suppliersService.verify(id, employeeId),
    onSuccess: refresh
  });
  return { createSupplier, verifySupplier };
}
