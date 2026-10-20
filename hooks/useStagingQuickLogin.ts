import { useMutation, useQuery } from '@tanstack/react-query';
import { stagingQuickLoginService } from '../services/staging-quick-login.service';
import { isStagingQuickLoginAvailable } from '../utils/stagingQuickLogin';

export function useStagingAccounts() {
    return useQuery({
        queryKey: ['staging-quick-login', 'utykzifrblpyxlvlknsm'],
        queryFn: () => stagingQuickLoginService.getAccounts(),
        enabled: isStagingQuickLoginAvailable(),
        staleTime: 60_000,
        retry: 2,
        retryDelay: attempt => Math.min(attempt * 1000, 3000),
    });
}

export function useStagingQuickLogin() {
    return useMutation({ mutationFn: (email: string) => stagingQuickLoginService.signIn(email) });
}
