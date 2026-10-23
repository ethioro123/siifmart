import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { poFinanceReviewService } from '../services/po-finance-review.service';
import { purchaseOrdersService } from '../services/purchase-orders.service';

export function usePOFinanceReview(page: number, selectedId: string | null) {
    const { user } = useStore();
    const { effectiveCountry } = useData();
    const enabled = user?.role === 'country_finance_director' && Boolean(effectiveCountry);
    const scope = [effectiveCountry, user?.siteId, user?.id];
    const queue = useQuery({
        queryKey: ['po_finance_review', ...scope, page],
        queryFn: () => poFinanceReviewService.getQueue(effectiveCountry!, page),
        enabled, staleTime: 15000
    });
    const detail = useQuery({
        queryKey: ['po_finance_detail', ...scope, selectedId],
        queryFn: () => purchaseOrdersService.getById(selectedId!),
        enabled: enabled && Boolean(selectedId), staleTime: 0
    });
    return { queue, detail };
}
export function useClearPOFinance() {
    const client = useQueryClient();
    const { effectiveCountry } = useData();
    return useMutation({
        mutationFn: ({ poId, reason }: { poId: string; reason: string }) => purchaseOrdersService.clearFinance(poId, reason),
        onSuccess: () => {
            client.invalidateQueries({ queryKey: ['po_finance_review', effectiveCountry] });
            client.invalidateQueries({ queryKey: ['po_finance_detail', effectiveCountry] });
            client.invalidateQueries({ queryKey: ['purchase_orders', effectiveCountry] });
        }
    });
}
