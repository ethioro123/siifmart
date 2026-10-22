import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productSuggestionsService } from '../services/product-suggestions.service';
import type { ProductSuggestionStatus } from '../types/productSuggestion';

export function useProductSuggestions(countryCode: string, cacheScope: string) {
  const queryClient = useQueryClient();
  const queryKey = ['product-suggestions', countryCode, cacheScope];
  const suggestions = useQuery({
    queryKey,
    queryFn: () => productSuggestionsService.list(countryCode),
    staleTime: 30_000
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey });
  const submit = useMutation({
    mutationFn: (input: Parameters<typeof productSuggestionsService.create>[0]) => productSuggestionsService.create(input),
    onSuccess: refresh
  });
  const review = useMutation({
    mutationFn: (input: { id: string; decision: ProductSuggestionStatus; note: string }) =>
      productSuggestionsService.review(input.id, input.decision, input.note),
    onSuccess: refresh
  });
  return { suggestions, submit, review, refresh };
}
