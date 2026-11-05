import { useMutation, useQueryClient } from '@tanstack/react-query';
import { recruitmentService } from '../services/recruitment.service';
export function useCandidateEnrollment() {
 const cache=useQueryClient();
 return useMutation({mutationFn:(input:Parameters<typeof recruitmentService.createCandidate>[0])=>recruitmentService.createCandidate(input),onSuccess:()=>cache.invalidateQueries({queryKey:['candidates']})});
}
