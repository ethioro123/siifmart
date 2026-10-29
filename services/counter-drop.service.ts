import { supabase } from '../lib/supabase';
export const counterDropService = {
    async request(shiftId: string, amount: number, bag: string, requestId: string = crypto.randomUUID()) {
        if (!Number.isFinite(amount) || amount <= 0 || !bag.trim()) throw new Error('Valid amount and bag reference required');
        const { data, error } = await supabase.rpc('request_counter_drop', { p_shift: shiftId, p_amount: amount, p_bag: bag.trim(), p_reason: '', p_request: requestId });
        if (error) throw error;
        if (!data?.id) throw new Error('Drop request was not confirmed');
        return data;
    },
};
