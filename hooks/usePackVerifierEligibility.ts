import { useQuery } from '@tanstack/react-query';
import type { WMSJob } from '../types';
import { packVerificationService } from '../services/pack-verification.service';
export function usePackVerifierEligibility(job:WMSJob|null) {
    const query=useQuery({queryKey:['pack-verifier-eligibility',job?.countryCode||job?.country_code,job?.siteId,job?.id],
        queryFn:()=>packVerificationService.excludedWorkers(job!.id),enabled:job?.type==='PACK',staleTime:0});
    return { ready:job?.type!=='PACK'||query.isSuccess, excluded:query.data||[] };
}
