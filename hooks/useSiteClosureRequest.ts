import { useMutation, useQueryClient } from '@tanstack/react-query';
import { recordLifecycleService } from '../services/record-lifecycle.service';
export function useSiteClosureRequest() {
    const cache = useQueryClient();
    return useMutation({
        mutationFn: ({ siteId, reason }: { siteId: string; reason: string }) =>
            recordLifecycleService.request('site', siteId, reason, {}),
        onSuccess: () => cache.invalidateQueries({ queryKey: ['record-lifecycle'] })
    });
}
