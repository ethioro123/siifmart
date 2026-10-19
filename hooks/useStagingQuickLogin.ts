import { useMutation, useQuery } from '@tanstack/react-query';
import { stagingQuickLoginService } from '../services/staging-quick-login.service';
import { isStagingQuickLoginAvailable } from '../utils/stagingQuickLogin';

export function useStagingAccounts() {
    return useQuery({
        queryKey: ['staging-quick-login', 'utykzifrblpyxlvlknsm'],
        queryFn: () => stagingQuickLoginService.getAccounts(),
        enabled: isStagingQuickLoginAvailable(), staleTime: 30_000, retry: false
    });
}

export function useStagingQuickLogin() {
    return useMutation({ mutationFn: (email: string) => stagingQuickLoginService.signIn(email) });
}
