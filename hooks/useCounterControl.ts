import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { counterControlService } from '../services/counter-control.service';
export function useCounterSummary(id: string | undefined, site: string | undefined, country: string | undefined, user: string | undefined) {
    return useQuery({ queryKey: ['counter-summary', country, site, user, id], queryFn: () => counterControlService.summary(id!), enabled: Boolean(id && site && country && user), staleTime: 0 });
}
export function useCounterReview(site: string, country: string, user: string, enabled: boolean) {
    const client = useQueryClient();
    const queryKey = ['counter-review', country, site, user];
    const query = useQuery({ queryKey, queryFn: () => counterControlService.queue(site, country), enabled: enabled && Boolean(site && country && user), staleTime: 0 });
    const mutation = useMutation({ mutationFn: (input: { id: string; type: 'shift' | 'drop'; notes: string }) => input.type === 'shift'
        ? counterControlService.review(input.id, 'supervisor', 'Flagged', input.notes) : counterControlService.approveDrop(input.id),
        onSuccess: async () => { await client.invalidateQueries({ queryKey }); await client.invalidateQueries({ queryKey: ['counter-summary', country, site] }); } });
    return { query, mutation };
}
