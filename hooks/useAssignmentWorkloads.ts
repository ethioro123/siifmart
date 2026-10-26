import { useQuery } from '@tanstack/react-query';
import { assignmentWorkloadsService } from '../services/assignment-workloads.service';
export function useAssignmentWorkloads(siteId: string | undefined, country: string | undefined, userId: string | undefined, employeeIds: string[]) {
    const ids = [...new Set(employeeIds)].sort();
    return useQuery({
        queryKey: ['assignment-workloads', userId, country, siteId, ids],
        queryFn: () => assignmentWorkloadsService.load(siteId!, country!, ids),
        enabled: !!siteId && !!country && !!userId && ids.length > 0,
        staleTime: 0, refetchInterval: 15000, refetchOnWindowFocus: true
    });
}
