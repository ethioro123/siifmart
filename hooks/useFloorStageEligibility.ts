import { useQuery } from '@tanstack/react-query';
import type { WMSJob } from '../types';
import { isIndependentFloorStage, floorStageVerificationService } from '../services/floor-stage-verification.service';
export function useFloorStageEligibility(job:WMSJob|null) {
    const query=useQuery({queryKey:['floor-stage-eligibility',job?.countryCode||job?.country_code,job?.siteId,job?.id],
        queryFn:()=>floorStageVerificationService.excludedWorkers(job!.id),enabled:!!job && isIndependentFloorStage(job.type),staleTime:0});
    return { ready:!job || !isIndependentFloorStage(job.type) || (query.isSuccess && !query.isFetching), excluded:query.data||[] };
}
