import { describe, it, expect, vi, beforeEach } from 'vitest';
import { merchandisingCampaignsService } from '../../services/merchandising-campaigns.service';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
   supabase: {
      from: vi.fn(),
      rpc: vi.fn()
   }
}));

describe('Merchandising Campaigns Service Governance', () => {
   beforeEach(() => {
      vi.clearAllMocks();
   });

   it('strictly validates campaign code regex before submission', async () => {
      await expect(
         merchandisingCampaignsService.create({
            code: 'ab', // too short (< 3)
            type: 'PERCENTAGE',
            value: 20,
            expiryDate: '2027-01-01'
         })
      ).rejects.toThrow(/Campaign code must be 3-32 characters/);

      await expect(
         merchandisingCampaignsService.create({
            code: 'INVALID CODE WITH SPACES',
            type: 'PERCENTAGE',
            value: 20,
            expiryDate: '2027-01-01'
         })
      ).rejects.toThrow(/Campaign code must be 3-32 characters/);
   });

   it('strictly enforces whole numbers on discount value', async () => {
      const insertMock = vi.fn().mockResolvedValue({ error: null });
      (supabase.from as any).mockReturnValue({
         insert: insertMock
      });

      await merchandisingCampaignsService.create({
         code: 'SUMMER25',
         type: 'PERCENTAGE',
         value: 24.8, // Fractional decimal
         expiryDate: '2027-01-01'
      });

      expect(insertMock).toHaveBeenCalledWith(
         expect.objectContaining({
            code: 'SUMMER25',
            discount_type: 'PERCENTAGE',
            discount_value: 25 // Rounded to nearest whole integer
         })
      );
   });

   it('rejects percentage discount greater than 100%', async () => {
      await expect(
         merchandisingCampaignsService.create({
            code: 'OVER100',
            type: 'PERCENTAGE',
            value: 105,
            expiryDate: '2027-01-01'
         })
      ).rejects.toThrow(/Percentage discount cannot exceed 100%/);
   });

   it('rejects past or missing expiry dates', async () => {
      await expect(
         merchandisingCampaignsService.create({
            code: 'PASTDATE',
            type: 'PERCENTAGE',
            value: 20,
            expiryDate: '2020-01-01'
         })
      ).rejects.toThrow(/Expiry date must be in the future/);
   });

   it('validates reject RPC call with mandatory reason', async () => {
      const rpcMock = vi.fn().mockResolvedValue({ error: null });
      (supabase.rpc as any).mockImplementation(rpcMock);

      await expect(
         merchandisingCampaignsService.reject('prop-123', '  ')
      ).rejects.toThrow(/Rejection reason must be at least 3 characters/);

      await merchandisingCampaignsService.reject('prop-123', 'Exceeds regional budget threshold');

      expect(rpcMock).toHaveBeenCalledWith('reject_merchandising_campaign', {
         p_proposal_id: 'prop-123',
         p_reason: 'Exceeds regional budget threshold'
      });
   });

   it('calls approve_merchandising_campaign RPC for approved plan', async () => {
      const rpcMock = vi.fn().mockResolvedValue({ error: null });
      (supabase.rpc as any).mockImplementation(rpcMock);

      await merchandisingCampaignsService.approve('prop-456');

      expect(rpcMock).toHaveBeenCalledWith('approve_merchandising_campaign', {
         p_proposal_id: 'prop-456'
      });
   });
});
