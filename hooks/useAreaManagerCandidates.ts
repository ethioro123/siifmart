import { useQuery } from '@tanstack/react-query';
import { sitesService } from '../services/sites.service';
import type { Site } from '../types';

export function useAreaManagerCandidates(
  regionCode: string | undefined,
  country: string | undefined,
  sites: Site[],
  enabled: boolean
) {
  return useQuery({
    queryKey: ['area-manager-candidates', country, regionCode],
    queryFn: async () => {
      const rows = await sitesService.getAreaManagerCandidates(regionCode || '');
      return rows
        .filter(row => sites.some(site =>
          site.id === row.site_id && site.country === country &&
          (site.regionCode || site.region_code) === regionCode
        ))
        .map(row => ({ id: row.id as string, name: row.name as string }));
    },
    enabled: enabled && Boolean(country && regionCode),
    staleTime: 60_000
  });
}
