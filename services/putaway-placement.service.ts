import { supabase } from '../lib/supabase';
export const putawayPlacementService = {
    async place(jobId: string, itemIndex: number, quantity: number, location: string) {
        if (!jobId || !Number.isInteger(itemIndex) || itemIndex < 0 || !Number.isFinite(quantity) || quantity <= 0) throw new Error('Valid Putaway job, line, and physical count required.');
        const { data, error } = await supabase.rpc('place_putaway_stock', {
            p_job_id: jobId, p_item_index: itemIndex, p_quantity: quantity, p_location: location
        });
        if (error) throw new Error(error.message || 'Putaway placement was rejected.');
        if (!data?.product_id) throw new Error('The server did not confirm the Putaway placement.');
        return data;
    }
};
