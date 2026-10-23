import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { putawayRoutingService } from '../../../../services/putaway-routing.service';
import { rankPutawayLocations, RoutingInput } from '../../../../utils/putawayRouting';

export function usePutawayRouting(input: RoutingInput, country: string, enabled: boolean, jobId?: string, userId?: string) {
    const scope = `${userId}:${country}:${input.siteId}:${jobId}`;
    const [skipped, setSkipped] = useState<{ scope: string; bins: string[] }>({ scope: '', bins: [] });
    const excluded = skipped.scope === scope ? skipped.bins : [];
    const query = useQuery({
        queryKey: ['putawayRouting', userId, country, input.siteId, jobId, input.sku, input.batchNumber, input.expiryDate],
        queryFn: () => putawayRoutingService.load(input.siteId),
        enabled: enabled && !!input.siteId && !!input.sku,
        staleTime: 0, refetchInterval: enabled ? 30000 : false, retry: 1
    });
    const suggestions = query.data && !query.isError ? rankPutawayLocations(input, query.data.stock, query.data.zones, query.data.mappings, excluded) : [];
    return { suggestions, loading: query.isFetching, error: query.error, updatedAt: query.dataUpdatedAt,
        refresh: () => { void query.refetch(); },
        reportFull: (location: string) => {
            setSkipped({ scope, bins: [...excluded, location] });
            void query.refetch();
        }
    };
}
