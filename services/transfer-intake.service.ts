import { z } from 'zod';
import { supabase } from '../lib/supabase';
const intakeConfirmation = z.object({
 saved: z.literal(true), jobId: z.string().uuid(), siteId: z.string().uuid(),
 countryCode: z.string().regex(/^[A-Z]{2}$/), receivedAt: z.string(), hasDiscrepancy: z.boolean()
});
export const transferIntakeService = {
 async accept(jobId: string) {
  z.string().uuid().parse(jobId);
  const { data, error } = await supabase.rpc('accept_verified_transfer', { p_job: jobId });
  if (error) throw error;
  const confirmed = intakeConfirmation.parse(data);
  if (confirmed.jobId !== jobId) throw new Error('Receipt confirmation does not match the shipment');
  return confirmed;
 }
};
