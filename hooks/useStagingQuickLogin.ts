import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { stagingQuickLoginService } from '../services/staging-quick-login.service';
import { isStagingQuickLoginAvailable } from '../utils/stagingQuickLogin';

export function useStagingAccounts() {
    const pairing = useStagingPairingStatus();
    return useQuery({
        queryKey: ['staging-quick-login', 'utykzifrblpyxlvlknsm'],
        queryFn: () => stagingQuickLoginService.getAccounts(),
        enabled: isStagingQuickLoginAvailable() && pairing.data?.paired === true,
        staleTime: 60_000,
        retry: 2,
        retryDelay: attempt => Math.min(attempt * 1000, 3000),
    });
}

export function useStagingQuickLogin() {
    return useMutation({ mutationFn: (email: string) => stagingQuickLoginService.signIn(email) });
}

export function useStagingPairingStatus() {
    return useQuery({ queryKey: ['staging-device-pairing'], queryFn: () => stagingQuickLoginService.pairingStatus(),
        enabled: isStagingQuickLoginAvailable(), staleTime: 30_000, retry: false });
}
export function useStagingDevicePairing() {
    const client = useQueryClient();
    const status = useStagingPairingStatus();
    const code = useMutation({ mutationFn: () => stagingQuickLoginService.pairingCode() });
    const pair = useMutation({ mutationFn: (value: string) => stagingQuickLoginService.pairDevice(value),
        onSuccess: async result => {
            client.setQueryData(['staging-device-pairing'], result);
            await client.invalidateQueries({ queryKey: ['staging-quick-login'] });
        }
    });
    return { status, code, pair };
}
