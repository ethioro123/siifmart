import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { WMSJob, User } from '../types';
import { discrepancyService } from '../services/discrepancy.service';
export function useFloorDiscrepancies(job: WMSJob, user: User | null, enabled = true) {
    const client = useQueryClient();
    const key = ['floor-discrepancies', user?.id, job.countryCode || job.country_code, job.siteId, job.id];
    const history = useQuery({ queryKey: key, queryFn: () => discrepancyService.getFloorHistory(job.id), enabled: enabled && !!user?.id, staleTime: 0, refetchInterval: enabled ? 10000 : false });
    const refresh = async () => { await Promise.all([client.invalidateQueries({ queryKey: key }), client.invalidateQueries({ queryKey: ['jobs'] })]); };
    const report = useMutation({ mutationFn: discrepancyService.reportFloor, onSuccess: refresh });
    const resolve = useMutation({ mutationFn: discrepancyService.resolveFloor, onSuccess: refresh });
    return { history, report, resolve };
}
