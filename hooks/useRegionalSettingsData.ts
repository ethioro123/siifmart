import { useQuery } from '@tanstack/react-query';
import { regionsService } from '../services/regions.service';
import { regionalAdminDirectoryService } from '../services/regional-admin-directory.service';
export function useRegionalSettingsData(actor: string, country: string) {
    const regions = useQuery({ queryKey: ['regions', 'settings', actor, country],
        queryFn: () => regionsService.getRegions(country), enabled: Boolean(actor && country), staleTime: 30_000 });
    const directory = useQuery({ queryKey: ['regional-admin-directory', actor, country],
        queryFn: () => regionalAdminDirectoryService.load(country), enabled: Boolean(actor && country), staleTime: 30_000 });
    return { regions, directory };
}
