import { useCallback } from 'react';
import { useCreateInventoryRequestMutation } from './useInventoryRequestMutations';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import type { Product } from '../types';
import { buildPriceChangeRequest, isBelowMarginFloor, type PriceProposal } from '../utils/pricingGovernance';
import { logger } from '../utils/logger';

export interface PriceChangeInput {
    product: Product;
    proposal: PriceProposal;
}

/**
 * Submits price changes as HQ-approval requests (inventory_requests). No direct product writes.
 * Returns the number of requests submitted and how many need Finance co-approval.
 */
export function useSubmitPriceChanges(countryCode: string) {
    const { user } = useStore();
    const { addNotification } = useData();
    const createRequest = useCreateInventoryRequestMutation();

    const submit = useCallback(
        async (changes: PriceChangeInput[], source: string) => {
            const requestedBy = user?.name || user?.email || 'Unknown';
            let submitted = 0;
            let financeFlagged = 0;
            try {
                for (const { product, proposal } of changes) {
                    const req = buildPriceChangeRequest({ product, proposal, requestedBy, countryCode, source });
                    await createRequest.mutateAsync(req);
                    submitted++;
                    if (isBelowMarginFloor(req.proposedChanges ?? {})) financeFlagged++;
                }
            } catch (error) {
                logger.error('useSubmitPriceChanges', 'submit failed', error as Error);
            }
            if (submitted > 0) {
                addNotification(
                    'success',
                    `${submitted} price change${submitted === 1 ? '' : 's'} sent for HQ approval${financeFlagged ? ` (${financeFlagged} need Finance co-approval)` : ''}.`
                );
            }
            return { submitted, financeFlagged };
        },
        [user, countryCode, createRequest, addNotification]
    );

    return { submit, isPending: createRequest.isPending };
}
