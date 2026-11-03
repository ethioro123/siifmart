import { useQuery } from '@tanstack/react-query';
import { sitesService } from '../services/sites.service';

export function useWarehouseManagerCandidates(siteId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['warehouse-manager-candidates', siteId],
    queryFn: () => sitesService.getWarehouseManagerCandidates(siteId || ''),
    enabled: enabled && Boolean(siteId),
    staleTime: 60_000
  });
}
