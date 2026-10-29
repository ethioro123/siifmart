import { useMutation } from '@tanstack/react-query';
import { drawerReconciliationService } from '../services/drawer-reconciliation.service';
export function useCounterFinanceReview() {
    return useMutation({ mutationFn: ({ id, action, notes }: { id: string; action: 'Reconciled' | 'Flagged'; notes: string }) =>
        drawerReconciliationService.signOff(id, { id: '', name: '' }, action, { hqNotes: notes }) });
}
