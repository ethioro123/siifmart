import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { blindReceiptReviewService as service } from '../services/blind-receipt-review.service';
export function useBlindReceiptReview(site: string, country: string, user: string, enabled: boolean, receipt?: string, exceptions = true) {
    const client = useQueryClient();
    const scope = ['blind-receipt-review', country, site, user];
    const queue = useInfiniteQuery({
        queryKey: [...scope, 'queue', exceptions], enabled: enabled && !receipt && Boolean(site && country && user), staleTime: 0,
        initialPageParam: undefined as { created_at: string; id: string } | undefined,
        queryFn: ({ pageParam }) => service.list(site, country, pageParam, exceptions),
        getNextPageParam: page => page.length === 25 ? page[page.length - 1] : undefined
    });
    const detail = useQuery({ queryKey: [...scope, 'detail', receipt], enabled: enabled && Boolean(receipt && site && country && user),
        queryFn: async () => {
            const result = await service.detail(receipt!);
            if (result.site_id !== site || result.country_code !== country) throw new Error('Receipt scope changed');
            return result;
        }, staleTime: 0 });
    const refresh = async () => {
        await client.invalidateQueries({ queryKey: scope });
    };
    const correction = useMutation({ mutationFn: service.requestCorrection, onSuccess: refresh });
    const decision = useMutation({ mutationFn: service.decide, onSuccess: refresh });
    const issue = useMutation({ mutationFn: service.reportIssue, onSuccess: refresh });
    return { queue, detail, correction, decision, issue };
}
