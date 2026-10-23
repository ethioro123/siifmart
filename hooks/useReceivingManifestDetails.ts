import { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useData } from '../contexts/DataContext';
import { useStore } from '../contexts/CentralStore';
import { purchaseOrdersService } from '../services/purchase-orders.service';
import type { PurchaseOrder } from '../types';

/** Load authoritative PO items only when a worker opens a manifest for receiving. */
export function useReceivingManifestDetails(summaries: PurchaseOrder[]) {
    const { effectiveCountry, activeSite } = useData();
    const { user } = useStore();
    const [requested, setRequested] = useState<string[]>([]);
    const scopeSite = user?.role === 'group_ceo' ? activeSite?.id : user?.siteId;
    const eligible = summaries.filter(po => requested.includes(po.id) && po.siteId === scopeSite &&
        (po.countryCode || po.country_code) === effectiveCountry);
    const details = useQueries({ queries: eligible.map(po => ({
        queryKey: ['receiving_manifest', effectiveCountry, scopeSite, user?.id, po.id, po.updated_at, po.status],
        queryFn: async () => {
            const detail = await purchaseOrdersService.getById(po.id);
            if (!detail || detail.siteId !== scopeSite || (detail.countryCode || detail.country_code) !== effectiveCountry) throw new Error('Receiving manifest unavailable in this facility.');
            if (!detail.lineItems?.length) throw new Error('This purchase order has no receiving items.');
            return detail;
        },
        staleTime: 0
    })) });
    const byId = new Map(eligible.map((po, index) => [po.id, details[index]]));
    return {
        orders: summaries.map(po => byId.get(po.id)?.data || po),
        loadManifest: (id: string) => {
            const existing = byId.get(id);
            if (existing) void existing.refetch();
            else setRequested(previous => [...previous, id]);
        },
        isLoadingManifest: (id: string) => Boolean(byId.get(id)?.isFetching),
        manifestError: (id: string) => byId.get(id)?.isError ? 'Could not load receiving items. Try again.' : undefined
    };
}
