import { useMutation } from '@tanstack/react-query';
import { counterDropService } from '../services/counter-drop.service';
export function useCashDropRequest(shiftId: string | undefined) {
    return useMutation({ mutationFn: ({ amount, bag }: { amount: number; bag: string }) => {
        if (!shiftId) throw new Error('No active counter');
        return counterDropService.request(shiftId, amount, bag);
    } });
}
