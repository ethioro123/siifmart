import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { transferVarianceService } from '../services/transfer-variance.service';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
export function useTransferVariance(jobId: string) {
    const { activeSite, effectiveCountry } = useData();
    const { user } = useStore();
    const client = useQueryClient();
    const key = ['transfer-variance', effectiveCountry, activeSite?.id, user?.id, jobId];
    const query = useQuery({ queryKey: key, queryFn: () => transferVarianceService.get(jobId), enabled: Boolean(user?.id && jobId), staleTime: 0 });
    const sign = useMutation({ mutationFn: transferVarianceService.sign, onSuccess: value => { client.setQueryData(key, value); } });
    return { query, sign };
}
