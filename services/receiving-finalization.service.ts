import { z } from 'zod';
import { supabase } from '../lib/supabase';
const confirmation = z.object({
 id: z.string().uuid(), saved: z.literal(true), status: z.enum(['Received', 'Partially Received']),
 jobs: z.array(z.object({ id: z.string().uuid(), status: z.literal('Completed'), completed_by: z.string().nullable(), completed_at: z.string() })).min(1)
});
export const receivingFinalizationService = {
 async finalize(id: string) {
  z.string().uuid().parse(id);
  const { data, error } = await supabase.rpc('finalize_receiving_session', { p_po: id });
  if (error) throw error;
  const saved = confirmation.parse(data);
  if (saved.id !== id) throw new Error('Receiving confirmation does not match the order');
  return saved;
 }
};
