import { useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { counterDropService } from '../services/counter-drop.service';
export function useCashDropRequest(shiftId: string | undefined) {
    const pendingRequest = useRef<{ key: string; id: string } | null>(null);
    return useMutation({ mutationFn: ({ amount, bag }: { amount: number; bag: string }) => {
        if (!shiftId) throw new Error('No active counter');
        const key = JSON.stringify([shiftId, amount, bag.trim()]);
        if (pendingRequest.current?.key !== key) pendingRequest.current = { key, id: crypto.randomUUID() };
        return counterDropService.request(shiftId, amount, bag, pendingRequest.current.id);
    } });
}
