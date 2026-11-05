import { useQuery } from '@tanstack/react-query';
import { useStore } from '../contexts/CentralStore';
import type { Region } from '../types';
import { regionsService } from '../services/regions.service';
export function useRegionBudgetStatus(region: Region) {
    const { user } = useStore();
    return useQuery({ queryKey: ['region-budget', user?.id, region.country, region.code],
        queryFn: () => regionsService.getRegionBudgetStatus(region.code), enabled: Boolean(user?.id), staleTime: 30_000, retry: false });
}
