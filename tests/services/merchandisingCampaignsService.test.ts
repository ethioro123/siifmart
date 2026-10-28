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

   it('applies bounded pagination and territory filtering on list', async () => {
      const rangeMock = vi.fn().mockResolvedValue({
         data: [
            {
               id: 'prop-1',
               scope_site_id: 'site-hq',
               country_code: 'ET',
               region_code: 'ADD',
               code: 'SUMMER25',
               discount_type: 'PERCENTAGE',
               discount_value: 25,
               expiry_date: '2027-01-01',
               status: 'pending',
               requested_by_employee_id: 'emp-1',
               requested_at: '2026-10-28T10:00:00Z',
               requester: [{ name: 'Abebe Bikila', role: 'merchandising_specialist' }]
            }
         ],
         error: null,
         count: 55
      });

      const orderMock = vi.fn().mockReturnValue({ range: rangeMock });
      const eqMock = vi.fn();
      eqMock.mockReturnValue({ eq: eqMock, order: orderMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

      (supabase.from as any).mockReturnValue({ select: selectMock });

      const result = await merchandisingCampaignsService.list({
         countryCode: 'ET',
         status: 'pending',
         page: 2,
         pageSize: 25
      });

      expect(supabase.from).toHaveBeenCalledWith('merchandising_campaign_proposals');
      expect(eqMock).toHaveBeenCalledWith('country_code', 'ET');
      expect(eqMock).toHaveBeenCalledWith('status', 'pending');
      expect(orderMock).toHaveBeenCalledWith('requested_at', { ascending: false });
      // Page 2 of size 25: from = 25, to = 49
      expect(rangeMock).toHaveBeenCalledWith(25, 49);
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(25);
      expect(result.totalCount).toBe(55);
      expect(result.proposals).toHaveLength(1);
      expect(result.proposals[0].requester?.name).toBe('Abebe Bikila');
   });
});
