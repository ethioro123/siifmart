import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productSuggestionsService } from '../services/product-suggestions.service';
import type { ProductSuggestionStatus } from '../types/productSuggestion';
import { APPROVAL_INBOX_KEY } from '../utils/unifiedApprovalInbox';
export function useSuggestionReviewWorkspace(scope: { actor: string; country: string; site: string }, page: number) {
 const cache = useQueryClient(); const key = ['suggestion-review-workspace', scope.actor, scope.country, scope.site];
 const list = useQuery({ queryKey: [...key, page], queryFn: () => productSuggestionsService.pendingPage(scope.country, scope.site, page), staleTime: 15000 });
 const decision = useMutation({ mutationFn: async (input: { id: string; status: ProductSuggestionStatus; note: string }) => {
  const request = list.data?.find(row => row.id === input.id);
  if (!request || list.isError || list.isFetching) throw new Error('Refresh the suggestion before deciding.');
  if (request.submitter_employee_id === scope.actor) throw new Error('An independent reviewer is required.');
  if (['Declined','Duplicate'].includes(input.status) && input.note.trim().length < 3) throw new Error('A decision note is required.');
  const saved = await productSuggestionsService.review(input.id, input.status, input.note);
  if (saved.status !== input.status) throw new Error('Decision was not confirmed.');
  return saved;
 }, onSuccess: async () => { await Promise.all([cache.invalidateQueries({ queryKey: key }), cache.invalidateQueries({ queryKey: ['product-suggestions', scope.country] }), cache.invalidateQueries({ queryKey: [APPROVAL_INBOX_KEY, scope.actor] })]); } });
 return { list, decision };
}
