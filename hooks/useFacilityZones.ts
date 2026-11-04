import { useQuery } from '@tanstack/react-query';
import { warehouseZonesService } from '../services/zones.service';

/** Zone layout is independent of jobs, transfers and barcode approval availability. */
export function useFacilityZones(siteId: string | undefined, country: string, userId: string | undefined, refresh = 0) {
    return useQuery({
        queryKey: ['zones', siteId, country, userId, refresh],
        queryFn: () => warehouseZonesService.getAll(siteId),
        enabled: !!siteId && !!country && !!userId,
        staleTime: 30_000,
        retry: 1
    });
}
