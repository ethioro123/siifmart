import { useMutation, useQueryClient } from '@tanstack/react-query';
import { APPROVAL_INBOX_KEY } from '../utils/unifiedApprovalInbox';
import { PRODUCT_APPROVAL_INBOX_KEY } from '../utils/approvalInbox';
import { useData } from '../contexts/DataContext';
import { submitScopedPriceProposals } from '../services/scoped-price-proposals.service';
import type { PriceChangeInput } from '../utils/priceManager';
export type { PriceChangeInput } from '../utils/priceManager';

/** One proposal per SKU and selected scope, with atomic per-location validation. */
export function useSubmitPriceChanges(countryCode: string) {
    const queryClient = useQueryClient();
    const { addNotification } = useData();
    const mutation = useMutation({
        mutationFn: ({ changes, source }: { changes: PriceChangeInput[]; source: string }) =>
            submitScopedPriceProposals(countryCode, changes, source),
        onSuccess: result => {
            if (result.submitted) {
                addNotification('success', `${result.proposalCount} scoped price proposal(s) saved for ${result.submitted} product location(s).${result.financeFlagged ? ` ${result.financeFlagged} location(s) require Finance clearance before commercial approval.` : ' Independent commercial approval is required.'}`);
                for (const key of ['product_pending_changes', 'product_change_history', 'merchandising_reviews', PRODUCT_APPROVAL_INBOX_KEY, APPROVAL_INBOX_KEY])
                    void queryClient.invalidateQueries({ queryKey: [key] });
            }
            if (result.failures.length) addNotification('alert', `${result.failures.length} product location(s) could not be submitted. Their selections are retained for retry.`);
        },
    });
    return { submit: (changes: PriceChangeInput[], source: string) => mutation.mutateAsync({ changes, source }), isPending: mutation.isPending };
}
