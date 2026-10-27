import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useCreateInventoryRequestMutation } from './useInventoryRequestMutations';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { submitPriceBatch, type PriceChangeInput } from '../utils/priceManager';
export type { PriceChangeInput } from '../utils/priceManager';
import { buildPriceChangeRequest, isBelowMarginFloor, type PriceProposal } from '../utils/pricingGovernance';

/**
 * Submits price changes for the authorized merchandising lead (inventory_requests).
 * Returns the number of requests submitted and how many need Finance co-approval.
 */
export function useSubmitPriceChanges(countryCode: string) {
    const queryClient = useQueryClient();
    const { user } = useStore();
    const { addNotification } = useData();
    const createRequest = useCreateInventoryRequestMutation();

    const submit = useCallback(
        async (changes: PriceChangeInput[], source: string) => {
            const requestedBy = user?.name || user?.email || 'Unknown';
            const result = await submitPriceBatch(changes, async ({ product, proposal }) => {
                await createRequest.mutateAsync(buildPriceChangeRequest({ product, proposal, requestedBy, countryCode, source }));
            }, isBelowMarginFloor);
            if (result.submitted > 0) addNotification('success', `${result.submitted} price proposal(s) submitted for Operations, Supply Chain and Merchandising approval${result.financeFlagged ? `; ${result.financeFlagged} also require Finance signoff` : ''}.`);
            if (result.failures.length) addNotification('alert', `${result.failures.length} proposal(s) were not submitted. Their selections are retained for retry.`);
            if (result.submitted) { queryClient.invalidateQueries({ queryKey: ['product_pending_changes'] }); queryClient.invalidateQueries({ queryKey: ['product_change_history'] }); }
            return result;
        },
        [user, countryCode, createRequest, addNotification]
    );

    return { submit, isPending: createRequest.isPending };
}
